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