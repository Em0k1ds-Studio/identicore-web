# from app.api.csrf.main import CsrfAction
# from app.api.csrf.schema import CSRF_RESPONSE_SCHEMA
import asyncio
import multiprocessing
import time
from collections import deque
from concurrent.futures import Future, ProcessPoolExecutor
from contextlib import suppress
from typing import Deque, List, NoReturn, Tuple, Union
from uuid import uuid4

import cv2
import identicore
import ormsgpack
from cv2.typing import MatLike
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from inspireface.modules.inspireface import FaceInformation
from loguru import logger
from numpy import frombuffer, uint8

from src.api.routes.core.schema import (
    DiagnosticResponse,
    FaceRectangle,
    IdentificationResponse,
    QueueEntry,
    QueueInner,
    VerificationResponse,
    WsMsgType,
    uint8_t,
)
from src.models import ErrorModel
from src.api.throttle import Throttler

router = APIRouter()
executor = ProcessPoolExecutor(max_workers=multiprocessing.cpu_count())

send_throttle = Throttler(rate_limit=10, period=30.0)
connect_throttle = Throttler(rate_limit=500, period=10.0)

queue: Deque[QueueEntry] = deque()
identicore_session = identicore.IdenticoreSession(
    model='Megatron'
)  # todo! verify that its multiprocessed


def middleware(
    entry: QueueEntry,
) -> Union[ErrorModel, VerificationResponse, IdentificationResponse]:
    """Middleware between AI and `queue_thread`."""

    def bytes2cvimg(x: bytes) -> MatLike:
        return cv2.imdecode(
            buf=frombuffer(buffer=x, dtype=uint8), flags=cv2.IMREAD_COLOR
        )

    logger.info(
        f'middleware: working on `{entry.uid}` w/ mode `{"verification" if entry.second_image else "identification"}`'
    )

    params: Tuple[bool, float] = (True, 0.7) if entry.second_image else (False, 0.65)

    first_image: MatLike = bytes2cvimg(entry.first_image)

    try:
        first_faces: List[FaceInformation] = identicore_session.face_detection(
            image=first_image, for_identification=params[0], threshold=params[1]
        )
    except identicore.MultipleFacesDetected as e:
        return ErrorModel(
            detail=f'Unable to compare faces due multiple faces detected on first image: {e.quantity}'
        )

    if entry.second_image:
        if not len(first_faces):
            return ErrorModel(detail='No faces were found on first image')
        
        second_image: MatLike = bytes2cvimg(entry.second_image)

        try:
            second_faces: List[FaceInformation] = identicore_session.face_detection(
                image=second_image, for_identification=params[0], threshold=params[1]
            )
        except identicore.MultipleFacesDetected as e:
            return ErrorModel(
                detail=f'Unable to compare faces due multiple faces detected on second image: {e.quantity}'
            )
        
        if not len(second_faces):
            return ErrorModel(detail='No faces were found on second image')

        try:
            result: identicore.FaceComparisonResult = (
                identicore_session.face_comparison(
                    first_face=(first_image, first_faces[0]),
                    second_face=(second_image, second_faces[0]),
                )
            )
        except identicore.FeaturesExtractionFailed as e:
            return ErrorModel(
                detail=f'Unable to compare faces due features extraction failed on {"second" if e.index else "first"} image'
            )

        return VerificationResponse(
            ok=True,
            is_match=result.is_match,
            similarity_confidence=result.similarity_confidence,
            faces=[
                FaceRectangle(
                    **dict(
                        zip(
                            ('top_left', 'bottom_right'),
                            (face.location[:2], face.location[2:]),
                        )
                    )
                )
                for faces in (first_faces, second_faces)
                for face in faces
            ],
        )

    if len(first_faces):
        return IdentificationResponse(
            ok=True,
            faces_count=len(first_faces),
            faces=[
                FaceRectangle(
                    **dict(
                        zip(
                            ('top_left', 'bottom_right'),
                            (face.location[:2], face.location[2:]),
                        )
                    )
                )
                for face in first_faces
            ],
        )
    else:
        return ErrorModel(detail='No faces were found')


def queue_thread() -> NoReturn:
    """Process queued tasks indefinitely."""
    while True:
        try:
            entry: QueueEntry = queue.popleft()

            logger.trace(f'queue_thread: recv `{entry.inner.uid}`')

            future: Future[
                Union[ErrorModel, VerificationResponse, IdentificationResponse]
            ] = executor.submit(middleware, entry.inner)

            submission: Union[
                ErrorModel, VerificationResponse, IdentificationResponse
            ] = future.result(timeout=15.0)

            logger.info(f'queue_thread: submission `{submission!r}`')

            entry.callback(submission)
        except IndexError:
            pass
        except TimeoutError:
            logger.warning(f'queue_thread: timed out `{entry.inner.uid}`')
            entry.callback(ErrorModel(detail='Timed out'))
        except Exception as e:
            logger.error(f'queue_thread: {e.__class__!s}: {e!s}')
            entry.callback(ErrorModel(detail='Internal server error'))
        finally:
            time.sleep(0.1)


