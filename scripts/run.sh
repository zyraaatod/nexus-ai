#!/usr/bin/env bash
# NEXUS AI - Cybersecurity Assistant Startup Script
# Usage: bash scripts/run.sh [options]
#   HOST=0.0.0.0 PORT=8080 bash scripts/run.sh
#   DEBUG=1 bash scripts/run.sh

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_ok() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_err() { echo -e "${RED}[ERR]${NC} $*"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $*"; }

cd "$(dirname "$0")/.."
ROOT_DIR="$(pwd)"

echo "========================================"
echo "  NEXUS AI - Cybersecurity Assistant"
echo "========================================"
echo "Directory: $ROOT_DIR"
echo "Date: $(date)"
echo "----------------------------------------"

# 1. Check Python
PY="$(command -v python3 || command -v python)"
if [ -z "$PY" ]; then
    log_err "Python not found. Install: pkg install python (Termux) / apt install python3"
    exit 1
fi
log_ok "Python: $($PY --version 2>&1)"

# 2. Check virtual environment
if [ -f .venv/bin/activate ]; then
    log_info "Activating virtual environment..."
    . .venv/bin/activate
    log_ok "Venv active: $VIRTUAL_ENV"
else
    log_warn "No virtual environment found (.venv). Using system Python."
    log_info "Create one with: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"
fi

# 3. Check Python packages
log_info "Checking Python packages..."
MISSING=()
# pydantic_settings is included in pydantic v1, so we check for pydantic only
# python-dotenv imports as 'dotenv', python-multipart imports as 'multipart'
for pkg in "fastapi" "uvicorn" "pydantic" "httpx" "websockets" "dotenv" "multipart"; do
    if "$PY" -c "import $pkg" 2>/dev/null; then
        log_ok "  $pkg"
    else
        log_err "  $pkg: MISSING"
        MISSING+=("$pkg")
    fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
    log_err "Missing packages: ${MISSING[*]}"
    log_info "Install with: $PY -m pip install -r requirements.txt"
    exit 1
fi

# 4. Check system tools
log_info "Checking system tools..."
TOOLS=(
    "nmap:Network scanner"
    "masscan:Fast port scanner"
    "subfinder:Subdomain enum"
    "amass:Attack surface mapping"
    "httpx:HTTP toolkit"
    "nuclei:Vuln scanner"
    "nikto:Web scanner"
    "sqlmap:SQLi tool"
    "ffuf:Web fuzzer"
    "gobuster:Dir/DNS busting"
    "dalfox:XSS scanner"
    "xsstrike:XSS scanner"
    "commix:Cmd injection"
    "enum4linux:SMB enum"
    "crackmapexec:AD post-exploit"
    "testssl.sh:SSL/TLS tester"
    "aws:AWS CLI"
    "kubectl:K8s CLI"
    "linpeas:Linux privesc audit"
    "pspy:Process monitor"
    "curl:HTTP client"
    "wget:Downloader"
    "git:Version control"
    "jq:JSON processor"
    "python3:Python"
    "bash:Shell"
    "ssh:SSH client"
    "dig:DNS lookup"
    "whois:Domain info"
    "nmap:Port scanner"
)

MISSING_TOOLS=()
for tool_desc in "${TOOLS[@]}"; do
    tool="${tool_desc%%:*}"
    desc="${tool_desc#*:}"
    if command -v "$tool" >/dev/null 2>&1; then
        log_ok "  $tool ($desc)"
    else
        log_warn "  $tool: NOT FOUND ($desc)"
        MISSING_TOOLS+=("$tool")
    fi
done

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
    log_warn "Some security tools missing. Install for full capability."
    log_info "Termux: pkg install ${MISSING_TOOLS[*]}"
    log_info "Ubuntu: apt install ${MISSING_TOOLS[*]}"
fi

# 5. Check NVIDIA API Key
log_info "Checking NVIDIA API configuration..."
if grep -q "NVIDIA_API_KEY=" .env 2>/dev/null; then
    KEY=$(grep "NVIDIA_API_KEY=" .env | cut -d'=' -f2)
    if [ -n "$KEY" ] && [ "$KEY" != "your_nvidia_api_key_here" ]; then
        log_ok "  NVIDIA_API_KEY configured"
    else
        log_warn "  NVIDIA_API_KEY is placeholder - set in .env"
    fi
else
    log_warn "  NVIDIA_API_KEY not in .env"
fi

# 5b. Test NVIDIA API Connection
log_info "Testing NVIDIA API connection..."
BASE_URL=$(grep "NVIDIA_BASE_URL=" .env 2>/dev/null | cut -d'=' -f2)
BASE_URL=${BASE_URL:-"https://integrate.api.nvidia.com/v1"}
MODEL=$(grep "NVIDIA_MODEL=" .env 2>/dev/null | cut -d'=' -f2)
MODEL=${MODEL:-"nvidia/nemotron-3.5-bolt-e4b"}

if [ -n "$KEY" ] && [ "$KEY" != "your_nvidia_api_key_here" ]; then
    log_info "  Testing API key against $BASE_URL..."
    
    # Test with a simple request - pass vars via environment
    export NVIDIA_API_KEY="$KEY"
    export NVIDIA_BASE_URL="$BASE_URL"
    export NVIDIA_MODEL="$MODEL"
    
    TEST_RESPONSE=$("$PY" -c "
import asyncio
import httpx
import os

async def test():
    try:
        key = os.getenv('NVIDIA_API_KEY')
        base_url = os.getenv('NVIDIA_BASE_URL')
        model = os.getenv('NVIDIA_MODEL')
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f'{base_url}/chat/completions',
                headers={
                    'Authorization': f'Bearer {key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': model,
                    'messages': [{'role': 'user', 'content': 'test'}],
                    'max_tokens': 5,
                    'stream': False
                }
            )
            if resp.status_code == 200:
                print('SUCCESS')
            elif resp.status_code == 401:
                print('INVALID_KEY')
            elif resp.status_code == 403:
                print('FORBIDDEN')
            else:
                print(f'ERROR_{resp.status_code}')
    except Exception as e:
        print(f'EXCEPTION_{e}')

asyncio.run(test())
")
    
    case "$TEST_RESPONSE" in
        SUCCESS)
            log_ok "  NVIDIA API connection successful ✓"
            ;;
        INVALID_KEY)
            log_err "  NVIDIA API key is invalid or expired"
            log_err "  Please check your NVIDIA_API_KEY in .env"
            exit 1
            ;;
        FORBIDDEN)
            log_err "  NVIDIA API access forbidden (check permissions/quotas)"
            exit 1
            ;;
        ERROR_429)
            log_warn "  Rate limited - API key works but quota exceeded"
            ;;
        ERROR_*)
            log_warn "  API returned error: ${TEST_RESPONSE#ERROR_}"
            ;;
        EXCEPTION_*)
            log_warn "  Could not reach NVIDIA API: ${TEST_RESPONSE#EXCEPTION_}"
            log_warn "  Server will start but AI features may not work"
            ;;
        *)
            log_warn "  Unexpected test result: $TEST_RESPONSE"
            ;;
    esac
