"""AI model registry for PixelForge.

The registry is the single source of truth for model identifiers and
model-specific input conventions. Feature services ask this class for model
IDs, default parameters, and input key names instead of hard-coding provider
details throughout the pipeline.
"""

from typing import Dict, List

from core.config import settings


class ModelRegistry:
    """Registry of supported AI models and provider-specific configuration."""

    _MODELS = {
        "general": {
            "replicate_id": "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
            "default_scale": settings.DEFAULT_SCALE,
            "face_enhance": True,
        },
        "rembg": {
            "replicate_id": "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
        },
        "colorrestore": {
            "replicate_id": "piddnad/ddcolor:ca494ba129e44e45f661d6ece83c4c98a9a7c774309beca01429b58fce8aa695",
            "input_key": "image",
        },
        "objectremove": {
            "replicate_id": "zylim0702/remove-object:0e3a841c913f597c1e4c321560aa69e2bc1f15c65f8c366caafc379240efd8ba",
            "input_key": "image",
            "mask_key": "mask",
        },
    }

    @classmethod
    def get_replicate_id(cls, model_type: str) -> str:
        """Return the Replicate model identifier for a registered model.

        Args:
            model_type:
                Internal model key such as ``general`` or ``rembg``.

        Raises:
            ValueError:
                Raised when ``model_type`` is not registered.

        Returns:
            str:
                Fully qualified Replicate model identifier.
        """
        if model_type not in cls._MODELS:
            raise ValueError(f"Model type '{model_type}' is not registered.")
        return cls._MODELS[model_type]["replicate_id"]

    @classmethod
    def get_params(cls, model_type: str, scale: int = settings.DEFAULT_SCALE) -> Dict:
        """Build provider input parameters for a registered model.

        Args:
            model_type:
                Internal model key.
            scale:
                Requested upscale factor. Used by the general upscaling model.

        Raises:
            ValueError:
                Raised when ``model_type`` is not registered.

        Returns:
            dict:
                Provider-specific parameter dictionary.
        """
        if model_type not in cls._MODELS:
            raise ValueError(f"Model type '{model_type}' is not registered.")

        model_info = cls._MODELS[model_type]

        if model_type == "general":
            return {
                "scale": scale,
                "face_enhance": model_info.get("face_enhance", False),
            }

        if model_type == "colorrestore":
            return {}

        return {}

    @classmethod
    def get_input_key(cls, model_type: str) -> str:
        """Return the image input field expected by a model.

        Args:
            model_type:
                Internal model key.

        Raises:
            ValueError:
                Raised when ``model_type`` is not registered.

        Returns:
            str:
                Input key name used in the provider payload.
        """
        if model_type not in cls._MODELS:
            raise ValueError(f"Model type '{model_type}' is not registered.")
        return cls._MODELS[model_type].get("input_key", "image")

    @classmethod
    def list_models(cls) -> List[str]:
        """Return the registered internal model keys."""
        return list(cls._MODELS.keys())

    @classmethod
    def get_mask_key(cls, model_type: str) -> str:
        """Return the mask input field expected by a model.

        Args:
            model_type:
                Internal model key.

        Raises:
            ValueError:
                Raised when ``model_type`` is not registered.

        Returns:
            str:
                Mask key name used in the provider payload.
        """
        if model_type not in cls._MODELS:
            raise ValueError(f"Model type '{model_type}' is not registered.")
        return cls._MODELS[model_type].get("mask_key", "mask")
