# NEXUS AI - Main FastAPI Application
import asyncio
import json
import logging
import uuid
from contextlib import asynccontextmanager
from typing import Dict, List, Optional, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .config import settings
from .ai_service import ai_service, Message
from .terminal import terminal_service, CommandResult
from .files import file_service

# Setup logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(settings.LOGS_DIR / "nexus.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_data: Dict[str, Dict] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.session_data[client_id] = {
            "messages": [],
            "context": {}
        }
        logger.info(f"Client connected: {client_id}")
    
    def disconnect(self, client_id: str):
        self.active_connections.pop(client_id, None)
        self.session_data.pop(client_id, None)
        logger.info(f"Client disconnected: {client_id}")
    
    async def send_json(self, client_id: str, data: dict):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(data)
            except Exception as e:
                logger.error(f"Send error to {client_id}: {e}")
    
    async def broadcast(self, data: dict):
        for client_id, ws in self.active_connections.items():
            try:
                await ws.send_json(data)
            except Exception:
                pass

manager = ConnectionManager()

# Pydantic models
class ChatMessage(BaseModel):
    role: str
    content: str
    tool_calls: Optional[List[Dict]] = None
    tool_call_id: Optional[str] = None

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    temperature: float = 0.7
    max_tokens: int = 4096
    stream: bool = True
    session_id: Optional[str] = None

class CommandRequest(BaseModel):
    command: str
    timeout: int = 300
    cwd: Optional[str] = None
    session_id: Optional[str] = None

class FileRequest(BaseModel):
    path: str
    content: Optional[str] = None
    encoding: str = "utf-8"
    session_id: Optional[str] = None

class FileListRequest(BaseModel):
    path: str = "."
    session_id: Optional[str] = None

# Tool execution handlers
async def handle_execute_command(args: Dict, session_id: str) -> Dict:
    """Execute shell command"""
    command = args.get("command", "")
    timeout = args.get("timeout", 300)
    description = args.get("description", "")
    
    logger.info(f"Executing command: {command}")
    
    result = await terminal_service.execute(command, timeout=timeout)
    
    return {
        "command": command,
        "description": description,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "returncode": result.returncode,
        "timeout": result.timeout
    }

async def handle_read_file(args: Dict, session_id: str) -> Dict:
    """Read file"""
    path = args.get("path", "")
    return file_service.read_file(path)

async def handle_write_file(args: Dict, session_id: str) -> Dict:
    """Write file"""
    path = args.get("path", "")
    content = args.get("content", "")
    encoding = args.get("encoding", "utf-8")
    return file_service.write_file(path, content, encoding)

async def handle_list_directory(args: Dict, session_id: str) -> Dict:
    """List directory"""
    path = args.get("path", ".")
    return file_service.list_directory(path)

