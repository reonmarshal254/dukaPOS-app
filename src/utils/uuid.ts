import * as Crypto from 'expo-crypto';

/**
 * Generate a new UUID v4 compatible with React Native
 * Uses expo-crypto for random number generation
 */
export function generateUUID(): string {
  // Generate random bytes
  const randomBytes = Crypto.getRandomBytes(16);
  
  // Convert to hex string
  const hex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Format as UUID v4 (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
  // Set version (4) and variant bits
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    '4' + hex.slice(13, 16),
    ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16) + hex.slice(18, 20),
    hex.slice(20, 32)
  ].join('-');
}

export default generateUUID;
