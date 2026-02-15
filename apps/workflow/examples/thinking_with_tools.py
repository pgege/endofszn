import asyncio
import os
import sys

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))

from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openrouter import OpenRouterModel, OpenRouterModelSettings
from pydantic_ai.providers.openrouter import OpenRouterProvider
from pydantic_ai.messages import (
    ModelResponse,
    ModelRequest,
    ThinkingPart,
    TextPart,
    ToolCallPart,
    ToolReturnPart,
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
    system_prompt="You are a helpful assistant with access to tools. Use them when needed.",
)


@agent.tool_plain
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    fake_weather = {
        "new york": "72°F, partly cloudy",
        "london": "58°F, rainy",
        "tokyo": "80°F, sunny",
    }
    return fake_weather.get(city.lower(), f"65°F, clear skies in {city}")


@agent.tool_plain
def get_population(city: str) -> str:
    """Get the population of a city."""
    fake_pop = {
        "new york": "8.3 million",
        "london": "8.9 million",
        "tokyo": "13.9 million",
    }
    return fake_pop.get(city.lower(), f"unknown for {city}")


async def main():
    prompt = (
        " ".join(sys.argv[1:])
        if len(sys.argv) > 1
        else "Compare the weather and population of New York and Tokyo. Which city would you recommend visiting today?"
    )

    print(f"\n{'='*60}")
    print(f"Prompt: {prompt}")
    print(f"Model:  anthropic/claude-sonnet-4-5 (via OpenRouter)")
    print(f"Reasoning effort: high")
    print(f"{'='*60}\n")

    result = await agent.run(prompt)

    round_num = 0
    for message in result.all_messages():
        if isinstance(message, ModelResponse):
            round_num += 1
            print(f"{'─'*40}")
            print(f"  MODEL RESPONSE (round {round_num})")
            print(f"{'─'*40}")
            for part in message.parts:
                if isinstance(part, ThinkingPart):
                    print(f"\n  [THINKING]")
                    print(f"  {(part.content or '(hidden)').replace(chr(10), chr(10) + '  ')}")
                    print(f"  [/THINKING]")
                elif isinstance(part, ToolCallPart):
                    print(f"\n  [TOOL CALL] {part.tool_name}({part.args})")
                elif isinstance(part, TextPart):
                    print(f"\n  [ANSWER]")
                    print(f"  {part.content.replace(chr(10), chr(10) + '  ')}")
                    print(f"  [/ANSWER]")

        elif isinstance(message, ModelRequest):
            for part in message.parts:
                if isinstance(part, ToolReturnPart):
                    print(f"\n  [TOOL RESULT] {part.tool_name} → {part.content}")

    print(f"\n{'='*60}")
    print(f"Usage: {result.usage()}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(main())
