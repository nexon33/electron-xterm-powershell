const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

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

  // Set up IPC communication for simulated terminal
  ipcMain.handle('terminal:command', (event, command) => {
    // Simulate command execution with basic responses
    let response = '';
    
    if (command.trim() === 'help') {
      response = 'Available commands:\n- help: Show this help\n- hello: Say hello\n- date: Show current date\n- version: Show Node.js version\n- exit: Exit the application';
    } else if (command.trim() === 'hello') {
      response = 'Hello from Electron!';
    } else if (command.trim() === 'date') {
      response = `Current date: ${new Date().toLocaleString()}`;
    } else if (command.trim() === 'version') {
      response = `Node.js version: ${process.versions.node}\nElectron version: ${process.versions.electron}`;
    } else if (command.trim() === 'exit') {
      app.quit();
      return { success: true, response: 'Exiting...' };
    } else if (command.trim() === '') {
      response = '';
    } else {
      response = `Command not found: ${command}. Type 'help' for available commands.`;
    }
    
    return { success: true, response };
  });

  // Re-create the window if it was closed and the app is activated (macOS)
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});