def queue_cleanup() -> None:
    executor.shutdown(wait=True)


@router.websocket(path='/ws', name='ws')
async def websocket_endpoint(ws: WebSocket) -> None:
    with suppress(WebSocketDisconnect):
        if connect_throttle.is_throttling():
            await ws.close(code=1013, reason='too many connections, try again later.')
            return

        await ws.accept()

        logger.info(f'websocket_endpoint: accepted `{ws.client}`')

        while rx := await ws.receive_bytes():
            await asyncio.sleep(delay=2)  # TODO! remove mimic delay

            logger.trace(f'[IN] websocket_endpoint: recv {len(rx)} bytes')

            if len(rx) < 2:
                continue

            try:
                ws_flag, rx = uint8_t(rx[0]), ormsgpack.unpackb(rx[1:])
            except Exception as e:
                logger.error(f'websocket_endpoint: {e.__class__!s}: {e!s}')
                continue

            if not isinstance(rx, dict):
                continue

            if ws_flag != WsMsgType.PING_REQUEST and send_throttle.is_throttling(
                client=ws.client
            ):
                tx = bytearray(WsMsgType.THROTTLED_RESPONSE.struct())
                tx += ormsgpack.packb(
                    ErrorModel(
                        detail='Too many requests, try again later.'
                    ).model_dump()
                )

                await ws.send_bytes(data=bytes(tx))
                continue

            uid = str(uuid4())
            event_loop: asyncio.AbstractEventLoop = asyncio.get_running_loop()

            match ws_flag:
                case WsMsgType.PING_REQUEST:
                    await ws.send_bytes(data=WsMsgType.PONG_RESPONSE.struct() + b'\x80')
                    logger.trace('[OUT] websocket_endpoint: sent PONG response')

                case WsMsgType.IDENTIFY_REQUEST:
                    if not rx.get('image'):
                        continue

                    def callback(
                        response: Union[
                            IdentificationResponse, VerificationResponse, ErrorModel
                        ],
                    ) -> None:
                        tx = bytearray(WsMsgType.IDENTIFY_RESPONSE.struct())
                        tx += ormsgpack.packb(response.model_dump())

                        try:
                            asyncio.run_coroutine_threadsafe(
                                coro=ws.send_bytes(data=bytes(tx)),
                                loop=event_loop,
                            ).result()
                        except Exception as e:
                            logger.error(
                                f'websocket_endpoint::callback: {e.__class__!s}: {e!s}'
                            )
                        else:
                            logger.info(
                                f'[OUT] websocket_endpoint: sent {len(tx)} bytes'
                            )

                    queue.append(
                        QueueEntry(
                            inner=QueueInner(uid=uid, first_image=rx['image']),
                            callback=callback,
                        )  # type: ignore[reportArgumentType]
                    )

                    logger.info(f'WsMsgType.IDENTIFY_REQUEST: enqueue `{uid}`')

                case WsMsgType.VERIFICATION_REQUEST:
                    if not rx.get('first_image') or not rx.get('second_image'):
                        continue

                    def callback(
                        response: Union[
                            VerificationResponse, IdentificationResponse, ErrorModel
                        ],
                    ) -> None:
                        tx = bytearray(WsMsgType.VERIFICATION_RESPONSE.struct())
                        tx += ormsgpack.packb(response.model_dump())

                        try:
                            asyncio.run_coroutine_threadsafe(
                                coro=ws.send_bytes(data=bytes(tx)),
                                loop=event_loop,
                            ).result()
                        except Exception as e:
                            logger.error(
                                f'websocket_endpoint::callback: {e.__class__!s}: {e!s}'
                            )
                        else:
                            logger.info(
                                f'[OUT] websocket_endpoint: sent {len(tx)} bytes'
                            )

                    queue.append(
                        QueueEntry(
                            inner=QueueInner(
                                uid=uid,
                                first_image=rx['first_image'],
                                second_image=rx['second_image'],
                            ),
                            callback=callback,
                        )
                    )

                    logger.info(f'WsMsgType.VERIFICATION_REQUEST: enqueue `{uid}`')

                case WsMsgType.DIAGNOSTIC_REQUEST:
                    tx = bytearray(WsMsgType.DIAGNOSTIC_RESPONSE.struct())
                    tx += ormsgpack.packb(
                        DiagnosticResponse(
                            alive=True,
                            queue_len=len(queue),
                            ws_clients=len(send_throttle._times_per_clients),
                        ).model_dump()
                    )

                    await ws.send_bytes(bytes(tx))
                    logger.info(f'[OUT] websocket_endpoint: sent {len(tx)} bytes')

                case _:
                    pass

    logger.info(f'websocket_endpoint: disconnected `{ws.client}`')
