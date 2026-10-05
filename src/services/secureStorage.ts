import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const KEYS = {
  PIN_HASH: 'pin_hash',
  PIN_SALT: 'pin_salt',
  DEVICE_ID: 'device_id',
  API_TOKEN: 'api_token',
  BUSINESS_ID: 'business_id',
  LAST_UNLOCK: 'last_unlock',
  FAILED_ATTEMPTS: 'failed_attempts',
  LOCKOUT_END_TIME: 'lockout_end_time',
  LOCKOUT_LEVEL: 'lockout_level',
  SECURITY_QUESTION: 'security_question',
  SECURITY_ANSWER_HASH: 'security_answer_hash',
  SECURITY_ANSWER_SALT: 'security_answer_salt',
  INSTALL_TIMESTAMP: 'install_timestamp',   // ms since epoch, set on first setup
} as const;

/**
 * Hash a PIN with salt using SHA256
 */
async function hashPIN(pin: string, salt: string): Promise<string> {
  const combined = `${pin}${salt}`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
  return hash;
}

/**
 * Generate a random salt
 */
async function generateSalt(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Store a new PIN securely
 */
export async function storePIN(pin: string): Promise<void> {
  try {
    const salt = await generateSalt();
    const hash = await hashPIN(pin, salt);
    
    await SecureStore.setItemAsync(KEYS.PIN_SALT, salt);
    await SecureStore.setItemAsync(KEYS.PIN_HASH, hash);
    
    // Reset failed attempts
    await SecureStore.setItemAsync(KEYS.FAILED_ATTEMPTS, '0');
    
    console.log('PIN stored successfully');
  } catch (error) {
    console.error('Error storing PIN:', error);
    throw error;
  }
}

/**
 * Verify a PIN
 */
export async function verifyPIN(pin: string): Promise<boolean> {
  try {
    const salt = await SecureStore.getItemAsync(KEYS.PIN_SALT);
    const storedHash = await SecureStore.getItemAsync(KEYS.PIN_HASH);
    
    if (!salt || !storedHash) {
      throw new Error('PIN not set');
    }
    
    const hash = await hashPIN(pin, salt);
    const isValid = hash === storedHash;
    
    if (isValid) {
      // Reset failed attempts on successful verification
      await SecureStore.setItemAsync(KEYS.FAILED_ATTEMPTS, '0');
      await SecureStore.setItemAsync(KEYS.LAST_UNLOCK, new Date().toISOString());
    } else {
      // Increment failed attempts
      await incrementFailedAttempts();
    }
    
    return isValid;
  } catch (error) {
    console.error('Error verifying PIN:', error);
    throw error;
  }
}

/**
 * Check if PIN is set
 */
export async function isPINSet(): Promise<boolean> {
  try {
    const hash = await SecureStore.getItemAsync(KEYS.PIN_HASH);
    return hash !== null;
  } catch (error) {
    console.error('Error checking PIN:', error);
    return false;
  }
}

/**
 * Delete stored PIN
 */
export async function deletePIN(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEYS.PIN_HASH);
    await SecureStore.deleteItemAsync(KEYS.PIN_SALT);
    await SecureStore.deleteItemAsync(KEYS.FAILED_ATTEMPTS);
  } catch (error) {
    console.error('Error deleting PIN:', error);
    throw error;
  }
}

/**
 * Get failed attempts count
 */
export async function getFailedAttempts(): Promise<number> {
  try {
    const attempts = await SecureStore.getItemAsync(KEYS.FAILED_ATTEMPTS);
    return parseInt(attempts || '0', 10);
  } catch (error) {
    console.error('Error getting failed attempts:', error);
    return 0;
  }
}

/**
 * Increment failed attempts
 */
async function incrementFailedAttempts(): Promise<void> {
  try {
    const current = await getFailedAttempts();
    await SecureStore.setItemAsync(KEYS.FAILED_ATTEMPTS, String(current + 1));
  } catch (error) {
    console.error('Error incrementing failed attempts:', error);
  }
}

