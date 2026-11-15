# NEXUS AI — Cybersecurity Assistant

<p align="center">
  <img src="frontend/icon-192.png" alt="NEXUS AI" width="128" height="128">
</p>

<p align="center">
  <strong>Elite Cybersecurity AI Assistant</strong> — ChatGPT-style interface for penetration testing, bug bounty hunting, vulnerability research, and red team operations.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#api">API</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## 🎯 Features

### 💬 **ChatGPT-Style Interface**
- **Clean chat interface** with streaming AI responses
- **Left sidebar**: Collapsible session/history panel (mobile drawer)
- **Center chat**: Welcome screen with quick action cards, streaming responses
- **Right drawer**: Terminal/Files/Tools bottom sheet
- **File attachments**: Paperclip button, drag-drop support
- **Prompt presets**: 15 quick-access cybersecurity prompts
- **Markdown rendering**: Code blocks, inline code, bold/italic

### 🖥️ **Real-time Terminal**
- Multi-tab support with add/close
- WebSocket streaming with auto-reconnect
- Command history (↑/↓ navigation)
- Mobile optimized: 16px font, touch targets ≥44px

### 📁 **File Manager**
- Tree view with expand/collapse folders
- Monaco-style editor with syntax highlighting
- Upload/Download support

### 🔧 **Security Tools Panel** (20+ tools)
| Category | Tools |
|----------|-------|
| **Recon** | subfinder, amass, httpx, nuclei, katana, gau |
| **Vuln Scanning** | nikto, nuclei, sqlmap, dalfox, xsstrike, commix |
| **Web Fuzzing** | ffuf, gobuster, feroxbuster, ffuf |
| **Network** | nmap, masscan, enum4linux, crackmapexec, kerbrute |
| **Crypto** | testssl.sh, sslscan, openssl |
| **Cloud** | aws, kubectl, terraform, trivy, kube-hunter |
| **Post-Exploitation** | linpeas, winpeas, pspy |

### 🤖 **AI Integration**
- **NVIDIA API** (Nemotron 3.5 Bolt, Llama 3.1 70B)
- **OpenAI-compatible** endpoints supported
- Streaming responses with typing indicator
- 15 built-in cybersecurity prompts
- Tool calling (execute_command, read_file, write_file, list_directory)

### 📱 **Mobile-First Responsive**
- Auto-detection: UA + touch + screen width
- Breakpoints: 1024px, 768px, landscape
- Touch targets: ≥44px minimum
- Font size: 16px on inputs (prevents iOS zoom)
- Swipe gestures: Edge swipe for sidebar
- Landscape mode: Compact headers
- PWA ready: Manifest, icons, theme color

### ⚙️ **Settings Modal (6 Tabs)**
| Tab | Features |
|-----|----------|
| **General** | Connection, chat behavior, appearance |
| **AI Model** | Provider, base URL, model, API key (show/hide), temperature, tokens, system prompt |
| **Terminal** | Shell, timeout, font, cursor, keybindings |
| **Session** | Current session info, export/clear, privacy |
| **Advanced** | Feature flags, debug, log level, backup, factory reset |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- FFmpeg + FFprobe
- NVIDIA API Key (get from [integrate.api.nvidia.com](https://integrate.api.nvidia.com))

### One-Command Setup
```bash
# Clone and setup
git clone https://github.com/zyraaatod/nexus-ai.git
cd nexus-ai

# Add your NVIDIA API key to .env
cp .env.example .env
# Edit .env and add: NVIDIA_API_KEY=your_key_here

# Run (auto-installs dependencies, checks API key)
bash scripts/run.sh
```

### Manual Setup
```bash
# Create venv
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set API key
export NVIDIA_API_KEY=your_key_here

# Run
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

### Access
- **Local**: http://localhost:8000
- **Network**: `HOST=0.0.0.0 bash scripts/run.sh` → http://your-ip:8000
- **API Docs**: http://localhost:8000/api/docs

---

## 🏗️ Architecture

```
nexus-ai/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI + WebSocket routes
│   │   ├── ai_service.py    # NVIDIA/OpenAI API integration
│   │   ├── terminal.py      # Terminal WebSocket handler
│   │   ├── files.py         # File operations
│   │   └── config.py        # Pydantic settings
│   └── tests/
├── frontend/
│   ├── index.html           # ChatGPT-style layout
│   ├── style.css            # Glass theme (1542 lines)
│   ├── app.js               # Vanilla JS (2200+ lines)
│   ├── manifest.json        # PWA manifest
│   └── icons/               # PWA icons
├── scripts/
│   ├── run.sh               # Smart startup with diagnostics
│   ├── setup.sh             # Dependency installer
│   └── get_engines.py       # Engine downloader
├── prompt.txt               # 15 cybersecurity prompts
├── .env.example             # Configuration template
└── scripts/run.sh           # Smart launcher with diagnostics
```

---

## 🔌 API

### REST Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/tools` | List available tools |
| `GET` | `/api/prompts/{name}` | Get prompt content |
| `POST` | `/api/chat` | Chat completion (streaming) |
| `POST` | `/api/files/list` | List directory |
| `POST` | `/api/files/read` | Read file |
| `POST` | `/api/files/write` | Write file |
| `POST` | `/api/files/delete` | Delete file |
| `POST` | `/api/files/mkdir` | Create directory |
| `POST` | `/api/terminal/execute` | Execute command |
| `GET` | `/api/terminal/history` | Command history |
| `POST` | `/api/terminal/clear` | Clear terminal |
| `POST` | `/api/tools/execute` | Execute tool |

### WebSocket
| Endpoint | Description |
|----------|-------------|
| `/ws/{client_id}` | Chat streaming |
| `/ws/terminal/{client_id}` | Terminal streaming |

### Example: Chat Completion
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are NEXUS AI..."},
      {"role": "user", "content": "How to enumerate subdomains?"}
    ],
    "stream": true
  }'
