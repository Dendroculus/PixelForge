"""Rate limiter setup and spoof-resistant client IP resolution.

Forwarded headers are user-controlled input unless every proxy hop that can
supply or append them is explicitly trusted. This module therefore fails closed:

- Direct peer addresses are always accepted.
- Forwarded headers are ignored unless ``TRUST_PROXY_HEADERS`` is enabled.
- The immediate peer must belong to ``TRUSTED_PROXY_CIDRS`` or
  ``CLOUDFLARE_SUBNETS``.
- ``X-Forwarded-For`` is evaluated from right to left, skipping only known
  trusted proxies and returning the first untrusted address.
- ``CF-Connecting-IP`` is trusted only when the immediate peer is a verified
  Cloudflare edge address.

This prevents a directly connected client from bypassing IP-based limits by
sending forged ``CF-Connecting-IP``, ``X-Forwarded-For``, or ``X-Real-IP``
headers.
"""

import logging
from functools import lru_cache
from ipaddress import (
    IPv4Address,
    IPv4Network,
    IPv6Address,
    IPv6Network,
    ip_address,
    ip_network,
)
from typing import TypeAlias

from fastapi import Request
from slowapi import Limiter

from core.config import settings

logger = logging.getLogger(__name__)

IPAddress: TypeAlias = IPv4Address | IPv6Address
IPNetwork: TypeAlias = IPv4Network | IPv6Network


def _parse_ip(value: str | None) -> IPAddress | None:
    """Return a validated IP address or ``None`` for malformed input."""
    if not value:
        return None

    candidate = value.strip()

    # Some proxies may serialize an IPv6 literal as ``[2001:db8::1]``.
    if candidate.startswith("[") and candidate.endswith("]"):
        candidate = candidate[1:-1]

    try:
        return ip_address(candidate)
    except ValueError:
        return None


def _parse_networks(values: tuple[str, ...], setting_name: str) -> tuple[IPNetwork, ...]:
    """Parse configured CIDRs while safely ignoring invalid entries."""
    networks: list[IPNetwork] = []

    for value in values:
        try:
            networks.append(ip_network(value, strict=False))
        except ValueError:
            logger.error(
                "Ignoring invalid CIDR in %s: %r",
                setting_name,
                value,
            )

    return tuple(networks)


@lru_cache(maxsize=1)
def _trusted_proxy_networks() -> tuple[IPNetwork, ...]:
    """Return all proxy networks allowed to influence client IP resolution."""
    configured = tuple(settings.trusted_proxy_cidrs_list)
    cloudflare = tuple(settings.cloudflare_subnets_list)

    return (
        *_parse_networks(configured, "TRUSTED_PROXY_CIDRS"),
        *_parse_networks(cloudflare, "CLOUDFLARE_SUBNETS"),
    )


@lru_cache(maxsize=1)
def _cloudflare_networks() -> tuple[IPNetwork, ...]:
    """Return validated Cloudflare edge networks."""
    return _parse_networks(
        tuple(settings.cloudflare_subnets_list),
        "CLOUDFLARE_SUBNETS",
    )


def _is_in_networks(address: IPAddress, networks: tuple[IPNetwork, ...]) -> bool:
    """Return whether an address belongs to one of the supplied networks."""
    return any(address in network for network in networks)


def _parse_forwarded_for(value: str | None) -> list[IPAddress]:
    """Parse valid addresses from an ``X-Forwarded-For`` chain."""
    if not value:
        return []

    addresses: list[IPAddress] = []

    for item in value.split(","):
        parsed = _parse_ip(item)
        if parsed is None:
            logger.debug(
                "Ignoring malformed X-Forwarded-For entry: %r",
                item.strip(),
            )
            continue

        addresses.append(parsed)

    return addresses


def _direct_peer_ip(request: Request) -> tuple[str, IPAddress | None]:
    """Return the raw and parsed direct peer address."""
    raw_peer = request.client.host if request.client else "127.0.0.1"
    return raw_peer, _parse_ip(raw_peer)


def get_real_client_ip(request: Request) -> str:
    """Resolve a client IP without trusting arbitrary forwarded headers.

    Resolution rules:

    1. Use the direct peer when proxy trust is disabled.
    2. Ignore forwarded headers when the direct peer is not allowlisted.
    3. Trust ``CF-Connecting-IP`` only for a direct Cloudflare peer.
    4. Otherwise evaluate ``X-Forwarded-For`` from right to left and return the
       first address that is not a configured trusted proxy.
    5. Use ``X-Real-IP`` only as a final fallback from an allowlisted proxy.

    Args:
        request:
            Current FastAPI request.

    Returns:
        str:
            Validated client IP used by rate limits, usage limits, and logs.
    """
    raw_peer, peer_ip = _direct_peer_ip(request)

    if peer_ip is None:
        logger.warning("Could not parse direct request peer IP: %r", raw_peer)
        return raw_peer

    if not settings.TRUST_PROXY_HEADERS:
        return str(peer_ip)

    trusted_networks = _trusted_proxy_networks()
    cloudflare_networks = _cloudflare_networks()

    if not _is_in_networks(peer_ip, trusted_networks):
        if any(
            request.headers.get(header)
            for header in (
                "CF-Connecting-IP",
                "X-Forwarded-For",
                "X-Real-IP",
            )
        ):
            logger.debug(
                "Ignoring forwarded client-IP headers from untrusted peer %s",
                peer_ip,
            )

        return str(peer_ip)

    peer_is_cloudflare = _is_in_networks(peer_ip, cloudflare_networks)

    # Cloudflare documents CF-Connecting-IP as the single original visitor IP.
    # It is authoritative here only when the socket peer itself is Cloudflare.
    if peer_is_cloudflare:
        cloudflare_client = _parse_ip(
            request.headers.get("CF-Connecting-IP")
        )
        if cloudflare_client is not None:
            return str(cloudflare_client)

    forwarded_chain = _parse_forwarded_for(
        request.headers.get("X-Forwarded-For")
    )

    cloudflare_in_chain = peer_is_cloudflare or any(
        _is_in_networks(address, cloudflare_networks)
        for address in forwarded_chain
    )

    if settings.REQUIRE_CLOUDFLARE_PROXY and not cloudflare_in_chain:
        logger.debug(
            "Ignoring forwarded chain without a verified Cloudflare hop; "
            "direct peer=%s",
            peer_ip,
        )
        return str(peer_ip)

    # Add the socket peer and walk from the application outward. Trusted proxy
    # addresses are skipped; the first untrusted address is the client.
    for address in reversed([*forwarded_chain, peer_ip]):
        if _is_in_networks(address, trusted_networks):
            continue

        return str(address)

    real_ip = _parse_ip(request.headers.get("X-Real-IP"))
    if real_ip is not None:
        return str(real_ip)

    return str(peer_ip)


limiter = Limiter(key_func=get_real_client_ip)
