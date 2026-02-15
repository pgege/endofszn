import logging
from typing import Callable, Awaitable, Any

from src.models import Message, MessageType
from src.pubsub import PubSubService
from src.callbacks import CallbackRegistry

logger = logging.getLogger(__name__)

MessageHandler = Callable[..., Awaitable[None]]


class HandlerRegistry:
    def __init__(self):
        self._handlers: dict[MessageType, MessageHandler] = {}

    def register(self, message_type: MessageType, handler: MessageHandler) -> None:
        self._handlers[message_type] = handler
        logger.info(f"Registered handler for {message_type.value}")

    def get(self, message_type: MessageType) -> MessageHandler | None:
        return self._handlers.get(message_type)

    async def dispatch(
        self,
        channel: str,
        message: Message,
        pubsub: PubSubService,
        callback_registry: CallbackRegistry,
        **services: Any,
    ) -> None:
        handler = self.get(message.type)
        if handler:
            logger.info(f"Dispatching {message.type.value} on {channel}")
            try:
                await handler(
                    channel, message, pubsub, callback_registry, **services
                )
            except Exception as e:
                logger.error(f"Handler error for {message.type.value}: {e}", exc_info=True)
        else:
            logger.debug(f"No handler for message type: {message.type.value}")
