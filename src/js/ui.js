/**
 * UI Manager Class
 * Handles UI interactions and events
 */
class UIManager {
  constructor() {
    this.contextMenu = null;
    this.settingsModal = null;
    this.initialized = false;
    
    // Bind methods
    this.init = this.init.bind(this);
    this.setupToolbarHandlers = this.setupToolbarHandlers.bind(this);
    this.setupContextMenu = this.setupContextMenu.bind(this);
    this.setupSettingsModal = this.setupSettingsModal.bind(this);
    this.setupResizeHandlers = this.setupResizeHandlers.bind(this);
    this.showContextMenu = this.showContextMenu.bind(this);
    this.hideContextMenu = this.hideContextMenu.bind(this);
    this.showSettingsModal = this.showSettingsModal.bind(this);
    this.hideSettingsModal = this.hideSettingsModal.bind(this);
    this.populateSettingsForm = this.populateSettingsForm.bind(this);
    this.saveSettings = this.saveSettings.bind(this);
    this.toggleTheme = this.toggleTheme.bind(this);
  }

  /**
   * Initialize the UI manager
   */
  init() {
    if (this.initialized) return;
    
    this.contextMenu = document.getElementById('context-menu');
    this.settingsModal = document.getElementById('settings-modal');
    
    this.setupToolbarHandlers();
    this.setupContextMenu();
    this.setupSettingsModal();
    this.setupResizeHandlers();
    
    // Apply theme from settings
    window.api.getSettings().then(settings => {
      document.documentElement.className = `theme-${settings.appearance.theme}`;
    });
    
    this.initialized = true;
  }