# Tool handlers mapping
TOOL_HANDLERS = {
    "execute_command": handle_execute_command,
    "read_file": handle_read_file,
    "write_file": handle_write_file,
    "list_directory": handle_list_directory,
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("NEXUS AI Cybersecurity Assistant starting up...")
    logger.info(f"Workspace: {settings.STORAGE_DIR / 'workspace'}")
    logger.info(f"Prompts loaded: {list(ai_service._prompt_cache.keys())}")
    yield
    # Shutdown
    await ai_service.close()
    terminal_service.kill_all()
    logger.info("NEXUS AI shutting down...")

app = FastAPI(
    title="NEXUS AI - Cybersecurity Assistant",
    description="Elite cybersecurity AI assistant with terminal access",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "NEXUS AI Cybersecurity Assistant",
        "version": "2.0.0",
        "terminal": settings.ENABLE_TERMINAL,
        "workspace": str(settings.STORAGE_DIR / "workspace")
    }

# Get available tools/prompts
@app.get("/api/tools")
async def get_tools():
    return {
        "tools": ai_service.build_tools_schema(),
        "prompts": list(ai_service._prompt_cache.keys())
    }

@app.get("/api/prompts/{name}")
async def get_prompt(name: str):
    prompt = ai_service.get_prompt(name)
    if not prompt:
        raise HTTPException(404, "Prompt not found")
    return {"name": name, "content": prompt}

# Chat endpoint (REST)
@app.post("/api/chat")
async def chat(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())
    
    # Convert messages
    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    
    # Add system prompt if not present
    if not any(m["role"] == "system" for m in messages):
        system_prompt = ai_service.get_system_prompt()
        if system_prompt:
            messages.insert(0, {"role": "system", "content": system_prompt})
    
    # Get tools
    tools = ai_service.build_tools_schema()
    
    try:
        if request.stream:
            # Return streaming response
            from fastapi.responses import StreamingResponse
            
            async def generate():
                async for chunk in ai_service.chat_completion_stream(
                    messages=messages,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens,
                    tools=tools
                ):
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
                
                # Handle tool calls if needed
                yield "data: [DONE]\n\n"
            
            return StreamingResponse(generate(), media_type="text/event-stream")
        else:
            result = await ai_service.chat_completion(
                messages=messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                tools=tools
            )
            return result
            
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(500, str(e))

# WebSocket endpoint for real-time chat
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "chat":
                await handle_ws_chat(websocket, client_id, data)
            elif msg_type == "command":
                await handle_ws_command(websocket, client_id, data)
            elif msg_type == "file":
                await handle_ws_file(websocket, client_id, data)
            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})
            else:
                await websocket.send_json({"type": "error", "message": f"Unknown type: {msg_type}"})
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(client_id)

async def handle_ws_chat(websocket: WebSocket, client_id: str, data: Dict):
    """Handle chat message over WebSocket"""
    session = manager.session_data.get(client_id, {})
    messages = session.get("messages", [])
    
    # Add user message
    user_msg = data.get("message", "")
    messages.append({"role": "user", "content": user_msg})
    
    # Keep context window manageable
    if len(messages) > 20:
        # Keep system prompt + last 18 messages
        system_msgs = [m for m in messages if m["role"] == "system"]
        other_msgs = [m for m in messages if m["role"] != "system"]
        messages = system_msgs + other_msgs[-18:]
    
    session["messages"] = messages
    manager.session_data[client_id] = session
    
    # Add system prompt if not present
    all_messages = messages.copy()
    if not any(m["role"] == "system" for m in all_messages):
        system_prompt = ai_service.get_system_prompt()
        if system_prompt:
            all_messages.insert(0, {"role": "system", "content": system_prompt})
    
    tools = ai_service.build_tools_schema()
    
    try:
        # Stream response
        await websocket.send_json({"type": "chat_start"})
        
        full_response = ""
        tool_calls = []
        
        async for chunk in ai_service.chat_completion_stream(
            messages=all_messages,
            temperature=0.7,
            max_tokens=4096,
            tools=tools
        ):
            full_response += chunk
            await websocket.send_json({"type": "chat_chunk", "content": chunk})
        
        # Check if response contains tool calls (would be in non-streaming)
        # For streaming, we'd need to parse tool calls from the response
        
        await websocket.send_json({"type": "chat_end", "full_response": full_response})
        
        # Save assistant response
        messages.append({"role": "assistant", "content": full_response})
        session["messages"] = messages
        
    except Exception as e:
        logger.error(f"WS chat error: {e}")
        await websocket.send_json({"type": "error", "message": str(e)})

async def handle_ws_command(websocket: WebSocket, client_id: str, data: Dict):
    """Execute command via WebSocket"""
    command = data.get("command", "")
    timeout = data.get("timeout", 300)
    cwd = data.get("cwd")
    
    if not command:
        await websocket.send_json({"type": "error", "message": "Empty command"})
        return
    
    await websocket.send_json({"type": "command_start", "command": command})
    
    try:
        result = await terminal_service.execute(command, timeout=timeout, cwd=cwd)
        
        await websocket.send_json({
            "type": "command_result",
            "command": command,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
            "timeout": result.timeout
        })
    except Exception as e:
        logger.error(f"WS command error: {e}")
        await websocket.send_json({"type": "error", "message": str(e)})

