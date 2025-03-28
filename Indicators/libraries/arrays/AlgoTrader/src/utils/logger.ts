export class Logger {
  /**
   * Logs an informational message.
   * @param message - The message to log.
   */
  info(message: string): void {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
  }

  /**
   * Logs a warning message.
   * @param message - The message to log.
   */
  warn(message: string): void {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
  }

  /**
   * Logs an error message.
   * @param message - The message to log.
   */
  error(message: string): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
  }

  /**
   * Logs a debug message.
   * @param message - The message to log.
   */
  debug(message: string): void {
    console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`);
  }
}