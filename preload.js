const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Send terminal input to the main process
    sendInput: (data) => {
      ipcRenderer.send('terminal:input', data);
    },

    // Resize the terminal
    resizeTerminal: (cols, rows) => {
      ipcRenderer.send('terminal:resize', cols, rows);
    },

    // Listen for terminal data from the main process
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

    // Listen for window resize events from the main process
    onWindowResize: (callback) => {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }

      ipcRenderer.on('window-resize', () => {
        callback();
      });

      return () => {
        ipcRenderer.removeAllListeners('window-resize');
      };
    }
  }
);
