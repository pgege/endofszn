import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.config import REDIS_URL, WORKFLOW_CHANNEL_PREFIX
from src.pubsub import RedisPubSubService
from src.callbacks import CallbackRegistry
from src.handlers import (
    HandlerRegistry,
    handle_user_message,
    handle_tool_response,
    handle_cancel,
    handle_workflow,
)
from src.tasks import TaskManager
from src.workflows import WorkflowExecutor
from src.models import Message, MessageType
from src.routers import health, mcp
from src.agents import mcp_registry

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

pubsub_service: RedisPubSubService | None = None
callback_registry: CallbackRegistry | None = None
handler_registry: HandlerRegistry | None = None
task_manager: TaskManager | None = None
workflow_executor: WorkflowExecutor | None = None


async def message_router(channel: str, raw_message: dict) -> None:
    msg_type = raw_message.get("type", "")
    if msg_type.startswith("workflow:"):
        return

    try:
        message = Message(**raw_message)
        await handler_registry.dispatch(
            channel,
            message,
            pubsub_service,
            callback_registry,
            task_manager=task_manager,
            workflow_executor=workflow_executor,
        )
    except Exception as e:
        logger.error(f"Failed to route message: {e}", exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pubsub_service, callback_registry, handler_registry
    global task_manager, workflow_executor

    pubsub_service = RedisPubSubService(REDIS_URL)
    callback_registry = CallbackRegistry()
    handler_registry = HandlerRegistry()
    task_manager = TaskManager()
    workflow_executor = WorkflowExecutor()

    handler_registry.register(MessageType.USER_MESSAGE, handle_user_message)
    handler_registry.register(MessageType.TOOL_RESPONSE, handle_tool_response)
    handler_registry.register(MessageType.CALLBACK_RESPONSE, handle_tool_response)
    handler_registry.register(MessageType.CANCEL, handle_cancel)
    handler_registry.register(MessageType.WORKFLOW, handle_workflow)

    mcp_base_dir = os.getenv(
        "MCP_BASE_DIR",
        os.path.join(os.path.dirname(__file__), "..", "..", "api", "dist", "mcp"),
    )
    mcp_env = {
        "REDIS_HOST": os.getenv("REDIS_HOST", "localhost"),
        "REDIS_PORT": os.getenv("REDIS_PORT", "6379"),
    }

    for server_name in ["store-core", "store-catalog", "store-media", "store-orders", "store-customers", "store-promotions", "store-pricing"]:
        server_path = os.path.join(mcp_base_dir, f"servers/{server_name}.js")
        mcp_registry.register_stdio(
            server_name,
            command="node",
            args=[server_path],
            env=mcp_env,
        )
        logger.info(f"Registered {server_name} MCP stdio server at {server_path}")

    sandbox_base_dir = os.getenv(
        "SANDBOX_MCP_DIR",
        os.path.join(os.path.dirname(__file__), "..", "..", "sandbox", "dist"),
    )
    sandbox_path = os.path.join(sandbox_base_dir, "index.js")
    mcp_registry.register_stdio(
        "sandbox",
        command="node",
        args=[sandbox_path],
        env={
            "REDIS_HOST": os.getenv("REDIS_HOST", "localhost"),
            "REDIS_PORT": os.getenv("REDIS_PORT", "6379"),
            "E2B_API_KEY": os.getenv("E2B_API_KEY", ""),
            "API_PROTOCOL": os.getenv("API_PROTOCOL", "http"),
            "API_HOST": os.getenv("API_HOST", "localhost"),
            "API_PORT": os.getenv("API_PORT", "3000"),
            "SANDBOX_TIMEOUT_MS": os.getenv("SANDBOX_TIMEOUT_MS", "3600000"),
        },
    )
    logger.info(f"Registered sandbox MCP stdio server at {sandbox_path}")

    async def handle_mcp_servers_list(_channel: str, raw: dict) -> None:
        request_id = raw.get("request_id")
        if not request_id:
            return
        await pubsub_service.publish(
            f"mcp:servers:list:response:{request_id}",
            {"servers": mcp_registry.list_servers()},
        )

    await pubsub_service.connect()
    await pubsub_service.subscribe(f"{WORKFLOW_CHANNEL_PREFIX}:*", message_router)
    await pubsub_service.subscribe("mcp:servers:list:request", handle_mcp_servers_list)

    logger.info(f"Workflow service started, listening on {WORKFLOW_CHANNEL_PREFIX}:*")

    yield

    logger.info("Shutting down workflow service...")
    task_manager.cancel_all()
    workflow_executor.cancel_all()
    callback_registry.cancel_all()
    await pubsub_service.disconnect()


app = FastAPI(title="endofszn Workflow Service", lifespan=lifespan)

cors_origins_str = os.getenv("WORKFLOW_CORS_ORIGINS", "")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
is_dev = os.getenv("NODE_ENV") != "production"

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["*"] if is_dev else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(mcp.router)
