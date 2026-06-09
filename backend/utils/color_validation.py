import io
import numpy as np
from PIL import Image
from core.config import ColorValidationConfig as CVC




def calculate_color_ratio(
    rgb: np.ndarray,
    valid_mask: np.ndarray,
) -> float:
    """
    Calculates the ratio of colored pixels within the valid image area.

    A pixel is considered "colored" when the difference between its
    maximum and minimum RGB channel values exceeds the configured
    COLOR_DIFF_THRESHOLD.

    Args:
        rgb (np.ndarray):
            RGB image data with shape (height, width, 3).
        valid_mask (np.ndarray):
            Boolean mask indicating which pixels should be analyzed.

    Returns:
        float:
            Ratio of colored pixels to valid pixels.
            Returns 0.0 if no valid pixels exist.
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
        (diff > CVC.COLOR_DIFF_THRESHOLD)
        & valid_mask
    )

    colored_pixel_count = np.sum(colored_mask)
    return colored_pixel_count / valid_pixel_count


def validate_grayscale_image(file_bytes: bytes) -> bool:
    """
    Validates whether an uploaded image is effectively grayscale.

    This mirrors the frontend validation logic:

    - Converts the image to RGBA.
    - Ignores nearly transparent pixels (alpha < ALPHA_THRESHOLD).
    - Marks a pixel as colored when the difference between its
      highest and lowest RGB channel exceeds COLOR_DIFF_THRESHOLD.
    - Rejects the image if at least COLOR_PIXEL_RATIO_THRESHOLD
      of valid pixels are considered colored.

    Examples:
        - Pure black-and-white images -> True
        - Grayscale photos -> True
        - Colored photos -> False
        - Corrupted/unreadable files -> False

    Args:
        file_bytes (bytes):
            Raw uploaded image bytes.

    Returns:
        bool:
            True if the image passes grayscale validation.
            False if the image contains significant color data
            or cannot be processed.
    """
    try:
        with Image.open(io.BytesIO(file_bytes)) as img:
            img = img.convert("RGBA")
            data = np.array(img)

        alpha = data[:, :, 3]
        valid_mask = alpha >= CVC.ALPHA_THRESHOLD

        rgb = data[:, :, :3]

        color_ratio = calculate_color_ratio(
            rgb=rgb,
            valid_mask=valid_mask,
        )
        return bool(color_ratio < CVC.COLOR_PIXEL_RATIO_THRESHOLD)

    except Exception as exc:
        print(
            "[Validation Error] "
            f"Could not process image for grayscale check: {exc}"
        )
        return False