/**
 * Reset failed attempts
 */
export async function resetFailedAttempts(): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEYS.FAILED_ATTEMPTS, '0');
    await SecureStore.deleteItemAsync(KEYS.LOCKOUT_END_TIME);
    await SecureStore.deleteItemAsync(KEYS.LOCKOUT_LEVEL);
  } catch (error) {
    console.error('Error resetting failed attempts:', error);
  }
}

/**
 * Get lockout end time
 */
export async function getLockoutEndTime(): Promise<Date | null> {
  try {
    const isoString = await SecureStore.getItemAsync(KEYS.LOCKOUT_END_TIME);
    return isoString ? new Date(isoString) : null;
  } catch (error) {
    console.error('Error getting lockout end time:', error);
    return null;
  }
}

/**
 * Set lockout end time
 */
export async function setLockoutEndTime(endTime: Date): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEYS.LOCKOUT_END_TIME, endTime.toISOString());
  } catch (error) {
    console.error('Error setting lockout end time:', error);
  }
}

/**
 * Get lockout level (0-2: 1min, 3min, 5min)
 */
export async function getLockoutLevel(): Promise<number> {
  try {
    const level = await SecureStore.getItemAsync(KEYS.LOCKOUT_LEVEL);
    return parseInt(level || '0', 10);
  } catch (error) {
    console.error('Error getting lockout level:', error);
    return 0;
  }
}

/**
 * Set lockout level
 */
export async function setLockoutLevel(level: number): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEYS.LOCKOUT_LEVEL, String(level));
  } catch (error) {
    console.error('Error setting lockout level:', error);
  }
}

/**
 * Check if currently locked out
 */
export async function isLockedOut(): Promise<boolean> {
  try {
    const endTime = await getLockoutEndTime();
    if (!endTime) return false;
    
    return new Date() < endTime;
  } catch (error) {
    console.error('Error checking lockout status:', error);
    return false;
  }
}

/**
 * Start progressive lockout
 * Level 0 (first lockout): 1 minute
 * Level 1 (second lockout): 3 minutes
 * Level 2+ (third+ lockout): 5 minutes
 */
export async function startLockout(): Promise<Date> {
  try {
    const level = await getLockoutLevel();
    
    // Progressive lockout durations in milliseconds
    const durations = [
      60 * 1000,      // Level 0: 1 minute
      3 * 60 * 1000,  // Level 1: 3 minutes
      5 * 60 * 1000,  // Level 2+: 5 minutes
    ];
    
    const duration = durations[Math.min(level, 2)];
    const endTime = new Date(Date.now() + duration);
    
    await setLockoutEndTime(endTime);
    await setLockoutLevel(level + 1);
    
    return endTime;
  } catch (error) {
    console.error('Error starting lockout:', error);
    throw error;
  }
}

/**
 * Store API token
 */
export async function storeAPIToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEYS.API_TOKEN, token);
  } catch (error) {
    console.error('Error storing API token:', error);
    throw error;
  }
}

/**
 * Get API token
 */
export async function getAPIToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS.API_TOKEN);
  } catch (error) {
    console.error('Error getting API token:', error);
    return null;
  }
}

/**
 * Delete API token
 */
export async function deleteAPIToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEYS.API_TOKEN);
  } catch (error) {
    console.error('Error deleting API token:', error);
  }
}

/**
 * Store device ID
 */
export async function storeDeviceID(deviceId: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEYS.DEVICE_ID, deviceId);
  } catch (error) {
    console.error('Error storing device ID:', error);
    throw error;
  }
}

/**
 * Get device ID
 */
export async function getDeviceID(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS.DEVICE_ID);
  } catch (error) {
    console.error('Error getting device ID:', error);
    return null;
  }
}

/**
 * Store business ID
 */
