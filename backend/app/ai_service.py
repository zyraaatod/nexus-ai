# NEXUS AI - AI Service with NVIDIA API
import os
import json
import asyncio
import logging
from typing import AsyncGenerator, List, Dict, Optional, Any
from dataclasses import dataclass

import httpx
from pydantic import BaseModel

from .config import settings

logger = logging.getLogger(__name__)

@dataclass
class Message:
    role: str  # system, user, assistant, tool
    content: str
    tool_calls: Optional[List[Dict]] = None
    tool_call_id: Optional[str] = None

class AIService:
    def __init__(self):
        self.api_key = settings.NVIDIA_API_KEY
        self.base_url = settings.NVIDIA_BASE_URL
        self.model = settings.NVIDIA_MODEL
        self.provider = settings.NVIDIA_PROVIDER
        self.client: Optional[httpx.AsyncClient] = None
        self._prompt_cache: Dict[str, str] = {}
        self._load_prompts()
    
    def _load_prompts(self):
        """Load prompts from prompt.txt"""
        try:
            with open(settings.PROMPT_FILE, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Parse prompts separated by ---PROMPT:NAME---
            parts = content.split('---PROMPT:')
            for part in parts[1:]:  # Skip first empty
                lines = part.split('\n', 1)
                if len(lines) == 2:
                    name = lines[0].strip()
                    prompt = lines[1].strip()
                    self._prompt_cache[name] = prompt
            
            logger.info(f"Loaded {len(self._prompt_cache)} prompts: {list(self._prompt_cache.keys())}")
        except Exception as e:
            logger.error(f"Failed to load prompts: {e}")
    
    def get_prompt(self, name: str) -> str:
        """Get a prompt by name"""
        return self._prompt_cache.get(name, "")
    
    def get_system_prompt(self) -> str:
        """Get the main system prompt"""
        return self.get_prompt("SYSTEM")
    
    async def _get_client(self) -> httpx.AsyncClient:
        if self.client is None:
            timeout = httpx.Timeout(120.0, connect=30.0)
            self.client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                timeout=timeout
            )
        return self.client
    
    async def close(self):
        if self.client:
            await self.client.aclose()
            self.client = None
    
    async def chat_completion_stream(
        self,
        messages: List[Dict[str, Any]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tools: Optional[List[Dict]] = None,
        tool_choice: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Call NVIDIA API for streaming chat completion"""
        client = await self._get_client()
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }
        
        if tools:
            payload["tools"] = tools
        if tool_choice:
            payload["tool_choice"] = tool_choice
        
        try:
            async with client.stream("POST", "/chat/completions", json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            delta = chunk.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue
        except httpx.HTTPStatusError as e:
            logger.error(f"API error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"API error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"AI service error: {e}")
            raise

    async def chat_completion(
        self,
        messages: List[Dict[str, Any]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tools: Optional[List[Dict]] = None,
        tool_choice: Optional[str] = None
    ) -> Dict:
        """Call NVIDIA API for non-streaming chat completion"""
        client = await self._get_client()
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False
        }
        
        if tools:
            payload["tools"] = tools
        if tool_choice:
            payload["tool_choice"] = tool_choice
        
        try:
            response = await client.post("/chat/completions", json=payload)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"API error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"API error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"AI service error: {e}")
            raise
    
    async def get_completion(
        self,
        messages: List[Dict[str, Any]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tools: Optional[List[Dict]] = None
    ) -> Dict:
        """Get non-streaming completion"""
        result = await self.chat_completion(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=False,
            tools=tools
        )
        return result
    
    def build_tools_schema(self) -> List[Dict]:
        """Build OpenAI-compatible tools schema for terminal execution"""
        return [
            {
                "type": "function",
                "function": {
                    "name": "execute_command",
                    "description": "Execute a shell command in the terminal. Use for running security tools, reconnaissance, scanning, etc.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "command": {
                                "type": "string",
                                "description": "The shell command to execute (e.g., 'nmap -sS target.com')"
                            },
                            "timeout": {
                                "type": "integer",
                                "description": "Command timeout in seconds (default: 300)",
                                "default": 300
                            },
                            "description": {
                                "type": "string",
                                "description": "Brief description of what this command does"
                            }
                        },
                        "required": ["command", "description"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "read_file",
                    "description": "Read a file from the filesystem",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {
                                "type": "string",
                                "description": "File path to read"
                            }
                        },
                        "required": ["path"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "write_file",
                    "description": "Write content to a file",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {
                                "type": "string",
                                "description": "File path to write"
                            },
                            "content": {
                                "type": "string",
                                "description": "Content to write"
                            }
                        },
                        "required": ["path", "content"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_directory",
                    "description": "List directory contents",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {
                                "type": "string",
                                "description": "Directory path to list"
                            }
                        },
                        "required": ["path"]
                    }
                }
            }
        ]

# Global instance
ai_service = AIService()