import logging

from src.models import Message
from src.pubsub import PubSubService
from src.callbacks import CallbackRegistry
from src.tasks import TaskManager

logger = logging.getLogger(__name__)


async def handle_user_message(
    channel: str,
    message: Message,
    pubsub: PubSubService,
    callback_registry: CallbackRegistry,
    *,
    task_manager: TaskManager,
    **_,
) -> None:
    workflow_run_id = message.workflow_run_id
    payload = message.payload
    user_content = payload.get("content", "")
    context = payload.get("context", {})
    agent_config = payload.get("agent_config")
    history = payload.get("history", [])

    logger.info(f"Received user message for {workflow_run_id}: {user_content[:50]}...")

    await task_manager.run_agent(
        workflow_run_id=workflow_run_id,
        user_message=user_content,
        context=context,
        pubsub=pubsub,
        callback_registry=callback_registry,
        agent_config=agent_config,
        history=history,
    )
