from fastapi import APIRouter
from pydantic import BaseModel

from src.agents import mcp_registry

router = APIRouter(prefix="/mcp", tags=["mcp"])


class StdioServerRequest(BaseModel):
    name: str
    command: str
    args: list[str] | None = None
    env: dict[str, str] | None = None


class HttpServerRequest(BaseModel):
    name: str
    url: str


class ServerResponse(BaseModel):
    name: str
    registered: bool


class ServerListResponse(BaseModel):
    servers: list[str]


@router.post("/servers/stdio", response_model=ServerResponse)
async def register_stdio_server(request: StdioServerRequest) -> ServerResponse:
    mcp_registry.register_stdio(
        name=request.name,
        command=request.command,
        args=request.args,
        env=request.env,
    )
    return ServerResponse(name=request.name, registered=True)


@router.post("/servers/sse", response_model=ServerResponse)
async def register_sse_server(request: HttpServerRequest) -> ServerResponse:
    mcp_registry.register_sse(name=request.name, url=request.url)
    return ServerResponse(name=request.name, registered=True)


@router.post("/servers/http", response_model=ServerResponse)
async def register_http_server(request: HttpServerRequest) -> ServerResponse:
    mcp_registry.register_http(name=request.name, url=request.url)
    return ServerResponse(name=request.name, registered=True)


@router.delete("/servers/{name}", response_model=ServerResponse)
async def unregister_server(name: str) -> ServerResponse:
    mcp_registry.unregister(name)
    return ServerResponse(name=name, registered=False)


@router.get("/servers", response_model=ServerListResponse)
async def list_servers() -> ServerListResponse:
    return ServerListResponse(servers=mcp_registry.list_servers())
