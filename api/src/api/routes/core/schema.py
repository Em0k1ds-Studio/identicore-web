from enum import Enum
from struct import Struct
from typing import Callable, List, Optional, Tuple, Union

from src.models import ErrorModel, StatusModel
from pydantic import BaseModel


class uint8_t(int):
    def struct(self) -> bytes:
        return Struct(format='<B').pack(int(self))

    def __repr__(self) -> str:
        return f'{int(self)!s} (be:{int(self):#02x})'


class WsMsgType(uint8_t, Enum):
    PING_REQUEST = 0x10
    PONG_RESPONSE = 0x11

    IDENTIFY_REQUEST = 0xA0
    IDENTIFY_RESPONSE = 0xA1

    VERIFICATION_REQUEST = 0xB0
    VERIFICATION_RESPONSE = 0xB1

    DIAGNOSTIC_REQUEST = 0xF0
    DIAGNOSTIC_RESPONSE = 0xF1

    THROTTLED_RESPONSE = 0xFF


class FaceRectangle(BaseModel):
    top_left: Tuple[int, int]
    bottom_right: Tuple[int, int]


class IdentificationForm(BaseModel):
    image: bytes


class IdentificationResponse(StatusModel):
    faces_count: int
    faces: List[FaceRectangle]


class VerificationForm(BaseModel):
    first_image: bytes
    second_image: bytes


class VerificationResponse(StatusModel):
    is_match: bool
    similarity_confidence: float
    faces: List[FaceRectangle]


class DiagnosticResponse(BaseModel):
    alive: bool
    queue_len: int
    ws_clients: int


class QueueInner(BaseModel):
    uid: str
    first_image: bytes
    second_image: Optional[bytes] = None


class QueueEntry(BaseModel):
    inner: QueueInner
    callback: Callable[
        [Union[IdentificationResponse, VerificationResponse, ErrorModel]], None
    ]


# old rest api impl: rest in peace
# IDENTIFY_RESPONSE_SCHEMA: Dict[int, Dict[Any, Any]] = {
#     200: {
#         'model': IdentificationResponse,
#         'content': {
#             'application/json': {
#                 'example': IdentificationResponse(
#                     ok=True,
#                     faces_count=2,
#                     faces=[
#                         FaceRectangle(top_left=(230, 230), bottom_right=(380, 380)),
#                         FaceRectangle(top_left=(510, 130), bottom_right=(660, 280)),
#                     ],
#                 ).model_dump(),
#             },
#         },
#     },
#     422: ERROR_RESPONSE_SCHEMA,
# }
