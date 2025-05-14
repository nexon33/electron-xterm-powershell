// Wait for the DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Terminal
  const terminalContainer = document.getElementById('terminal-container');
  
  // Initialize terminal with options
  const term = new Terminal({
    fontFamily: '"Consolas", monospace',
    fontSize: 14,
    theme: {
      background: '#2D2E2C',
      foreground: '#F8F8F8'
    },
    cursorBlink: true,
    allowTransparency: false,
    convertEol: true,
    screenReaderMode: false,
    scrollback: 1000
  });

  // Initialize fit addon
  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);

  // Open the terminal in the container
  term.open(terminalContainer);
  
  // Fit terminal to container on initial load
  setTimeout(() => {
    fitAddon.fit();
  }, 100);

  // Display welcome message
  term.write('Welcome to the xterm.js + Electron terminal demo!\r\n');
  term.write('Type "help" to see available commands.\r\n\r\n');

  // Keep track of current line
  let currentLine = '';
  let commandHistory = [];
  let historyIndex = -1;

  // Handle terminal input
  term.onKey(e => {
    const ev = e.domEvent;
    const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

    // Handle special keys
    if (ev.key === 'Enter') {
      // Process the command
      processCommand(currentLine);
      // Reset current line
      currentLine = '';
      historyIndex = -1;
    } else if (ev.key === 'Backspace') {
      // Handle backspace
      if (currentLine.length > 0) {
        // Remove the last character from the current line
        currentLine = currentLine.substring(0, currentLine.length - 1);
        // Move cursor back, clear the character and move cursor back again
        term.write('\b \b');
      }
    } else if (ev.key === 'ArrowUp') {
      // Navigate command history (up)
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        historyIndex++;
        // Clear current line
        term.write('\r\x1b[K> ');
        currentLine = commandHistory[commandHistory.length - 1 - historyIndex];
        term.write(currentLine);
      }
    } else if (ev.key === 'ArrowDown') {
      // Navigate command history (down)
      if (historyIndex > 0) {
        historyIndex--;
        // Clear current line
        term.write('\r\x1b[K> ');
        currentLine = commandHistory[commandHistory.length - 1 - historyIndex];
        term.write(currentLine);
      } else if (historyIndex === 0) {
        historyIndex = -1;
        // Clear current line
        term.write('\r\x1b[K> ');
        currentLine = '';
      }
    } else if (printable) {
      // Add printable characters to the current line
      currentLine += e.key;
      term.write(e.key);
    }
  });

  // Process command and display result
  async function processCommand(command) {
    // Add the command to history if it's not empty
    if (command.trim() !== '') {
      commandHistory.push(command);
    }
    
    // Write the command and new line
    term.write('\r\n');
    
    // Execute the command through the API
    try {
      const result = await window.api.executeCommand(command);
      if (result && result.response) {
        term.write(result.response + '\r\n');
      }
    } catch (error) {
      term.write(`\x1b[31mError: ${error.message}\x1b[0m\r\n`);
    }
    
    // Display the prompt
    term.write('> ');
  }

  // Initialize with a prompt
  term.write('> ');
  
  // Handle window resize events
  window.addEventListener('resize', () => {
    fitAddon.fit();
  });
  
  // Handle terminal container resize 
  const resizeObserver = new ResizeObserver(() => {
    fitAddon.fit();
  });
  resizeObserver.observe(terminalContainer);
  
  // Focus the terminal
  term.focus();

  // Add keyboard shortcut for search
  document.addEventListener('keydown', (event) => {
    // Ctrl+F to open search
    if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();
      searchAddon.findNext('');
    }
  });
});