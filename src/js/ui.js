/**
 * UI Manager Class
 * Handles UI interactions and events
 */
class UIManager {
  constructor() {
    this.contextMenu = null;
    this.settingsModal = null;
    this.activeMenu = null;
    this.initialized = false;
    
    // Bind methods
    this.init = this.init.bind(this);
    this.setupWindowControls = this.setupWindowControls.bind(this);
    this.setupMenuHandlers = this.setupMenuHandlers.bind(this);
    this.setupActionButtonHandlers = this.setupActionButtonHandlers.bind(this);
    this.setupDropdownMenuHandlers = this.setupDropdownMenuHandlers.bind(this);
    this.setupContextMenu = this.setupContextMenu.bind(this);
    this.setupSettingsModal = this.setupSettingsModal.bind(this);
    this.setupInlineSearch = this.setupInlineSearch.bind(this);
    this.setupResizeHandlers = this.setupResizeHandlers.bind(this);
    this.showDropdownMenu = this.showDropdownMenu.bind(this);
    this.hideDropdownMenus = this.hideDropdownMenus.bind(this);
    this.showContextMenu = this.showContextMenu.bind(this);
    this.hideContextMenu = this.hideContextMenu.bind(this);
    this.showSettingsModal = this.showSettingsModal.bind(this);
    this.hideSettingsModal = this.hideSettingsModal.bind(this);
    this.populateSettingsForm = this.populateSettingsForm.bind(this);
    this.saveSettings = this.saveSettings.bind(this);
    this.toggleTheme = this.toggleTheme.bind(this);
    this.toggleInlineSearch = this.toggleInlineSearch.bind(this);
  }

  /**
   * Initialize the UI manager
   */
  init() {
    if (this.initialized) return;
    
    this.contextMenu = document.getElementById('context-menu');
    this.settingsModal = document.getElementById('settings-modal');
    this.inlineSearch = document.getElementById('inline-search');
    
    this.setupWindowControls();
    this.setupMenuHandlers();
    this.setupActionButtonHandlers();
    this.setupDropdownMenuHandlers();
    this.setupContextMenu();
    this.setupSettingsModal();
    this.setupInlineSearch();
    this.setupResizeHandlers();
    
    // Apply theme from settings
    window.api.getSettings().then(settings => {
      document.documentElement.className = `theme-${settings.appearance.theme}`;
    });
    
    // Document click handler to close dropdowns
    document.addEventListener('click', (e) => {
      // If click is not in a menu item, hide all dropdowns
      if (!e.target.closest('.menu-item')) {
        this.hideDropdownMenus();
      }
    });
    
    this.initialized = true;
  }

  /**
   * Set up window control buttons
   */
  setupWindowControls() {
    // Minimize button
    document.getElementById('minimize-btn').addEventListener('click', () => {
      window.api.minimizeWindow();
    });
    
    // Maximize button
    document.getElementById('maximize-btn').addEventListener('click', () => {
      window.api.maximizeWindow();
    });
    
    // Close button
    document.getElementById('close-btn').addEventListener('click', () => {
      window.api.closeWindow();
    });
  }

