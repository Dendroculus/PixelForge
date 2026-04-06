from typing import Dict, List
from core.config import DEFAULT_SCALE

class ModelRegistry:
    """
    Registry for available AI models and their configuration.

    Currently supports a single model: "general".
    Provides helper methods to retrieve model-specific parameters.
    """

    _MODELS = {
        "general": {
            "replicate_id": "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
            "default_scale": DEFAULT_SCALE,
            "face_enhance": False,
        }
    }

    @classmethod
    def get_replicate_id(cls, model_type: str) -> str:
        """
        Returns the Replicate model ID for a given model type.

        @param model_type: Model identifier
        @return: Replicate model ID
        @raises ValueError: If model is not registered
        """
        if model_type not in cls._MODELS:
            raise ValueError(f"Model type '{model_type}' is not registered.")
        return cls._MODELS[model_type]["replicate_id"]

    @classmethod
    def get_params(cls, model_type: str, scale: int = DEFAULT_SCALE) -> Dict:
        """
        Returns model parameters for inference.

        @param model_type: Model identifier
        @param scale: Upscale factor (overrides default)
        @return: Dictionary of model parameters
        @raises ValueError: If model is not registered
        """
        if model_type not in cls._MODELS:
            raise ValueError(f"Model type '{model_type}' is not registered.")

        model_info = cls._MODELS[model_type]

        return {
            "scale": scale,
            "face_enhance": model_info["face_enhance"],
        }

    @classmethod
    def list_models(cls) -> List[str]:
        """
        Returns a list of available model types.

        @return: List of model names
        """
        return list(cls._MODELS.keys())