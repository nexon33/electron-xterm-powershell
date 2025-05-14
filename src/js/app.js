/**
 * Main Application Script
 * This file initializes the application components and sets up the main event listeners
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize UI manager
  window.uiManager.init();
  
  // Initialize terminal manager
  await window.terminalManager.init();
  
  console.log('Application initialized successfully');
});

// Handle uncaught exceptions and render them to the console
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  
  if (window.terminalManager && window.terminalManager.activeTerminalId) {
    const activeTerminal = window.terminalManager.terminals[window.terminalManager.activeTerminalId];
    if (activeTerminal) {
      activeTerminal.term.writeln(`\r\n\x1b[31m[ERROR] ${event.error.message}\x1b[0m`);
    }
  }
});