  /**
   * Set up toolbar button event handlers
   */
  setupToolbarHandlers() {
    // New tab button
    document.getElementById('new-tab-btn').addEventListener('click', () => {
      window.terminalManager.createTerminal();
    });
    
    // New tab button (in tabs bar)
    document.getElementById('new-tab-button').addEventListener('click', () => {
      window.terminalManager.createTerminal();
    });
    
    // Settings button
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.showSettingsModal();
    });
    
    // Search button
    document.getElementById('search-btn').addEventListener('click', () => {
      window.terminalManager.findInActiveTerminal();
    });
    
    // Clear button
    document.getElementById('clear-btn').addEventListener('click', () => {
      window.terminalManager.clearActiveTerminal();
    });
    
    // Theme toggle button
    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
      this.toggleTheme();
    });
  }

  /**
   * Set up context menu
   */
  setupContextMenu() {
    // Show context menu on right-click
    const terminalsContainer = document.getElementById('terminals-container');
    terminalsContainer.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e.clientX, e.clientY);
    });
    
    // Hide context menu on click outside
    document.addEventListener('click', () => {
      this.hideContextMenu();
    });
    
    // Context menu item actions
    this.contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        
        switch (action) {
          case 'copy':
            // Use the browser's copy functionality
            document.execCommand('copy');
            break;
            
          case 'paste':
            // Read from clipboard and send to terminal
            navigator.clipboard.readText()
              .then(text => {
                if (window.terminalManager.activeTerminalId) {
                  window.api.sendTerminalInput(
                    window.terminalManager.activeTerminalId, 
                    text
                  );
                }
              })
              .catch(err => {
                console.error('Failed to read clipboard contents:', err);
              });
            break;
            
          case 'search':
            window.terminalManager.findInActiveTerminal();
            break;
            
          case 'clear':
            window.terminalManager.clearActiveTerminal();
            break;
            
          case 'settings':
            this.showSettingsModal();
            break;
        }
        
        this.hideContextMenu();
      });
    });
  }

  /**
   * Set up settings modal
   */
  setupSettingsModal() {
    // Settings buttons
    document.getElementById('settings-close-btn').addEventListener('click', () => {
      this.hideSettingsModal();
    });
    
    document.getElementById('settings-cancel-btn').addEventListener('click', () => {
      this.hideSettingsModal();
    });
    
    document.getElementById('settings-save-btn').addEventListener('click', () => {
      this.saveSettings();
      this.hideSettingsModal();
    });
    
    // Close modal when clicking outside
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) {
        this.hideSettingsModal();
      }
    });
    
    // Handle ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideSettingsModal();
        this.hideContextMenu();
        
        // Hide search panel
        const searchPanel = document.getElementById('search-panel');
        searchPanel.classList.remove('show');
      }
    });
  }

  /**
   * Set up resize handlers
   */
  setupResizeHandlers() {
    // Handle window resize
    window.addEventListener('resize', () => {
      window.terminalManager.resizeActiveTerminal();
    });
    
    // Handle terminal container resize with ResizeObserver
    const terminalsContainer = document.getElementById('terminals-container');
    const resizeObserver = new ResizeObserver(() => {
      window.terminalManager.resizeActiveTerminal();
    });
    resizeObserver.observe(terminalsContainer);
  }

  /**
   * Show context menu at coordinates
   */
  showContextMenu(x, y) {
    // Position the menu
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    
    // Show the menu
    this.contextMenu.classList.add('show');
    
    // Ensure menu stays within viewport
    const rect = this.contextMenu.getBoundingClientRect();
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    
    if (rect.right > winWidth) {
      this.contextMenu.style.left = `${winWidth - rect.width - 5}px`;
    }
    
    if (rect.bottom > winHeight) {
      this.contextMenu.style.top = `${winHeight - rect.height - 5}px`;
    }
  }

  /**
   * Hide context menu
   */
  hideContextMenu() {
    this.contextMenu.classList.remove('show');
  }

  /**
   * Show settings modal
   */
  showSettingsModal() {
    // Populate form with current settings
    this.populateSettingsForm();
    
    // Show the modal
    this.settingsModal.classList.add('show');
  }

  /**
   * Hide settings modal
   */
  hideSettingsModal() {
    this.settingsModal.classList.remove('show');
  }

  /**
   * Populate settings form with current settings
   */
  async populateSettingsForm() {
    const settings = await window.api.getSettings();
    
    // Appearance settings
    document.getElementById('font-family').value = settings.appearance.fontFamily;
    document.getElementById('font-size').value = settings.appearance.fontSize;
    document.getElementById('cursor-style').value = settings.appearance.cursorStyle;
    document.getElementById('cursor-blink').checked = settings.appearance.cursorBlink;
    
    // Terminal settings
    document.getElementById('scrollback').value = settings.terminal.scrollback;
    document.getElementById('line-height-auto').checked = settings.terminal.autoLineHeight;
    document.getElementById('enable-bell').checked = settings.terminal.enableBell;
  }

  /**
   * Save settings from form
   */
  saveSettings() {
    const settings = {
      appearance: {
        fontFamily: document.getElementById('font-family').value,
        fontSize: parseInt(document.getElementById('font-size').value, 10),
        cursorStyle: document.getElementById('cursor-style').value,
        cursorBlink: document.getElementById('cursor-blink').checked,
        theme: document.documentElement.className.includes('theme-dark') ? 'dark' : 'light'
      },
      terminal: {
        scrollback: parseInt(document.getElementById('scrollback').value, 10),
        autoLineHeight: document.getElementById('line-height-auto').checked,
        enableBell: document.getElementById('enable-bell').checked
      }
    };
    
    window.terminalManager.updateTerminalSettings(settings);
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const currentTheme = document.documentElement.className.includes('theme-dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Update the document class
    document.documentElement.className = `theme-${newTheme}`;
    
    // Update the settings
    window.api.getSettings().then(settings => {
      settings.appearance.theme = newTheme;
      window.api.setSettings(settings);
      
      // Update terminal themes
      window.terminalManager.applyTheme(newTheme);
    });
  }
}

// Create a global instance
window.uiManager = new UIManager();
