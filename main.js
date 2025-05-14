const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const os = require('os');
const pty = require('node-pty');
const fs = require('fs');

// Keep global references to prevent garbage collection
let mainWindow;
let ptyProcesses = {};

// Application settings
let settings = {
  appearance: {
    fontFamily: 'Consolas',
    fontSize: 14,
    cursorStyle: 'block',
    cursorBlink: true,
    theme: 'dark'
  },
  terminal: {
    scrollback: 1000,
    autoLineHeight: true,
    enableBell: false
  }
};

// Load settings from disk if available
function loadSettings() {
  try {
    const userDataPath = app.getPath('userData');
    const settingsPath = path.join(userDataPath, 'settings.json');
    
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      const loadedSettings = JSON.parse(data);
      settings = { ...settings, ...loadedSettings };
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

// Save settings to disk
function saveSettings() {
  try {
    const userDataPath = app.getPath('userData');
    const settingsPath = path.join(userDataPath, 'settings.json');
    
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

function createWindow() {
  // Load settings before creating the window
  loadSettings();

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 640,
    minHeight: 480,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: settings.appearance.theme === 'dark' ? '#1e1e1e' : '#f5f5f5',
    show: false
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

  // Open DevTools for debugging (uncomment when needed)
  // mainWindow.webContents.openDevTools();

  // Show the window when it's ready to prevent flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closing
  mainWindow.on('closed', () => {
    killAllPtyProcesses();
    mainWindow = null;
  });

  // Create application menu
  createApplicationMenu();
}

function createApplicationMenu() {
  const isMac = process.platform === 'darwin';
  
  const template = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Terminal',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            mainWindow.webContents.send('menu:new-terminal');
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          click: () => {
            mainWindow.webContents.send('menu:settings');
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            mainWindow.webContents.send('menu:find');
          }
        }
      ]
    },
    
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Toggle Theme',
          click: () => {
            mainWindow.webContents.send('menu:toggle-theme');
          }
        }
      ]
    },
    
    // Terminal menu
    {
      label: 'Terminal',
      submenu: [
        {
          label: 'Clear',
          accelerator: 'CmdOrCtrl+K',
          click: () => {
            mainWindow.webContents.send('menu:clear');
          }
        },
        { type: 'separator' },
        {
          label: 'Next Tab',
          accelerator: 'CmdOrCtrl+Tab',
          click: () => {
            mainWindow.webContents.send('menu:next-tab');
          }
        },
        {
          label: 'Previous Tab',
          accelerator: 'CmdOrCtrl+Shift+Tab',
          click: () => {
            mainWindow.webContents.send('menu:prev-tab');
          }
        }
      ]
    },
    
    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            mainWindow.webContents.send('menu:about');
          }
        },
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://github.com/electron/electron');
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Create a new PTY process
function createPtyProcess(id) {
  // Determine shell based on platform
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME || process.env.USERPROFILE,
    env: process.env
  });
  
  // Store the PTY process
  ptyProcesses[id] = ptyProcess;
  
  // Handle data from the PTY process
  ptyProcess.onData(data => {
    if (mainWindow) {
      mainWindow.webContents.send('terminal:data', { id, data });
    }
  });
  
  // Handle exit event
  ptyProcess.onExit(({ exitCode, signal }) => {
    if (mainWindow) {
      mainWindow.webContents.send('terminal:exit', { id, exitCode, signal });
    }
    delete ptyProcesses[id];
  });
  
  return id;
}

// Kill a specific PTY process
function killPtyProcess(id) {
  if (ptyProcesses[id]) {
    ptyProcesses[id].kill();
    delete ptyProcesses[id];
  }
}

// Kill all PTY processes
function killAllPtyProcesses() {
  Object.keys(ptyProcesses).forEach(id => {
    if (ptyProcesses[id]) {
      ptyProcesses[id].kill();
    }
  });
  ptyProcesses = {};
}

// Set up IPC handlers
function setupIPC() {
  // Create a new terminal
  ipcMain.handle('terminal:create', (event) => {
    const id = `terminal-${Date.now()}`;
    return createPtyProcess(id);
  });
  
  // Send input to the terminal
  ipcMain.on('terminal:input', (event, { id, data }) => {
    if (ptyProcesses[id]) {
      ptyProcesses[id].write(data);
    }
  });
  
  // Resize the terminal
  ipcMain.on('terminal:resize', (event, { id, cols, rows }) => {
    if (ptyProcesses[id]) {
      ptyProcesses[id].resize(cols, rows);
    }
  });
  
  // Close a terminal
  ipcMain.on('terminal:close', (event, { id }) => {
    killPtyProcess(id);
  });
  
  // Get/set settings
  ipcMain.handle('settings:get', () => {
    return settings;
  });
  
  ipcMain.on('settings:set', (event, newSettings) => {
    settings = { ...settings, ...newSettings };
    saveSettings();
  });
}

// Start the application
app.whenReady().then(() => {
  setupIPC();
  createWindow();
  
  // Re-create the window on macOS when the dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app before quit
app.on('before-quit', () => {
  killAllPtyProcesses();
});
