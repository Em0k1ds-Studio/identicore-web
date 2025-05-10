from fastapi import APIRouter

from src.api.routes.core import core_router

api_router = APIRouter()
api_router.include_router(router=core_router, prefix='/core', tags=['core'])
