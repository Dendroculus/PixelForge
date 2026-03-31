from fastapi import Request
from slowapi import Limiter

def get_real_client_ip(request: Request) -> str:
    """
    Resolves the client IP address for rate limiting.

    Priority order:
    1. CF-Connecting-IP (Cloudflare)
    2. X-Real-IP (trusted reverse proxies)
    3. X-Forwarded-For (first IP in chain)
    4. Direct client connection IP

    Returns:
        str: Resolved client IP address
    """
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()

    x_real_ip = request.headers.get("X-Real-IP")
    if x_real_ip:
        return x_real_ip.strip()

    xff = request.headers.get("X-Forwarded-For")
    if xff:
        ips = [ip.strip() for ip in xff.split(",") if ip.strip()]
        if ips:
            return ips[0]

    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"


limiter = Limiter(key_func=get_real_client_ip)