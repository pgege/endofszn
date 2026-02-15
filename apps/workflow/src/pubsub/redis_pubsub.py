import asyncio
import json
import logging
from typing import Callable, Awaitable

import redis.asyncio as redis

logger = logging.getLogger(__name__)


class RedisPubSubService:
    def __init__(self, redis_url: str):
        self._redis_url = redis_url
        self._client: redis.Redis | None = None
        self._pubsub: redis.client.PubSub | None = None
        self._handlers: dict[str, Callable[[str, dict], Awaitable[None]]] = {}
        self._listener_task: asyncio.Task | None = None

    async def connect(self) -> None:
        self._client = redis.from_url(self._redis_url, decode_responses=True)
        self._pubsub = self._client.pubsub()
        logger.info(f"Connected to Redis at {self._redis_url}")

    async def disconnect(self) -> None:
        if self._listener_task:
            self._listener_task.cancel()
            try:
                await self._listener_task
            except asyncio.CancelledError:
                pass

        if self._pubsub:
            await self._pubsub.close()

        if self._client:
            await self._client.close()

        logger.info("Disconnected from Redis")

    async def publish(self, channel: str, message: dict) -> None:
        if not self._client:
            raise RuntimeError("Not connected to Redis")

        msg_type = message.get('type', 'unknown')
        payload = json.dumps(message)
        payload_size = len(payload.encode('utf-8'))
        if msg_type not in ('thinking', 'text_delta'):
            logger.info(f"Publishing {msg_type} to {channel} ({payload_size / 1024:.1f}KB)")
        receivers = await self._client.publish(channel, payload)
        if msg_type not in ('thinking', 'text_delta'):
            logger.info(f"Published {msg_type} to {channel} ({receivers} receivers)")

    async def subscribe(
        self,
        pattern: str,
        handler: Callable[[str, dict], Awaitable[None]],
    ) -> None:
        if not self._pubsub:
            raise RuntimeError("Not connected to Redis")

        self._handlers[pattern] = handler
        await self._pubsub.psubscribe(pattern)
        logger.info(f"Subscribed to pattern: {pattern}")

        if not self._listener_task or self._listener_task.done():
            self._listener_task = asyncio.create_task(self._listen())

    async def unsubscribe(self, pattern: str) -> None:
        if not self._pubsub:
            return

        await self._pubsub.punsubscribe(pattern)
        self._handlers.pop(pattern, None)
        logger.info(f"Unsubscribed from pattern: {pattern}")

    async def get_key(self, key: str) -> str | None:
        if not self._client:
            raise RuntimeError("Not connected to Redis")
        return await self._client.get(key)

    async def delete_key(self, key: str) -> None:
        if not self._client:
            raise RuntimeError("Not connected to Redis")
        await self._client.delete(key)

    async def _listen(self) -> None:
        if not self._pubsub:
            return

        logger.info("Starting Redis listener...")

        async for message in self._pubsub.listen():
            if message["type"] == "pmessage":
                pattern = message["pattern"]
                channel = message["channel"]
                data = message["data"]

                handler = self._handlers.get(pattern)
                if handler:
                    try:
                        parsed = json.loads(data)
                        await handler(channel, parsed)
                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON on {channel}: {data}")
                    except Exception as e:
                        logger.error(f"Handler error on {channel}: {e}", exc_info=True)
