import base64
import json
import logging
from datetime import datetime, timezone
from uuid import uuid4

from pydantic_ai import RunContext, ToolReturn, BinaryContent
from pydantic_ai.tools import Tool

from src.agents.types import AgentDeps
from src.callbacks import CallbackRegistry
from src.pubsub import PubSubService
from src import config

logger = logging.getLogger(__name__)


def create_attachment_tools(
    pubsub: PubSubService,
    channel: str,
    workflow_run_id: str,
    callback_registry: CallbackRegistry,
) -> list[Tool[AgentDeps]]:
    async def list_attachments(ctx_run: RunContext[AgentDeps], filter: str = "all") -> str:
        cb_id = callback_registry.create()
        await pubsub.publish(channel, {
            "id": str(uuid4()),
            "type": "workflow:attachments_query",
            "workflow_run_id": workflow_run_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": {"filter": filter, "callback_id": cb_id},
        })
        response = await callback_registry.wait_for(cb_id, timeout=30.0)
        attachments = response.get("attachments", [])
        return json.dumps({"attachments": attachments, "count": len(attachments)})

    async def view_images(ctx_run: RunContext[AgentDeps], attachment_ids: list[str]) -> ToolReturn:
        cb_id = callback_registry.create()
        await pubsub.publish(channel, {
            "id": str(uuid4()),
            "type": "workflow:view_images",
            "workflow_run_id": workflow_run_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": {"attachment_ids": attachment_ids, "callback_id": cb_id},
        })
        response = await callback_registry.wait_for(cb_id, timeout=30.0)
        images = response.get("images", [])

        VALID_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

        content = []
        summaries = []
        for img in images:
            if img.get("error"):
                summaries.append(f"{img['id']}: {img['error']}")
                continue

            redis_key = img.get("redisKey", "")
            b64_data = ""
            if redis_key:
                b64_data = await pubsub.get_key(redis_key) or ""
                await pubsub.delete_key(redis_key)

            if not b64_data:
                summaries.append(f"{img['id']}: image data not available")
                continue

            mime = img.get("mimeType", "image/png")
            if mime not in VALID_IMAGE_TYPES:
                mime = "image/png"
            filename = img.get("filename", "image")
            content.append(f"Image: {filename}")
            content.append(BinaryContent(data=base64.b64decode(b64_data), media_type=mime))
            summaries.append(f"{filename} (id: {img['id']})")

        return ToolReturn(
            return_value=f"Viewing {len(summaries)} image(s): {', '.join(summaries)}",
            content=content,
        )

    async def add_attachment(ctx_run: RunContext[AgentDeps], url: str, filename: str, mimeType: str) -> str:
        cb_id = callback_registry.create()
        await pubsub.publish(channel, {
            "id": str(uuid4()),
            "type": "workflow:attachment",
            "workflow_run_id": workflow_run_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": {
                "callback_id": cb_id,
                "attachment": {
                    "external_url": url, "filename": filename, "mimeType": mimeType,
                    "source": "agent",
                },
            },
        })
        response = await callback_registry.wait_for(cb_id, timeout=30.0)
        return json.dumps({"url": response.get("url", ""), "filename": filename, "id": response.get("id", "")})

    async def generate_image(ctx_run: RunContext[AgentDeps], prompt: str, size: str = "", quality: str = "") -> str:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)
        response = await client.images.generate(
            model=config.OPENAI_IMAGE_MODEL,
            prompt=prompt,
            size=size or config.OPENAI_IMAGE_DEFAULT_SIZE,
            quality=quality or config.OPENAI_IMAGE_DEFAULT_QUALITY,
            n=1,
        )
        b64_data = response.data[0].b64_json
        gen_filename = f"generated-{uuid4().hex[:8]}.png"
        cb_id = callback_registry.create()
        await pubsub.publish(channel, {
            "id": str(uuid4()),
            "type": "workflow:attachment",
            "workflow_run_id": workflow_run_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": {
                "callback_id": cb_id,
                "attachment": {
                    "b64_data": b64_data, "filename": gen_filename, "mimeType": "image/png",
                    "source": "agent",
                },
            },
        })
        result = await callback_registry.wait_for(cb_id, timeout=60.0)
        return json.dumps({"url": result.get("url", ""), "filename": gen_filename, "id": result.get("id", "")})

    async def clarify(ctx_run: RunContext[AgentDeps], questions: list[dict], context: str = "") -> str:
        if len(questions) > 3:
            questions = questions[:3]

        cb_id = callback_registry.create()
        await pubsub.publish(channel, {
            "id": str(uuid4()),
            "type": "workflow:clarification",
            "workflow_run_id": workflow_run_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": {
                "callback_id": cb_id,
                "context": context,
                "questions": questions,
            },
        })
        response = await callback_registry.wait_for(cb_id, timeout=300.0)

        answers = response.get("answers", {})
        OTHER_PREFIX = "other:"

        lines = []
        for q in questions:
            qid = q["id"]
            selected = answers.get(qid, [])
            if isinstance(selected, str):
                selected = [selected]
            labels = []
            for val in selected:
                if isinstance(val, str) and val.startswith(OTHER_PREFIX):
                    user_text = val[len(OTHER_PREFIX):]
                    if user_text:
                        labels.append(f'"{user_text}" (custom)')
                else:
                    for opt in q.get("options", []):
                        if opt["id"] == val:
                            labels.append(opt["label"])
                            break
            lines.append(f"{q['prompt']}: {', '.join(labels) if labels else 'No selection'}")
        return "\n".join(lines)

    async def view_product_images(ctx_run: RunContext[AgentDeps], store_id: str, product_id: str, image_ids: list[str] | None = None) -> ToolReturn:
        cb_id = callback_registry.create()
        payload: dict = {"store_id": store_id, "product_id": product_id, "callback_id": cb_id}
        if image_ids:
            payload["image_ids"] = image_ids
        await pubsub.publish(channel, {
            "id": str(uuid4()),
            "type": "workflow:view_product_images",
            "workflow_run_id": workflow_run_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        })
        response = await callback_registry.wait_for(cb_id, timeout=30.0)
        images = response.get("images", [])

        VALID_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"}

        content = []
        summaries = []
        for img in images:
            if img.get("error"):
                summaries.append(f"{img.get('id', 'unknown')}: {img['error']}")
                continue

            redis_key = img.get("redisKey", "")
            b64_data = ""
            if redis_key:
                b64_data = await pubsub.get_key(redis_key) or ""
                await pubsub.delete_key(redis_key)

            if not b64_data:
                summaries.append(f"{img.get('id', 'unknown')}: image data not available")
                continue

            mime = img.get("mimeType", "image/png")
            if mime not in VALID_IMAGE_TYPES:
                mime = "image/png"
            filename = img.get("filename", "image")
            content.append(f"Product image: {filename} (id: {img.get('id', 'unknown')})")
            content.append(BinaryContent(data=base64.b64decode(b64_data), media_type=mime))
            summaries.append(f"{filename} (id: {img.get('id', 'unknown')})")

        return ToolReturn(
            return_value=f"Viewing {len(summaries)} product image(s): {', '.join(summaries)}",
            content=content,
        )

    return [
        Tool(
            function=list_attachments, name="list_attachments",
            description="List attachments in this conversation. Returns id, url, filename, mimeType for each. Use filter='latest' for most recent message or 'all' for entire conversation.",
            takes_ctx=True,
        ),
        Tool(
            function=view_images, name="view_images",
            description="Visually inspect images by attachment ID. Returns actual image data you can see and describe. Call list_attachments first to get IDs. Use this to verify image contents before assigning them.",
            takes_ctx=True,
        ),
        Tool(
            function=view_product_images, name="view_product_images",
            description="Visually inspect product/store images by image entity ID. Pass store_id, product_id, and optionally image_ids to filter. If image_ids is omitted, shows all product images. Limit to 3-4 images per call to avoid timeouts. Use get_product to find image IDs first.",
            takes_ctx=True,
        ),
        Tool(
            function=add_attachment, name="add_attachment",
            description="Send an existing image/file URL to the chat.",
            takes_ctx=True,
        ),
        Tool(
            function=generate_image, name="generate_image",
            description="Generate an image from a text prompt via GPT Image. Automatically uploaded and sent to chat. Returns permanent URL.",
            takes_ctx=True,
        ),
        Tool(
            function=clarify, name="clarify",
            description=(
                "The ONLY way to ask the user questions. NEVER ask questions as plain text — always use this tool. "
                "Presents an interactive UI with options the user can select. Every question also includes a built-in 'Other' text input, "
                "so users can type a custom answer instead of picking an option. This makes it suitable for ALL questions — "
                "both multiple-choice AND open-ended (e.g. taglines, descriptions, names).\n\n"
                "Parameters:\n"
                "- questions: list of dicts, max 3. Each: {id: str, prompt: str, options: [{id: str, label: str}], allow_multiple?: bool}\n"
                "- context: short label shown above the questions (e.g. 'Store Branding', 'Category Setup')\n\n"
                "For open-ended questions, provide 3-4 suggested options — the user picks one or types their own via 'Other'.\n\n"
                "Examples:\n"
                '  clarify(questions=[{"id": "tagline", "prompt": "What tagline for your store?", '
                '"options": [{"id": "a", "label": "Step into Style"}, {"id": "b", "label": "Walk Your Way"}, '
                '{"id": "c", "label": "Shoes for Every Journey"}]}], context="Store Branding")\n\n'
                '  clarify(questions=[{"id": "cats", "prompt": "How should we organize categories?", '
                '"options": [{"id": "flat", "label": "Flat (Sneakers, Boots, Sandals)"}, '
                '{"id": "nested", "label": "By gender then type (Men > Sneakers, Women > Boots)"}], "allow_multiple": false}], '
                'context="Category Structure")'
            ),
            takes_ctx=True,
        ),
    ]
