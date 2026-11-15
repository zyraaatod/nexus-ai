# NEXUS AI — Planning for Perfection

> Living document tracking the path to a flawless cybersecurity AI assistant.

---

## 🎯 Vision

Build the **definitive cybersecurity AI assistant** — the tool every pentester, bug bounty hunter, and red teamer reaches for first. Combining ChatGPT's polished UX with deep security tooling integration.

---

## 📊 Current State (v2.0)

| Component | Status | Quality |
|-----------|--------|---------|
| Chat Interface | ✅ Complete | ⭐⭐⭐⭐⭐ |
| Terminal (WebSocket) | ✅ Complete | ⭐⭐⭐⭐ |
| File Manager | ✅ Complete | ⭐⭐⭐⭐ |
| Tools Panel | ✅ Complete | ⭐⭐⭐⭐ |
| Settings Modal | ✅ Complete | ⭐⭐⭐⭐ |
| Mobile Responsive | ✅ Complete | ⭐⭐⭐⭐ |
| AI Streaming | ✅ Complete | ⭐⭐⭐⭐ |
| Terminal WebSocket | ✅ Complete | ⭐⭐⭐ |
| File Upload | ⚠️ Partial | ⭐⭐ |
| Tool Execution | ⚠️ Stub | ⭐⭐ |
| Multi-session | ✅ Basic | ⭐⭐⭐ |

---

## 🚀 Roadmap

### v2.1 — Polish & Core Features (2 weeks)

#### Chat Enhancements
- [ ] **Drag-drop file upload** in chat input
- [ ] **Conversation branching** — fork conversations at any message
- [ ] **Message editing** — edit user messages to re-generate
- [ ] **Code copy button** on code blocks
- [ ] **Message reactions** (copy, regenerate, dislike)
- [ ] **Search conversations** (full-text search)
- [ ] **Pin important messages**

#### Tool Execution
- [ ] **Real tool execution** via `/api/tools/execute`
- [ ] **Tool output rendering** in chat (structured output)
- [ ] **Progress indicators** for long-running tools
- [ ] **Tool chaining** — pipe output of one tool to another
- [ ] **Save tool results** to workspace

#### Terminal
- [ ] **PTY support** (true TTY via websocket)
- [ ] **Session persistence** across reloads
- [ ] **Command palette** (Ctrl+K)
- [ ] **Split panes** (horizontal/vertical split)

#### Files
- [ ] **Drag-drop upload** to chat/files
- [ ] **File preview** (images, PDF, text)
- [ ] **Git integration** (status, diff, commit)
- [ ] **Search in files** (ripgrep integration)

---

### v2.2 — Intelligence & Workflow (3 weeks)

#### AI Intelligence
- [ ] **Context-aware suggestions** — AI suggests tools based on conversation
- [ ] **Auto-tool selection** — AI picks and runs appropriate tools
- [ ] **Vulnerability correlation** — Cross-reference findings
- [ ] **Attack path generation** — AI suggests attack chains
- [ ] **Report auto-generation** — One-click professional reports

#### Bug Bounty Workflow
- [ ] **Scope management** — In-scope/out-of-scope tracking
- [ ] **Finding tracker** — Kanban board for findings
- [ ] **Duplicate detection** — Check against known CVEs/bugs
- [ ] **Payout calculator** — Estimate bounty amounts
- [ ] **Program templates** — H1, BC, Intigriti, YesWeHack configs

#### Recon Automation
- [ ] **Continuous monitoring** — Scheduled subdomain/enumeration
- [ ] **Change detection** — Alert on new subdomains/ports
- [ ] **Asset inventory** — Live asset dashboard
- [ ] **Attack surface mapping** — Visual graph

---

### v2.3 — Collaboration & Scale (4 weeks)

#### Multi-user
- [ ] **Team workspaces** — Shared projects, isolated sessions
- [ ] **Role-based access** — Admin, Analyst, Viewer
- [ ] **Real-time collaboration** — See teammates' cursors
- [ ] **Shared terminal** — Pair debugging

#### Enterprise
- [ ] **SSO/SAML/OIDC** — Enterprise auth
- [ ] **Audit logging** — Full activity trail
- [ ] **Compliance reports** — SOC2, ISO27001 exports
- [ ] **On-premise deployment** — Docker/K8s helm charts

#### Platform
- [ ] **Plugin system** — Custom tools, prompts, themes
- [ ] **Marketplace** — Community tools/prompts
- [ ] **API tokens** — Granular permissions
- [ ] **Webhooks** — CI/CD integration

---

### v3.0 — AI-First Platform (8 weeks)

#### AI-Native
- [ ] **Multi-model routing** — Route to best model per task
- [ ] **Local LLM support** — Ollama, llama.cpp, vLLM
- [ ] **RAG over workspace** — Query your notes/files
- [ ] **Agentic workflows** — Autonomous task completion

#### Intelligence
- [ ] **Vulnerability prioritization** — CVSS + context scoring
- [ ] **Exploit development assistant** — PoC generation
- [ ] **Malware analysis** — Static/dynamic analysis
- [ ] **Threat modeling** — STRIDE/PASTA automation

---

## 🐛 Known Issues & Technical Debt

### High Priority
| Issue | Impact | Fix |
|-------|--------|-----|
| Tool execution returns stub | Tools panel non-functional | Implement `/api/tools/execute` with sandbox |
| File upload missing in chat | Can't attach files in chat | Add multipart handling in `/api/chat` |
| Terminal PTY not true TTY | Some tools behave oddly | Use `pty` library for true TTY |
| Session persistence | Loses state on refresh | Persist WS state to localStorage |
| Mobile keyboard covers input | Can't see typing on mobile | Viewport resize handling |

### Medium Priority
| Issue | Fix |
|-------|-----|
| No dark/light auto-switch | Add `prefers-color-scheme` listener |
| Settings don't persist across tabs | BroadcastChannel sync |
| No keyboard shortcuts help | Add `?` key for shortcuts modal |
| Terminal history not searchable | Add fuzzy search (fzf-style) |
| Code blocks not copyable | Add copy button per block |

### Low Priority
- [ ] Theme customization (custom colors)
- [ ] Custom prompt templates
- [ ] Export chat as PDF/Markdown/HTML
- [ ] Keyboard shortcuts cheatsheet
- [ ] Animated emoji reactions

---

## 📐 Technical Architecture Targets

### Performance
| Metric | Current | Target |
|--------|---------|--------|
| First paint | ~800ms | <400ms |
| TTI | ~1.2s | <600ms |
| WS latency | ~50ms | <20ms |
| Bundle size | ~200KB | <150KB |
| Memory (idle) | ~45MB | <30MB |

### Code Quality
- [ ] TypeScript migration (frontend)
- [ ] Unit test coverage >80%
- [ ] E2E tests (Playwright)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Dependency scanning (Dependabot)
- [ ] SBOM generation

---

## 📅 Release Schedule

| Version | Target Date | Focus |
|---------|-------------|-------|
| v2.1 | Week 2 | Tool execution, file upload, chat polish |
| v2.2 | Week 5 | AI intelligence, bug bounty workflow |
| v2.3 | Week 9 | Collaboration, enterprise features |
| v3.0 | Week 17 | AI-native, multi-model, agentic |

---

## 📝 Notes

> **Philosophy**: Every feature must pass the "daily driver test" — would a pentester use this daily instead of their current toolkit?

> **Quality Gate**: No feature ships without mobile testing, keyboard navigation, and screen reader verification.

> **Documentation**: Every feature ships with inline help, tooltip, and docs update.

---

*Last updated: 2024 — NEXUS AI Team*