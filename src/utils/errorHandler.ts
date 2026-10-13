/**
 * Global error handler for production builds
 * Prevents app crashes from unhandled promise rejections
 */

import { ErrorUtils } from 'react-native';

let isErrorHandlerInitialized = false;

export function initializeErrorHandler(): void {
  if (isErrorHandlerInitialized) {
    return;
  }

  // Set custom global error handler
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Global Error Handler:', error, 'isFatal:', isFatal);
    }
    
    // Report to Sentry
    try {
      const { captureException } = require('../services/sentryService');
      captureException(error, {
        isFatal,
        source: 'globalErrorHandler',
      });
    } catch {
      // Sentry reporting failed, but don't crash
    }
    
    // In production, we could log to a crash reporting service
    // For now, just prevent the crash
    if (!isFatal) {
      // Try to recover from non-fatal errors
      return;
    }
    
    // For fatal errors, let the ErrorBoundary handle it
    throw error;
  });

  isErrorHandlerInitialized = true;
}

/**
 * Safe console wrapper for production builds
 * Prevents crashes from console methods when ProGuard is enabled
 */
export const safeConsole = {
  log: (...args: any[]) => {
    try {
      if (__DEV__ && console?.log) {
        console.log(...args);
      }
    } catch {
      // Silently fail in production
    }
  },
  
  warn: (...args: any[]) => {
    try {
      if (__DEV__ && console?.warn) {
        console.warn(...args);
      }
    } catch {
      // Silently fail in production
    }
  },
  
  error: (...args: any[]) => {
    try {
      if (console?.error) {
        console.error(...args);
      }
    } catch {
      // Silently fail in production
    }
  },
};
