# NEXUS AI - File Operations Service
import os
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass

from .config import settings

logger = logging.getLogger(__name__)

@dataclass
class FileInfo:
    path: str
    name: str
    size: int
    is_dir: bool
    modified: float
    permissions: str

class FileService:
    def __init__(self):
        self.base_dir = settings.STORAGE_DIR / "workspace"
        self.base_dir.mkdir(parents=True, exist_ok=True)
    
    def _resolve_path(self, path: str) -> Path:
        """Resolve and validate path"""
        if path.startswith("/"):
            resolved = Path(path).resolve()
        else:
            resolved = (settings.STORAGE_DIR / "workspace" / path).resolve()
        
        # Ensure path is within workspace
        workspace = settings.STORAGE_DIR / "workspace"
        try:
            resolved.relative_to(workspace)
        except ValueError:
            raise ValueError("Path traversal not allowed")
        
        return resolved
    
    def read_file(self, path: str) -> Dict[str, Any]:
        """Read file content"""
        try:
            resolved = self._resolve_path(path)
            if not resolved.exists():
                return {"success": False, "error": "File not found"}
            
            if resolved.is_dir():
                return {"success": False, "error": "Path is a directory"}
            
            # Check file size
            size = resolved.stat().st_size
            max_size = 10 * 1024 * 1024  # 10MB
            if size > max_size:
                return {"success": False, "error": f"File too large (> {max_size} bytes)"}
            
            # Read as text (try UTF-8 first)
            try:
                content = resolved.read_text(encoding='utf-8')
            except UnicodeDecodeError:
                # Binary file - return base64
                import base64
                content = base64.b64encode(resolved.read_bytes()).decode('ascii')
                return {"success": True, "content": content, "encoding": "base64", "size": size}
            
            return {"success": True, "content": content, "encoding": "utf-8", "size": size}
            
        except Exception as e:
            logger.error(f"Read file error: {e}")
            return {"success": False, "error": str(e)}
    
    def write_file(self, path: str, content: str, encoding: str = "utf-8") -> Dict[str, Any]:
        """Write file content"""
        try:
            resolved = self._resolve_path(path)
            
            # Create parent directories
            resolved.parent.mkdir(parents=True, exist_ok=True)
            
            if encoding == "base64":
                import base64
                data = base64.b64decode(content)
                resolved.write_bytes(data)
            else:
                resolved.write_text(content, encoding=encoding)
            
            return {"success": True, "path": str(path), "size": resolved.stat().st_size}
            
        except Exception as e:
            logger.error(f"Write file error: {e}")
            return {"success": False, "error": str(e)}
    
    def list_directory(self, path: str = ".") -> Dict[str, Any]:
        """List directory contents"""
        try:
            resolved = self._resolve_path(path)
            
            if not resolved.exists():
                return {"success": False, "error": "Directory not found"}
            
            if not resolved.is_dir():
                return {"success": False, "error": "Path is not a directory"}
            
            items = []
            for item in resolved.iterdir():
                try:
                    stat = item.stat()
                    items.append({
                        "name": item.name,
                        "path": str(item.relative_to(settings.STORAGE_DIR / "workspace")),
                        "size": stat.st_size,
                        "is_dir": item.is_dir(),
                        "modified": stat.st_mtime,
                        "permissions": oct(stat.st_mode)[-3:]
                    })
                except Exception:
                    continue
            
            # Sort: directories first, then files, alphabetically
            items.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))
            
            return {"success": True, "items": items, "path": str(path)}
            
        except Exception as e:
            logger.error(f"List directory error: {e}")
            return {"success": False, "error": str(e)}
    
    def delete_file(self, path: str) -> Dict[str, Any]:
        """Delete file or directory"""
        try:
            resolved = self._resolve_path(path)
            
            if not resolved.exists():
                return {"success": False, "error": "Path not found"}
            
            if resolved.is_dir():
                import shutil
                shutil.rmtree(resolved)
            else:
                resolved.unlink()
            
            return {"success": True, "path": str(path)}
            
        except Exception as e:
            logger.error(f"Delete error: {e}")
            return {"success": False, "error": str(e)}
    
    def get_file_info(self, path: str) -> Dict[str, Any]:
        """Get file/directory info"""
        try:
            resolved = self._resolve_path(path)
            
            if not resolved.exists():
                return {"success": False, "error": "Path not found"}
            
            stat = resolved.stat()
            
            return {
                "success": True,
                "path": str(path),
                "name": resolved.name,
                "size": stat.st_size,
                "is_dir": resolved.is_dir(),
                "modified": stat.st_mtime,
                "permissions": oct(stat.st_mode)[-3:],
                "absolute_path": str(resolved)
            }
            
        except Exception as e:
            logger.error(f"File info error: {e}")
            return {"success": False, "error": str(e)}
    
    def create_directory(self, path: str) -> Dict[str, Any]:
        """Create directory"""
        try:
            resolved = self._resolve_path(path)
            resolved.mkdir(parents=True, exist_ok=True)
            return {"success": True, "path": str(path)}
        except Exception as e:
            logger.error(f"Create directory error: {e}")
            return {"success": False, "error": str(e)}

# Global instance
file_service = FileService()