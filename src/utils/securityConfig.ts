/**
 * Security configuration and constants
 * DO NOT commit sensitive keys to version control
 */

// Certificate pinning - replace with your actual backend certificate hashes
export const CERTIFICATE_PINS = {
  // SHA-256 hashes of backend SSL certificates
  production: [
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Primary cert
    'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=', // Backup cert
  ],
  staging: [
    'sha256/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=',
  ],
};

// Request signing key - should be injected at build time
export const REQUEST_SIGNING_KEY = '__REQUEST_SIGNING_KEY__'; // Replaced by build script

// Minimum security requirements
export const SECURITY_CONFIG = {
  // PIN requirements
  PIN_LENGTH_MIN: 4,
  PIN_LENGTH_MAX: 4,
  PIN_BLACKLIST: [
    '0000', '1111', '2222', '3333', '4444',
    '5555', '6666', '7777', '8888', '9999',
    '1234', '4321', '1122', '1212',
  ],
  
  // Session management
  SESSION_TIMEOUT_MS: 300000, // 5 minutes
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 300000, // 5 minutes
  
  // Request security
  REQUEST_TIMEOUT_MS: 30000,
  MAX_RETRY_ATTEMPTS: 3,
  
  // File security
  SECURE_FILE_PREFIX: 'secure_',
  ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// Common weak PINs to block
export function isPINWeak(pin: string): boolean {
  return (SECURITY_CONFIG.PIN_BLACKLIST as readonly string[]).includes(pin);
}

// Check for sequential digits
export function hasSequentialDigits(pin: string): boolean {
  for (let i = 0; i < pin.length - 2; i++) {
    const a = parseInt(pin[i]);
    const b = parseInt(pin[i + 1]);
    const c = parseInt(pin[i + 2]);
    
    // Check ascending sequence
    if (b === a + 1 && c === b + 1) return true;
    
    // Check descending sequence
    if (b === a - 1 && c === b - 1) return true;
  }
  
  return false;
}

// Check for repeated digits
export function hasRepeatedDigits(pin: string): boolean {
  const digitCounts = new Map<string, number>();
  
  for (const digit of pin) {
    digitCounts.set(digit, (digitCounts.get(digit) || 0) + 1);
  }
  
  // If any digit appears more than half the length, it's too repetitive
  for (const count of digitCounts.values()) {
    if (count > pin.length / 2) return true;
  }
  
  return false;
}

// Validate PIN strength
export function validatePINStrength(pin: string): {
  valid: boolean;
  reason?: string;
} {
  if (isPINWeak(pin)) {
    return { valid: false, reason: 'This PIN is too common. Please choose a different one.' };
  }
  
  if (hasSequentialDigits(pin)) {
    return { valid: false, reason: 'Avoid sequential digits like 123 or 321.' };
  }
  
  if (hasRepeatedDigits(pin)) {
    return { valid: false, reason: 'Avoid repeating digits. Choose a more random PIN.' };
  }
  
  return { valid: true };
}
