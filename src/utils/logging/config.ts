/**
 * Server Logging Configuration
 * Centralized configuration for server-side logging
 */

import fs from 'fs';
import path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFileTransport: boolean;
  logDir: string;
  logFileName: string;
  maxFileSize: number; // in bytes
  maxFiles: number;
  enableRequestLogging: boolean;
  enableErrorReporting: boolean;
  logFormat: 'json' | 'text';
}

/**
 * Get logging configuration from environment variables
 */
export function getLoggingConfig(): LoggingConfig {
  const env = process.env.NODE_ENV || 'development';
  const logLevel = (process.env.LOG_LEVEL || 
    (env === 'production' ? 'info' : 'debug')) as LogLevel;

  const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
  
  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  return {
    level: logLevel,
    enableConsole: true,
    enableFileTransport: env === 'production' || process.env.ENABLE_FILE_LOGGING === 'true',
    logDir,
    logFileName: 'app.log',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    enableRequestLogging: true,
    enableErrorReporting: env === 'production',
    logFormat: process.env.LOG_FORMAT === 'json' ? 'json' : 'text',
  };
}

/**
 * Check if a log level should be logged based on configuration
 */
export function shouldLog(level: LogLevel, config: LoggingConfig): boolean {
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const configLevelIndex = levels.indexOf(config.level);
  const messageLevelIndex = levels.indexOf(level);
  
  return messageLevelIndex >= configLevelIndex;
}

