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
    
    // Send initial size to the main process
    const dimensions = fitAddon.proposeDimensions();
    if (dimensions) {
      window.api.resizeTerminal(dimensions.cols, dimensions.rows);
    }
  }, 100);

  // Register listener for terminal data from the PTY process
  window.api.onTerminalData((data) => {
    term.write(data);
  });

  // Handle terminal input
  term.onData(data => {
    window.api.sendInput(data);
  });

  // Handle window resize events
  window.addEventListener('resize', () => {
    fitAddon.fit();
    const dimensions = fitAddon.proposeDimensions();
    if (dimensions) {
      window.api.resizeTerminal(dimensions.cols, dimensions.rows);
    }
  });

  // Handle terminal container resize
  const resizeObserver = new ResizeObserver(() => {
    fitAddon.fit();
    const dimensions = fitAddon.proposeDimensions();
    if (dimensions) {
      window.api.resizeTerminal(dimensions.cols, dimensions.rows);
    }
  });
  resizeObserver.observe(terminalContainer);

  // Focus the terminal
  term.focus();
});