else
    log_warn "  Skipping API test - no valid API key configured"
    log_warn "  Set NVIDIA_API_KEY in .env to enable AI features"
fi

# 6. Check directories
log_info "Checking directories..."
for dir in storage logs frontend; do
    if [ -d "$dir" ]; then
        log_ok "  $dir/"
    else
        log_warn "  $dir/ missing, creating..."
        mkdir -p "$dir"
    fi
done

# 7. Check prompt.txt
if [ -f prompt.txt ]; then
    PROMPT_COUNT=$(grep -c '^---PROMPT:' prompt.txt)
    log_ok "  prompt.txt ($PROMPT_COUNT prompts loaded)"
else
    log_err "  prompt.txt MISSING - required for AI prompts"
    exit 1
fi

# 8. Check frontend
if [ -f frontend/index.html ]; then
    log_ok "  frontend/index.html"
else
    log_err "  frontend/index.html MISSING"
    exit 1
fi

# 9. Port check
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
log_info "Checking port $PORT..."
if command -v ss >/dev/null 2>&1; then
    if ss -tuln | grep -q ":$PORT "; then
        log_warn "  Port $PORT in use (ss)"
    else
        log_ok "  Port $PORT available"
    fi
elif command -v netstat >/dev/null 2>&1; then
    if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
        log_warn "  Port $PORT in use (netstat)"
    else
        log_ok "  Port $PORT available"
    fi
fi

# 10. Test backend import
log_info "Testing backend modules..."
if ! "$PY" -c "
import sys
sys.path.insert(0, 'backend')
from app import config, ai_service, terminal, files
print('  All backend modules: OK')
" 2>/dev/null; then
    log_err "Backend import failed. Run with DEBUG=1 for details."
    exit 1
fi
log_ok "  All backend modules: OK"

echo "----------------------------------------"
log_ok "All checks passed. Starting server..."
echo "========================================"
echo ""
echo "  Access: http://localhost:$PORT"
echo "  API Docs: http://localhost:$PORT/api/docs"
echo "  Health:   http://localhost:$PORT/api/health"
echo ""
echo "  Press Ctrl+C to stop"
echo ""

# Build uvicorn args
UVICORN_ARGS=(
    "backend.app.main:app"
    "--host" "$HOST"
    "--port" "$PORT"
)

if [ "${DEBUG:-0}" = "1" ]; then
    UVICORN_ARGS+=("--log-level" "debug" "--reload")
    log_info "Debug mode enabled"
else
    UVICORN_ARGS+=("--log-level" "info")
fi

# Run
exec "$PY" -m uvicorn "${UVICORN_ARGS[@]}"