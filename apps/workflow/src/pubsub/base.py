from typing import Protocol, Callable, Awaitable


class PubSubService(Protocol):
    async def connect(self) -> None:
        """Establish connection to pub/sub backend."""
        ...

    async def disconnect(self) -> None:
        """Close connection."""
        ...

    async def publish(self, channel: str, message: dict) -> None:
        """Publish message to channel."""
        ...

    async def subscribe(
        self,
        pattern: str,
        handler: Callable[[str, dict], Awaitable[None]],
    ) -> None:
        """Subscribe to channel pattern, call handler for each message."""
        ...

    async def unsubscribe(self, pattern: str) -> None:
        """Unsubscribe from channel pattern."""
        ...
