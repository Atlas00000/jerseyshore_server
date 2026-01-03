/**
 * Enhanced Server-side Logger
 * Comprehensive logging with multiple transports, file rotation, and structured output
 */

import { getLoggingConfig, shouldLog, type LogLevel } from './logging/config.js';
import { ConsoleTransport, FileTransport, type LogEntry } from './logging/transports.js';

class Logger {
  private config = getLoggingConfig();
  private consoleTransport: ConsoleTransport;
  private fileTransport: FileTransport | null = null;

  constructor() {
    this.consoleTransport = new ConsoleTransport();

    if (this.config.enableFileTransport) {
      this.fileTransport = new FileTransport(
        this.config.logDir,
        this.config.logFileName,
        this.config.maxFileSize,
        this.config.maxFiles,
        this.config.logFormat
      );
    }
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    options?: {
      context?: string;
      error?: Error;
      metadata?: Record<string, any>;
      requestId?: string;
    }
  ): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context: options?.context,
      error: options?.error ? {
        message: options.error.message,
        stack: options.error.stack,
        name: options.error.name,
      } : undefined,
      metadata: options?.metadata,
      requestId: options?.requestId,
    };
  }

  private log(
    level: LogLevel,
    message: string,
    options?: {
      context?: string;
      error?: Error;
      metadata?: Record<string, any>;
      requestId?: string;
    }
  ): void {
    // Check if we should log this level
    if (!shouldLog(level, this.config)) {
      return;
    }

    const entry = this.createLogEntry(level, message, options);

    // Console transport (always enabled if configured)
    if (this.config.enableConsole) {
      this.consoleTransport.log(entry);
    }

    // File transport (if enabled)
    if (this.config.enableFileTransport && this.fileTransport) {
      this.fileTransport.log(entry);
    }
  }

  /**
   * Debug level logging
   */
  debug(
    message: string,
    options?: { context?: string; metadata?: Record<string, any>; requestId?: string }
  ): void {
    this.log('debug', message, options);
  }

  /**
   * Info level logging
   */
  info(
    message: string,
    options?: { context?: string; metadata?: Record<string, any>; requestId?: string }
  ): void {
    this.log('info', message, options);
  }

  /**
   * Warning level logging
   */
  warn(
    message: string,
    options?: { context?: string; error?: Error; metadata?: Record<string, any>; requestId?: string }
  ): void {
    this.log('warn', message, options);
  }

  /**
   * Error level logging
   */
  error(
    message: string,
    options?: { context?: string; error?: Error; metadata?: Record<string, any>; requestId?: string }
  ): void {
    this.log('error', message, options);
  }

  /**
   * Close file transport (for graceful shutdown)
   */
  close(): void {
    if (this.fileTransport) {
      this.fileTransport.close();
    }
  }
}

export const logger = new Logger();
