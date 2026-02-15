import logging

from src.models import Message
from src.pubsub import PubSubService
from src.callbacks import CallbackRegistry
from src.workflows import WorkflowExecutor, WorkflowDefinition

logger = logging.getLogger(__name__)


async def handle_workflow(
    channel: str,
    message: Message,
    pubsub: PubSubService,
    callback_registry: CallbackRegistry,
    *,
    workflow_executor: WorkflowExecutor,
    **_,
) -> None:
    workflow_run_id = message.workflow_run_id
    payload = message.payload

    workflow_data = payload.get("workflow")
    if not workflow_data:
        logger.error("No workflow definition provided")
        return

    try:
        workflow = WorkflowDefinition(**workflow_data)
    except Exception as e:
        logger.error(f"Invalid workflow definition: {e}")
        return

    trigger_data = {
        "message": payload.get("content", ""),
        "attachments": payload.get("attachments", []),
        "context": payload.get("context", {}),
        "history": payload.get("history", {}),
    }

    logger.info(f"Executing workflow '{workflow.name}' for {workflow_run_id}")

    await workflow_executor.run(
        workflow=workflow,
        workflow_run_id=workflow_run_id,
        trigger_data=trigger_data,
        pubsub=pubsub,
        callback_registry=callback_registry,
    )
