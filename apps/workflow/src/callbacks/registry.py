import asyncio
import logging
import uuid
from typing import Any

logger = logging.getLogger(__name__)


class CallbackTimeoutError(Exception):
    def __init__(self, callback_id: str, timeout: float):
        self.callback_id = callback_id
        self.timeout = timeout
        super().__init__(f"Callback {callback_id} timed out after {timeout}s")


class CallbackError(Exception):
    def __init__(self, callback_id: str, error: str):
        self.callback_id = callback_id
        self.error = error
        super().__init__(f"Callback {callback_id} failed: {error}")


class CallbackRegistry:
    def __init__(self):
        self._pending: dict[str, asyncio.Future[dict[str, Any]]] = {}

    def create(self, callback_id: str | None = None) -> str:
        if callback_id is None:
            callback_id = f"cb_{uuid.uuid4().hex[:12]}"

        future: asyncio.Future[dict[str, Any]] = asyncio.get_event_loop().create_future()
        self._pending[callback_id] = future
        logger.debug(f"Created callback: {callback_id}")
        return callback_id

    async def wait_for(
        self, callback_id: str, timeout: float = 30.0
    ) -> dict[str, Any]:
        future = self._pending.get(callback_id)
        if not future:
            raise KeyError(f"Unknown callback: {callback_id}")

        try:
            result = await asyncio.wait_for(future, timeout=timeout)
            return result
        except asyncio.TimeoutError:
            self._pending.pop(callback_id, None)
            raise CallbackTimeoutError(callback_id, timeout)
        finally:
            self._pending.pop(callback_id, None)

    def resolve(self, callback_id: str, data: dict[str, Any]) -> bool:
        future = self._pending.get(callback_id)
        if not future or future.done():
            logger.warning(f"Cannot resolve callback {callback_id}: not found or already done")
            return False

        future.set_result(data)
        logger.debug(f"Resolved callback: {callback_id}")
        return True

    def reject(self, callback_id: str, error: str) -> bool:
        future = self._pending.get(callback_id)
        if not future or future.done():
            logger.warning(f"Cannot reject callback {callback_id}: not found or already done")
            return False

        future.set_exception(CallbackError(callback_id, error))
        logger.debug(f"Rejected callback: {callback_id}")
        return True

    def cancel_all(self) -> None:
        for callback_id, future in self._pending.items():
            if not future.done():
                future.cancel()
        self._pending.clear()
        logger.info("Cancelled all pending callbacks")
