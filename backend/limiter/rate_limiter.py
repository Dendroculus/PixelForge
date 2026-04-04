import ipaddress
from fastapi import Request
from slowapi import Limiter


CLOUDFLARE_SUBNETS = [
    ipaddress.ip_network(subnet) for subnet in [
        "173.245.48.0/20",
        "103.21.244.0/22",
        "103.22.200.0/22",
        "103.31.4.0/22",
        "141.101.64.0/18",
        "108.162.192.0/18",
        "190.93.240.0/20",
        "188.114.96.0/20",
        "197.234.240.0/22",
        "198.41.128.0/17",
        "162.158.0.0/15",
        "104.16.0.0/13",
        "104.24.0.0/14",
        "172.64.0.0/13",
        "131.0.72.0/22",
    ]
]
def get_real_client_ip(request: Request) -> str:
    """
    Resolves the client IP address securely, protecting against header spoofing.
    """
    client_host = request.client.host if request.client else "127.0.0.1"
    
    try:
        client_ip_obj = ipaddress.ip_address(client_host)
        is_cloudflare = any(client_ip_obj in subnet for subnet in CLOUDFLARE_SUBNETS)
    except ValueError:
        is_cloudflare = False

    if is_cloudflare:
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip:
            return cf_ip.strip()
    
    return client_host

limiter = Limiter(key_func=get_real_client_ip)