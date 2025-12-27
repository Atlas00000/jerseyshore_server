/**
 * Logger utility for structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  error?: Error;
  metadata?: Record<string, any>;
}

class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error, metadata } = entry;
    
    let log = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (context) {
      log += ` [${context}]`;
    }
    
    log += ` ${message}`;
    
    if (error) {
      log += `\n  Error: ${error.message}`;
      if (error.stack) {
        log += `\n  Stack: ${error.stack}`;
      }
    }
    
    if (metadata && Object.keys(metadata).length > 0) {
      log += `\n  Metadata: ${JSON.stringify(metadata, null, 2)}`;
    }
    
    return log;
  }

  private log(level: LogLevel, message: string, options?: {
    context?: string;
    error?: Error;
    metadata?: Record<string, any>;
  }) {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      ...options,
    };

    const formattedLog = this.formatLog(entry);

    // Color coding for terminal
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      reset: '\x1b[0m',
    };

    const color = colors[level] || colors.reset;
    console.log(`${color}${formattedLog}${colors.reset}`);

    // In production, you might want to send to a logging service
    if (level === 'error' && entry.error) {
      // Could send to Sentry, LogRocket, etc.
    }
  }

  debug(message: string, options?: { context?: string; metadata?: Record<string, any> }) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, options);
    }
  }

  info(message: string, options?: { context?: string; metadata?: Record<string, any> }) {
    this.log('info', message, options);
  }

  warn(message: string, options?: { context?: string; error?: Error; metadata?: Record<string, any> }) {
    this.log('warn', message, options);
  }

  error(message: string, options?: { context?: string; error?: Error; metadata?: Record<string, any> }) {
    this.log('error', message, options);
  }
}

export const logger = new Logger();



