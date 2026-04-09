from typing import Dict, List
from core.config import DEFAULT_SCALE

class ModelRegistry:
    """
    Registry for available AI models and their configuration.
    """

    _MODELS = {
        "general": {
            "replicate_id": "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
            "default_scale": DEFAULT_SCALE,
            "face_enhance": True,
        },
        "rembg": {
            "replicate_id": "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
        }
    }

    @classmethod
    def get_replicate_id(cls, model_type: str) -> str:
        if model_type not in cls._MODELS:
            raise ValueError(f"Model type '{model_type}' is not registered.")
        return cls._MODELS[model_type]["replicate_id"]

    @classmethod
    def get_params(cls, model_type: str, scale: int = DEFAULT_SCALE) -> Dict:
        if model_type not in cls._MODELS:
            raise ValueError(f"Model type '{model_type}' is not registered.")

        model_info = cls._MODELS[model_type]

        # General requires specific parameters; RemBG just needs the image.
        if model_type == "general":
            return {
                "scale": scale,
                "face_enhance": model_info.get("face_enhance", False),
            }
        
        return {}

    @classmethod
    def list_models(cls) -> List[str]:
        return list(cls._MODELS.keys())