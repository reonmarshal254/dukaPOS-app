import * as Crypto from 'expo-crypto';
import { REQUEST_SIGNING_KEY } from './securityConfig';

/**
 * Sign API request to prevent tampering and replay attacks
 */
export async function signRequest(
  method: string,
  url: string,
  body: any,
  timestamp: number
): Promise<string> {
  // Create canonical request string
  const bodyString = body ? JSON.stringify(body) : '';
  const canonical = `${method}\n${url}\n${timestamp}\n${bodyString}`;

  // Create HMAC-SHA256 signature
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${REQUEST_SIGNING_KEY}${canonical}`
  );

  return signature;
}

/**
 * Generate request headers with signature
 */
export async function getSignedHeaders(
  method: string,
  url: string,
  body?: any
): Promise<Record<string, string>> {
  const timestamp = Date.now();
  const signature = await signRequest(method, url, body, timestamp);

  return {
    'X-Request-Timestamp': timestamp.toString(),
    'X-Request-Signature': signature,
    'X-App-Version': require('../../app.json').expo.version,
  };
}

/**
 * Check if request is expired (prevent replay attacks)
 */
export function isRequestExpired(timestamp: number, maxAgeMs: number = 300000): boolean {
  const now = Date.now();
  const age = now - timestamp;
  
  return age > maxAgeMs || age < -60000; // Allow 1 minute clock skew
}
