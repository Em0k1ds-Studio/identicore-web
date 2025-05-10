import time
from collections import deque
from typing import Deque, Dict, Optional, Union

from fastapi.datastructures import Address


class Throttler:
    _rate_limit: int
    _period: float

    _times_per_clients: Dict[Address, Deque[float]] = {}
    _times_global: Deque[float]

    def __init__(self, rate_limit: int, period: Union[int, float] = 1.0) -> None:
        if not (isinstance(rate_limit, int) and rate_limit > 0):
            raise ValueError('`rate_limit` should be positive integer')

        if not (isinstance(period, (int, float)) and period > 0.0):
            raise ValueError('`period` should be positive float')

        self._rate_limit = rate_limit
        self._period = float(period)
        self._times_global = deque(iterable=[0.0 for _ in range(self._rate_limit)])

    def is_throttling(self, client: Optional[Address] = None) -> bool:
        if client and client not in self._times_per_clients.keys():
            self._times_per_clients.update(
                {client: deque(iterable=[0.0 for _ in range(self._rate_limit)])}
            )

        times: deque[float] = (
            self._times_per_clients[client] if client else self._times_global
        )

        timestamp: float = time.monotonic()
        difference: float = timestamp - (times[0] + self._period)
        is_throttling: bool = difference <= 0

        # if not is_throttling:
        times.popleft()
        times.append(timestamp)

        return is_throttling
