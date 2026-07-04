from abc import ABC, abstractmethod
from provider.replicate_client import smart_replicate_run

class BaseAIProvider(ABC):
    """
    Abstract Base Class defining the contract for AI providers.
    Ensures seamless switching between cloud vendors without altering core logic.
    """

    @abstractmethod
    async def run_model(self, model_identifier: str, params: dict) -> str:
        """
        Executes the remote AI model and returns the standardized output URL.
        """
        pass


class ReplicateProvider(BaseAIProvider):
    """
    Concrete implementation of the AI provider contract using Replicate.
    """

    async def run_model(self, model_identifier: str, params: dict) -> str:
        output = await smart_replicate_run(model_identifier, params)
        
        return str(output[0]) if isinstance(output, list) else str(output)


# Example of how easy it is to add a new provider in the future:
# class RunPodProvider(BaseAIProvider):
#     async def run_model(self, model_identifier: str, params: dict) -> str:
#         # RunPod specific API calls here
#         return result_url