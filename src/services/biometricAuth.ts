import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export interface BiometricCapability {
  isAvailable: boolean;
  biometricType: 'fingerprint' | 'face' | 'iris' | 'none';
  hardwareAvailable: boolean;
  enrolled: boolean;
}

/**
 * Check if biometric authentication is available on the device
 */
export async function checkBiometricCapability(): Promise<BiometricCapability> {
  try {
    // Check if hardware is available
    const compatible = await LocalAuthentication.hasHardwareAsync();
    
    if (!compatible) {
      return {
        isAvailable: false,
        biometricType: 'none',
        hardwareAvailable: false,
        enrolled: false,
      };
    }

    // Check if biometrics are enrolled
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (!enrolled) {
      return {
        isAvailable: false,
        biometricType: 'none',
        hardwareAvailable: true,
        enrolled: false,
      };
    }

    // Get supported authentication types
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    let biometricType: 'fingerprint' | 'face' | 'iris' | 'none' = 'none';
    
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = 'face';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = 'fingerprint';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometricType = 'iris';
    }

    return {
      isAvailable: true,
      biometricType,
      hardwareAvailable: true,
      enrolled: true,
    };
  } catch (error) {
    console.error('Error checking biometric capability:', error);
    return {
      isAvailable: false,
      biometricType: 'none',
      hardwareAvailable: false,
      enrolled: false,
    };
  }
}

/**
 * Get user-friendly biometric type name
 */
export function getBiometricTypeName(type: BiometricCapability['biometricType']): string {
  switch (type) {
    case 'fingerprint':
      return 'Fingerprint';
    case 'face':
      return 'Face ID';
    case 'iris':
      return 'Iris';
    default:
      return 'Biometric';
  }
}

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access DukaPOS',
      fallbackLabel: 'Use PIN instead',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });

    return result.success;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
}

/**
 * Check if biometric authentication is enabled by user
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking biometric enabled status:', error);
    return false;
  }
}

/**
 * Enable or disable biometric authentication
 */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting biometric enabled status:', error);
    throw error;
  }
}

/**
 * Try to authenticate with biometric if enabled
 * Returns true if auth succeeds or biometric not enabled
 * Returns false if auth fails
 */
export async function tryBiometricAuth(): Promise<boolean> {
  try {
    const enabled = await isBiometricEnabled();
    
    if (!enabled) {
      return true; // Not enabled, allow through
    }

    const capability = await checkBiometricCapability();
    
    if (!capability.isAvailable) {
      return true; // Not available, allow through
    }

    return await authenticateWithBiometric();
  } catch (error) {
    console.error('Error in tryBiometricAuth:', error);
    return false;
  }
}
