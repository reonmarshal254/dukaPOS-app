/**
 * Account Status Service
 * 
 * Checks if the account is suspended by querying the admin backend.
 */

import * as Network from 'expo-network';
import Constants from 'expo-constants';

export interface AccountStatus {
  suspended: boolean;
  deviceId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  deviceName: string;
  deviceModel: string;
  osName: string;
  lastSeenAt: string;
  licenceStatus: string;
  plan: string | null;
}

/**
 * Get admin API URL
 */
function getAdminUrl(): string {
  try {
    return (
      (Constants.expoConfig?.extra as any)?.adminApiUrl ??
      'https://dukapos-gjfx.onrender.com'
    );
  } catch (error) {
    return 'https://dukapos-gjfx.onrender.com';
  }
}

/**
 * Check if device is online
 */
async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected === true && state.isInternetReachable === true;
  } catch (error) {
    console.warn('[accountStatus] Network check error:', error);
    return false;
  }
}

/**
 * Check account suspension status
 * 
 * @param deviceId - The device ID to check
 * @returns Account status or null if offline/error
 */
export async function checkAccountStatus(deviceId: string): Promise<AccountStatus | null> {
  try {
    // Only check if online
    const online = await isOnline();
    if (!online) {
      console.log('[accountStatus] Offline — skipping suspension check');
      return null;
    }

    const adminUrl = getAdminUrl();
    console.log(`[accountStatus] Checking status for device: ${deviceId.slice(0, 16)}...`);
    console.log(`[accountStatus] URL: ${adminUrl}/api/account-status/${deviceId}`);

    const response = await fetch(`${adminUrl}/api/account-status/${deviceId}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('[accountStatus] Device not found in backend');
        return null;
      }
      console.warn('[accountStatus] Status check failed:', response.status);
      return null;
    }

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('[accountStatus] Response is not JSON, got:', contentType);
      const text = await response.text();
      console.warn('[accountStatus] Response body preview:', text.slice(0, 200));
      return null;
    }

    const data = await response.json();
    console.log('[accountStatus] Status:', data.suspended ? '🔒 SUSPENDED' : '✅ Active');

    return data;
  } catch (error: any) {
    // Silently fail for JSON parse errors or network issues
    if (error.name === 'SyntaxError') {
      console.warn('[accountStatus] Invalid JSON response from server');
    } else {
      console.warn('[accountStatus] Check error:', error.message);
    }
    return null;
  }
}
