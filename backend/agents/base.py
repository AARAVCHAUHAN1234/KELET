import abc
from typing import Any, Dict

class BaseAgent(abc.ABC):
    """Base class for all agents.

    Sub‑classes must implement an async ``run`` method that receives a mutable ``context``
    dict and returns any structured output. ``context`` holds data shared across agents.
    """

    @abc.abstractmethod
    async def run(self, context: Dict[str, Any]) -> Any:
        """Execute the agent logic.

        Args:
            context: Shared dictionary that persists throughout the pipeline.
        Returns:
            Agent‑specific output (stored back into ``context`` by the caller).
        """
        raise NotImplementedError
