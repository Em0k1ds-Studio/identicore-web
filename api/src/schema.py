from typing import Any, Dict

from src.models import ErrorModel

ERROR_RESPONSE_SCHEMA: Dict[str, Any] = {
    'model': ErrorModel,
    'content': {
        'application/json': {
            'example': ErrorModel(detail='string').model_dump(),
        },
    },
}