  /**
   * Set up menu handlers
   */
  setupMenuHandlers() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const menuName = item.dataset.menu;
        this.showDropdownMenu(menuName);
        e.stopPropagation();
      });
    });
  }

  /**
   * Set up action button handlers
   */
  setupActionButtonHandlers() {
    // New terminal button
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
      this.toggleInlineSearch();
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
   * Set up dropdown menu handlers
   */
  setupDropdownMenuHandlers() {
    // File menu
    document.getElementById('menu-new-terminal').addEventListener('click', () => {
      window.terminalManager.createTerminal();
      this.hideDropdownMenus();
    });
    
    document.getElementById('menu-settings').addEventListener('click', () => {
      this.showSettingsModal();
      this.hideDropdownMenus();
    });
    
    document.getElementById('menu-exit').addEventListener('click', () => {
      window.api.closeWindow();
      this.hideDropdownMenus();
    });
    
    // Edit menu
    document.getElementById('menu-copy').addEventListener('click', () => {
      document.execCommand('copy');
      this.hideDropdownMenus();
    });
    
    document.getElementById('menu-paste').addEventListener('click', () => {
      navigator.clipboard.readText()
        .then(text => {
          if (window.terminalManager.activeTerminalId) {
            window.api.sendTerminalInput(
              window.terminalManager.activeTerminalId, 
              text
            );
          }
        });
      this.hideDropdownMenus();
    });
    
    document.getElementById('menu-select-all').addEventListener('click', () => {
      if (window.terminalManager.activeTerminalId) {
        window.terminalManager.terminals[window.terminalManager.activeTerminalId].term.selectAll();
      }
      this.hideDropdownMenus();
    });
    
    // View menu
    document.getElementById('menu-toggle-theme').addEventListener('click', () => {
      this.toggleTheme();
      this.hideDropdownMenus();
    });
    
    document.getElementById('menu-increase-font').addEventListener('click', () => {
      if (window.terminalManager.settings.appearance.fontSize < 32) {
        window.terminalManager.settings.appearance.fontSize += 1;
        window.terminalManager.updateAllTerminals();
      }
      this.hideDropdownMenus();
    });
    
    document.getElementById('menu-decrease-font').addEventListener('click', () => {
      if (window.terminalManager.settings.appearance.fontSize > 8) {
        window.terminalManager.settings.appearance.fontSize -= 1;
        window.terminalManager.updateAllTerminals();
      }
      this.hideDropdownMenus();
    });
    
    document.getElementById('menu-fullscreen').addEventListener('click', () => {
      window.api.toggleFullscreen();
      this.hideDropdownMenus();
    });
    
    // Terminal menu
    document.getElementById('menu-clear').addEventListener('click', () => {
      window.terminalManager.clearActiveTerminal();
      this.hideDropdownMenus();
    });
    
    document.getElementById('menu-next-tab').addEventListener('click', () => {
      const tabIds = Object.keys(window.terminalManager.terminals);
      if (tabIds.length <= 1) return;
      
      const currentIndex = tabIds.indexOf(window.terminalManager.activeTerminalId);
      const nextIndex = (currentIndex + 1) % tabIds.length;
      window.terminalManager.setActiveTerminal(tabIds[nextIndex]);
      this.hideDropdownMenus();
    });
    
    document.getElementById('menu-prev-tab').addEventListener('click', () => {
      const tabIds = Object.keys(window.terminalManager.terminals);
      if (tabIds.length <= 1) return;
      
      const currentIndex = tabIds.indexOf(window.terminalManager.activeTerminalId);
      const prevIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
      window.terminalManager.setActiveTerminal(tabIds[prevIndex]);
      this.hideDropdownMenus();
    });
    
    // Help menu
    document.getElementById('menu-keyboard-shortcuts').addEventListener('click', () => {
      // Show keyboard shortcuts
      this.hideDropdownMenus();
    });
    
    document.getElementById('menu-about').addEventListener('click', () => {
      // Show about dialog
      this.hideDropdownMenus();
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
            this.toggleInlineSearch();
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
  }

  /**
   * Set up inline search
   */
  setupInlineSearch() {
    const searchInput = document.getElementById('inline-search-input');
    const prevBtn = document.getElementById('inline-search-prev');
    const nextBtn = document.getElementById('inline-search-next');
    const closeBtn = document.getElementById('inline-search-close');
    
    // Search as you type
    searchInput.addEventListener('input', () => {
      const query = searchInput.value;
      if (query && window.terminalManager.activeTerminalId) {
        window.terminalManager.terminals[window.terminalManager.activeTerminalId].searchAddon.findNext(query);
      }
    });
    
    // Previous match
    prevBtn.addEventListener('click', () => {
      const query = searchInput.value;
      if (query && window.terminalManager.activeTerminalId) {
        window.terminalManager.terminals[window.terminalManager.activeTerminalId].searchAddon.findPrevious(query);
      }
    });
    
    // Next match
    nextBtn.addEventListener('click', () => {
      const query = searchInput.value;
      if (query && window.terminalManager.activeTerminalId) {
        window.terminalManager.terminals[window.terminalManager.activeTerminalId].searchAddon.findNext(query);
      }
    });
    
    // Close search
    closeBtn.addEventListener('click', () => {
      this.toggleInlineSearch(false);
      if (window.terminalManager.activeTerminalId) {
        window.terminalManager.terminals[window.terminalManager.activeTerminalId].term.focus();
      }
    });
    
    // Key events
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value;
        if (query && window.terminalManager.activeTerminalId) {
          if (e.shiftKey) {
            window.terminalManager.terminals[window.terminalManager.activeTerminalId].searchAddon.findPrevious(query);
          } else {
            window.terminalManager.terminals[window.terminalManager.activeTerminalId].searchAddon.findNext(query);
          }
        }
      } else if (e.key === 'Escape') {
        this.toggleInlineSearch(false);
        if (window.terminalManager.activeTerminalId) {
          window.terminalManager.terminals[window.terminalManager.activeTerminalId].term.focus();
        }
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
    
    // Handle Escape key for closing menus and dialogs
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideDropdownMenus();
        this.hideContextMenu();
        this.toggleInlineSearch(false);
        
        // Only hide settings modal if it's open
        if (this.settingsModal.classList.contains('show')) {
          this.hideSettingsModal();
        }
      }
    });
  }

  /**
   * Show dropdown menu
   */
  showDropdownMenu(menuName) {
    // First hide all dropdown menus
    this.hideDropdownMenus();
    
    // Then show the one we want
    const menuElement = document.getElementById(`${menuName}-menu`);
    if (menuElement) {
      // Position the menu
      const menuItem = document.querySelector(`.menu-item[data-menu="${menuName}"]`);
      const menuRect = menuItem.getBoundingClientRect();
      
      menuElement.style.left = `${menuRect.left}px`;
      menuElement.style.top = `${menuRect.bottom}px`;
      
      // Show the menu
      menuElement.classList.add('show');
      
      // Set active class on menu item
      menuItem.classList.add('active');
      
      // Store active menu
      this.activeMenu = menuName;
    }
  }

  /**
   * Hide all dropdown menus
   */
  hideDropdownMenus() {
    // Hide all dropdown menus
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.classList.remove('show');
    });
    
    // Remove active class from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Clear active menu
    this.activeMenu = null;
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
   * Toggle inline search
   */
  toggleInlineSearch(force) {
    const show = force !== undefined ? force : !this.inlineSearch.classList.contains('show');
    
    if (show) {
      this.inlineSearch.classList.add('show');
      document.getElementById('inline-search-input').focus();
    } else {
      this.inlineSearch.classList.remove('show');
    }
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
