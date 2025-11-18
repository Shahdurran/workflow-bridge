/**
 * Console Manager - Manages console output for different modes
 * Prevents console pollution in stdio mode
 */

export class ConsoleManager {
  private originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
    debug: typeof console.debug;
  };

  constructor() {
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };
  }

  /**
   * Suppress console output (for stdio mode)
   */
  suppress(): void {
    const noop = () => {};
    console.log = noop;
    console.warn = noop;
    console.info = noop;
    console.debug = noop;
    // Keep console.error for critical errors
  }

  /**
   * Restore original console
   */
  restore(): void {
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
  }

  /**
   * Configure console for current mode
   */
  configure(): void {
    const mode = process.env.MCP_MODE || 'stdio';
    const disableOutput = process.env.DISABLE_CONSOLE_OUTPUT === 'true';

    if (mode === 'stdio' || disableOutput) {
      this.suppress();
    }
  }
}

