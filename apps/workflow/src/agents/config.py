from dataclasses import dataclass, field
from typing import Any


@dataclass
class AgentConfig:
    name: str
    system_prompt: str | None = None
    model: str | None = None
    mcp_servers: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


class AgentConfigRegistry:
    def __init__(self):
        self._configs: dict[str, AgentConfig] = {}
        self._register_defaults()

    def _register_defaults(self) -> None:
        self.register(AgentConfig(
            name="default",
            system_prompt=None,
            mcp_servers=[],
        ))

    def register(self, config: AgentConfig) -> None:
        self._configs[config.name] = config

    def get(self, name: str) -> AgentConfig | None:
        return self._configs.get(name)

    def list(self) -> list[str]:
        return list(self._configs.keys())

    def unregister(self, name: str) -> None:
        if name != "default":
            self._configs.pop(name, None)


agent_config_registry = AgentConfigRegistry()