```

### WebSocket Chat
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/client-123');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'chat_chunk') console.log(data.content);
};
ws.send(JSON.stringify({ type: 'chat', message: 'Hello!' }));
```

---

## ⚙️ Configuration

### Environment Variables (`.env`)
```env
# NVIDIA API (required)
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxxxxx
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/nemotron-3.5-bolt-e4b

# Alternative: OpenAI-compatible
# OPENAI_API_KEY=sk-xxxxx
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_MODEL=gpt-4o

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true

# Features
ENABLE_TERMINAL=true
ENABLE_FILE_OPS=true
ENABLE_NETWORK_TOOLS=true
```

### Tool Paths (auto-detected if empty)
```env
NMAP_PATH=
MASSCAN_PATH=
NUCLEI_PATH=
SUBFINDER_PATH=
# ... etc
```

---

## 🔒 Security

- **No external data**: All processing local
- **API keys**: Stored locally in browser (localStorage)
- **Network isolation**: No external calls except NVIDIA API
- **Sandboxed execution**: Commands run in workspace directory
- **No auth**: Designed for trusted networks only

---

## 🧪 Testing

```bash
# Backend tests
cd backend && python -m pytest tests/ -v

# Frontend syntax check
node --check frontend/app.js

# API health
curl http://localhost:8000/api/health

# Tools list
curl http://localhost:8000/api/tools
```

---

## 📚 Built-in Prompts (15)

| Prompt | Use Case |
|--------|----------|
| `SYSTEM` | Core system instructions |
| `RECON_SUBDOMAIN` | Subdomain enumeration |
| `RECON_INFRASTRUCTURE` | Infrastructure mapping |
| `WEB_VULN_SCAN` | Web vulnerability assessment |
| `API_SECURITY` | API security testing |
| `NETWORK_ATTACK` | Network penetration testing |
| `OSINT_PERSON` | Person/entity OSINT |
| `REPORT_WRITING` | Professional report templates |
| `TERMINAL_GUIDE` | Terminal usage guide |
| `BUG_BOUNTY_WORKFLOW` | End-to-end bug bounty methodology |
| `RED_TEAM` | APT simulation with MITRE ATT&CK |
| `CTF_GUIDE` | CTF challenge solving |
| `VULN_RESEARCH` | Vulnerability research methodology |
| `TOOL_CHEATSHEET` | Essential commands reference |
| `TERMINAL_EXECUTE` | Terminal execution protocol |

---

## 🗺️ Roadmap

See [PLANNING.md](PLANNING.md) for detailed roadmap to perfection.

### Near Term (v2.1)
- [ ] File upload via drag-drop in chat
- [ ] Conversation branching/forking
- [ ] Tool output rendering in chat
- [ ] Session search/filter

### Medium Term (v2.5)
- [ ] Multi-user sessions with auth
- [ ] Project/workspace management
- [ ] Custom tool definitions
- [ ] Report generator (PDF/Markdown)

### Long Term (v3.0)
- [ ] Multi-user collaboration
- [ ] Plugin system for custom tools
- [ ] Distributed scanning
- [ ] AI-powered report generation

---

## 📄 License

MIT License — Free for personal and commercial use.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 🙏 Acknowledgments

- [NVIDIA Nemotron](https://www.nvidia.com/en-us/ai-data-science/) — AI models
- [Phosphor Icons](https://phosphoricons.com/) — Beautiful icons
- [Inter Font](https://rsms.me/inter/) — Clean typography
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/) — Code font
- [FastAPI](https://fastapi.tiangolo.com/) — Modern Python web framework
- [Phosphor Icons](https://phosphoricons.com/) — Icon library

---

<p align="center">
  Made with ❤️ for the cybersecurity community
</p>