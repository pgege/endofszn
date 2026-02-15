import asyncio
import os
import sys

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))

from pydantic_ai import Agent
from pydantic_ai.models.openrouter import OpenRouterModel, OpenRouterModelSettings
from pydantic_ai.providers.openrouter import OpenRouterProvider
from pydantic_ai.messages import (
    ModelResponse,
    ThinkingPart,
    TextPart,
)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

provider = OpenRouterProvider(api_key=OPENROUTER_API_KEY)
model = OpenRouterModel(
    "anthropic/claude-sonnet-4-5",
    provider=provider,
)

settings = OpenRouterModelSettings(
    openrouter_reasoning={"effort": "high"},
)

agent = Agent(
    model,
    model_settings=settings,
    system_prompt="You are a helpful assistant. Think carefully before answering.",
)


async def main():
    prompt = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "What is 27 * 43? Explain your reasoning."

    print(f"\n{'='*60}")
    print(f"Prompt: {prompt}")
    print(f"Model:  anthropic/claude-sonnet-4-5 (via OpenRouter)")
    print(f"Reasoning effort: high")
    print(f"{'='*60}\n")

    result = await agent.run(prompt)

    for message in result.all_messages():
        if isinstance(message, ModelResponse):
            for part in message.parts:
                if isinstance(part, ThinkingPart):
                    print(f"--- THINKING ---")
                    print(part.content or "(thinking content hidden)")
                    print(f"--- END THINKING ---\n")
                elif isinstance(part, TextPart):
                    print(f"--- ANSWER ---")
                    print(part.content)
                    print(f"--- END ANSWER ---")

    print(f"\n{'='*60}")
    print(f"Usage: {result.usage()}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(main())
