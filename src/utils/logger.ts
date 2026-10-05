/**
 * Secure Logger Utility
 * 
 * Conditional logging that:
 * - Logs in development
 * - Silent in production (console.log stripped by Metro)
 * - Can send to monitoring service in production
 */

import { APP_CONFIG } from '../constants/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = APP_CONFIG.DEBUG_MODE || __DEV__;
  private logQueue: LogEntry[] = [];
  private maxQueueSize = 100;

  /**
   * Log debug message (development only)
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  /**
   * Log informational message
   */
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any): void {
    // Sanitize error to remove sensitive data
    const sanitizedError = this.sanitizeError(error);
    this.log('error', message, sanitizedError);
  }

  /**
   * Log security event (always logged for audit)
   */
  security(event: string, data?: any): void {
    const entry: LogEntry = {
      level: 'info',
      message: `[SECURITY] ${event}`,
      data: this.sanitize(data),
      timestamp: new Date().toISOString(),
    };

    this.logQueue.push(entry);
    this.trimQueue();

    // Always log security events in development
    if (this.isDevelopment) {
      console.log(`🔒 ${event}`, data);
    }

    // In production, send to monitoring service
    // TODO: Implement remote logging
  }

  /**
   * Internal logging function
   */
  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      data: this.sanitize(data),
      timestamp: new Date().toISOString(),
    };

    this.logQueue.push(entry);
    this.trimQueue();

    // Only console.log in development
    if (this.isDevelopment) {
      const emoji = this.getEmoji(level);
      if (data !== undefined) {
        console.log(`${emoji} ${message}`, data);
      } else {
        console.log(`${emoji} ${message}`);
      }
    }

    // In production, errors should be sent to monitoring
    if (!this.isDevelopment && level === 'error') {
      // TODO: Send to Sentry or similar service
    }
  }

  /**
   * Get emoji for log level
   */
  private getEmoji(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return '🐛';
      case 'info':
        return 'ℹ️';
      case 'warn':
        return '⚠️';
      case 'error':
        return '❌';
    }
  }

  /**
   * Sanitize data before logging (remove sensitive information)
   */
  private sanitize(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    // Don't log sensitive keys
    const sensitiveKeys = [
      'password',
      'pin',
      'token',
      'apiKey',
      'secret',
      'creditCard',
      'cvv',
      'ssn',
    ];

    if (typeof data === 'object') {
      const sanitized: any = Array.isArray(data) ? [] : {};

      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          // Check if key is sensitive
          const isSensitive = sensitiveKeys.some((sensitive) =>
            key.toLowerCase().includes(sensitive.toLowerCase())
          );

          if (isSensitive) {
            sanitized[key] = '[REDACTED]';
          } else if (typeof data[key] === 'object') {
            sanitized[key] = this.sanitize(data[key]);
          } else {
            sanitized[key] = data[key];
          }
        }
      }

      return sanitized;
    }

    return data;
  }

  /**
   * Sanitize error object
   */
  private sanitizeError(error: any): any {
    if (!error) return null;

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    return this.sanitize(error);
  }

  /**
   * Trim log queue to max size
   */
  private trimQueue(): void {
    if (this.logQueue.length > this.maxQueueSize) {
      this.logQueue = this.logQueue.slice(-this.maxQueueSize);
    }
  }

  /**
   * Get recent logs (for debugging or support)
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logQueue.slice(-count);
  }

  /**
   * Clear log queue
   */
  clearLogs(): void {
    this.logQueue = [];
  }

  /**
   * Export logs for support/debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logQueue, null, 2);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience methods
export const log = {
  debug: (message: string, data?: any) => logger.debug(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  warn: (message: string, data?: any) => logger.warn(message, data),
  error: (message: string, error?: Error | any) => logger.error(message, error),
  security: (event: string, data?: any) => logger.security(event, data),
};

export default logger;