export async function storeBusinessID(businessId: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEYS.BUSINESS_ID, businessId);
  } catch (error) {
    console.error('Error storing business ID:', error);
    throw error;
  }
}

/**
 * Get business ID
 */
export async function getBusinessID(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS.BUSINESS_ID);
  } catch (error) {
    console.error('Error getting business ID:', error);
    return null;
  }
}

/**
 * Get last unlock time
 */
export async function getLastUnlockTime(): Promise<Date | null> {
  try {
    const isoString = await SecureStore.getItemAsync(KEYS.LAST_UNLOCK);
    return isoString ? new Date(isoString) : null;
  } catch (error) {
    console.error('Error getting last unlock time:', error);
    return null;
  }
}

/**
 * Clear all secure storage
 */
export async function clearAllSecureStorage(): Promise<void> {
  try {
    for (const key of Object.values(KEYS)) {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error('Error clearing secure storage:', error);
    throw error;
  }
}

/**
 * Store security question and answer
 */
export async function storeSecurityQuestion(
  question: string,
  answer: string
): Promise<void> {
  try {
    const salt = await generateSalt();
    const hash = await hashPIN(answer.toLowerCase().trim(), salt);
    
    await SecureStore.setItemAsync(KEYS.SECURITY_QUESTION, question);
    await SecureStore.setItemAsync(KEYS.SECURITY_ANSWER_SALT, salt);
    await SecureStore.setItemAsync(KEYS.SECURITY_ANSWER_HASH, hash);
  } catch (error) {
    console.error('Error storing security question:', error);
    throw error;
  }
}

/**
 * Get security question
 */
export async function getSecurityQuestion(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS.SECURITY_QUESTION);
  } catch (error) {
    console.error('Error getting security question:', error);
    return null;
  }
}

/**
 * Verify security answer
 */
export async function verifySecurityAnswer(answer: string): Promise<boolean> {
  try {
    const salt = await SecureStore.getItemAsync(KEYS.SECURITY_ANSWER_SALT);
    const storedHash = await SecureStore.getItemAsync(KEYS.SECURITY_ANSWER_HASH);
    
    if (!salt || !storedHash) {
      throw new Error('Security question not set');
    }
    
    const hash = await hashPIN(answer.toLowerCase().trim(), salt);
    return hash === storedHash;
  } catch (error) {
    console.error('Error verifying security answer:', error);
    throw error;
  }
}

// ─── Install timestamp ────────────────────────────────────────────────────────

/**
 * Record the first-install timestamp (called once during business setup).
 * Does nothing if already set so reinstalls keep the original timestamp.
 */
export async function recordInstallTimestamp(): Promise<void> {
  try {
    const existing = await SecureStore.getItemAsync(KEYS.INSTALL_TIMESTAMP);
    if (!existing) {
      await SecureStore.setItemAsync(KEYS.INSTALL_TIMESTAMP, Date.now().toString());
    }
  } catch (error) {
    console.error('Error recording install timestamp:', error);
  }
}

/**
 * Returns true if the app was installed less than 24 hours ago.
 * Used to grant a grace period before requiring a subscription.
 */
export async function isInGracePeriod(): Promise<boolean> {
  try {
    const ts = await SecureStore.getItemAsync(KEYS.INSTALL_TIMESTAMP);
    if (!ts) return false; // no timestamp = already past setup, no grace
    const GRACE_MS = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - parseInt(ts, 10) < GRACE_MS;
  } catch {
    return false;
  }
}

/**
 * Returns the number of milliseconds remaining in the grace period, or 0.
 */
export async function getGraceRemainingMs(): Promise<number> {
  try {
    const ts = await SecureStore.getItemAsync(KEYS.INSTALL_TIMESTAMP);
    if (!ts) return 0;
    const GRACE_MS = 24 * 60 * 60 * 1000;
    const remaining = GRACE_MS - (Date.now() - parseInt(ts, 10));
    return Math.max(0, remaining);
  } catch {
    return 0;
  }
}
