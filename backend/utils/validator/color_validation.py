"""Color/grayscale validation helpers.

The color restoration feature should receive grayscale or black-and-white
images. These helpers estimate whether an image contains significant color data
by comparing RGB channel differences on non-transparent pixels.
"""

import io

import numpy as np
from PIL import Image

from core.config import settings


def calculate_color_ratio(
    rgb: np.ndarray,
    valid_mask: np.ndarray,
) -> float:
    """Calculate the ratio of colored pixels within valid image pixels.

    Args:
        rgb:
            RGB image array with shape ``(height, width, 3)``.
        valid_mask:
            Boolean mask selecting pixels that should be analyzed.

    Returns:
        float:
            Ratio of colored pixels to valid pixels. Returns ``0.0`` when no
            valid pixels exist.
    """
    valid_pixel_count = np.sum(valid_mask)

    if valid_pixel_count == 0:
        return 0.0

    rgb_int = rgb.astype(np.int16)
    diff = (
        np.max(rgb_int, axis=2)
        - np.min(rgb_int, axis=2)
    )
    colored_mask = (
        (diff > settings.COLOR_DIFF_THRESHOLD)
        & valid_mask
    )

    colored_pixel_count = np.sum(colored_mask)
    return colored_pixel_count / valid_pixel_count


def validate_grayscale_image(file_bytes: bytes) -> bool:
    """Return whether image bytes are effectively grayscale.

    The check mirrors frontend validation:
        - convert image to RGBA
        - ignore nearly transparent pixels
        - mark pixels as colored when RGB channel spread exceeds the configured
          threshold
        - reject images when colored pixel ratio reaches the configured limit

    Args:
        file_bytes:
            Raw uploaded image bytes.

    Returns:
        bool:
            ``True`` when the image is effectively grayscale, otherwise
            ``False``.
    """
    try:
        with Image.open(io.BytesIO(file_bytes)) as img:
            img = img.convert("RGBA")
            data = np.array(img)

        alpha = data[:, :, 3]
        valid_mask = alpha >= settings.ALPHA_THRESHOLD

        rgb = data[:, :, :3]

        color_ratio = calculate_color_ratio(
            rgb=rgb,
            valid_mask=valid_mask,
        )
        return bool(color_ratio < settings.COLOR_PIXEL_RATIO_THRESHOLD)

    except Exception as exc:
        print(
            "[Validation Error] "
            f"Could not process image for grayscale check: {exc}"
        )
        return False
