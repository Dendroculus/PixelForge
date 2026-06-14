from PIL import Image

def smart_downscale(img: Image.Image, max_pixels: int) -> Image.Image:
    """
    Proportionally downscales a PIL Image if its total pixel count exceeds the specified maximum.
    Uses LANCZOS resampling for maximum quality.

    Args:
        img (Image.Image): The input PIL Image object.
        max_pixels (int): The maximum allowed total pixels (width * height).

    Returns:
        Image.Image: The downscaled image, or the original image if downscaling is not required.
    """
    width, height = img.size
    total_pixels = width * height

    if total_pixels > max_pixels:
        scale_factor = (max_pixels / total_pixels) ** 0.5
        new_width = max(1, int(width * scale_factor))
        new_height = max(1, int(height * scale_factor))
        return img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    return img