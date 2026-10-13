/**
 * licenceService.ts
 *
 * PRICING_REMOVED: This service is currently disabled but preserved for future use.
 * All subscription and licence checking functionality has been disabled.
 * The app is now free to use without any restrictions.
 * 
 * To restore pricing functionality:
 * 1. Uncomment the licence checks in src/app/index.tsx
 * 2. Uncomment background enforcement in src/app/(tabs)/_layout.tsx
 * 3. Re-enable payment screens in src/app/(auth)/_layout.tsx
 * 4. Restore "Pricing & Licence" menu item in settings
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Handles all licence and payment operations.
 *
 * Offline / grace policy (updated):
 *  - If we have a confirmed VALID cached licence → trust it offline.
 *  - If we have NO valid cache offline → return { valid: false, offline: true }
 *    The caller (index.tsx, _layout.tsx) checks isInGracePeriod() to decide
 *    whether to let the user in. licenceService no longer makes that policy
 *    decision itself — it just reports facts.
 *  - Billing disabled globally → always valid regardless.
 */

import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ─── Types ────────────────────────────────────────────────────────────────────
export type Plan = 'daily' | 'weekly' | 'monthly' | 'lifetime' | 'free';

export interface LicenceInfo {
  valid: boolean;
  plan?: Plan;
  licenceKey?: string;
  expiresAt?: string | null;
  activatedAt?: string;
  /** Why invalid */
  reason?: 'no_licence' | 'expired' | 'suspended';
  /** True when result is from offline cache/grace — not server-verified */
  offline?: boolean;
  /** True when billing is globally disabled by admin */
  billingDisabled?: boolean;
}

export type BillingPlan = 'daily' | 'weekly' | 'monthly' | 'lifetime';

// Read pricing from Constants.expoConfig.extra (loaded from eas.json env at build time)
function getPlanPrices() {
  try {
    const extra = (Constants.expoConfig?.extra as any) || {};
    return {
      daily:    parseInt(extra.planPrices?.daily    || '10000',  10),
      weekly:   parseInt(extra.planPrices?.weekly   || '60000',  10),
      monthly:  parseInt(extra.planPrices?.monthly  || '200000', 10),
      lifetime: parseInt(extra.planPrices?.lifetime || '1000000',10),
    };
  } catch (error) {
    // Fallback to default prices if Constants fails to load
    return {
      daily:    10000,
      weekly:   60000,
      monthly:  200000,
      lifetime: 1000000,
    };
  }
}

// Lazy getter for PLANS to avoid module-load-time crashes
let _cachedPlans: Record<BillingPlan, { label: string; price: number; duration: string; popular?: boolean }> | null = null;

export function getPlans() {
  if (!_cachedPlans) {
    const prices = getPlanPrices();
    _cachedPlans = {
      daily:    { label: 'Daily',    price: prices.daily,    duration: '1 day'    },
      weekly:   { label: 'Weekly',   price: prices.weekly,   duration: '7 days',  popular: true },
      monthly:  { label: 'Monthly',  price: prices.monthly,  duration: '30 days'  },
      lifetime: { label: 'Lifetime', price: prices.lifetime, duration: 'Forever'  },
    };
  }
  return _cachedPlans;
}

// Legacy export for backwards compatibility - but prefer using getPlans()
export const PLANS: Record<BillingPlan, { label: string; price: number; duration: string; popular?: boolean }> = new Proxy({} as any, {
  get(_target, prop: string) {
    return getPlans()[prop as BillingPlan];
  }
});

// ─── SecureStore keys ─────────────────────────────────────────────────────────
const KEYS = {
  LICENCE:    'licence_info',
  CHECKED_AT: 'licence_checked_at',
};

// ─── Admin API URL ─────────────────────────────────────────────────────────────
export function getAdminUrl(): string {
  try {
    return (
      (Constants.expoConfig?.extra as any)?.adminApiUrl ??
      'http://10.0.2.2:5000'
    );
  } catch (error) {
    // Fallback if Constants fails in production
    return 'https://dukapos-gjfx.onrender.com';
  }
}

