import ipaddress
import os
from fastapi import Request
from slowapi import Limiter

DEFAULT_CLOUDFLARE_SUBNETS = [
    "173.245.48.0/20","103.21.244.0/22","103.22.200.0/22","103.31.4.0/22",
    "141.101.64.0/18","108.162.192.0/18","190.93.240.0/20","188.114.96.0/20",
    "197.234.240.0/22","198.41.128.0/17","162.158.0.0/15","104.16.0.0/13",
    "104.24.0.0/14","172.64.0.0/13","131.0.72.0/22",
    "2400:cb00::/32","2606:4700::/32","2803:f800::/32","2405:b500::/32",
    "2405:8100::/32","2a06:98c0::/29","2c0f:f248::/32",
]

def _env_truthy(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "on"}

def _parse_subnets(csv_value: str):
    out = []
    for raw in (csv_value or "").split(","):
        s = raw.strip()
        if not s:
            continue
        try:
            out.append(ipaddress.ip_network(s, strict=False))
        except ValueError:
            pass
    return out

def _load_cloudflare_subnets():
    custom = _parse_subnets(os.getenv("CLOUDFLARE_SUBNETS", ""))
    if custom:
        return custom
    return [ipaddress.ip_network(s) for s in DEFAULT_CLOUDFLARE_SUBNETS]

def _load_trusted_proxy_subnets():
    return _parse_subnets(os.getenv("TRUSTED_PROXY_SUBNETS", ""))

def _parse_ip(value: str):
    if not value:
        return None
    try:
        return ipaddress.ip_address(value.strip())
    except ValueError:
        return None

def _first_xff_ip(xff: str):
    if not xff:
        return None
    first = xff.split(",")[0].strip()
    return _parse_ip(first)

def _ip_in_any_subnet(ip_obj, subnets):
    return any(ip_obj in net for net in subnets)

CLOUDFLARE_SUBNETS = _load_cloudflare_subnets()
TRUSTED_PROXY_SUBNETS = _load_trusted_proxy_subnets()

TRUST_PROXY_HEADERS = _env_truthy("TRUST_PROXY_HEADERS", "true")
REQUIRE_CLOUDFLARE_PROXY = _env_truthy("REQUIRE_CLOUDFLARE_PROXY", "false")

def get_real_client_ip(request: Request) -> str:
    """
    Anti-spoof strategy:
    - Never trust forwarded headers from untrusted peers.
    - Trust CF-Connecting-IP only if immediate peer is Cloudflare.
    - Trust X-Forwarded-For only if immediate peer is explicitly trusted proxy.
    - Never return global shared key like 'proxy-missing'.
    """
    peer_raw = request.client.host if request.client else "127.0.0.1"
    peer_ip = _parse_ip(peer_raw)
    if peer_ip is None:
        return "127.0.0.1"

    peer_is_cloudflare = _ip_in_any_subnet(peer_ip, CLOUDFLARE_SUBNETS)
    peer_is_trusted_proxy = _ip_in_any_subnet(peer_ip, TRUSTED_PROXY_SUBNETS)

    if REQUIRE_CLOUDFLARE_PROXY and not peer_is_cloudflare:
        return f"direct:{peer_ip}"

    if TRUST_PROXY_HEADERS:
        if peer_is_cloudflare:
            cfip = _parse_ip(request.headers.get("CF-Connecting-IP", ""))
            if cfip is not None:
                return str(cfip)

        if peer_is_trusted_proxy:
            xff_ip = _first_xff_ip(request.headers.get("X-Forwarded-For", ""))
            if xff_ip is not None:
                return str(xff_ip)

    return str(peer_ip)

limiter = Limiter(key_func=get_real_client_ip)