import logging
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import AsyncIterator

from pydantic_ai.mcp import MCPServerStdio, MCPServerSSE, MCPServerStreamableHTTP
from pydantic_ai.toolsets import AbstractToolset

from src.agents.types import AgentDeps

logger = logging.getLogger(__name__)

MCPServer = MCPServerStdio | MCPServerSSE | MCPServerStreamableHTTP


@dataclass
class MCPServerConfig:
    type: str
    command: str | None = None
    args: list[str] | None = None
    env: dict[str, str] | None = None
    url: str | None = None


class MCPRegistry:
    def __init__(self):
        self._configs: dict[str, MCPServerConfig] = {}

    def register_stdio(
        self,
        name: str,
        command: str,
        args: list[str] | None = None,
        env: dict[str, str] | None = None,
    ) -> None:
        self._configs[name] = MCPServerConfig(
            type="stdio", command=command, args=args, env=env
        )
        logger.info(f"Registered MCP stdio server: {name}")

    def register_sse(self, name: str, url: str) -> None:
        self._configs[name] = MCPServerConfig(type="sse", url=url)
        logger.info(f"Registered MCP SSE server: {name}")

    def register_http(self, name: str, url: str) -> None:
        self._configs[name] = MCPServerConfig(type="http", url=url)
        logger.info(f"Registered MCP HTTP server: {name}")

    def unregister(self, name: str) -> None:
        if name in self._configs:
            del self._configs[name]
            logger.info(f"Unregistered MCP server: {name}")

    def list_servers(self) -> list[str]:
        return list(self._configs.keys())

    def has_servers(self) -> bool:
        return len(self._configs) > 0

    def _create_server(
        self,
        config: MCPServerConfig,
        extra_headers: dict[str, str] | None = None,
    ) -> MCPServer:
        if config.type == "stdio":
            return MCPServerStdio(config.command, args=config.args, env=config.env)
        elif config.type == "sse":
            return MCPServerSSE(config.url, headers=extra_headers or {})
        elif config.type == "http":
            return MCPServerStreamableHTTP(config.url, headers=extra_headers or {})
        raise ValueError(f"Unknown server type: {config.type}")

    @asynccontextmanager
    async def connect(
        self,
        server_names: list[str] | None = None,
        extra_env: dict[str, str] | None = None,
        extra_headers: dict[str, str] | None = None,
    ) -> AsyncIterator[list[AbstractToolset[AgentDeps]]]:
        if server_names is not None:
            if not server_names:
                yield []
                return
            configs_to_connect = {
                name: config
                for name, config in self._configs.items()
                if name in server_names
            }
        else:
            configs_to_connect = self._configs

        if not configs_to_connect:
            yield []
            return

        connected: list[MCPServer] = []

        try:
            for name, config in configs_to_connect.items():
                effective_config = config
                if extra_env and config.type == "stdio":
                    merged_env = {**(config.env or {}), **extra_env}
                    effective_config = MCPServerConfig(
                        type=config.type,
                        command=config.command,
                        args=config.args,
                        env=merged_env,
                        url=config.url,
                    )
                server = self._create_server(
                    effective_config,
                    extra_headers=extra_headers if config.type in ("http", "sse") else None,
                )
                try:
                    await server.__aenter__()
                    connected.append(server)
                    logger.info(f"Connected to MCP server: {name}")
                except Exception as e:
                    logger.error(f"Failed to connect to MCP server {name}: {e}")

            yield connected
        finally:
            for server in connected:
                try:
                    await server.__aexit__(None, None, None)
                except Exception as e:
                    logger.error(f"Error disconnecting MCP server: {e}")


mcp_registry = MCPRegistry()
