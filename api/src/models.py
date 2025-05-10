from typing import Optional
from pydantic import BaseModel


class StatusModel(BaseModel):
    ok: bool
    detail: Optional[str] = None


class ErrorModel(StatusModel):
    ok: bool = False
    detail: str  # type: ignore
