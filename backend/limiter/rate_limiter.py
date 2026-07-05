"""Rate limiter setup and client IP resolution.

This module configures SlowAPI to rate-limit requests by resolved client IP.
The IP resolution order matches the deployment path used by PixelForge while
still supporting local development and common reverse-proxy headers.
"""

import logging

from fastapi import Request
from slowapi import Limiter

logger = logging.getLogger(__name__)


def get_real_client_ip(request: Request) -> str:
    """Resolve the best available client IP address for rate limiting.

    Resolution order:
        1. ``CF-Connecting-IP`` for Cloudflare-fronted traffic.
        2. First address from ``X-Forwarded-For`` for reverse proxies.
        3. ``X-Real-IP`` for common proxy setups.
        4. Direct request peer host, or localhost fallback.

    Args:
        request:
            Current FastAPI request.

    Returns:
        str:
            Resolved client IP address.
    """
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()

    xff = request.headers.get("X-Forwarded-For")
    if xff:
        client_ip = xff.split(",")[0].strip()
        if client_ip:
            return client_ip

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()

    peer_ip = request.client.host if request.client else "127.0.0.1"
    return peer_ip


limiter = Limiter(key_func=get_real_client_ip)
