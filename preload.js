const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Terminal management
    createTerminal: () => ipcRenderer.invoke('terminal:create'),
    
    sendTerminalInput: (id, data) => {
      ipcRenderer.send('terminal:input', { id, data });
    },
    
    resizeTerminal: (id, cols, rows) => {
      ipcRenderer.send('terminal:resize', { id, cols, rows });
    },
    
    closeTerminal: (id) => {
      ipcRenderer.send('terminal:close', { id });
    },
    
    onTerminalData: (callback) => {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      ipcRenderer.on('terminal:data', (event, data) => {
        callback(data);
      });
      
      return () => {
        ipcRenderer.removeAllListeners('terminal:data');
      };
    },
    
    onTerminalExit: (callback) => {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      ipcRenderer.on('terminal:exit', (event, data) => {
        callback(data);
      });
      
      return () => {
        ipcRenderer.removeAllListeners('terminal:exit');
      };
    },
    
    // Settings management
    getSettings: () => ipcRenderer.invoke('settings:get'),
    
    setSettings: (settings) => {
      ipcRenderer.send('settings:set', settings);
    },
    
    // Menu event handlers
    onMenuNewTerminal: (callback) => {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      ipcRenderer.on('menu:new-terminal', () => {
        callback();
      });
      
      return () => {
        ipcRenderer.removeAllListeners('menu:new-terminal');
      };
    },
    
    onMenuFind: (callback) => {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      ipcRenderer.on('menu:find', () => {
        callback();
      });
      
      return () => {
        ipcRenderer.removeAllListeners('menu:find');
      };
    },
    
    onMenuSettings: (callback) => {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      ipcRenderer.on('menu:settings', () => {
        callback();
      });
      
      return () => {
        ipcRenderer.removeAllListeners('menu:settings');
      };
    },
    
    onMenuClear: (callback) => {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      ipcRenderer.on('menu:clear', () => {
        callback();
      });
      
      return () => {
        ipcRenderer.removeAllListeners('menu:clear');
      };
    },
    
    onMenuToggleTheme: (callback) => {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      ipcRenderer.on('menu:toggle-theme', () => {
        callback();
      });
      
      return () => {
        ipcRenderer.removeAllListeners('menu:toggle-theme');
      };
    },
    
    onMenuNextTab: (callback) => {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      ipcRenderer.on('menu:next-tab', () => {
        callback();
      });
      
      return () => {
        ipcRenderer.removeAllListeners('menu:next-tab');
      };
    },
    
    onMenuPrevTab: (callback) => {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      ipcRenderer.on('menu:prev-tab', () => {
        callback();
      });
      
      return () => {
        ipcRenderer.removeAllListeners('menu:prev-tab');
      };
    },
    
    onMenuAbout: (callback) => {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      ipcRenderer.on('menu:about', () => {
        callback();
      });
      
      return () => {
        ipcRenderer.removeAllListeners('menu:about');
      };
    }
  }
);
