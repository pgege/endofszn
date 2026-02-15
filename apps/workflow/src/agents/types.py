from dataclasses import dataclass
from typing import Any, Callable, Awaitable

from src.pubsub import PubSubService
from src.callbacks import CallbackRegistry


@dataclass
class AgentDeps:
    workflow_run_id: str
    channel: str
    pubsub: PubSubService
    callback_registry: CallbackRegistry
    context: dict[str, Any]


ToolHandler = Callable[[str, dict[str, Any]], Awaitable[dict[str, Any]]]