// ─── Cache helpers ────────────────────────────────────────────────────────────
export async function cacheLicence(info: LicenceInfo): Promise<void> {
  // Never cache the offline/grace marker — only persist server-verified results
  const toStore = { ...info };
  delete toStore.offline;
  await SecureStore.setItemAsync(KEYS.LICENCE, JSON.stringify(toStore));
  await SecureStore.setItemAsync(KEYS.CHECKED_AT, Date.now().toString());
}

export async function getCachedLicence(): Promise<LicenceInfo | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEYS.LICENCE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// Cache TTL: valid licence = 5 min, invalid = 30 sec (picks up new payments fast)
const VALID_TTL_MS   = 5 * 60 * 1000;
const INVALID_TTL_MS = 30 * 1000;

async function isCacheStale(isValid: boolean): Promise<boolean> {
  const ts = await SecureStore.getItemAsync(KEYS.CHECKED_AT);
  if (!ts) return true;
  const ttl = isValid ? VALID_TTL_MS : INVALID_TTL_MS;
  return Date.now() - parseInt(ts, 10) > ttl;
}

// ─── Check licence ────────────────────────────────────────────────────────────
export async function checkLicence(deviceId: string): Promise<LicenceInfo> {
  const cached = await getCachedLicence();

  // 1. Local expiry check — mark cached valid licence as expired
  if (cached?.valid && cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
    const expired: LicenceInfo = { valid: false, reason: 'expired', expiresAt: cached.expiresAt };
    await cacheLicence(expired);
    // Fall through to network check — don't return offline expired result immediately
  }

  const current = await getCachedLicence();

  // 2. Fresh valid cache — return without hitting network
  if (current?.valid && !(await isCacheStale(true))) {
    return current;
  }

  // 3. Test connectivity (4s timeout)
  let online = false;
  try {
    const ping = await fetch(`${getAdminUrl()}/health`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(4000),
    });
    online = ping.ok || ping.status < 500;
  } catch { online = false; }

  // 4. Offline path
  if (!online) {
    if (current?.valid) {
      // Has a valid cached licence — trust it offline
      return { ...current, offline: true };
    }
    // No valid cache while offline — report invalid + offline flag
    // The CALLER decides whether to apply grace period
    return {
      valid:   false,
      reason:  current?.reason ?? 'no_licence',
      offline: true,
    };
  }

  // 5. Online — fetch authoritative state from server
  try {
    const res = await fetch(`${getAdminUrl()}/api/licence/${deviceId}`, {
      headers: { 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      // 5xx server error — fall back to cache, don't block
      return current ?? { valid: false, reason: 'no_licence' };
    }

    const data: LicenceInfo & { billingEnabled?: boolean } = await res.json();

    // Billing globally disabled — grant free access
    if (data.billingEnabled === false) {
      const free: LicenceInfo = { valid: true, billingDisabled: true };
      await cacheLicence(free);
      return free;
    }

    // Normal result — cache and return
    await cacheLicence(data);
    return data;
  } catch {
    // Network dropped mid-request — fall back to cache
    if (current?.valid) return { ...current, offline: true };
    return { valid: false, reason: 'no_licence', offline: true };
  }
}

// ─── Initiate M-Pesa STK push ─────────────────────────────────────────────────
export async function chargeMpesa(
  deviceId: string,
  plan: BillingPlan,
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

  if (data.status === 'success' && data.licenceKey && data.plan) {
    await cacheLicence({
      valid:       true,
      plan:        data.plan,
      licenceKey:  data.licenceKey,
      expiresAt:   data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      activatedAt: data.activatedAt ?? new Date().toISOString(),
    });
  }
  return data;
}

// ─── Clear cached licence ─────────────────────────────────────────────────────
export async function clearCachedLicence(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.LICENCE).catch(() => {});
  await SecureStore.deleteItemAsync(KEYS.CHECKED_AT).catch(() => {});
}

// ─── Force the next checkLicence call to bypass the cache TTL ────────────────
// Call this before a background enforcement check so you always get a fresh
// server response rather than the cached value.
export async function invalidateLicenceCache(): Promise<void> {
  await SecureStore.setItemAsync(KEYS.CHECKED_AT, '0');
}
