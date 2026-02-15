import logging

from src.models import Message
from src.pubsub import PubSubService
from src.callbacks import CallbackRegistry
from src.tasks import TaskManager
from src.workflows import WorkflowExecutor

logger = logging.getLogger(__name__)


async def handle_cancel(
    channel: str,
    message: Message,
    pubsub: PubSubService,
    callback_registry: CallbackRegistry,
    *,
    task_manager: TaskManager,
    workflow_executor: WorkflowExecutor,
    **_,
) -> None:
    payload = message.payload
    task_id = payload.get("task_id")
    workflow_run_id = message.workflow_run_id

    logger.info(f"Received cancel request for workflow run: {workflow_run_id}, task: {task_id}")

    cancelled = task_manager.cancel(workflow_run_id, task_id)
    if not cancelled:
        cancelled = workflow_executor.cancel(workflow_run_id)

    if cancelled:
        logger.info(f"Cancelled task for workflow run: {workflow_run_id}")
    else:
        logger.warning(f"No active task to cancel for workflow run: {workflow_run_id}")
