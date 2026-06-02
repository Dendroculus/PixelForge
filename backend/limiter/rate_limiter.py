import logging
from fastapi import Request
from slowapi import Limiter

logger = logging.getLogger(__name__)

def get_real_client_ip(request: Request) -> str:
    """
    Extracts the true client IP safely to prevent rate-limit spoofing.
    
    Infrastructure Context:
    - Backend is hosted on DigitalOcean App Platform.
    - The DO edge load balancer automatically strips spoofed client headers.
    - We prioritize Cloudflare's strict header first, falling back to standard proxies.
    """
    # 1. Cloudflare Strict Header (If traffic routes through CF first)
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()

    # 2. Standard Reverse Proxy (DigitalOcean Load Balancer)
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        client_ip = xff.split(",")[0].strip()
        if client_ip:
            return client_ip

    # 3. Nginx / Caddy standard fallback
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()

    # 4. Direct Localhost / Container Fallback
    peer_ip = request.client.host if request.client else "127.0.0.1"
    return peer_ip

limiter = Limiter(key_func=get_real_client_ip)