/**
 * Terminal Manager Class
 * Handles terminal creation, configuration, and management
 */
class TerminalManager {
  constructor() {
    this.terminals = {};
    this.activeTerminalId = null;
    this.settings = null;
    this.initialized = false;
    
    // Terminal themes
    this.themes = {
      dark: {
        background: '#1e1e1e',
        foreground: '#f0f0f0',
        black: '#000000',
        red: '#e74c3c',
        green: '#2ecc71',
        yellow: '#f1c40f',
        blue: '#3498db',
        magenta: '#9b59b6',
        cyan: '#1abc9c',
        white: '#ecf0f1',
        brightBlack: '#95a5a6',
        brightRed: '#e74c3c',
        brightGreen: '#2ecc71',
        brightYellow: '#f1c40f',
        brightBlue: '#3498db',
        brightMagenta: '#9b59b6',
        brightCyan: '#1abc9c',
        brightWhite: '#ffffff'
      },
      light: {
        background: '#ffffff',
        foreground: '#333333',
        black: '#000000',
        red: '#c0392b',
        green: '#27ae60',
        yellow: '#f39c12',
        blue: '#2980b9',
        magenta: '#8e44ad',
        cyan: '#16a085',
        white: '#bdc3c7',
        brightBlack: '#7f8c8d',
        brightRed: '#e74c3c',
        brightGreen: '#2ecc71',
        brightYellow: '#f1c40f',
        brightBlue: '#3498db',
        brightMagenta: '#9b59b6',
        brightCyan: '#1abc9c',
        brightWhite: '#ecf0f1'
      }
    };

    // Bind methods
    this.init = this.init.bind(this);
    this.createTerminal = this.createTerminal.bind(this);
    this.setActiveTerminal = this.setActiveTerminal.bind(this);
    this.closeTerminal = this.closeTerminal.bind(this);
    this.resizeActiveTerminal = this.resizeActiveTerminal.bind(this);
    this.handleTerminalData = this.handleTerminalData.bind(this);
    this.handleTerminalExit = this.handleTerminalExit.bind(this);
    this.updateTerminalSettings = this.updateTerminalSettings.bind(this);
    this.updateAllTerminals = this.updateAllTerminals.bind(this);
    this.clearActiveTerminal = this.clearActiveTerminal.bind(this);
    this.findInActiveTerminal = this.findInActiveTerminal.bind(this);
    this.applyTheme = this.applyTheme.bind(this);
  }

  /**
   * Initialize the terminal manager
   */
  async init() {
    if (this.initialized) return;
    
    // Load settings
    this.settings = await window.api.getSettings();
    
    // Set up event listeners
    window.api.onTerminalData(this.handleTerminalData);
    window.api.onTerminalExit(this.handleTerminalExit);
    
    // Set up menu event handlers
    window.api.onMenuNewTerminal(() => {
      this.createTerminal();
    });
    
    window.api.onMenuClear(() => {
      this.clearActiveTerminal();
    });
    
    window.api.onMenuFind(() => {
      this.findInActiveTerminal();
    });
    
    window.api.onMenuToggleTheme(() => {
      const newTheme = this.settings.appearance.theme === 'dark' ? 'light' : 'dark';
      this.settings.appearance.theme = newTheme;
      this.applyTheme(newTheme);
      window.api.setSettings(this.settings);
    });
    
    window.api.onMenuNextTab(() => {
      const tabIds = Object.keys(this.terminals);
      if (tabIds.length <= 1) return;
      
      const currentIndex = tabIds.indexOf(this.activeTerminalId);
      const nextIndex = (currentIndex + 1) % tabIds.length;
      this.setActiveTerminal(tabIds[nextIndex]);
    });
    
    window.api.onMenuPrevTab(() => {
      const tabIds = Object.keys(this.terminals);
      if (tabIds.length <= 1) return;
      
      const currentIndex = tabIds.indexOf(this.activeTerminalId);
      const prevIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
      this.setActiveTerminal(tabIds[prevIndex]);
    });
    
    this.initialized = true;
    
    // Create the initial terminal
    return this.createTerminal();
  }

