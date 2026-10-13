/**
 * Global error handler for production builds
 * Prevents app crashes from unhandled promise rejections
 * 
 * Note: ErrorUtils is only available in production builds, not in dev/Expo Go
 */

let isErrorHandlerInitialized = false;

export function initializeErrorHandler(): void {
  if (isErrorHandlerInitialized) {
    return;
  }

  // Skip in development - Sentry and ErrorBoundary handle everything
  if (__DEV__) {
    isErrorHandlerInitialized = true;
    return;
  }

  // Defer initialization until next tick to ensure ErrorUtils is available
  setTimeout(() => {
    try {
      // Dynamically import ErrorUtils - only available in production builds
      const { ErrorUtils } = require('react-native');
      
      if (!ErrorUtils || typeof ErrorUtils.setGlobalHandler !== 'function') {
        return;
      }

      // Set custom global error handler
      ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
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
        
        // Try to recover from non-fatal errors
        if (!isFatal) {
          return;
        }
        
        // For fatal errors, let the ErrorBoundary handle it
        throw error;
      });
    } catch {
      // Failed to initialize, but don't crash
    }
  }, 0);

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
