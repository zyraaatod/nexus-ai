// NEXUS AI - Frontend Application (opencode.ai inspired)
(function() {
  'use strict';

  // Configuration
  const API_BASE = '/api';
  const WS_BASE = '/ws';
  
  // State
  let state = {
    user: null,
    sessionId: null,
    sessions: [],
    currentSessionId: null,
    ws: null,
    terminalWs: null,
    currentView: 'chat',
    chatMessages: [],
    chatHistory: [],
    terminalHistory: [],
    terminalTabs: [{ id: 'main', title: 'Main', cwd: '/workspace' }],
    activeTerminalTab: 'main',
    filesTree: [],
    selectedFile: null,
    editorContent: '',
    prompts: [],
    selectedPrompt: null,
    commandHistory: [],
    tools: [],
    modelName: 'nvidia/nemotron-3.5-bolt-e4b',
    isConnected: false,
    pendingToolCalls: [],
    attachments: [],
    rightPaneOpen: false,
    isMobile: false,
    isTouch: false,
    orientation: 'portrait'
  };

  // DOM Elements
  const els = {};
  
  // Initialize
  document.addEventListener('DOMContentLoaded', async () => {
    cacheElements();
    bindEvents();
    await initializeApp();
  });

  function cacheElements() {
    // Layout
    els.app = document.getElementById('app');
    els.sessionsSidebar = document.getElementById('sessionsSidebar');
    els.sidebarOverlay = document.getElementById('sidebarOverlay');
    els.sidebarToggle = document.getElementById('sidebarToggle');
    els.mainContent = document.getElementById('mainContent');
    els.rightPane = document.getElementById('rightPane');
    els.closePane = document.getElementById('closePane');
    
    // Sessions sidebar
    els.sessionsList = document.getElementById('sessionsList');
    els.newSessionBtn = document.getElementById('newSession');
    els.navItems = document.querySelectorAll('.nav-item[data-view]');
    els.mobileNav = document.getElementById('mobileNav');
    els.mobileNavBtns = document.querySelectorAll('.mobile-nav .nav-btn');
    els.paneTabs = document.getElementById('paneTabs');
    
    // Chat
    els.chatMessages = document.getElementById('chatMessages');
    els.welcomeMessage = document.getElementById('welcomeMessage');
    els.chatInput = document.getElementById('chatInput');
    els.sendBtn = document.getElementById('sendBtn');
    els.newChatBtn = document.getElementById('newChat');
    els.promptPresets = document.getElementById('promptPresets');
    els.attachFileBtn = document.getElementById('attachFile');
    els.attachmentsPreview = document.getElementById('attachmentsPreview');
    els.fileUpload = document.getElementById('fileUpload');
    
    // Terminal
    els.terminalOutput = document.getElementById('terminalOutput');
    els.terminalInput = document.getElementById('terminalInput');
    els.terminalTabs = document.getElementById('terminalTabs');
    els.addTabBtn = document.getElementById('addTab');
    els.clearTerminalBtn = document.getElementById('clearTerminal');
    els.killProcessBtn = document.getElementById('killProcess');
    
    // Files
    els.filesTree = document.getElementById('filesTree');
    els.fileEditor = document.getElementById('fileEditor');
    els.editorPath = document.getElementById('editorPath');
    els.editorContent = document.getElementById('editorContent');
    els.saveFileBtn = document.getElementById('saveFile');
    els.closeEditorBtn = document.getElementById('closeEditor');
    els.newFileBtn = document.getElementById('newFile');
    els.newFolderBtn = document.getElementById('newFolder');
    els.refreshFilesBtn = document.getElementById('refreshFiles');
    els.uploadFileBtn = document.getElementById('uploadFile');
    els.fileUpload = document.getElementById('fileUpload');
    
    // Tools
    els.toolsGrid = document.getElementById('toolsGrid');
    els.toolsSearch = document.getElementById('toolsSearch');
    
    // Prompts
    els.promptsList = document.getElementById('promptsList');
    els.promptsSearch = document.getElementById('promptsSearch');
    els.promptDetail = document.getElementById('promptDetail');
    els.detailTitle = document.getElementById('detailTitle');
    els.detailContent = document.getElementById('detailContent');
    els.usePromptBtn = document.getElementById('usePrompt');
    els.closeDetailBtn = document.getElementById('closeDetail');
    els.promptsSearch = document.getElementById('promptsSearch');
    
    // History
    els.historyList = document.getElementById('historyList');
    els.clearHistoryBtn = document.getElementById('clearHistory');
    els.exportHistoryBtn = document.getElementById('exportHistory');
    
    // Status
    els.statusDot = document.getElementById('statusDot');
    els.statusText = document.getElementById('statusText');
    els.modelName = document.getElementById('modelName');
    els.chatStatusDot = document.getElementById('chatStatusDot');
    els.chatStatusText = document.getElementById('chatStatusText');
    els.chatModelBadge = document.getElementById('chatModelBadge');
    
    // Modal
    els.modalOverlay = document.getElementById('modalOverlay');
    els.modal = document.getElementById('modal');
    els.modalTitle = document.getElementById('modalTitle');
    els.modalBody = document.getElementById('modalBody');
    els.modalFooter = document.getElementById('modalFooter');
    els.modalClose = document.getElementById('modalClose');
    
    // Settings Modal
    els.settingsOverlay = document.getElementById('settingsOverlay');
    els.settingsModal = document.getElementById('settingsModal');
    els.settingsClose = document.getElementById('settingsClose');
    els.settingsCancel = document.getElementById('settingsCancel');
    els.settingsSave = document.getElementById('settingsSave');
    els.settingsTabs = document.getElementById('settingsTabs');
    els.settingsBody = document.getElementById('settingsBody');
    
    // Settings inputs - cache all
    const inputIds = [
      'autoConnect', 'reconnectEnabled', 'connectionTimeout',
      'streamResponses', 'showTimestamps', 'autoScroll', 'enterToSend', 'saveHistory', 'maxHistory',
      'themeSelect', 'fontSizeSelect', 'compactMode', 'showAvatars',
      'providerSelect', 'baseUrlInput', 'modelInput', 'apiKeyInput', 'toggleApiKey',
      'temperatureInput', 'temperatureValue', 'maxTokensInput', 'topPInput', 'topPValue',
      'systemPromptInput', 'resetSystemPrompt', 'testConnection', 'loadDefaultPrompt',
      'defaultShell', 'cmdTimeout', 'maxOutputLines', 'scrollbackBuffer',
      'termReconnect', 'termBell', 'copyOnSelect', 'ctrlCInterrupt', 'tabCompletion',
      'altClickMove', 'termFontFamily', 'termFontSize', 'termLineHeight', 'termLineHeightValue',
      'cursorBlink', 'cursorStyle',
      'sessionId', 'sessionStarted', 'sessionMessages', 'sessionCommands', 'sessionFiles',
      'exportSession', 'clearSession', 'autoSaveSession', 'maxSessions', 'autoLoadSession',
      'includeTerminalOutput', 'viewSessions', 'clearAllSessions', 'storeLocally',
      'encryptStorage', 'anonymousStats', 'wipeAllData',
      'featTerminal', 'featFiles', 'featNetwork', 'featWeb', 'featCrypto', 'featCloud', 'featK8s',
      'debugMode', 'logLevel', 'showLogs', 'perfMonitor',
      'exportAllData', 'importData', 'importFile', 'backupInterval', 'maxBackups',
      'resetSettings', 'factoryReset', 'resetSystemPrompt', 'testConnection', 'loadDefaultPrompt'
    ];
    
    inputIds.forEach(id => {
      els[id] = document.getElementById(id);
    });
    
    // Settings tabs
    els.settingsTabs = document.getElementById('settingsTabs');
    els.settingsBody = document.getElementById('settingsBody');
    els.settingsClose = document.getElementById('settingsClose');
    els.settingsCancel = document.getElementById('settingsCancel');
    els.settingsSave = document.getElementById('settingsSave');
    els.settingsTabs = document.getElementById('settingsTabs');
    els.settingsBody = document.getElementById('settingsBody');
    
    // Status
    els.statusDot = document.getElementById('statusDot');
    els.statusText = document.getElementById('statusText');
    els.modelName = document.getElementById('modelName');
    els.chatStatusDot = document.getElementById('chatStatusDot');
    els.chatStatusText = document.getElementById('chatStatusText');
    els.chatModelBadge = document.getElementById('chatModelBadge');
    
    // Toast
    els.toastContainer = document.getElementById('toastContainer');
    
    // Modal
    els.modalOverlay = document.getElementById('modalOverlay');
    els.modal = document.getElementById('modal');
    els.modalTitle = document.getElementById('modalTitle');
    els.modalBody = document.getElementById('modalBody');
    els.modalFooter = document.getElementById('modalFooter');
    els.modalClose = document.getElementById('modalClose');
    
    // Settings Modal
    els.settingsOverlay = document.getElementById('settingsOverlay');
    els.settingsModal = document.getElementById('settingsModal');
    els.settingsClose = document.getElementById('settingsClose');
    els.settingsCancel = document.getElementById('settingsCancel');
    els.settingsSave = document.getElementById('settingsSave');
    els.settingsTabs = document.getElementById('settingsTabs');
    els.settingsBody = document.getElementById('settingsBody');
    
    // Terminal
    els.terminalOutput = document.getElementById('terminalOutput');
    els.terminalInput = document.getElementById('terminalInput');
    els.terminalTabs = document.getElementById('terminalTabs');
    els.addTabBtn = document.getElementById('addTab');
    els.clearTerminalBtn = document.getElementById('clearTerminal');
    els.killProcessBtn = document.getElementById('killProcess');
    
    // Files
    els.filesTree = document.getElementById('filesTree');
    els.fileEditor = document.getElementById('fileEditor');
    els.editorPath = document.getElementById('editorPath');
    els.editorContent = document.getElementById('editorContent');
    els.saveFileBtn = document.getElementById('saveFile');
    els.closeEditorBtn = document.getElementById('closeEditor');
    els.newFileBtn = document.getElementById('newFile');
    els.newFolderBtn = document.getElementById('newFolder');
    els.refreshFilesBtn = document.getElementById('refreshFiles');
    els.uploadFileBtn = document.getElementById('uploadFile');
    els.fileUpload = document.getElementById('fileUpload');
    
    // Tools
    els.toolsGrid = document.getElementById('toolsGrid');
    els.toolsSearch = document.getElementById('toolsSearch');
    
    // Prompts
    els.promptsList = document.getElementById('promptsList');
    els.promptsSearch = document.getElementById('promptsSearch');
    els.promptDetail = document.getElementById('promptDetail');
    els.detailTitle = document.getElementById('detailTitle');
    els.detailContent = document.getElementById('detailContent');
    els.usePromptBtn = document.getElementById('usePrompt');
    els.closeDetailBtn = document.getElementById('closeDetail');
    els.promptsSearch = document.getElementById('promptsSearch');
    
    // History
    els.historyList = document.getElementById('historyList');
    els.clearHistoryBtn = document.getElementById('clearHistory');
    els.exportHistoryBtn = document.getElementById('exportHistory');
    
    // Status
    els.statusDot = document.getElementById('statusDot');
    els.statusText = document.getElementById('statusText');
    els.modelName = document.getElementById('modelName');
    els.chatStatusDot = document.getElementById('chatStatusDot');
    els.chatStatusText = document.getElementById('chatStatusText');
    els.chatModelBadge = document.getElementById('chatModelBadge');
    
    // Toast
    els.toastContainer = document.getElementById('toastContainer');
    
    // Modal
    els.modalOverlay = document.getElementById('modalOverlay');
    els.modal = document.getElementById('modal');
    els.modalTitle = document.getElementById('modalTitle');
    els.modalBody = document.getElementById('modalBody');
    els.modalFooter = document.getElementById('modalFooter');
    els.modalClose = document.getElementById('modalClose');
    
    // Settings Modal
    els.settingsOverlay = document.getElementById('settingsOverlay');
    els.settingsModal = document.getElementById('settingsModal');
    els.settingsClose = document.getElementById('settingsClose');
    els.settingsCancel = document.getElementById('settingsCancel');
    els.settingsSave = document.getElementById('settingsSave');
    els.settingsTabs = document.getElementById('settingsTabs');
    els.settingsBody = document.getElementById('settingsBody');
  }

  function bindEvents() {
    // Sidebar toggle
    els.sidebarToggle?.addEventListener('click', toggleSidebar);
    els.sidebarToggleMobile?.addEventListener('click', toggleSidebar);
    els.sidebarOverlay?.addEventListener('click', closeSidebar);
    
    // Mobile nav
    els.mobileNavBtns?.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const view = btn.dataset.view;
        const drawer = btn.dataset.drawer;
        
        if (action === 'drawer' && drawer) {
          // Open drawer and switch to the specified pane
          switchPane(drawer);
          toggleRightPane(true);
        } else if (view) {
          switchView(view);
        }
      });
    });
    
    // Navigation
    els.navItems?.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        if (view) switchView(view);
      });
    });
    
    // Pane tabs
    els.paneTabs?.addEventListener('click', (e) => {
      const tab = e.target.closest('.pane-tab');
      if (tab) switchPane(tab.dataset.pane);
    });
    
    // Right pane toggle
    els.closePane?.addEventListener('click', toggleRightPane);
    els.toggleDrawer?.addEventListener('click', toggleRightPane);
    
    // Sessions
    els.newSessionBtn?.addEventListener('click', newSession);
    els.sessionsList?.addEventListener('click', (e) => {
      const sessionItem = e.target.closest('.session-item');
      if (sessionItem) switchSession(sessionItem.dataset.sessionId);
    });
    
    // Navigation
    els.navItems?.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(item.dataset.view);
      });
    });
    
    els.mobileNavBtns?.forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    
    // Pane tabs
    els.paneTabs?.addEventListener('click', (e) => {
      const tab = e.target.closest('.pane-tab');
      if (tab) switchPane(tab.dataset.pane);
    });
    
    // Right pane toggle
    els.closePane?.addEventListener('click', toggleRightPane);
    els.closeDrawer?.addEventListener('click', toggleRightPane);
    
    // Chat
    els.sendBtn?.addEventListener('click', sendMessage);
    els.chatInput?.addEventListener('keydown', handleChatKeydown);
    els.newChatBtn?.addEventListener('click', newSession);
    els.attachFileBtn?.addEventListener('click', () => els.fileUpload?.click());
    els.fileUpload?.addEventListener('change', handleFileAttach);
    els.sendBtn?.addEventListener('click', sendMessage);
    
    // Terminal
    els.terminalInput?.addEventListener('keydown', handleTerminalKeydown);
    els.terminalTabs?.addEventListener('click', handleTabClick);
    els.addTabBtn?.addEventListener('click', addTerminalTab);
    els.clearTerminalBtn?.addEventListener('click', clearTerminal);
    els.killProcessBtn?.addEventListener('click', killTerminalProcess);
    
    // Files
    els.refreshFilesBtn?.addEventListener('click', loadFilesTree);
    els.newFileBtn?.addEventListener('click', createNewFile);
    els.newFolderBtn?.addEventListener('click', createNewFolder);
    els.uploadFileBtn?.addEventListener('click', () => els.fileUpload?.click());
    els.fileUpload?.addEventListener('change', handleFileUpload);
    els.saveFileBtn?.addEventListener('click', saveFile);
    els.closeEditorBtn?.addEventListener('click', closeFileEditor);
    
    // Tools
    els.toolsSearch?.addEventListener('input', filterTools);
    
    // Prompts
    els.promptsSearch?.addEventListener('input', filterPrompts);
    els.usePromptBtn?.addEventListener('click', useSelectedPrompt);
    els.closeDetailBtn?.addEventListener('click', closePromptDetail);
    
    // History
    els.clearHistoryBtn?.addEventListener('click', clearHistory);
    els.exportHistoryBtn?.addEventListener('click', exportHistory);
    
    // Welcome actions
    document.querySelectorAll('.welcome-action').forEach(btn => {
      btn.addEventListener('click', () => loadPrompt(btn.dataset.prompt));
    });
    
    // Prompt presets
    els.promptPresets?.addEventListener('click', (e) => {
      const btn = e.target.closest('.preset-btn');
      if (btn) loadPrompt(btn.dataset.prompt);
    });
    
    // Settings Modal
    els.openSettings?.addEventListener('click', openSettings);
    els.settingsClose?.addEventListener('click', closeSettings);
    els.settingsCancel?.addEventListener('click', closeSettings);
    els.settingsOverlay?.addEventListener('click', (e) => {
      if (e.target === els.settingsOverlay) closeSettings();
    });
    els.settingsSave?.addEventListener('click', saveSettings);
    
    // Settings tabs
    if (els.settingsTabs) {
      els.settingsTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab-btn');
        if (tab) switchSettingsTab(tab.dataset.tab);
      });
    }
    
    // Settings input events
    if (els.toggleApiKey) {
      els.toggleApiKey.addEventListener('click', () => {
        const type = els.apiKeyInput.type === 'password' ? 'text' : 'password';
        els.apiKeyInput.type = type;
        els.toggleApiKey.innerHTML = type === 'password' ? '<i class="ph ph-eye"></i>' : '<i class="ph ph-eye-slash"></i>';
      });
    }
    
    // Range input value displays
    document.querySelectorAll('input[type="range"]').forEach(input => {
      input.addEventListener('input', (e) => {
        const valueEl = document.getElementById(e.target.id + 'Value');
        if (valueEl) valueEl.textContent = e.target.value;
      });
    });
    
    // Session buttons
    if (els.exportSession) els.exportSession.addEventListener('click', exportSession);
    if (els.clearSession) els.clearSession.addEventListener('click', clearSession);
    if (els.viewSessions) els.viewSessions.addEventListener('click', viewSessions);
    if (els.clearAllSessions) els.clearAllSessions.addEventListener('click', clearAllSessions);
    if (els.wipeAllData) els.wipeAllData.addEventListener('click', wipeAllData);
    
    // Advanced buttons
    if (els.exportAllData) els.exportAllData.addEventListener('click', exportAllData);
    if (els.importData) {
      els.importData.addEventListener('click', () => els.importFile?.click());
      els.importFile?.addEventListener('change', importData);
    }
    if (els.resetSettings) els.resetSettings.addEventListener('click', resetSettings);
    if (els.factoryReset) els.factoryReset.addEventListener('click', factoryReset);
    if (els.resetSystemPrompt) els.resetSystemPrompt.addEventListener('click', resetSystemPrompt);
    if (els.testConnection) els.testConnection.addEventListener('click', testConnection);
    if (els.loadDefaultPrompt) els.loadDefaultPrompt.addEventListener('click', loadDefaultPrompt);
    
    // Modal
    els.modalClose?.addEventListener('click', closeModal);
    els.modalOverlay?.addEventListener('click', (e) => {
      if (e.target === els.modalOverlay) closeModal();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleGlobalKeydown);
    
    // Auto-resize textarea
    if (els.chatInput) {
      els.chatInput.addEventListener('input', autoResizeTextarea);
    }
    
    // Touch swipe for sidebar
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      if (!state.isMobile) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      // Horizontal swipe detection (min 50px horizontal, less than 100px vertical)
      if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100) {
        if (deltaX > 0 && touchStartX < 50) {
          // Swipe right from left edge - open sidebar
          els.sessionsSidebar?.classList.add('open');
          els.sidebarOverlay?.classList.add('active');
        } else if (deltaX < 0) {
          // Swipe left - close sidebar
          closeSidebar();
        }
      }
    }, { passive: true });
    
    // Close right pane on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
        closeSidebar();
        closeFileEditor();
        closePromptDetail();
        closeSettings();
        if (state.rightPaneOpen) toggleRightPane();
      }
    });
  }

  // Mobile detection
  function detectMobile() {
    const ua = navigator.userAgent;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileScreen = window.innerWidth <= 768;
    const isMobile = isMobileUA || (isTouch && isMobileScreen);
    
    state.isMobile = isMobile;
    state.isTouch = isTouch;
    state.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    
    // Apply mobile class to body for CSS
    document.body.classList.toggle('is-mobile', state.isMobile);
    document.body.classList.toggle('is-touch', state.isTouch);
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        state.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        document.body.classList.toggle('landscape', state.orientation === 'landscape');
        handleResize();
      }, 100);
    });
    
    // Listen for resize
    window.addEventListener('resize', handleResize);
    
    return isMobile;
  }

  function handleResize() {
    const wasMobile = state.isMobile;
    const isMobileScreen = window.innerWidth <= 768;
    state.isMobile = state.isTouch && isMobileScreen;
    
    if (wasMobile !== state.isMobile) {
      document.body.classList.toggle('is-mobile', state.isMobile);
      // Re-render layout if needed
      if (state.isMobile) {
        closeSidebar();
        if (state.rightPaneOpen) toggleRightPane();
      }
    }
  }
  
  async function initializeApp() {
    // Detect mobile first
    detectMobile();
    
    showStatus('connecting', 'Connecting...');
    
    try {
      // Initialize session
      initSession();
      
      // Load initial data
      await Promise.all([
        loadTools(),
        loadPrompts(),
        loadFilesTree(),
        loadCommandHistory(),
        loadSessions(),
        checkHealth()
      ]);
      
      // Load settings
      loadSettings();
      
      // Connect WebSocket
      connectWebSocket();
      connectTerminalWS();
      
      // Load quick prompts
      renderPromptPresets();
      renderSessions();
      
      // Apply mobile-specific UI adjustments
      applyMobileUI();
      
      showStatus('connected', 'Connected');
      showToast('Welcome to NEXUS AI', 'Connected to backend', 'success');
      
    } catch (error) {
      console.error('Initialization error:', error);
      showStatus('error', 'Connection failed');
      showToast('Connection failed', error.message, 'error');
    }
  }

  function initSession() {
    // Generate or restore session ID
    state.sessionId = localStorage.getItem('nexus_session_id') || generateId();
    localStorage.setItem('nexus_session_id', state.sessionId);
    
    // Session start time
    state.sessionStarted = new Date().toISOString();
    localStorage.setItem('nexus_session_started', state.sessionStarted);
    
    // Initialize counters
    state.sessionMessages = 0;
    state.sessionCommands = 0;
    state.sessionFiles = 0;
    
    // Update session info in settings
    updateSessionInfo();
  }
  
  function applyMobileUI() {
    if (!state.isMobile) return;
    
    // Hide sidebar by default on mobile
    closeSidebar();
    
    // Ensure right pane is closed on mobile
    if (state.rightPaneOpen) toggleRightPane();
    
    // Adjust chat input for mobile
    if (els.chatInput) {
      els.chatInput.style.fontSize = '16px'; // Prevent zoom on iOS
    }
    
    // Adjust terminal input for mobile
    if (els.terminalInput) {
      els.terminalInput.style.fontSize = '16px';
    }
    
    // Show mobile nav
    if (els.mobileNav) {
      els.mobileNav.style.display = 'flex';
    }
    
    // Hide desktop-only elements
    document.querySelectorAll('.desktop-only').forEach(el => {
      el.style.display = 'none';
    });
  }
  
  function updateSessionInfo() {
    if (els.sessionId) els.sessionId.textContent = state.sessionId?.slice(0, 8) + '...';
    if (els.sessionStarted) els.sessionStarted.textContent = state.sessionStarted ? new Date(state.sessionStarted).toLocaleString() : '-';
    if (els.sessionMessages) els.sessionMessages.textContent = state.sessionMessages;
    if (els.sessionCommands) els.sessionCommands.textContent = state.sessionCommands;
    if (els.sessionFiles) els.sessionFiles.textContent = state.sessionFiles;
  }

  // API Helpers
  async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return response.json();
  }

  async function checkHealth() {
    try {
      const data = await apiRequest('/health');
      state.modelName = data.model || 'nvidia/nemotron-3.5-bolt-e4b';
      updateModelInfo();
    } catch (e) {
      console.warn('Health check failed:', e);
    }
  }

  async function loadTools() {
    try {
      const data = await apiRequest('/tools');
      state.tools = data.tools || [];
      renderTools();
      renderPromptPresets(data.prompts || []);
    } catch (e) {
      console.error('Failed to load tools:', e);
    }
  }

  async function loadPrompts() {
    try {
      const data = await apiRequest('/tools');
      state.prompts = data.prompts || [];
      renderPromptsList();
    } catch (e) {
      console.error('Failed to load prompts:', e);
    }
  }

  async function loadSessions() {
    try {
      const saved = localStorage.getItem('nexus_sessions');
      state.sessions = saved ? JSON.parse(saved) : [];
      state.currentSessionId = state.sessions.length > 0 ? state.sessions[0].id : null;
      renderSessions();
    } catch (e) {
      console.error('Load sessions error:', e);
      state.sessions = [];
    }
  }

  // WebSocket Connection
  function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}${WS_BASE}/${generateId()}`;
    
    state.ws = new WebSocket(wsUrl);
    
    state.ws.onopen = () => {
      console.log('WebSocket connected');
      showStatus('connected', 'Connected');
    };
    
    state.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWSMessage(data);
      } catch (e) {
        console.error('WS message parse error:', e);
      }
    };
    
    state.ws.onclose = () => {
      console.log('WebSocket disconnected');
      showStatus('disconnected', 'Disconnected');
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };
    
    state.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  function handleWSMessage(data) {
    switch (data.type) {
      case 'chat_chunk':
        appendChatChunk(data.content);
        break;
      case 'chat_start':
        startAssistantMessage();
        break;
      case 'chat_end':
        endAssistantMessage(data.full_response);
        break;
      case 'command_result':
        appendTerminalOutput(data);
        break;
      case 'command_start':
        appendTerminalLine({ type: 'command', data: data.command });
        break;
      case 'error':
        showToast('Error', data.message, 'error');
        break;
      case 'pong':
        break;
    }
  }

  // Terminal WebSocket
  function connectTerminalWS(initialCommand) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/terminal/${generateId()}`;
    
    state.terminalWs = new WebSocket(`${wsUrl}?initial=${encodeURIComponent(initialCommand || '')}`);
    
    state.terminalWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        appendTerminalOutput(data);
      } catch (e) {
        console.error('Terminal WS parse error:', e);
      }
    };
    
    state.terminalWs.onclose = () => {
      // Reconnect if needed
      setTimeout(() => connectTerminalWS(), 2000);
    };
  }

  // Chat Functions
  function handleChatKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === 'ArrowUp' && els.chatInput.value === '') {
      e.preventDefault();
      navigateHistory(-1);
    } else if (e.key === 'ArrowDown' && els.chatInput.value === '') {
      e.preventDefault();
      navigateHistory(1);
    }
  }

  async function sendMessage() {
    const message = els.chatInput.value.trim();
    if (!message && state.attachments.length === 0) return;
    
    const text = message;
    const attachments = [...state.attachments];
    
    // Add user message
    addMessage('user', text, attachments);
    els.chatInput.value = '';
    state.attachments = [];
    renderAttachmentsPreview();
    autoResizeTextarea();
    
    // Update session counter
    state.sessionMessages++;
    updateSessionInfo();
    
    // Hide welcome message
    if (els.welcomeMessage) els.welcomeMessage.style.display = 'none';
    
    // Show typing indicator
    startAssistantMessage();
    
    // Send via WebSocket
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify({
        type: 'chat',
        message: text,
        attachments: attachments
      }));
    } else {
      // Fallback to REST
      await sendMessageREST(text, attachments);
    }
    
    // Add to history
    state.chatHistory.unshift(text);
    if (state.chatHistory.length > 50) state.chatHistory.pop();
  }

  async function sendMessageREST(message, attachments = []) {
    try {
      const data = await apiRequest('/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            { role: 'system', content: getSystemPrompt() },
            ...state.chatMessages.map(m => ({ role: m.role, content: m.content, attachments: m.attachments })),
            { role: 'user', content: message, attachments }
          ],
          stream: false
        })
      });
      
      endAssistantMessage(data.choices?.[0]?.message?.content || 'No response');
    } catch (e) {
      endAssistantMessage(`Error: ${e.message}`);
      showToast('Error', e.message, 'error');
    }
  }

  function getSystemPrompt() {
    const custom = els.systemPromptInput?.value;
    if (custom) return custom;
    
    return `You are NEXUS AI, an elite cybersecurity assistant specialized in penetration testing, bug bounty hunting, OSINT, reconnaissance, vulnerability research, and red team operations. You have direct access to a Linux terminal with a comprehensive arsenal of security tools.

## Core Capabilities:
- **Reconnaissance & OSINT**: Subdomain enumeration, asset discovery, technology fingerprinting, certificate transparency, DNS analysis, WHOIS, email harvesting, social media intelligence
- **Vulnerability Assessment**: Automated scanning (Nuclei, Nikto), manual testing, configuration audits, SSL/TLS analysis, header security, CORS, CSP
- **Web Application Security**: XSS, SQLi, SSRF, IDOR, XXE, RCE, LFI/RFI, auth bypass, session management, JWT attacks, API testing
- **Network Security**: Port scanning, service enumeration, firewall evasion, VPN/pivoting, lateral movement, AD enumeration, Kerberos attacks
- **Exploitation & Post-Exploitation**: Proof-of-concept development, privilege escalation, persistence, credential access, data exfiltration simulation
- **Bug Bounty Methodology**: Scope analysis, recon automation, vulnerability prioritization, report writing, duplicate checking
- **Code Review**: Static analysis, dependency scanning, secret detection, insecure patterns, supply chain risks

## Operating Principles:
1. **Always verify before executing** - Confirm targets are in scope
2. **Start passive, go active** - OSINT → scanning → exploitation
3. **Document everything** - Commands, outputs, findings, evidence
4. **Follow methodology** - PTES, OSSTMM, OWASP, NIST frameworks
5. **Respect scope & rules** - Never test out-of-scope assets
6. **Minimize impact** - Read-only first, controlled exploitation
7. **Chain vulnerabilities** - Look for attack chains, not single issues
8. **Think like attacker, report like pro** - Clear PoC, impact, remediation

## Response Format:
- **Analysis**: Brief assessment of situation
- **Plan**: Step-by-step approach
- **Commands**: Exact terminal commands to run (use \`tool:\` blocks)
- **Expected Outcome**: What to look for
- **Next Steps**: Follow-up actions

## Tool Execution:
Use \`tool:\` blocks for terminal commands:
\`\`\`
tool: nmap -sS -sV -T4 target.com
\`\`\`
Multiple commands can be chained. Output will be returned for analysis.

## Safety Boundaries:
- NEVER attack production systems without explicit written authorization
- NEVER exfiltrate real data - simulate only
- NEVER create persistence on systems you don't own
- ALWAYS verify scope before each action
- Report critical findings immediately with evidence`;
  }

  function addMessage(role, content, attachments = []) {
    const message = { role, content, attachments, timestamp: Date.now() };
    state.chatMessages.push(message);
    renderMessage(message);
    scrollToBottom();
  }

  function renderMessage(message) {
    const div = document.createElement('div');
    div.className = `message ${message.role}`;
    
    let attachmentsHtml = '';
    if (message.attachments && message.attachments.length > 0) {
      attachmentsHtml = '<div class="message-attachments">' + 
        message.attachments.map(a => `<span class="attachment-chip"><i class="ph ph-${a.type === 'image' ? 'image' : 'file'}"></i>${escapeHtml(a.name)}</span>`).join('') +
        '</div>';
    }
    
    div.innerHTML = `
      <div class="message-avatar">
        <i class="ph ${message.role === 'user' ? 'ph-user' : 'ph-robot'}"></i>
      </div>
      <div class="message-content">${attachmentsHtml}${formatMessageContent(message.content)}</div>
    `;
    els.chatMessages.appendChild(div);
    scrollToBottom();
  }

  function formatMessageContent(content) {
    return content
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  function startAssistantMessage() {
    const div = document.createElement('div');
    div.className = 'message assistant';
    div.id = 'assistant-placeholder';
    div.innerHTML = `
      <div class="message-avatar">
        <i class="ph ph-robot"></i>
      </div>
      <div class="message-content"><span class="typing-indicator"><span></span><span></span><span></span></span></div>
    `;
    els.chatMessages.appendChild(div);
    scrollToBottom();
  }

  function appendChatChunk(content) {
    const placeholder = document.getElementById('assistant-placeholder');
    if (placeholder) {
      const contentEl = placeholder.querySelector('.message-content');
      if (contentEl.querySelector('.typing-indicator')) {
        contentEl.innerHTML = '';
      }
      contentEl.innerHTML += content;
      scrollToBottom();
    }
  }

  function endAssistantMessage(fullResponse) {
    const placeholder = document.getElementById('assistant-placeholder');
    if (placeholder) {
      placeholder.id = '';
      placeholder.querySelector('.message-content').innerHTML = formatMessageContent(fullResponse);
    }
    // Only update state for history, don't re-render
    state.chatMessages.push({ role: 'assistant', content: fullResponse || '', timestamp: Date.now() });
    if (state.chatMessages.length > 100) state.chatMessages.shift();
  }

  function scrollToBottom() {
    els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
  }

  function renderPromptPresets(prompts = ['RECON_SUBDOMAIN', 'WEB_VULN_SCAN', 'BUG_BOUNTY_WORKFLOW', 'OSINT_PERSON', 'VULN_RESEARCH']) {
    if (!els.promptPresets) return;
    els.promptPresets.innerHTML = prompts.map(name => `
      <button class="preset-btn" data-prompt="${name}" title="Load ${name} prompt">
        ${name.replace(/_/g, ' ')}
      </button>
    `).join('');
    
    els.promptPresets.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => loadPrompt(btn.dataset.prompt));
    });
  }

  async function loadPrompt(name) {
    try {
      const data = await apiRequest(`/prompts/${name}`);
      if (data.content) {
        els.chatInput.value = data.content;
        autoResizeTextarea();
        els.chatInput.focus();
        showToast('Prompt loaded', name, 'success');
      }
    } catch (e) {
      showToast('Error', 'Failed to load prompt', 'error');
    }
  }

  function newSession() {
    state.chatMessages = [];
    els.chatMessages.innerHTML = '';
    if (els.welcomeMessage) els.welcomeMessage.style.display = 'flex';
    state.chatHistory = [];
    state.attachments = [];
    renderAttachmentsPreview();
    state.sessionId = generateId();
    localStorage.setItem('nexus_session_id', state.sessionId);
    state.sessionStarted = new Date().toISOString();
    localStorage.setItem('nexus_session_started', state.sessionStarted);
    state.sessionMessages = 0;
    state.sessionCommands = 0;
    state.sessionFiles = 0;
    updateSessionInfo();
    showToast('New session', 'Started new conversation', 'success');
  }

  function navigateHistory(direction) {
    // Implement history navigation
  }

  function scrollToBottom() {
    els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
  }

  function autoResizeTextarea() {
    if (!els.chatInput) return;
    els.chatInput.style.height = 'auto';
    els.chatInput.style.height = Math.min(els.chatInput.scrollHeight, 200) + 'px';
  }

  function handleFileAttach(e) {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (state.attachments.length >= 5) {
        showToast('Limit reached', 'Maximum 5 attachments per message', 'warning');
        break;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        state.attachments.push({
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          size: file.size,
          data: event.target.result
        });
        renderAttachmentsPreview();
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }

  function renderAttachmentsPreview() {
    if (!els.attachmentsPreview) return;
    
    if (state.attachments.length === 0) {
      els.attachmentsPreview.hidden = true;
      els.attachmentsPreview.innerHTML = '';
      return;
    }
    
    els.attachmentsPreview.hidden = false;
    els.attachmentsPreview.innerHTML = state.attachments.map((a, i) => `
      <div class="attachment-item">
        <i class="ph ph-${a.type === 'image' ? 'image' : 'file'}"></i>
        <span>${escapeHtml(a.name)}</span>
        <button class="remove-btn" data-index="${i}" aria-label="Remove attachment">
          <i class="ph ph-x"></i>
        </button>
      </div>
    `).join('');
    
    els.attachmentsPreview.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.attachments.splice(parseInt(btn.dataset.index), 1);
        renderAttachmentsPreview();
      });
    });
  }

  // Terminal Functions
  function handleTerminalKeydown(e) {
    if (e.key === 'Enter') {
      const command = els.terminalInput.value.trim();
      if (command) {
        executeTerminalCommand(command);
        els.terminalInput.value = '';
      }
    } else if (e.key === 'ArrowUp') {
      // History navigation
    } else if (e.key === 'ArrowDown') {
      // History navigation
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Tab completion
    }
  }

  async function executeTerminalCommand(command) {
    const tab = state.terminalTabs.find(t => t.id === state.activeTerminalTab);
    const cwd = tab?.cwd || '/workspace';
    
    appendTerminalLine({ type: 'command', data: `${getPrompt()} ${command}` });
    state.terminalHistory.push(command);
    if (state.terminalHistory.length > 1000) state.terminalHistory.shift();
    renderHistory();
    
    // Update session counter
    state.sessionCommands++;
    updateSessionInfo();
    
    if (state.terminalWs && state.terminalWs.readyState === WebSocket.OPEN) {
      state.terminalWs.send(JSON.stringify({ command, cwd }));
    } else {
      connectTerminalWS(command);
    }
  }

  function connectTerminalWS(initialCommand) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/terminal/${generateId()}`;
    
    state.terminalWs = new WebSocket(`${wsUrl}?initial=${encodeURIComponent(initialCommand || '')}`);
    
    state.terminalWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        appendTerminalOutput(data);
      } catch (e) {
        console.error('Terminal WS parse error:', e);
      }
    };
    
    state.terminalWs.onclose = () => {
      setTimeout(() => connectTerminalWS(), 2000);
    };
  }

  function appendTerminalOutput(data) {
    const div = document.createElement('div');
    div.className = 'terminal-line';
    
    switch (data.type) {
      case 'stdout':
        div.innerHTML = `<span class="stdout">${escapeHtml(data.data)}</span>`;
        break;
      case 'stderr':
        div.innerHTML = `<span class="stderr">${escapeHtml(data.data)}</span>`;
        break;
      case 'exit':
        appendTerminalLine({ type: 'system', data: `Process exited with code ${data.data}` });
        setTimeout(() => appendTerminalLine({ type: 'prompt' }), 100);
        break;
      case 'error':
        div.innerHTML = `<span class="stderr">Error: ${escapeHtml(data.data)}</span>`;
        break;
    }
    
    els.terminalOutput.appendChild(div);
    els.terminalOutput.scrollTop = els.terminalOutput.scrollHeight;
  }

  function appendTerminalLine(data) {
    const div = document.createElement('div');
    div.className = 'terminal-line';
    
    switch (data.type) {
      case 'command':
        div.innerHTML = `<span class="prompt">${getPrompt()}</span> <span class="command">${escapeHtml(data.data.replace(getPrompt() + ' ', ''))}</span>`;
        break;
      case 'stdout':
        div.innerHTML = `<span class="stdout">${escapeHtml(data.data)}</span>`;
        break;
      case 'stderr':
        div.innerHTML = `<span class="stderr">${escapeHtml(data.data)}</span>`;
        break;
      case 'system':
        div.innerHTML = `<span class="system">${escapeHtml(data.data)}</span>`;
        break;
      case 'info':
        div.innerHTML = `<span class="info">${escapeHtml(data.data)}</span>`;
        break;
      case 'prompt':
        div.innerHTML = `<span class="prompt">${getPrompt()}</span><span class="cursor" aria-hidden="true"></span>`;
        break;
    }
    
    // Remove old prompt if exists and adding new content
    const lines = els.terminalOutput.querySelectorAll('.terminal-line');
    const lastLine = lines[lines.length - 1];
    if (lastLine && lastLine.querySelector('.prompt') && data.type !== 'prompt') {
      lastLine.remove();
    }
    
    els.terminalOutput.appendChild(div);
    els.terminalOutput.scrollTop = els.terminalOutput.scrollHeight;
  }

  function getPrompt() {
    const tab = state.terminalTabs.find(t => t.id === state.activeTerminalTab);
    const cwd = tab?.cwd || '/workspace';
    const shortCwd = cwd.replace('/workspace', '~');
    return `nexus@workspace:${shortCwd}$`;
  }

  function clearTerminal() {
    els.terminalOutput.innerHTML = '';
    appendTerminalLine({ type: 'prompt' });
  }

  function killTerminalProcess() {
    if (state.terminalWs) {
      state.terminalWs.send(JSON.stringify({ command: '\x03' })); // Ctrl+C
    }
  }

  function handleTabClick(e) {
    const tabBtn = e.target.closest('.tab-btn');
    if (!tabBtn || tabBtn.classList.contains('add-tab')) return;
    
    if (e.target.classList.contains('tab-close')) {
      closeTab(tabBtn.dataset.tab);
      return;
    }
    
    switchTab(tabBtn.dataset.tab);
  }

  function switchTab(tabId) {
    state.activeTerminalTab = tabId;
    document.querySelectorAll('#terminalTabs .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
      btn.setAttribute('aria-selected', btn.dataset.tab === tabId);
    });
    clearTerminal();
  }

  function addTerminalTab() {
    const id = `tab-${Date.now()}`;
    const title = `Tab ${state.terminalTabs.length + 1}`;
    state.terminalTabs.push({ id, title, cwd: '/workspace' });
    renderTabs();
    switchTab(id);
  }

  function closeTab(tabId) {
    if (state.terminalTabs.length <= 1) return;
    state.terminalTabs = state.terminalTabs.filter(t => t.id !== tabId);
    if (state.activeTerminalTab === tabId) {
      state.activeTerminalTab = state.terminalTabs[0].id;
    }
    renderTabs();
  }

  function renderTabs() {
    if (!els.terminalTabs) return;
    const addTabBtn = els.terminalTabs.querySelector('.add-tab');
    els.terminalTabs.querySelectorAll('.tab-btn:not(.add-tab)').forEach(el => el.remove());
    
    state.terminalTabs.forEach((tab, index) => {
      const btn = document.createElement('button');
      btn.className = `tab-btn ${tab.id === state.activeTerminalTab ? 'active' : ''}`;
      btn.dataset.tab = tab.id;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', tab.id === state.activeTerminalTab);
      btn.innerHTML = `
        <i class="ph ph-terminal"></i>
        <span>${escapeHtml(tab.title)}</span>
        <i class="ph ph-x tab-close" aria-label="Close tab"></i>
      `;
      els.terminalTabs.insertBefore(btn, addTabBtn);
    });
  }

  // Files
  async function loadFilesTree(path = '.') {
    try {
      const data = await apiRequest('/files/list', {
        method: 'POST',
        body: JSON.stringify({ path })
      });
      state.filesTree = data.items || [];
      renderFilesTree();
    } catch (e) {
      console.error('Load files error:', e);
    }
  }

  function renderFilesTree(items = state.filesTree, container = els.filesTree, depth = 0) {
    if (!container) return;
    if (depth === 0) container.innerHTML = '';
    
    items.forEach(item => {
      const div = document.createElement('div');
      div.className = `tree-item ${item.is_dir ? 'folder' : 'file'} ${state.selectedFile?.path === item.path ? 'selected' : ''}`;
      div.dataset.path = item.path;
      div.innerHTML = `
        <i class="ph ${item.is_dir ? 'ph-folder' : 'ph-file'}"></i>
        <span class="tree-item-name">${escapeHtml(item.name)}</span>
        ${item.is_dir ? '<i class="ph ph-chevron-right toggle" style="font-size:12px; margin-left:auto;"></i>' : ''}
      `;
      
      div.addEventListener('click', (e) => {
        if (e.target.classList.contains('toggle')) {
          e.stopPropagation();
          toggleFolder(item.path, e.target);
        } else if (item.is_dir) {
          toggleFolder(item.path, div.querySelector('.toggle'));
        } else {
          selectFile(item);
        }
      });
      
      if (item.is_dir) {
        const childrenDiv = document.createElement('div');
        childrenDiv.className = 'tree-children';
        childrenDiv.style.display = 'none';
        childrenDiv.dataset.path = item.path;
        div.appendChild(childrenDiv);
      }
      
      container.appendChild(div);
    });
  }

  function toggleFolder(path, toggleEl) {
    const childrenDiv = document.querySelector(`.tree-children[data-path="${path}"]`);
    const toggle = toggleEl || document.querySelector(`.tree-item[data-path="${path}"] .toggle`);
    if (childrenDiv && toggle) {
      const isOpen = childrenDiv.style.display !== 'none';
      childrenDiv.style.display = isOpen ? 'none' : 'block';
      toggle.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
    }
  }

  function selectFile(item) {
    document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('selected'));
    const el = document.querySelector(`.tree-item[data-path="${item.path}"]`);
    if (el) el.classList.add('selected');
    state.selectedFile = item;
    openFileEditor(item);
  }

  async function openFileEditor(item) {
    try {
      const data = await apiRequest('/files/read', {
        method: 'POST',
        body: JSON.stringify({ path: item.path })
      });
      
      if (data.success) {
        state.editorContent = data.content;
        els.editorPath.textContent = item.path;
        els.editorContent.value = data.content;
        els.fileEditor.hidden = false;
      } else {
        showToast('Error', data.error, 'error');
      }
    } catch (e) {
      showToast('Error', e.message, 'error');
    }
  }

  async function saveFile() {
    if (!state.selectedFile) return;
    
    try {
      const data = await apiRequest('/files/write', {
        method: 'POST',
        body: JSON.stringify({
          path: state.selectedFile.path,
          content: els.editorContent.value
        })
      });
      
      if (data.success) {
        showToast('Saved', 'File saved successfully', 'success');
      } else {
        showToast('Error', data.error, 'error');
      }
    } catch (e) {
      showToast('Error', e.message, 'error');
    }
  }

  function closeFileEditor() {
    els.fileEditor.hidden = true;
    state.selectedFile = null;
    document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('selected'));
  }

  async function createNewFile() {
    const name = prompt('File name:');
    if (!name) return;
    
    try {
      await apiRequest('/files/write', {
        method: 'POST',
        body: JSON.stringify({ path: name, content: '' })
      });
      loadFilesTree();
      showToast('Created', 'File created', 'success');
    } catch (e) {
      showToast('Error', e.message, 'error');
    }
  }

  async function createNewFolder() {
    const name = prompt('Folder name:');
    if (!name) return;
    
    try {
      await apiRequest('/files/mkdir', {
        method: 'POST',
        body: JSON.stringify({ path: name })
      });
      loadFilesTree();
      showToast('Created', 'Folder created', 'success');
    } catch (e) {
      showToast('Error', e.message, 'error');
    }
  }

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    for (const file of files) {
      // Would need multipart upload implementation
      console.log('Upload:', file.name);
    }
    e.target.value = '';
  }

  // Tools
  function renderTools(filter = '') {
    if (!els.toolsGrid) return;
    
    const tools = [
      { id: 'nmap', name: 'Nmap', desc: 'Network discovery and security auditing', category: 'Recon', tags: ['scan', 'network', 'ports'] },
      { id: 'masscan', name: 'Masscan', desc: 'Fastest Internet port scanner', category: 'Recon', tags: ['scan', 'fast', 'ports'] },
      { id: 'subfinder', name: 'Subfinder', desc: 'Subdomain enumeration tool', category: 'Recon', tags: ['subdomain', 'dns', 'enum'] },
      { id: 'amass', name: 'Amass', desc: 'In-depth attack surface mapping', category: 'Recon', tags: ['enum', 'graph', 'intel'] },
      { id: 'httpx', name: 'HTTPX', desc: 'Fast and multi-purpose HTTP toolkit', category: 'Recon', tags: ['http', 'probe', 'tech'] },
      { id: 'nuclei', name: 'Nuclei', desc: 'Fast vulnerability scanner with templates', category: 'Vuln', tags: ['scan', 'cve', 'template'] },
      { id: 'nikto', name: 'Nikto', desc: 'Web server vulnerability scanner', category: 'Vuln', tags: ['web', 'scan', 'server'] },
      { id: 'sqlmap', name: 'SQLMap', desc: 'Automatic SQL injection tool', category: 'Vuln', tags: ['sqli', 'injection', 'database'] },
      { id: 'ffuf', name: 'FFUF', desc: 'Fast web fuzzer', category: 'Web', tags: ['fuzz', 'dir', 'param'] },
      { id: 'gobuster', name: 'Gobuster', desc: 'Directory/file & DNS busting', category: 'Web', tags: ['dir', 'dns', 'fuzz'] },
      { id: 'dalfox', name: 'DalFox', desc: 'XSS scanner and parameter analyzer', category: 'Vuln', tags: ['xss', 'param', 'scan'] },
      { id: 'xsstrike', name: 'XSStrike', desc: 'Advanced XSS detection suite', category: 'Vuln', tags: ['xss', 'crawl', 'waf'] },
      { id: 'sqlmap', name: 'SQLMap', desc: 'Automatic SQL injection exploitation', category: 'Vuln', tags: ['sqli', 'exploit', 'database'] },
      { id: 'commix', name: 'Commix', desc: 'Command injection exploiter', category: 'Vuln', tags: ['rce', 'injection', 'cmd'] },
      { id: 'enum4linux', name: 'Enum4linux', desc: 'SMB enumeration tool', category: 'Network', tags: ['smb', 'enum', 'ad'] },
      { id: 'crackmapexec', name: 'CrackMapExec', desc: 'Post-exploitation for AD', category: 'Network', tags: ['ad', 'smb', 'post'] },
      { id: 'testssl', name: 'testssl.sh', desc: 'SSL/TLS configuration tester', category: 'Crypto', tags: ['ssl', 'tls', 'cert'] },
      { id: 'aws', name: 'AWS CLI', desc: 'Amazon Web Services CLI', category: 'Cloud', tags: ['aws', 'cloud', 's3'] },
      { id: 'kubectl', name: 'kubectl', desc: 'Kubernetes CLI', category: 'Cloud', tags: ['k8s', 'cluster', 'pod'] },
      { id: 'linpeas', name: 'LinPEAS', desc: 'Linux privilege escalation auditor', category: 'Post-Ex', tags: ['privesc', 'linux', 'audit'] },
      { id: 'pspy', name: 'pspy', desc: 'Monitor Linux processes without root', category: 'Post-Ex', tags: ['monitor', 'process', 'linux'] }
    ];
    
    if (!els.toolsGrid) return;
    
    els.toolsGrid.innerHTML = tools
      .filter(t => t.name.toLowerCase().includes(filter.toLowerCase()) || 
                    t.desc.toLowerCase().includes(filter.toLowerCase()) ||
                    t.category.toLowerCase().includes(filter.toLowerCase()) ||
                    t.tags.some(tag => tag.includes(filter.toLowerCase())))
      .map(tool => `
        <div class="tool-card" data-tool="${tool.id}" onclick="window.showToolDetail('${tool.id}')">
          <div class="tool-card-header">
            <div class="tool-icon"><i class="ph ph-${getToolIcon(tool.id)}"></i></div>
            <div class="tool-info">
              <h3>${tool.name}</h3>
              <p>${tool.desc}</p>
            </div>
          </div>
          <div class="tool-tags">
            <span class="tag">${tool.category}</span>
            ${tool.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
      `).join('');
  }

  function getToolIcon(id) {
    const icons = {
      nmap: 'radar',
      masscan: 'speedometer',
      subfinder: 'globe-network',
      amass: 'sitemap',
      httpx: 'globe-simple',
      nuclei: 'shield-check',
      nikto: 'magnifying-glass',
      sqlmap: 'database',
      ffuf: 'magnifying-glass-plus',
      gobuster: 'folder-open',
      dalfox: 'bug',
      xsstrike: 'bug-beetle',
      commix: 'terminal',
      enum4linux: 'network',
      crackmapexec: 'key',
      testssl: 'lock-key',
      aws: 'cloud',
      kubectl: 'cube',
      linpeas: 'arrow-up',
      pspy: 'eye'
    };
    return icons[id] || 'wrench';
  }

  function filterTools() {
    renderTools(els.toolsSearch?.value || '');
  }

  window.showToolDetail = function(toolId) {
    showToast('Tool', `${toolId} - Click to run in terminal`, 'info');
  }

  // Prompts
  function renderPromptsList(filter = '') {
    if (!els.promptsList) return;
    
    const prompts = [
      { id: 'SYSTEM', title: 'System Prompt', desc: 'Core NEXUS AI system instructions and capabilities' },
      { id: 'RECON_SUBDOMAIN', title: 'Subdomain Enumeration', desc: 'Comprehensive subdomain discovery strategy' },
      { id: 'RECON_INFRASTRUCTURE', title: 'Infrastructure Mapping', desc: 'Map target infrastructure, hosting, CDN, cloud assets' },
      { id: 'WEB_VULN_SCAN', title: 'Web Vulnerability Assessment', desc: 'OWASP Top 10 + advanced web vulnerability testing' },
      { id: 'API_SECURITY', title: 'API Security Testing', desc: 'REST/GraphQL/gRPC API security assessment' },
      { id: 'NETWORK_ATTACK', title: 'Network Penetration Testing', desc: 'Internal/external network assessment methodology' },
      { id: 'OSINT_PERSON', title: 'Person/Entity OSINT', desc: 'Comprehensive intelligence on individuals/organizations' },
      { id: 'REPORT_WRITING', title: 'Professional Report Writing', desc: 'Bug bounty and pentest report templates' },
      { id: 'TERMINAL_GUIDE', title: 'Terminal Usage Guide', desc: 'Available tools and best practices' },
      { id: 'BUG_BOUNTY_WORKFLOW', title: 'Bug Bounty Workflow', desc: 'End-to-end bug bounty hunting methodology' },
      { id: 'RED_TEAM', title: 'Red Team Operations', desc: 'APT simulation with MITRE ATT&CK framework' },
      { id: 'CTF_GUIDE', title: 'CTF Challenge Solving', desc: 'Category-specific solving strategies' },
      { id: 'VULN_RESEARCH', title: 'Vulnerability Research', desc: 'Code audit, fuzzing, root cause analysis' },
      { id: 'TOOL_CHEATSHEET', title: 'Tool Cheatsheet', desc: 'Essential commands for all categories' }
    ];
    
    const filtered = prompts.filter(p => 
      p.title.toLowerCase().includes(filter.toLowerCase()) ||
      p.desc.toLowerCase().includes(filter.toLowerCase())
    );
    
    if (!els.promptsList) return;
    els.promptsList.innerHTML = filtered.map(p => `
      <div class="prompt-item ${state.selectedPrompt === p.id ? 'active' : ''}" 
           data-prompt="${p.id}" onclick="window.selectPrompt('${p.id}')">
        <div class="prompt-item-title">${p.title}</div>
        <div class="prompt-item-desc">${p.desc}</div>
      </div>
    `).join('');
  }

  function filterPrompts() {
    renderPromptsList(els.promptsSearch?.value || '');
  }

  window.selectPrompt = function(id) {
    state.selectedPrompt = id;
    document.querySelectorAll('.prompt-item').forEach(el => {
      el.classList.toggle('active', el.dataset.prompt === id);
    });
    loadPromptDetail(id);
  };

  async function loadPromptDetail(id) {
    try {
      const data = await apiRequest(`/prompts/${id}`);
      if (data.content) {
        els.detailTitle.textContent = id;
        els.detailContent.textContent = data.content;
        els.promptDetail.hidden = false;
      }
    } catch (e) {
      console.error('Load prompt detail error:', e);
    }
  }

  function closePromptDetail() {
    els.promptDetail.hidden = true;
    state.selectedPrompt = null;
    document.querySelectorAll('.prompt-item').forEach(el => el.classList.remove('active'));
  }

  function useSelectedPrompt() {
    if (state.selectedPrompt) {
      loadPrompt(state.selectedPrompt);
      closePromptDetail();
    }
  }

  // History
  function renderHistory() {
    if (!els.historyList) return;
    
    els.historyList.innerHTML = state.terminalHistory
      .slice(-50)
      .reverse()
      .map((cmd, index) => `
        <div class="history-item" data-cmd="${escapeHtml(cmd)}" onclick="window.useHistoryCommand('${escapeHtml(cmd).replace(/'/g, "\\'")}')">
          <span class="cmd">${escapeHtml(cmd)}</span>
          <span class="time">${new Date(Date.now() - index * 1000).toLocaleTimeString()}</span>
          <span class="status success"></span>
        </div>
      `).join('');
  }

  window.useHistoryCommand = function(cmd) {
    if (els.terminalInput) {
      els.terminalInput.value = cmd;
      els.terminalInput.focus();
    }
  };

  function clearHistory() {
    state.terminalHistory = [];
    renderHistory();
    showToast('Cleared', 'History cleared', 'success');
  }

  function exportHistory() {
    const blob = new Blob([state.terminalHistory.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-history-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Sessions
  function renderSessions() {
    if (!els.sessionsList) return;
    
    const newSessionBtn = els.sessionsList.querySelector('.new-session');
    els.sessionsList.innerHTML = '';
    if (newSessionBtn) els.sessionsList.appendChild(newSessionBtn);
    
    state.sessions.forEach(session => {
      const div = document.createElement('div');
      div.className = `session-item ${session.id === state.currentSessionId ? 'active' : ''}`;
      div.dataset.sessionId = session.id;
      div.innerHTML = `
        <div class="session-info">
          <div class="session-title">${escapeHtml(session.title || 'Untitled')}</div>
          <div class="session-meta">${new Date(session.updated || session.created).toLocaleString()}</div>
        </div>
      `;
      div.addEventListener('click', () => switchSession(session.id));
      els.sessionsList.appendChild(div);
    });
  }

  function newSession() {
    const id = generateId();
    const session = {
      id,
      title: 'New Session',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      messages: []
    };
    state.sessions.unshift(session);
    state.currentSessionId = id;
    saveSessions();
    renderSessions();
    newSession(); // Reset chat
  }

  function switchSession(id) {
    state.currentSessionId = id;
    const session = state.sessions.find(s => s.id === id);
    if (session) {
      state.chatMessages = session.messages || [];
      renderChatMessages();
      renderSessions();
    }
  }

  function saveSessions() {
    localStorage.setItem('nexus_sessions', JSON.stringify(state.sessions));
  }

  function renderChatMessages() {
    if (!els.chatMessages) return;
    els.chatMessages.innerHTML = '';
    if (state.chatMessages.length === 0) {
      if (els.welcomeMessage) els.welcomeMessage.style.display = 'flex';
    } else {
      if (els.welcomeMessage) els.welcomeMessage.style.display = 'none';
      state.chatMessages.forEach(m => renderMessage(m));
    }
    scrollToBottom();
  }

  // View/Pane Switching
  function switchView(viewName) {
    state.currentView = viewName;
    
    document.querySelectorAll('.view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${viewName}`);
    });
    
    els.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
      item.setAttribute('aria-current', item.dataset.view === viewName ? 'page' : 'false');
    });
    
    els.mobileNavBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    
    closeSidebar();
    
    // Load view-specific data
    if (viewName === 'files') loadFilesTree();
    if (viewName === 'history') renderHistory();
    if (viewName === 'tools') renderTools();
    if (viewName === 'prompts') renderPromptsList();
  }

  function switchPane(paneName) {
    document.querySelectorAll('.pane-tab, .drawer-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.pane === paneName);
      btn.setAttribute('aria-selected', btn.dataset.pane === paneName);
    });
    document.querySelectorAll('.pane-tab-content').forEach(panel => {
      panel.classList.toggle('active', panel.id === `pane-${paneName}`);
    });
  }

  function toggleRightPane(forceOpen) {
    if (typeof forceOpen === 'boolean') {
      state.rightPaneOpen = forceOpen;
    } else {
      state.rightPaneOpen = !state.rightPaneOpen;
    }
    els.rightPane.classList.toggle('open', state.rightPaneOpen);
    // Use sidebar overlay for drawer backdrop on mobile
    if (els.sidebarOverlay) {
      els.sidebarOverlay.classList.toggle('active', state.rightPaneOpen);
    }
  }

  // Sidebar
  function toggleSidebar() {
    els.sessionsSidebar.classList.toggle('open');
    els.sidebarOverlay.classList.toggle('active');
  }

  function closeSidebar() {
    els.sessionsSidebar.classList.remove('open');
    els.sidebarOverlay.classList.remove('active');
  }

  // Modal
  function showModal(title, body, footer = '') {
    els.modalTitle.textContent = title;
    els.modalBody.innerHTML = body;
    els.modalFooter.innerHTML = footer;
    els.modalOverlay.classList.add('active');
    els.modalOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    els.modalOverlay.classList.remove('active');
    els.modalOverlay.setAttribute('aria-hidden', 'true');
  }

  // Settings Modal
  function openSettings() {
    loadSettings();
    els.settingsOverlay.classList.add('active');
    els.settingsOverlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      const firstInput = els.settingsOverlay.querySelector('input, select, textarea');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  function closeSettings() {
    els.settingsOverlay.classList.remove('active');
    els.settingsOverlay.setAttribute('aria-hidden', 'true');
  }

  function switchSettingsTab(tabName) {
    document.querySelectorAll('#settingsTabs .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
      btn.setAttribute('aria-selected', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.settings-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${tabName}`);
    });
  }

  // Settings persistence
  const SETTINGS_KEY = 'nexus_ai_settings';
  const DEFAULT_SETTINGS = {
    autoConnect: true, reconnectEnabled: true, connectionTimeout: 30,
    streamResponses: true, showTimestamps: true, autoScroll: true, enterToSend: true, saveHistory: true, maxHistory: 100,
    theme: 'dark', fontSize: 14, compactMode: false, showAvatars: true,
    provider: 'nvidia', baseUrl: 'https://integrate.api.nvidia.com/v1', model: 'nvidia/nemotron-3.5-bolt-e4b', apiKey: '',
    temperature: 0.7, maxTokens: 4096, topP: 1.0, systemPrompt: '',
    defaultShell: 'bash', cmdTimeout: 300, maxOutputLines: 10000, scrollbackBuffer: 5000,
    termReconnect: true, termBell: false, copyOnSelect: true,
    ctrlCInterrupt: true, tabCompletion: true, altClickMove: true,
    termFontFamily: 'jetbrains', termFontSize: 13, termLineHeight: 1.6,
    cursorBlink: true, cursorStyle: 'block',
    autoSaveSession: true, maxSessions: 50, autoLoadSession: false, includeTerminalOutput: true,
    storeLocally: true, encryptStorage: false, anonymousStats: false,
    featTerminal: true, featFiles: true, featNetwork: true, featWeb: true, featCrypto: true, featCloud: true, featK8s: true,
    debugMode: false, logLevel: 'info', showLogs: false, perfMonitor: false,
    backupInterval: 24, maxBackups: 10
  };

  function loadSettings() {
    try {
      const saved = localStorage.getItem('nexus_ai_settings');
      const settings = saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
      applySettings(settings);
    } catch (e) {
      console.error('Load settings error:', e);
      applySettings(DEFAULT_SETTINGS);
    }
  }

  // Helper to safely set element values
  const setEl = (el, prop, value) => { if (el) el[prop] = value; };
  const setChecked = (el, value) => { if (el) el.checked = value; };
  const setValue = (el, value) => { if (el) el.value = value; };
  const setText = (el, value) => { if (el) el.textContent = value; };

  function applySettings(settings) {
    // Connection
    setChecked(els.autoConnect, settings.autoConnect);
    setChecked(els.reconnectEnabled, settings.reconnectEnabled);
    setValue(els.connectionTimeout, settings.connectionTimeout);
    // Chat
    setChecked(els.streamResponses, settings.streamResponses);
    setChecked(els.showTimestamps, settings.showTimestamps);
    setChecked(els.autoScroll, settings.autoScroll);
    setChecked(els.enterToSend, settings.enterToSend);
    setChecked(els.saveHistory, settings.saveHistory);
    setValue(els.maxHistory, settings.maxHistory);
    // Appearance
    setValue(els.themeSelect, settings.theme);
    setValue(els.fontSizeSelect, settings.fontSize);
    setChecked(els.compactMode, settings.compactMode);
    setChecked(els.showAvatars, settings.showAvatars);
    // AI Model
    setValue(els.providerSelect, settings.provider);
    setValue(els.baseUrlInput, settings.baseUrl);
    setValue(els.modelInput, settings.model);
    setValue(els.apiKeyInput, settings.apiKey);
    setValue(els.temperatureInput, settings.temperature);
    setText(els.temperatureValue, settings.temperature);
    setValue(els.maxTokensInput, settings.maxTokens);
    setValue(els.topPInput, settings.topP);
    setText(els.topPValue, settings.topP.toFixed(1));
    setValue(els.systemPromptInput, settings.systemPrompt);
    // Terminal
    setValue(els.defaultShell, settings.defaultShell);
    setValue(els.cmdTimeout, settings.cmdTimeout);
    setValue(els.maxOutputLines, settings.maxOutputLines);
    setValue(els.scrollbackBuffer, settings.scrollbackBuffer);
    setChecked(els.termReconnect, settings.termReconnect);
    setChecked(els.termBell, settings.termBell);
    setChecked(els.copyOnSelect, settings.copyOnSelect);
    setChecked(els.ctrlCInterrupt, settings.ctrlCInterrupt);
    setChecked(els.tabCompletion, settings.tabCompletion);
    setChecked(els.altClickMove, settings.altClickMove);
    setValue(els.termFontFamily, settings.termFontFamily);
    setValue(els.termFontSize, settings.termFontSize);
    setValue(els.termLineHeight, settings.termLineHeight);
    setText(els.termLineHeightValue, settings.termLineHeight);
    setChecked(els.cursorBlink, settings.cursorBlink);
    setValue(els.cursorStyle, settings.cursorStyle);
    // Session
    setChecked(els.autoSaveSession, settings.autoSaveSession);
    setValue(els.maxSessions, settings.maxSessions);
    setChecked(els.autoLoadSession, settings.autoLoadSession);
    setChecked(els.includeTerminalOutput, settings.includeTerminalOutput);
    setChecked(els.storeLocally, settings.storeLocally);
    setChecked(els.encryptStorage, settings.encryptStorage);
    setChecked(els.anonymousStats, settings.anonymousStats);
    // Advanced
    setChecked(els.featTerminal, settings.featTerminal);
    setChecked(els.featFiles, settings.featFiles);
    setChecked(els.featNetwork, settings.featNetwork);
    setChecked(els.featWeb, settings.featWeb);
    setChecked(els.featCrypto, settings.featCrypto);
    setChecked(els.featCloud, settings.featCloud);
    setChecked(els.featK8s, settings.featK8s);
    setChecked(els.debugMode, settings.debugMode);
    setValue(els.logLevel, settings.logLevel);
    setChecked(els.showLogs, settings.showLogs);
    setChecked(els.perfMonitor, settings.perfMonitor);
    setValue(els.backupInterval, settings.backupInterval);
    setValue(els.maxBackups, settings.maxBackups);
    
    applyTheme(settings.theme);
    applyFontSize(settings.fontSize);
  }

  function getCurrentSettings() {
    return {
      autoConnect: els.autoConnect?.checked, reconnectEnabled: els.reconnectEnabled?.checked,
      connectionTimeout: parseInt(els.connectionTimeout?.value) || 30,
      streamResponses: els.streamResponses?.checked, showTimestamps: els.showTimestamps?.checked,
      autoScroll: els.autoScroll?.checked, enterToSend: els.enterToSend?.checked,
      saveHistory: els.saveHistory?.checked, maxHistory: parseInt(els.maxHistory?.value) || 100,
      theme: els.themeSelect?.value, fontSize: parseInt(els.fontSizeSelect?.value),
      compactMode: els.compactMode?.checked, showAvatars: els.showAvatars?.checked,
      provider: els.providerSelect?.value, baseUrl: els.baseUrlInput?.value,
      model: els.modelInput?.value, apiKey: els.apiKeyInput?.value,
      temperature: parseFloat(els.temperatureInput?.value) || 0.7,
      maxTokens: parseInt(els.maxTokensInput?.value) || 4096,
      topP: parseFloat(els.topPInput?.value) || 1.0,
      systemPrompt: els.systemPromptInput?.value,
      defaultShell: els.defaultShell?.value, cmdTimeout: parseInt(els.cmdTimeout?.value) || 300,
      maxOutputLines: parseInt(els.maxOutputLines?.value) || 10000,
      scrollbackBuffer: parseInt(els.scrollbackBuffer?.value) || 5000,
      termReconnect: els.termReconnect?.checked, termBell: els.termBell?.checked,
      copyOnSelect: els.copyOnSelect?.checked, ctrlCInterrupt: els.ctrlCInterrupt?.checked,
      tabCompletion: els.tabCompletion?.checked, altClickMove: els.altClickMove?.checked,
      termFontFamily: els.termFontFamily?.value, termFontSize: parseInt(els.termFontSize?.value) || 13,
      termLineHeight: parseFloat(els.termLineHeight?.value) || 1.6,
      cursorBlink: els.cursorBlink?.checked, cursorStyle: els.cursorStyle?.value,
      autoSaveSession: els.autoSaveSession?.checked, maxSessions: parseInt(els.maxSessions?.value) || 50,
      autoLoadSession: els.autoLoadSession?.checked, includeTerminalOutput: els.includeTerminalOutput?.checked,
      storeLocally: els.storeLocally?.checked, encryptStorage: els.encryptStorage?.checked,
      anonymousStats: els.anonymousStats?.checked,
      featTerminal: els.featTerminal?.checked, featFiles: els.featFiles?.checked,
      featNetwork: els.featNetwork?.checked, featWeb: els.featWeb?.checked,
      featCrypto: els.featCrypto?.checked, featCloud: els.featCloud?.checked,
      featK8s: els.featK8s?.checked, debugMode: els.debugMode?.checked,
      logLevel: els.logLevel?.value, showLogs: els.showLogs?.checked,
      perfMonitor: els.perfMonitor?.checked, backupInterval: parseInt(els.backupInterval?.value) || 24,
      maxBackups: parseInt(els.maxBackups?.value) || 10
    };
  }

  function saveSettings() {
    try {
      const settings = getCurrentSettings();
      localStorage.setItem('nexus_ai_settings', JSON.stringify(settings));
      applySettings(settings);
      closeSettings();
      showToast('Settings saved', 'Your preferences have been saved', 'success');
    } catch (e) {
      console.error('Save settings error:', e);
      showToast('Error', 'Failed to save settings', 'error');
    }
  }

  function resetSettings() {
    if (confirm('Reset all settings to defaults?')) {
      localStorage.removeItem('nexus_ai_settings');
      applySettings(DEFAULT_SETTINGS);
      showToast('Settings reset', 'All settings restored to defaults', 'success');
    }
  }

  function factoryReset() {
    if (confirm('WARNING: This will delete ALL data including settings, history, sessions, and files. This cannot be undone. Continue?')) {
      if (confirm('Are you absolutely sure? This action cannot be undone!')) {
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
      }
    }
  }

  // Settings action handlers
  function resetSystemPrompt() {
    if (confirm('Reset system prompt to default?')) {
      if (els.systemPromptInput) els.systemPromptInput.value = '';
      showToast('System prompt reset', 'Default prompt will be used', 'success');
    }
  }

  async function testConnection() {
    if (!els.apiKeyInput?.value) {
      showToast('No API key', 'Please enter an API key first', 'warning');
      return;
    }
    
    els.testConnection.disabled = true;
    els.testConnection.innerHTML = '<i class="ph ph-spinner"></i> Testing...';
    
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      if (data.status === 'ok') {
        showToast('Connection OK', 'Backend is reachable', 'success');
      } else {
        showToast('Connection issue', 'Backend returned: ' + data.status, 'warning');
      }
    } catch (e) {
      showToast('Connection failed', e.message, 'error');
    } finally {
      els.testConnection.disabled = false;
      els.testConnection.innerHTML = '<i class="ph ph-wifi-high"></i> Test Connection';
    }
  }

  async function loadDefaultPrompt() {
    try {
      const data = await apiRequest('/prompts/SYSTEM');
      if (data.content) {
        if (els.systemPromptInput) els.systemPromptInput.value = data.content;
        showToast('Default prompt loaded', 'System prompt updated', 'success');
      }
    } catch (e) {
      showToast('Error', 'Failed to load default prompt', 'error');
    }
  }

  function exportSession() {
    const sessionData = {
      sessionId: state.sessionId,
      started: state.sessionStarted,
      messages: state.chatMessages,
      history: state.commandHistory,
      timestamp: Date.now()
    };
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `nexus-session-${Date.now()}.json`);
    showToast('Session exported', 'Session data downloaded', 'success');
  }

  function clearSession() {
    if (confirm('Clear current session? This will clear chat messages and command history.')) {
      state.chatMessages = [];
      state.commandHistory = [];
      if (els.chatMessages) els.chatMessages.innerHTML = '';
      renderHistory();
      showToast('Session cleared', 'Current session data cleared', 'success');
    }
  }

  function viewSessions() {
    showToast('Coming soon', 'Session manager will be available soon', 'info');
  }

  function clearAllSessions() {
    if (confirm('Clear all session history? This cannot be undone.')) {
      localStorage.removeItem('nexus_sessions');
      state.commandHistory = [];
      renderHistory();
      showToast('History cleared', 'All session history removed', 'success');
    }
  }

  function wipeAllData() {
    factoryReset();
  }

  function exportAllData() {
    const allData = {
      settings: getCurrentSettings(),
      sessions: JSON.parse(localStorage.getItem('nexus_sessions') || '[]'),
      chatHistory: state.chatHistory,
      commandHistory: state.commandHistory,
      files: state.filesTree,
      timestamp: Date.now(),
      version: '2.0.0'
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `nexus-backup-${Date.now()}.json`);
    showToast('Data exported', 'All data downloaded', 'success');
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.settings) {
          localStorage.setItem('nexus_ai_settings', JSON.stringify(data.settings));
          applySettings(data.settings);
        }
        if (data.sessions) {
          localStorage.setItem('nexus_sessions', JSON.stringify(data.sessions));
        }
        if (data.chatHistory) state.chatHistory = data.chatHistory;
        if (data.commandHistory) state.commandHistory = data.commandHistory;
        if (data.files) state.filesTree = data.filesTree;
        showToast('Data imported', 'Settings and data restored', 'success');
        setTimeout(() => location.reload(), 1000);
      } catch (e) {
        showToast('Import failed', 'Invalid backup file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function resetSettings() {
    if (confirm('Reset all settings to defaults?')) {
      localStorage.removeItem('nexus_ai_settings');
      applySettings(DEFAULT_SETTINGS);
      showToast('Settings reset', 'All settings restored to defaults', 'success');
    }
  }

  function factoryReset() {
    if (confirm('WARNING: This will delete ALL data including settings, history, sessions, and files. This cannot be undone. Continue?')) {
      if (confirm('Are you absolutely sure? This action cannot be undone!')) {
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
      }
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Theme and font size application
  function applyTheme(theme) {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  function applyFontSize(size) {
    document.documentElement.style.fontSize = size + 'px';
  }

  // Update connection status in both sidebar and chat header
  function updateConnectionStatus(connected) {
    const status = connected ? 'connected' : 'disconnected';
    const text = connected ? 'Connected' : 'Disconnected';
    
    els.statusDot.className = 'status-dot ' + status;
    els.statusText.textContent = text;
    
    if (els.chatStatusDot) {
      els.chatStatusDot.className = 'status-dot ' + status;
      els.chatStatusText.textContent = text;
    }
  }

  function showStatus(status, text) {
    state.isConnected = status === 'connected';
    updateConnectionStatus(state.isConnected);
    els.statusText.textContent = text;
    if (els.chatStatusText) els.chatStatusText.textContent = text;
  }

  function updateModelInfo() {
    if (els.modelName) els.modelName.textContent = state.modelName;
    if (els.chatModelBadge) els.chatModelBadge.textContent = state.modelName;
  }

  // Utility Functions
  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function handleGlobalKeydown(e) {
    // Ctrl/Cmd + K for command palette
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
    }
    
    // Ctrl/Cmd + , for settings
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault();
      openSettings();
    }
    
    // Escape to close modal/sidebar
    if (e.key === 'Escape') {
      closeModal();
      closeSidebar();
      closeFileEditor();
      closePromptDetail();
      closeSettings();
      if (state.rightPaneOpen) toggleRightPane();
    }
    
    // Ctrl/Cmd + Enter to send message
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && document.activeElement === els.chatInput) {
      sendMessage();
    }
  }

  // Expose functions globally for onclick handlers
  window.selectPrompt = window.selectPrompt;
  window.useHistoryCommand = window.useHistoryCommand;
  window.showToolDetail = window.showToolDetail;
  window.switchView = switchView;
  window.openSettings = openSettings;
  window.toggleRightPane = toggleRightPane;

})();