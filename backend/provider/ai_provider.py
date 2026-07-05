"""AI provider abstraction layer.

Feature services should depend on ``BaseAIProvider`` instead of directly
calling a vendor SDK. This keeps the image pipeline independent from Replicate
and makes it easier to add another provider later.
"""

from abc import ABC, abstractmethod

from provider.replicate_client import smart_replicate_run


class BaseAIProvider(ABC):
    """Abstract contract implemented by AI inference providers."""

    @abstractmethod
    async def run_model(self, model_identifier: str, params: dict) -> str:
        """Execute a remote AI model and return a result URL.

        Args:
            model_identifier:
                Provider-specific model identifier.
            params:
                Provider-specific input payload.

        Returns:
            str:
                URL of the generated output.
        """


class ReplicateProvider(BaseAIProvider):
    """AI provider implementation backed by Replicate."""

    async def run_model(self, model_identifier: str, params: dict) -> str:
        """Run a Replicate model and normalize its output to a URL string.

        Args:
            model_identifier:
                Replicate model identifier.
            params:
                Replicate input payload.

        Returns:
            str:
                Output URL. If Replicate returns a list, the first item is used.
        """
        output = await smart_replicate_run(model_identifier, params)

        return str(output[0]) if isinstance(output, list) else str(output)


# Example of how easy it is to add a new provider in the future:
# class RunPodProvider(BaseAIProvider):
#     async def run_model(self, model_identifier: str, params: dict) -> str:
#         # RunPod specific API calls here
#         return result_url
