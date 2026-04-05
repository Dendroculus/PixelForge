import ipaddress
import os
from fastapi import Request
from slowapi import Limiter


DEFAULT_CLOUDFLARE_SUBNETS = [
    # IPv4
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

    # IPv6
    "2400:cb00::/32",
    "2606:4700::/32",
    "2803:f800::/32",
    "2405:b500::/32",
    "2405:8100::/32",
    "2a06:98c0::/29",
    "2c0f:f248::/32",
]


def _load_cloudflare_subnets():
    raw = os.getenv("CLOUDFLARE_SUBNETS")
    subnet_values = DEFAULT_CLOUDFLARE_SUBNETS if not raw else [s.strip() for s in raw.split(",") if s.strip()]

    parsed = []
    for subnet in subnet_values:
        try:
            parsed.append(ipaddress.ip_network(subnet))
        except ValueError:
            continue

    if not parsed:
        parsed = [ipaddress.ip_network(subnet) for subnet in DEFAULT_CLOUDFLARE_SUBNETS]

    return parsed


CLOUDFLARE_SUBNETS = _load_cloudflare_subnets()


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
            candidate = cf_ip.strip()
            try:
                ipaddress.ip_address(candidate)
                return candidate
            except ValueError:
                pass

    return client_host


limiter = Limiter(key_func=get_real_client_ip)