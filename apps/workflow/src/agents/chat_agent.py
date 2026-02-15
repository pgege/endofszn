from __future__ import annotations

from pydantic_ai import Agent
from pydantic_ai.models.openrouter import OpenRouterModel, OpenRouterModelSettings
from pydantic_ai.providers.openrouter import OpenRouterProvider
from pydantic_ai.toolsets import AbstractToolset

from src.agents.types import AgentDeps
from src.config import DEFAULT_MODEL, OPENROUTER_API_KEY


def create_model(model_name: str | None = None) -> OpenRouterModel:
    provider = OpenRouterProvider(api_key=OPENROUTER_API_KEY)
    return OpenRouterModel(model_name or DEFAULT_MODEL, provider=provider)


def create_chat_agent(
    model_name: str | None = None,
    system_prompt: str | None = None,
    mcp_toolsets: list[AbstractToolset[AgentDeps]] | None = None,
) -> Agent[AgentDeps, str]:
    return Agent(
        create_model(model_name),
        deps_type=AgentDeps,
        output_type=str,
        system_prompt=system_prompt,
        toolsets=mcp_toolsets if mcp_toolsets else None,
        model_settings=OpenRouterModelSettings(
            openrouter_reasoning={"effort": "high"},
        ),
    )
