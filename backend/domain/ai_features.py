from typing import Literal

FeatureType = Literal["upscale", "rembg", "colorrestore"]


FEATURE_DISPLAY_NAMES: dict[FeatureType, str] = {
    "upscale": "Upscale",
    "rembg": "RemBG",
    "colorrestore": "Color Restore",
}