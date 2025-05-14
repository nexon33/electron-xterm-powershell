const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Send command to the main process
    executeCommand: (command) => ipcRenderer.invoke('terminal:command', command),
    
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