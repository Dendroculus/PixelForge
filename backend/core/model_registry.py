from typing import Dict, List

class ModelRegistry:
    """
    Central source of truth for available AI models.
    The application is configured to use a single model: "general".
    """

    _MODELS = {
        "general": {
            "replicate_id": "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
            "default_scale": 4,
            "face_enhance": False,
        }
    }

    @classmethod
    def get_replicate_id(cls, model_type: str) -> str:
        if model_type not in cls._MODELS:
            raise ValueError(f"Model type '{model_type}' is not registered.")
        return cls._MODELS[model_type]["replicate_id"]

    @classmethod
    def get_params(cls, model_type: str) -> Dict:
        if model_type not in cls._MODELS:
            raise ValueError(f"Model type '{model_type}' is not registered.")

        model_info = cls._MODELS[model_type]
        return {
            "scale": model_info["default_scale"],
            "face_enhance": model_info["face_enhance"],
        }

    @classmethod
    def list_models(cls) -> List[str]:
        return list(cls._MODELS.keys())