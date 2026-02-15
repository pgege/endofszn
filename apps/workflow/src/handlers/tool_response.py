import logging

from src.models import Message
from src.pubsub import PubSubService
from src.callbacks import CallbackRegistry

logger = logging.getLogger(__name__)


async def handle_tool_response(
    channel: str,
    message: Message,
    pubsub: PubSubService,
    callback_registry: CallbackRegistry,
    **_,
) -> None:
    payload = message.payload
    callback_id = payload.get("callback_id")
    data = payload.get("data", {})
    error = payload.get("error")

    if not callback_id:
        logger.warning("Received tool_response without callback_id")
        return

    logger.info(f"Received tool response for callback: {callback_id}")

    if error:
        callback_registry.reject(callback_id, error)
    else:
        callback_registry.resolve(callback_id, data)
