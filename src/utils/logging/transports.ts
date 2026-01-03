/**
 * Server Logging Transports
 * Different output methods for logs (console, file, remote)
 */

import fs from 'fs';
import path from 'path';
import { createWriteStream, WriteStream } from 'fs';
import type { LogLevel } from './config.js';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
  metadata?: Record<string, any>;
  requestId?: string;
  userId?: string;
}

/**
 * Console Transport
 * Enhanced console logging with colors and structured output
 */
export class ConsoleTransport {
  log(entry: LogEntry): void {
    const formattedLog = this.formatLog(entry);
    const color = this.getColor(entry.level);

    // Use appropriate console method
    switch (entry.level) {
      case 'error':
        console.error(`${color}${formattedLog}\x1b[0m`);
        if (entry.error) {
          console.error(`  Error: ${entry.error.message}`);
          if (entry.error.stack) {
            console.error(`  Stack: ${entry.error.stack}`);
          }
        }
        if (entry.metadata) {
          console.error('  Metadata:', entry.metadata);
        }
        break;
      case 'warn':
        console.warn(`${color}${formattedLog}\x1b[0m`);
        if (entry.metadata) {
          console.warn('  Metadata:', entry.metadata);
        }
        break;
      case 'debug':
        console.debug(`${color}${formattedLog}\x1b[0m`);
        if (entry.metadata) {
          console.debug('  Metadata:', entry.metadata);
        }
        break;
      default:
        console.log(`${color}${formattedLog}\x1b[0m`);
        if (entry.metadata) {
          console.log('  Metadata:', entry.metadata);
        }
    }
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, requestId } = entry;
    let log = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (requestId) {
      log += ` [${requestId}]`;
    }
    
    if (context) {
      log += ` [${context}]`;
    }
    
    log += ` ${message}`;
    
    return log;
  }

  private getColor(level: LogLevel): string {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
    };
    return colors[level] || '';
  }
}

/**
 * File Transport
 * Write logs to file with rotation support
 */
export class FileTransport {
  private logDir: string;
  private logFileName: string;
  private maxFileSize: number;
  private maxFiles: number;
  private currentStream: WriteStream | null = null;
  private currentFile: string = '';
  private format: 'json' | 'text';

  constructor(
    logDir: string,
    logFileName: string,
    maxFileSize: number,
    maxFiles: number,
    format: 'json' | 'text' = 'text'
  ) {
    this.logDir = logDir;
    this.logFileName = logFileName;
    this.maxFileSize = maxFileSize;
    this.maxFiles = maxFiles;
    this.format = format;
    this.ensureLogFile();
  }

  private ensureLogFile(): void {
    const filePath = path.join(this.logDir, this.logFileName);
    
    if (this.currentFile !== filePath) {
      this.closeStream();
      this.currentFile = filePath;
    }

    if (!this.currentStream) {
      this.currentStream = createWriteStream(filePath, { flags: 'a' });
    }

    // Check file size and rotate if needed
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > this.maxFileSize) {
        this.rotateLogs();
      }
    } catch (error) {
      // File doesn't exist yet, that's fine
    }
  }

  private rotateLogs(): void {
    this.closeStream();

    // Rotate existing files
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const oldFile = path.join(this.logDir, `${this.logFileName}.${i}`);
      const newFile = path.join(this.logDir, `${this.logFileName}.${i + 1}`);
      
      if (fs.existsSync(oldFile)) {
        if (i + 1 > this.maxFiles) {
          fs.unlinkSync(oldFile);
        } else {
          fs.renameSync(oldFile, newFile);
        }
      }
    }

    // Move current log to .1
    const currentFile = path.join(this.logDir, this.logFileName);
    if (fs.existsSync(currentFile)) {
      fs.renameSync(currentFile, path.join(this.logDir, `${this.logFileName}.1`));
    }

    this.ensureLogFile();
  }

  log(entry: LogEntry): void {
    this.ensureLogFile();

    if (!this.currentStream) {
      return;
    }

    let logLine: string;
    
    if (this.format === 'json') {
      logLine = JSON.stringify(entry) + '\n';
    } else {
      logLine = this.formatLog(entry) + '\n';
    }

    this.currentStream.write(logLine);
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, requestId, error, metadata } = entry;
    let log = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (requestId) {
      log += ` [${requestId}]`;
    }
    
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

  closeStream(): void {
    if (this.currentStream) {
      this.currentStream.end();
      this.currentStream = null;
    }
  }

  close(): void {
    this.closeStream();
  }
}

