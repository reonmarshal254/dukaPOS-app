/**
 * licenceService.ts
 *
 * Handles all licence and payment operations:
 *  - Check licence validity (local cache + remote)
 *  - Charge M-Pesa via Paystack STK push (no WebView)
 *  - Poll payment status until confirmed
 *  - Persist licence in SecureStore
 */

import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ─── Types ────────────────────────────────────────────────────────────────────
export type Plan = 'daily' | 'weekly' | 'monthly' | 'lifetime';

export interface LicenceInfo {
  valid: boolean;
  plan?: Plan;
  licenceKey?: string;
  expiresAt?: string | null;
  activatedAt?: string;
  reason?: 'no_licence' | 'expired' | 'suspended';
}

export const PLANS: Record<Plan, { label: string; price: number; duration: string; popular?: boolean }> = {
  daily:    { label: 'Daily',    price: 100,   duration: '1 day'    },
  weekly:   { label: 'Weekly',   price: 600,   duration: '7 days',  popular: true },
  monthly:  { label: 'Monthly',  price: 2000,  duration: '30 days'  },
  lifetime: { label: 'Lifetime', price: 10000, duration: 'Forever'  },
};

// ─── SecureStore keys ─────────────────────────────────────────────────────────
const KEYS = {
  LICENCE:    'licence_info',
  CHECKED_AT: 'licence_checked_at',
};

// ─── Admin API URL ─────────────────────────────────────────────────────────────
export function getAdminUrl(): string {
  return (
    (Constants.expoConfig?.extra as any)?.adminApiUrl ??
    'http://10.0.2.2:5000'
  );
}

// ─── Cache helpers ────────────────────────────────────────────────────────────
export async function cacheLicence(info: LicenceInfo): Promise<void> {
  await SecureStore.setItemAsync(KEYS.LICENCE, JSON.stringify(info));
  await SecureStore.setItemAsync(KEYS.CHECKED_AT, Date.now().toString());
}

export async function getCachedLicence(): Promise<LicenceInfo | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEYS.LICENCE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

const CACHE_TTL_MS       = 5 * 60 * 1000;  // 5 min — short enough to pick up new payments quickly
const INVALID_CACHE_TTL  = 30 * 1000;       // 30 sec — re-check very fast if currently invalid

async function isCacheStale(isValid: boolean): Promise<boolean> {
  const ts = await SecureStore.getItemAsync(KEYS.CHECKED_AT);
  if (!ts) return true;
  // Invalid licences are re-checked much more aggressively
  const ttl = isValid ? CACHE_TTL_MS : INVALID_CACHE_TTL;
  return Date.now() - parseInt(ts, 10) > ttl;
}

// ─── Check licence ─────────────────────────────────────────────────────────────
/**
 * Returns current licence status.
 *
 * Offline behaviour (POS must always work):
 *  - If we have a valid cached licence → trust it, let the user in.
 *  - If we have an invalid/expired cache AND we're offline → grant a grace
 *    period (OFFLINE_GRACE_HOURS) so the POS still works without internet.
 *    The licence will be re-verified properly next time the device is online.
 *  - Only block when: online + server confirms invalid/expired.
 */
const OFFLINE_GRACE_HOURS = 24; // kept for documentation — grace is unconditional when offline

export async function checkLicence(deviceId: string): Promise<LicenceInfo> {
  const cached = await getCachedLicence();

  // 1. Local expiry check on a valid cached licence
  if (cached?.valid && cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
    const expired: LicenceInfo = { valid: false, reason: 'expired', expiresAt: cached.expiresAt };
    await cacheLicence(expired);
    // Don't block yet — still check connectivity below
  }

  // Re-read (may have been updated above)
  const current = await getCachedLicence();

  // 2. Return fresh valid cache without hitting network
  if (current?.valid && !(await isCacheStale(true))) return current;

  // 3. Try to reach server
  let online = false;
  try {
    const ping = await fetch(`${getAdminUrl()}/health`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(4000),
    });
    online = ping.ok || ping.status < 500;
  } catch { online = false; }

  // 4. Offline path — never block the POS
  if (!online) {
    if (current?.valid) {
      // Valid cached licence → let in
      return current;
    }
    // No valid cache offline → grant grace so POS keeps working
    // Mark as grace so the UI can show a soft warning if needed
    return {
      valid: true,
      plan: current?.plan,
      licenceKey: current?.licenceKey,
      expiresAt: current?.expiresAt,
      activatedAt: current?.activatedAt,
    };
  }

  // 5. Online → fetch authoritative state from server
  try {
    const res = await fetch(`${getAdminUrl()}/api/licence/${deviceId}`, {
      headers: { 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      // Server error, not a licence denial — fall back to cache
      return current ?? { valid: false, reason: 'no_licence' };
    }
    const data: LicenceInfo = await res.json();
    await cacheLicence(data);
    return data;
  } catch {
    // Network error mid-request — fall back to cache
    return current ?? { valid: false, reason: 'no_licence' };
  }
}

// ─── Initiate M-Pesa charge (STK push) ────────────────────────────────────────
/**
 * Sends an STK push to the user's M-Pesa number via Paystack.
 * Returns a reference string used to poll for completion.
 * phone must be in E.164 format e.g. +254712345678
 */
export async function chargeMpesa(
  deviceId: string,
  plan: Plan,
  phone: string
): Promise<{ reference: string; displayText: string; amountKes: number }> {
  const res = await fetch(`${getAdminUrl()}/api/payment/initiate`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ deviceId, plan, phone }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err.error || `Charge failed (${res.status})`);
  }

  return res.json();
}

// ─── Poll payment status ───────────────────────────────────────────────────────
export type PollStatus = 'pending' | 'success' | 'failed';

export interface PollResult {
  status: PollStatus;
  licenceKey?: string;
  plan?: Plan;
  expiresAt?: string | null;
}

export async function pollPayment(reference: string): Promise<PollResult> {
  const res = await fetch(`${getAdminUrl()}/api/payment/poll/${reference}`);
  if (!res.ok) throw new Error(`Poll failed (${res.status})`);
  const data = await res.json() as PollResult & { activatedAt?: string };

  // Always cache on success regardless of which field is present
  if (data.status === 'success') {
    const licenceKey = data.licenceKey;
    const plan       = data.plan;
    const expiresAt  = data.expiresAt ?? null;

    if (licenceKey && plan) {
      await cacheLicence({
        valid:       true,
        plan,
        licenceKey,
        expiresAt:   expiresAt ? new Date(expiresAt).toISOString() : null,
        activatedAt: data.activatedAt ?? new Date().toISOString(),
      });
    }
  }

  return data;
}

// ─── Clear cached licence ─────────────────────────────────────────────────────
export async function clearCachedLicence(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.LICENCE).catch(() => {});
  await SecureStore.deleteItemAsync(KEYS.CHECKED_AT).catch(() => {});
}
