import * as Application from 'expo-application';
import { Platform } from 'react-native';

// Fallback for expo-device if not available
const Device = {
  isDevice: true,
} as any;

export interface SecurityCheckResult {
  isSecure: boolean;
  risks: string[];
  warnings: string[];
}

/**
 * Check if the device is rooted/jailbroken
 * Note: This is a basic check. Advanced root detection requires native modules.
 */
export async function checkDeviceIntegrity(): Promise<SecurityCheckResult> {
  const risks: string[] = [];
  const warnings: string[] = [];

  // Check if running on emulator (development)
  if (!Device.isDevice) {
    warnings.push('Running on emulator or simulator');
  }

  // Check for debugging
  if (__DEV__) {
    warnings.push('App running in development mode');
  }

  // Platform-specific checks
  if (Platform.OS === 'android') {
    // Note: These checks require a custom development build with native modules
    // For production, implement native root detection
    
    // Check if installing from unknown sources
    // This would need a native module to check properly
    warnings.push('Root detection requires custom build');
  }

  const isSecure = risks.length === 0;

  return {
    isSecure,
    risks,
    warnings,
  };
}

/**
 * Get device fingerprint for device registration
 */
export async function getDeviceFingerprint(): Promise<string> {
  const components = [
    Device.modelName || 'unknown',
    Device.osName || 'unknown',
    Device.osVersion || 'unknown',
    Application.nativeApplicationVersion || 'unknown',
    Device.manufacturer || 'unknown',
  ];

  // Create a deterministic fingerprint
  return components.join('|');
}

/**
 * Detect if the app is running in a debugger
 */
export function isDebuggerAttached(): boolean {
  return __DEV__;
}

/**
 * Check if app has been tampered with
 * Note: Full implementation requires native code signing verification
 */
export async function verifyAppIntegrity(): Promise<boolean> {
  // In production, this should verify:
  // 1. Code signature
  // 2. Checksum of critical files
  // 3. Native library integrity
  
  if (__DEV__) {
    // Skip integrity checks in development
    return true;
  }

  // Placeholder - implement native integrity checks
  return true;
}

/**
 * Generate a secure random token for session management
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto-secure random if available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    // Fallback to Math.random (less secure)
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}