  /**
   * Create a new terminal instance
   */
  async createTerminal() {
    // Create a terminal container
    const terminalId = await window.api.createTerminal();
    const terminalContainer = document.createElement('div');
    terminalContainer.id = terminalId;
    terminalContainer.className = 'terminal-instance';
    document.getElementById('terminals-container').appendChild(terminalContainer);
    
    // Create the xterm.js instance
    const term = new Terminal({
      fontFamily: this.settings.appearance.fontFamily,
      fontSize: this.settings.appearance.fontSize,
      cursorStyle: this.settings.appearance.cursorStyle,
      cursorBlink: this.settings.appearance.cursorBlink,
      theme: this.themes[this.settings.appearance.theme],
      scrollback: this.settings.terminal.scrollback,
      allowTransparency: true,
      convertEol: true,
      disableStdin: false,
      allowProposedApi: true  // Enable proposed API
    });
    
    // Create addons
    const fitAddon = new FitAddon.FitAddon();
    const searchAddon = new SearchAddon.SearchAddon();
    const webLinksAddon = new WebLinksAddon.WebLinksAddon();
    const serializeAddon = new SerializeAddon.SerializeAddon();
    const unicode11Addon = new Unicode11Addon.Unicode11Addon();
    
    // Load addons
    term.loadAddon(fitAddon);
    term.loadAddon(searchAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(serializeAddon);
    term.loadAddon(unicode11Addon);
    
    // Open the terminal
    term.open(terminalContainer);
    
    // Store terminal information
    this.terminals[terminalId] = {
      id: terminalId,
      term,
      fitAddon,
      searchAddon,
      serializeAddon,
      title: 'PowerShell',
      createdAt: new Date()
    };
    
    // Set up terminal events
    term.onData(data => {
      window.api.sendTerminalInput(terminalId, data);
    });
    
    term.onTitleChange(title => {
      this.terminals[terminalId].title = title || 'PowerShell';
      if (terminalId === this.activeTerminalId) {
        this.updateTabTitle(terminalId, this.terminals[terminalId].title);
      }
    });
    
    term.onResize(({ cols, rows }) => {
      window.api.resizeTerminal(terminalId, cols, rows);
      
      if (terminalId === this.activeTerminalId) {
        document.getElementById('terminal-size').textContent = `${cols}×${rows}`;
      }
    });
    
    // Initial fit
    setTimeout(() => {
      fitAddon.fit();
      const { cols, rows } = term;
      window.api.resizeTerminal(terminalId, cols, rows);
    }, 100);
    
    // Set as active terminal
    this.setActiveTerminal(terminalId);
    
    // Create a tab for this terminal
    this.createTab(terminalId, 'PowerShell');
    
    return terminalId;
  }

  /**
   * Create a tab for a terminal
   */
  createTab(id, title) {
    const tabsContainer = document.getElementById('tabs');
    const newTabButton = document.getElementById('new-tab-button');
    
    const tab = document.createElement('div');
    tab.id = `tab-${id}`;
    tab.className = 'tab';
    tab.dataset.terminalId = id;
    tab.innerHTML = `
      <span class="tab-title">${title}</span>
      <span class="tab-close">×</span>
    `;
    
    // Insert before the new tab button
    tabsContainer.insertBefore(tab, newTabButton);
    
    // Add click event to activate this terminal
    tab.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-close')) {
        this.closeTerminal(id);
      } else {
        this.setActiveTerminal(id);
      }
    });
    
    return tab;
  }

  /**
   * Update a tab's title
   */
  updateTabTitle(id, title) {
    const tab = document.getElementById(`tab-${id}`);
    if (tab) {
      const titleElement = tab.querySelector('.tab-title');
      if (titleElement) {
        titleElement.textContent = title;
      }
    }
  }

  /**
   * Set the active terminal
   */
  setActiveTerminal(id) {
    if (!this.terminals[id]) return;
    
    // Deactivate the current terminal
    if (this.activeTerminalId && this.terminals[this.activeTerminalId]) {
      const currentTerminalContainer = document.getElementById(this.activeTerminalId);
      if (currentTerminalContainer) {
        currentTerminalContainer.classList.remove('active');
      }
      
      const currentTab = document.getElementById(`tab-${this.activeTerminalId}`);
      if (currentTab) {
        currentTab.classList.remove('active');
      }
    }
    
    // Activate the new terminal
    this.activeTerminalId = id;
    
    const terminalContainer = document.getElementById(id);
    if (terminalContainer) {
      terminalContainer.classList.add('active');
    }
    
    const tab = document.getElementById(`tab-${id}`);
    if (tab) {
      tab.classList.add('active');
      
      // Ensure the tab is visible by scrolling if necessary
      tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
    
    // Update status bar
    document.getElementById('terminal-info').textContent = this.terminals[id].title;
    
    const { cols, rows } = this.terminals[id].term;
    document.getElementById('terminal-size').textContent = `${cols}×${rows}`;
    
    // Focus the terminal
    this.terminals[id].term.focus();
    
    // Fit the terminal
    this.terminals[id].fitAddon.fit();
  }

  /**
   * Close a terminal
   */
  closeTerminal(id) {
    if (!this.terminals[id]) return;
    
    // Remove the terminal container
    const terminalContainer = document.getElementById(id);
    if (terminalContainer) {
      terminalContainer.remove();
    }
    
    // Remove the tab
    const tab = document.getElementById(`tab-${id}`);
    if (tab) {
      tab.remove();
    }
    
    // Notify the main process
    window.api.closeTerminal(id);
    
    // Clean up
    this.terminals[id].term.dispose();
    delete this.terminals[id];
    
    // If this was the active terminal, activate another one
    if (this.activeTerminalId === id) {
      const remainingIds = Object.keys(this.terminals);
      if (remainingIds.length > 0) {
        this.setActiveTerminal(remainingIds[0]);
      } else {
        // No terminals left, create a new one
        this.createTerminal();
      }
    }
  }

  /**
   * Resize the active terminal to fit its container
   */
  resizeActiveTerminal() {
    if (!this.activeTerminalId || !this.terminals[this.activeTerminalId]) return;
    
    const terminal = this.terminals[this.activeTerminalId];
    terminal.fitAddon.fit();
  }

  /**
   * Handle terminal data event
   */
  handleTerminalData({ id, data }) {
    if (!this.terminals[id]) return;
    
    this.terminals[id].term.write(data);
  }

  /**
   * Handle terminal exit event
   */
  handleTerminalExit({ id, exitCode, signal }) {
    if (!this.terminals[id]) return;
    
    // Display exit message
    const exitMessage = `\r\n\r\nTerminal exited (exit code: ${exitCode}${signal ? `, signal: ${signal}` : ''})\r\n`;
    this.terminals[id].term.write(exitMessage);
    
    // Disable input
    this.terminals[id].term.setOption('disableStdin', true);
    
    // Update tab title
    this.updateTabTitle(id, 'Closed');
    
    // Update terminals object
    this.terminals[id].exited = true;
  }

  /**
   * Update terminal settings
   */
  updateTerminalSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    window.api.setSettings(this.settings);
    this.updateAllTerminals();
  }

  /**
   * Update all terminals with current settings
   */
  updateAllTerminals() {
    Object.values(this.terminals).forEach(terminal => {
      const { term } = terminal;
      
      term.setOption('fontFamily', this.settings.appearance.fontFamily);
      term.setOption('fontSize', this.settings.appearance.fontSize);
      term.setOption('cursorStyle', this.settings.appearance.cursorStyle);
      term.setOption('cursorBlink', this.settings.appearance.cursorBlink);
      term.setOption('theme', this.themes[this.settings.appearance.theme]);
      term.setOption('scrollback', this.settings.terminal.scrollback);
      
      // Resize after settings change
      terminal.fitAddon.fit();
    });
  }

  /**
   * Clear the active terminal
   */
  clearActiveTerminal() {
    if (!this.activeTerminalId || !this.terminals[this.activeTerminalId]) return;
    
    this.terminals[this.activeTerminalId].term.clear();
  }

  /**
   * Show search panel for the active terminal
   */
  findInActiveTerminal() {
    if (!this.activeTerminalId || !this.terminals[this.activeTerminalId]) return;
    
    // Show search panel
    const searchPanel = document.getElementById('search-panel');
    searchPanel.classList.add('show');
    
    // Focus search input
    const searchInput = document.getElementById('search-input');
    searchInput.focus();
    
    // Set up search handlers if not already set
    if (!this._searchHandlersInitialized) {
      const searchPrevBtn = document.getElementById('search-prev-btn');
      const searchNextBtn = document.getElementById('search-next-btn');
      const searchCloseBtn = document.getElementById('search-close-btn');
      
      // Search as you type
      searchInput.addEventListener('input', () => {
        const query = searchInput.value;
        if (query) {
          this.terminals[this.activeTerminalId].searchAddon.findNext(query);
        }
      });
      
      // Previous match
      searchPrevBtn.addEventListener('click', () => {
        const query = searchInput.value;
        if (query) {
          this.terminals[this.activeTerminalId].searchAddon.findPrevious(query);
        }
      });
      
      // Next match
      searchNextBtn.addEventListener('click', () => {
        const query = searchInput.value;
        if (query) {
          this.terminals[this.activeTerminalId].searchAddon.findNext(query);
        }
      });
      
      // Close search
      searchCloseBtn.addEventListener('click', () => {
        searchPanel.classList.remove('show');
        this.terminals[this.activeTerminalId].term.focus();
      });
      
      // Enter key behavior
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const query = searchInput.value;
          if (query) {
            if (e.shiftKey) {
              this.terminals[this.activeTerminalId].searchAddon.findPrevious(query);
            } else {
              this.terminals[this.activeTerminalId].searchAddon.findNext(query);
            }
          }
        } else if (e.key === 'Escape') {
          searchPanel.classList.remove('show');
          this.terminals[this.activeTerminalId].term.focus();
        }
      });
      
      this._searchHandlersInitialized = true;
    }
  }

  /**
   * Apply theme to the application
   */
  applyTheme(theme) {
    document.documentElement.className = `theme-${theme}`;
    
    // Update terminal themes
    Object.values(this.terminals).forEach(terminal => {
      terminal.term.setOption('theme', this.themes[theme]);
    });
  }
}

// Create a global instance
window.terminalManager = new TerminalManager();