async def handle_ws_file(websocket: WebSocket, client_id: str, data: Dict):
    """Handle file operations via WebSocket"""
    action = data.get("action")
    
    try:
        if action == "read":
            result = file_service.read_file(data.get("path", ""))
        elif action == "write":
            result = file_service.write_file(
                data.get("path", ""),
                data.get("content", ""),
                data.get("encoding", "utf-8")
            )
        elif action == "list":
            result = file_service.list_directory(data.get("path", "."))
        elif action == "delete":
            result = file_service.delete_file(data.get("path", ""))
        elif action == "info":
            result = file_service.get_file_info(data.get("path", ""))
        elif action == "mkdir":
            result = file_service.create_directory(data.get("path", ""))
        else:
            result = {"success": False, "error": f"Unknown action: {action}"}
        
        await websocket.send_json({"type": "file_result", "action": action, "result": result})
        
    except Exception as e:
        logger.error(f"WS file error: {e}")
        await websocket.send_json({"type": "error", "message": str(e)})

# REST endpoints for terminal
@app.post("/api/terminal/execute")
async def execute_command(request: CommandRequest):
    result = await terminal_service.execute(
        request.command,
        timeout=request.timeout,
        cwd=request.cwd
    )
    return {
        "command": request.command,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "returncode": result.returncode,
        "timeout": result.timeout
    }

@app.get("/api/terminal/history")
async def get_history(limit: int = 50):
    return {"history": terminal_service.get_history(limit)}

@app.post("/api/terminal/clear")
async def clear_history():
    terminal_service.clear_history()
    return {"success": True}

# REST endpoints for files
@app.post("/api/files/read")
async def read_file(request: FileRequest):
    return file_service.read_file(request.path)

@app.post("/api/files/write")
async def write_file(request: FileRequest):
    if request.content is None:
        raise HTTPException(400, "Content required")
    return file_service.write_file(request.path, request.content, request.encoding)

@app.post("/api/files/list")
async def list_files(request: FileListRequest):
    return file_service.list_directory(request.path)

@app.post("/api/files/delete")
async def delete_file(request: FileRequest):
    return file_service.delete_file(request.path)

@app.post("/api/files/info")
async def file_info(request: FileRequest):
    return file_service.get_file_info(request.path)

@app.post("/api/files/mkdir")
async def make_dir(request: FileRequest):
    return file_service.create_directory(request.path)

# Terminal streaming endpoint
@app.websocket("/ws/terminal/{client_id}")
async def terminal_websocket(websocket: WebSocket, client_id: str):
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            command = data.get("command", "")
            timeout = data.get("timeout", 300)
            cwd = data.get("cwd")
            
            if not command:
                await websocket.send_json({"type": "error", "message": "Empty command"})
                continue
            
            # Execute with streaming
            async for chunk in terminal_service.execute_streaming(command, timeout, cwd):
                await websocket.send_json(chunk)
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Terminal WS error: {e}")

# Session management
@app.post("/api/session/new")
async def new_session():
    session_id = str(uuid.uuid4())
    return {"session_id": session_id}

@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    return {"session_id": session_id, "exists": True}

# Tool execution endpoint (for AI tool calls)
@app.post("/api/tools/execute")
async def execute_tool(request: Request):
    data = await request.json()
    tool_name = data.get("tool")
    args = data.get("args", {})
    session_id = data.get("session_id", str(uuid.uuid4()))
    
    handler = TOOL_HANDLERS.get(tool_name)
    if not handler:
        raise HTTPException(404, f"Tool not found: {tool_name}")
    
    try:
        result = await handler(args, session_id)
        return {"success": True, "result": result}
    except Exception as e:
        logger.error(f"Tool execution error: {e}")
        return {"success": False, "error": str(e)}

# Serve frontend (must be last to not interfere with API routes)
frontend_dir = settings.BASE_DIR / "frontend"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )