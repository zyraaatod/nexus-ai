# NEXUS AI - Terminal Service
import asyncio
import os
import shlex
import logging
import signal
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from pathlib import Path

from .config import settings, get_tool_path, is_tool_allowed

logger = logging.getLogger(__name__)

@dataclass
class CommandResult:
    stdout: str
    stderr: str
    returncode: int
    command: str
    timeout: bool = False

class TerminalService:
    def __init__(self):
        self.processes: Dict[int, asyncio.subprocess.Process] = {}
        self.next_pid = 1
        self.cwd = settings.STORAGE_DIR / "workspace"
        self.cwd.mkdir(parents=True, exist_ok=True)
        self.history: List[str] = []
    
    def _validate_command(self, command: str) -> tuple[bool, str]:
        """Validate command for security"""
        if not settings.ENABLE_TERMINAL:
            return False, "Terminal access is disabled"
        
        # Parse command to get base tool
        try:
            parts = shlex.split(command)
            if not parts:
                return False, "Empty command"
            base_tool = parts[0]
            
            # Check if tool is allowed
            if not is_tool_allowed(base_tool):
                return False, f"Tool '{base_tool}' is not in allowed list"
            
            # Block dangerous patterns
            dangerous = [
                "rm -rf /",
                "mkfs",
                "dd if=",
                ":(){ :|:& };:",
                "> /dev/sda",
                "chmod 777 /",
                "chown -R root",
                "passwd",
                "userdel",
                "groupdel",
                "iptables -F",
                "systemctl stop",
                "service stop",
                "reboot",
                "shutdown",
                "halt",
                "poweroff",
            ]
            cmd_lower = command.lower()
            for pattern in dangerous:
                if pattern in cmd_lower:
                    return False, f"Dangerous command pattern blocked: {pattern}"
            
            return True, ""
        except Exception as e:
            return False, f"Command validation error: {e}"
    
    async def execute(
        self,
        command: str,
        timeout: int = 300,
        cwd: Optional[str] = None
    ) -> CommandResult:
        """Execute a shell command"""
        # Validate
        valid, error = self._validate_command(command)
        if not valid:
            return CommandResult(
                stdout="",
                stderr=f"Command blocked: {error}",
                returncode=-1,
                command=command
            )
        
        # Add to history
        self.history.append(command)
        if len(self.history) > 1000:
            self.history = self.history[-1000:]
        
        # Prepare working directory
        work_dir = Path(cwd) if cwd else self.cwd
        work_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Executing: {command} (cwd={work_dir})")
        
        try:
            # Create process
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(work_dir),
                preexec_fn=os.setsid if hasattr(os, 'setsid') else None
            )
            
            pid = self.next_pid
            self.next_pid += 1
            self.processes[pid] = process
            
            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout
                )
                
                stdout = stdout_bytes.decode('utf-8', errors='replace')
                stderr = stderr_bytes.decode('utf-8', errors='replace')
                
                # Truncate output if too large
                max_output = settings.MAX_COMMAND_OUTPUT
                if len(stdout) > max_output:
                    stdout = stdout[:max_output] + f"\n... [OUTPUT TRUNCATED, MAX {max_output} CHARS]"
                if len(stderr) > max_output:
                    stderr = stderr[:max_output] + f"\n... [OUTPUT TRUNCATED, MAX {max_output} CHARS]"
                
                return CommandResult(
                    stdout=stdout,
                    stderr=stderr,
                    returncode=process.returncode or 0,
                    command=command
                )
                
            except asyncio.TimeoutError:
                # Kill process group
                try:
                    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                    await asyncio.sleep(0.5)
                    os.killpg(os.getpgid(process.pid), signal.SIGKILL)
                except Exception:
                    pass
                
                return CommandResult(
                    stdout="",
                    stderr=f"Command timed out after {timeout} seconds",
                    returncode=-1,
                    command=command,
                    timeout=True
                )
            finally:
                self.processes.pop(pid, None)
                
        except Exception as e:
            logger.error(f"Command execution error: {e}")
            return CommandResult(
                stdout="",
                stderr=f"Execution error: {str(e)}",
                returncode=-1,
                command=command
            )
    
    async def execute_streaming(
        self,
        command: str,
        timeout: int = 300,
        cwd: Optional[str] = None
    ):
        """Execute command with streaming output"""
        valid, error = self._validate_command(command)
        if not valid:
            yield {"type": "error", "data": f"Command blocked: {error}"}
            return
        
        self.history.append(command)
        work_dir = Path(cwd) if cwd else self.cwd
        work_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Streaming: {command} (cwd={work_dir})")
        
        try:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(work_dir),
                preexec_fn=os.setsid if hasattr(os, 'setsid') else None
            )
            
            pid = self.next_pid
            self.next_pid += 1
            self.processes[pid] = process
            
            async def read_stream(stream, stream_type):
                while True:
                    line = await stream.readline()
                    if not line:
                        break
                    yield {"type": stream_type, "data": line.decode('utf-8', errors='replace')}
            
            # Stream stdout and stderr concurrently
            async def merge_streams():
                stdout_task = asyncio.create_task(self._consume_stream(process.stdout, "stdout"))
                stderr_task = asyncio.create_task(self._consume_stream(process.stderr, "stderr"))
                
                async for item in self._merge_async(stdout_task, stderr_task):
                    yield item
                
                await process.wait()
                yield {"type": "exit", "data": process.returncode or 0}
            
            async for item in merge_streams():
                yield item
                
        except asyncio.TimeoutError:
            try:
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
            except Exception:
                pass
            yield {"type": "error", "data": f"Command timed out after {timeout} seconds"}
        except Exception as e:
            logger.error(f"Streaming execution error: {e}")
            yield {"type": "error", "data": f"Execution error: {str(e)}"}
        finally:
            self.processes.pop(pid, None)
    
    async def _consume_stream(self, stream, stream_type):
        while True:
            line = await stream.readline()
            if not line:
                break
            yield (stream_type, line.decode('utf-8', errors='replace'))
    
    async def _merge_async(self, *tasks):
        """Merge multiple async generators"""
        queues = [asyncio.Queue() for _ in tasks]
        
        async def worker(i, task):
            async for item in task:
                await queues[i].put(item)
            await queues[i].put(None)
        
        workers = [asyncio.create_task(worker(i, t)) for i, t in enumerate(tasks)]
        
        done_count = 0
        while done_count < len(tasks):
            for i, q in enumerate(queues):
                item = await q.get()
                if item is None:
                    done_count += 1
                else:
                    yield item
        
        await asyncio.gather(*workers, return_exceptions=True)
    
    def get_history(self, limit: int = 50) -> List[str]:
        return self.history[-limit:]
    
    def clear_history(self):
        self.history.clear()
    
    def kill_all(self):
        """Kill all running processes"""
        for pid, process in self.processes.items():
            try:
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
            except Exception:
                pass
        self.processes.clear()
    
    def get_cwd(self) -> str:
        return str(self.cwd)
    
    def set_cwd(self, path: str):
        new_cwd = Path(path).resolve()
        new_cwd.mkdir(parents=True, exist_ok=True)
        self.cwd = new_cwd

# Global instance
terminal_service = TerminalService()