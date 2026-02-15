import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class MessageType(str, Enum):
    USER_MESSAGE = "user_message"
    WORKFLOW = "workflow"
    THINKING = "thinking"
    TEXT_DELTA = "text_delta"
    TOOL_REQUEST = "tool_request"
    TOOL_RESPONSE = "tool_response"
    CALLBACK_RESPONSE = "callback_response"
    END_OF_TURN = "end_of_turn"
    ERROR = "error"
    CANCEL = "cancel"


class UserMessagePayload(BaseModel):
    content: str
    context: dict[str, Any] | None = None


class ThinkingPayload(BaseModel):
    content: str
    step_id: str | None = None


class TextDeltaPayload(BaseModel):
    content: str
    step_id: str | None = None


class ToolRequestPayload(BaseModel):
    callback_id: str
    tool: str
    args: dict[str, Any] = Field(default_factory=dict)


class ToolResponsePayload(BaseModel):
    callback_id: str
    data: dict[str, Any] = Field(default_factory=dict)
    error: str | None = None


class EndOfTurnPayload(BaseModel):
    data: dict[str, Any] | None = None


class ErrorPayload(BaseModel):
    message: str
    code: str | None = None
    details: dict[str, Any] | None = None


class CancelPayload(BaseModel):
    task_id: str | None = None


class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: MessageType
    workflow_run_id: str
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    payload: dict[str, Any]


def create_message(
    message_type: MessageType,
    workflow_run_id: str,
    payload: BaseModel | dict[str, Any],
) -> Message:
    if isinstance(payload, BaseModel):
        payload_dict = payload.model_dump()
    else:
        payload_dict = payload

    return Message(
        type=message_type,
        workflow_run_id=workflow_run_id,
        payload=payload_dict,
    )
