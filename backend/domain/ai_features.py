"""Domain definitions for supported PixelForge AI features.

This module contains stable feature identifiers shared across routes, services,
usage limits, and user-facing response messages. Keeping these identifiers in
one place reduces typo risk when adding or refactoring AI tools.
"""

from typing import Literal


FeatureType = Literal[
    "upscale",
    "rembg",
    "colorrestore",
    "objectremove",
]


FEATURE_DISPLAY_NAMES: dict[FeatureType, str] = {
    "upscale": "Upscale",
    "rembg": "RemBG",
    "colorrestore": "Color Restore",
    "objectremove": "Object Remove",
}
