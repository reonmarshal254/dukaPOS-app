/**
 * Sentry Crash Reporting Service
 * 
 * Captures and reports crashes, errors, and performance data to Sentry
 */

import * as Sentry from '@sentry/react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Get Sentry DSN from environment or Constants
function getSentryDSN(): string | undefined {
  try {
    // Try to get from Constants (set in app.config.js at build time)
    const dsn = (Constants.expoConfig?.extra as any)?.sentryDsn;
    if (dsn) return dsn;
    
    // Fallback for local development - your actual DSN
    // This is safe to commit (it's a public key, not a secret)
    if (__DEV__) {
      return 'https://e8636f00010902861d65dfb574cdfa78@o4512247884480512.ingest.us.sentry.io/4512248017911808';
    }
    
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Initialize Sentry for crash reporting
 */
export function initializeSentry(): void {
  const dsn = getSentryDSN();
  
  if (!dsn) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[Sentry] DSN not configured. Crash reporting disabled.');
    }
    return;
  }

  try {
    Sentry.init({
      dsn,
      
      // Set to true to enable debug mode (only in development)
      debug: __DEV__,
      
      // Environment
      environment: __DEV__ ? 'development' : 'production',
      
      // Release version
      release: `dukapos-mobile@${Application.nativeApplicationVersion || '1.0.0'}`,
      
      // Distribution (build number)
      dist: Application.nativeBuildVersion || '1',
      
      // Enable automatic session tracking
      enableAutoSessionTracking: true,
      
      // Session tracking interval (30 seconds)
      sessionTrackingIntervalMillis: 30000,
      
      // Enable native crash handling
      enableNative: true,
      
      // Enable auto breadcrumbs
      enableAutoPerformanceTracing: true,
      
      // Trace sample rate (100% for now, reduce in production if needed)
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,
      
      // Before send hook - you can filter events here
      beforeSend(event, hint) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[Sentry] 📤 Sending event to Sentry:', event.message || event.exception);
        }
        // Always send events to Sentry (even in dev for testing)
        return event;
      },
      
      // Integrations
      integrations: [
        Sentry.reactNavigationIntegration(),
      ],
    });

    // Set user context with device info
    Sentry.setContext('device', {
      model: Device.modelName || 'Unknown',
      manufacturer: Device.manufacturer || 'Unknown',
      brand: Device.brand || 'Unknown',
      osName: Device.osName || 'Unknown',
      osVersion: Device.osVersion || 'Unknown',
      isPhysicalDevice: Device.isDevice || false,
    });

    // Set app context
    Sentry.setContext('app', {
      name: 'DukaPOS',
      version: Application.nativeApplicationVersion || '1.0.0',
      buildNumber: Application.nativeBuildVersion || '1',
      expoVersion: Constants.expoVersion || 'Unknown',
    });

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[Sentry] Initialized successfully');
    }
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[Sentry] Initialization failed:', error);
    }
  }
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  try {
    if (context) {
      Sentry.setContext('custom', context);
    }
    Sentry.captureException(error);
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[Sentry] Failed to capture exception:', err);
    }
  }
}

/**
 * Manually capture a message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  try {
    Sentry.captureMessage(message, level);
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[Sentry] Failed to capture message:', err);
    }
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
): void {
  try {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
    });
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[Sentry] Failed to add breadcrumb:', err);
    }
  }
}

/**
 * Set user information
 */
export function setUser(userId: string, email?: string, username?: string): void {
  try {
    Sentry.setUser({
      id: userId,
      email,
      username,
    });
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[Sentry] Failed to set user:', err);
    }
  }
}

/**
 * Clear user information (on logout)
 */
export function clearUser(): void {
  try {
    Sentry.setUser(null);
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[Sentry] Failed to clear user:', err);
    }
  }
}

/**
 * Set custom tag
 */
export function setTag(key: string, value: string): void {
  try {
    Sentry.setTag(key, value);
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[Sentry] Failed to set tag:', err);
    }
  }
}

/**
 * Test Sentry integration (development only)
 */
export function testSentry(): void {
  if (!__DEV__) return;
  
  try {
    throw new Error('Test Sentry Error - This is intentional');
  } catch (error) {
    captureException(error as Error, { test: true });
  }
}

export default {
  initializeSentry,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  clearUser,
  setTag,
  testSentry,
};
