const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const pty = require('node-pty');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let ptyProcess;

function createWindow() {
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
    }
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

  // Open DevTools for debugging (optional)
  // mainWindow.webContents.openDevTools();

  // Ensure proper rendering on resize
  mainWindow.on('resize', () => {
    mainWindow.webContents.send('window-resize');
  });
}

// Create the window when Electron is ready
app.whenReady().then(() => {
  createWindow();

  // Initialize PTY process with PowerShell
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  
  ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME || process.env.USERPROFILE,
    env: process.env
  });

  // Handle data events from the PTY
  ptyProcess.onData(data => {
    mainWindow.webContents.send('terminal:data', data);
  });

  // Set up IPC communication for PTY
  ipcMain.on('terminal:input', (event, data) => {
    ptyProcess.write(data);
  });

  // Handle terminal resize events
  ipcMain.on('terminal:resize', (event, cols, rows) => {
    if (ptyProcess) {
      ptyProcess.resize(cols, rows);
    }
  });

  // Re-create the window if it was closed and the app is activated (macOS)
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcess = null;
  }
  
  if (process.platform !== 'darwin') app.quit();
});
