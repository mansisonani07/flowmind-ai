import threading
import time
from typing import Dict, List, Optional

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class RateLimiter:
    """In-memory rate limiter using a sliding window."""

    def __init__(self, max_requests: int = 20, window_seconds: int = 60) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: Dict[str, List[float]] = {}
        self._lock = threading.Lock()

    def _clean_old(self, key: str, now: float) -> None:
        if key in self._requests:
            cutoff = now - self.window_seconds
            self._requests[key] = [ts for ts in self._requests[key] if ts > cutoff]

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        with self._lock:
            self._clean_old(key, now)
            timestamps = self._requests.setdefault(key, [])
            if len(timestamps) >= self.max_requests:
                return False
            timestamps.append(now)
            return True

    def get_remaining(self, key: str) -> int:
        now = time.time()
        with self._lock:
            self._clean_old(key, now)
            used = len(self._requests.get(key, []))
            return max(0, self.max_requests - used)


def create_rate_limit_middleware(limiter: Optional[RateLimiter] = None) -> BaseHTTPMiddleware:
    """Factory that returns a FastAPI middleware applying rate limiting."""
    _limiter = limiter or RateLimiter()

    class RateLimitMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
            client_ip = request.client.host if request.client else "unknown"
            user_phone = request.headers.get("X-User-Phone", "")
            key = user_phone if user_phone else client_ip
            if not _limiter.is_allowed(key):
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Please try again later."},
                )
            response = await call_next(request)
            response.headers["X-RateLimit-Remaining"] = str(_limiter.get_remaining(key))
            return response

    return RateLimitMiddleware()
