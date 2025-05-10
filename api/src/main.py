import sys
from contextlib import asynccontextmanager
from threading import Thread

from fastapi import FastAPI, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

# from fastapi_csrf_protect.exceptions import CsrfProtectError
# from fastapi_redis_cache import FastApiRedisCache
from starlette.exceptions import HTTPException

from src.api.main import api_router
from src.api.routes.core.main import queue_cleanup, queue_thread
from src.models import ErrorModel

LOGGING_LEVEL = 'TRACE'


# Loguru : Initialize


logger.configure(handlers=[{'sink': sys.stdout, 'level': LOGGING_LEVEL}])


# RedisCache : Initialize


# redis_cache = FastApiRedisCache()

# redis_cache.init(
#     host_url=REDIS_DB_URI,
#     prefix='identicore-cache',
#     response_header='Identicore-Cache',
#     ignore_arg_types=[Request, Response, AsyncSession],
# )


# FastAPI : Initialize


@asynccontextmanager
async def lifespan(app: FastAPI):
    Thread(target=queue_thread, daemon=True).start()
    yield
    queue_cleanup()


app = FastAPI(title='Identicore', lifespan=lifespan)
app.include_router(router=api_router, prefix='/api/v1')


app.add_middleware(
    middleware_class=CORSMiddleware,
    allow_origins=['http://localhost:3000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


# app.mount(path='/static', app=StaticFiles(directory='static'), name='static')


# FastAPI : Exception handlers


@app.exception_handler(exc_class_or_status_code=HTTPException)
async def http_error_handler(_, cls: HTTPException) -> JSONResponse:
    return JSONResponse(
        content=ErrorModel(detail=cls.detail).model_dump(),
        status_code=cls.status_code,
        headers=cls.headers,
    )


# @app.exception_handler(exc_class_or_status_code=CsrfProtectError)
# async def csrf_error_handler(_, cls: CsrfProtectError) -> JSONResponse:
#     return JSONResponse(
#         content=ErrorModel(detail=cls.message).model_dump(),
#         status_code=400,
#     )


# @app.exception_handler(exc_class_or_status_code=RequestValidationError)
# async def validation_error_handler(_, cls: RequestValidationError) -> JSONResponse:
#     return JSONResponse(
#         content=ErrorModel(
#             detail='; '.join(filter(None, [error.get('msg') for error in cls.errors()]))
#         ).model_dump(),
#         status_code=422,
#     )


@app.exception_handler(exc_class_or_status_code=Exception)
async def unexpected_error_handler(_, cls: Exception) -> JSONResponse:
    return JSONResponse(
        content=ErrorModel(
            detail='Unexpected error, please contact developer about this issue and try again later'
            + f' <{(lambda x: Path(default=x.parent()).joinpath(x.name()))(Path(cls.__traceback__.tb_frame.f_code.co_filename))}:{cls.__traceback__.tb_lineno}:{cls.__class__!s}>'  # type: ignore[union-attr]
        ).model_dump(),
        status_code=500,
    )
