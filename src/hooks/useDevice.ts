import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as Network from 'expo-network';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getDeviceID, storeDeviceID, getBusinessID } from '../services/secureStorage';
import { executeQuerySingle, executeWrite } from '../database';
import { TABLES } from '../database/schema';
import { generateUUID } from '../utils/uuid';
import { getCurrentDateTime } from '../utils/datetime';
import { ensureBusinessID } from '../services/businessSync';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  osName: string;
  osVersion: string;
  appVersion: string;
  appBuildNumber: string;
  isPhysicalDevice: boolean;
  registeredAt: string;
}

// ─── Sync status tracking ─────────────────────────────────────────────────────
interface SyncStatus {
  lastSyncAttempt: number | null;
  lastSuccessfulSync: number | null;
  retryCount: number;
}

const syncStatus: SyncStatus = {
  lastSyncAttempt: null,
  lastSuccessfulSync: null,
  retryCount: 0,
};

// Minimum time between sync attempts (5 minutes)
const MIN_SYNC_INTERVAL = 5 * 60 * 1000;

// ─── Admin API URL ─────────────────────────────────────────────────────────────
// Read from app.config.js extra — the only reliable way to pass env vars to
// React Native at runtime. Falls back to production URL.
function getAdminUrl(): string {
  try {
    return (
      (Constants.expoConfig?.extra as any)?.adminApiUrl ??
      'https://dukapos-gjfx.onrender.com'
    );
  } catch (error) {
    // Fallback if Constants fails
    return 'https://dukapos-gjfx.onrender.com';
  }
}

// ─── Network detection ────────────────────────────────────────────────────────
async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected === true && state.isInternetReachable === true;
  } catch (error) {
    console.warn('[useDevice] Network check error:', error);
    return false;
  }
}

// ─── Stable device ID ─────────────────────────────────────────────────────────
async function resolveDeviceId(): Promise<string> {
  if (Platform.OS === 'android') {
    try {
      const androidId = Application.getAndroidId();
      if (androidId) return androidId;
    } catch (_) {}
  }
  const stored = await getDeviceID();
  if (stored) return stored;
  const newId = generateUUID();
  await storeDeviceID(newId);
  return newId;
}

// ─── Report to admin backend ───────────────────────────────────────────────────
/**
 * Syncs business registration and device details to admin backend.
 * Only runs when online and respects minimum sync intervals.
 * Fire-and-forget — never blocks the app, always logs the result.
 */
async function reportToAdmin(info: DeviceInfo, businessId: string): Promise<void> {
  try {
    // Check if we're online
    const online = await isOnline();
    if (!online) {
      console.log('[useDevice] Offline — skipping admin sync');
      return;
    }

    // Check if we've synced recently (avoid redundant calls)
    const now = Date.now();
    if (
      syncStatus.lastSyncAttempt &&
      now - syncStatus.lastSyncAttempt < MIN_SYNC_INTERVAL
    ) {
      console.log('[useDevice] Sync attempted recently — skipping');
      return;
    }

    syncStatus.lastSyncAttempt = now;

    // Fetch business details
    const biz = await executeQuerySingle<{
      name: string;
      owner_name: string;
      phone: string;
      location: string;
    }>(`SELECT name, owner_name, phone, location FROM ${TABLES.BUSINESSES} WHERE id = ?`, [businessId]);

    if (!biz) {
      console.warn('[useDevice] Business record not found for ID:', businessId);
      return;
    }

    const adminUrl = getAdminUrl();
    const payload = {
      deviceId: info.deviceId,
      businessName: biz.name,
      ownerName: biz.owner_name,
      phone: biz.phone,
      location: biz.location,
      deviceName: info.deviceName,
      deviceModel: info.deviceModel,
      osName: info.osName,
      osVersion: info.osVersion,
      appVersion: info.appVersion,
      buildNumber: info.appBuildNumber,
      platform: Platform.OS,
      isPhysical: info.isPhysicalDevice,
    };

    console.log(`[useDevice] POST ${adminUrl}/api/register`);

    const res = await fetch(`${adminUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      console.log('[useDevice] ✅ Admin sync successful');
      syncStatus.lastSuccessfulSync = now;
      syncStatus.retryCount = 0;
    } else {
      const text = await res.text();
      console.warn('[useDevice] ⚠️ Admin sync failed:', res.status, text);
      syncStatus.retryCount++;
    }
  } catch (err: any) {
    console.warn('[useDevice] ⚠️ Admin sync error:', err.message);
    syncStatus.retryCount++;
  }
}

// ─── Local DB upsert ──────────────────────────────────────────────────────────
async function registerDeviceInDB(info: DeviceInfo): Promise<void> {
  // Ensure business ID exists (auto-generate if missing)
  const businessId = await ensureBusinessID();

  const now = getCurrentDateTime();
  const existing = await executeQuerySingle<{ id: string }>(
    `SELECT id FROM ${TABLES.DEVICES} WHERE id = ?`,
    [info.deviceId]
  );

  if (existing) {
    await executeWrite(
      `UPDATE ${TABLES.DEVICES}
       SET device_name = ?, device_model = ?, os_version = ?, app_version = ?,
           last_heartbeat = ?, is_active = 1
       WHERE id = ?`,
      [info.deviceName, info.deviceModel, `${info.osName} ${info.osVersion}`,
       info.appVersion, now, info.deviceId]
    );
  } else {
    await executeWrite(
      `INSERT INTO ${TABLES.DEVICES} (
        id, business_id, device_name, device_model, os_version,
        app_version, registered_at, last_heartbeat, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [info.deviceId, businessId, info.deviceName, info.deviceModel,
       `${info.osName} ${info.osVersion}`, info.appVersion, now, now, 1]
    );
  }

  // Report to admin backend (fire-and-forget with logging)
  reportToAdmin(info, businessId);
}

// ─── Core fetch function ──────────────────────────────────────────────────────
async function fetchDeviceInfo(): Promise<DeviceInfo> {
  const deviceId = await resolveDeviceId();

  const deviceName =
    Device.deviceName ?? Device.modelName ??
    (Platform.OS === 'ios' ? 'iPhone' : 'Android Device');
  const deviceModel    = Device.modelName ?? 'Unknown Model';
  const osName         = Device.osName    ?? (Platform.OS === 'ios' ? 'iOS' : 'Android');
  const osVersion      = Device.osVersion ?? Platform.Version?.toString() ?? 'Unknown';
  const appVersion     = Application.nativeApplicationVersion ?? '1.0.0';
  const appBuildNumber = Application.nativeBuildVersion ?? '1';
  const isPhysicalDevice = Device.isDevice ?? false;

  const existingRow = await executeQuerySingle<{ registered_at: string }>(
    `SELECT registered_at FROM ${TABLES.DEVICES} WHERE id = ?`,
    [deviceId]
  );
  const registeredAt = existingRow?.registered_at ?? getCurrentDateTime();

  const info: DeviceInfo = {
    deviceId, deviceName, deviceModel,
    osName, osVersion, appVersion,
    appBuildNumber, isPhysicalDevice, registeredAt,
  };

  // Run local DB + admin report in background — don't await
  registerDeviceInDB(info).catch((err) =>
    console.warn('[useDevice] registerDeviceInDB error:', err)
  );

  return info;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useDevice() {
  return useQuery<DeviceInfo>({
    queryKey: ['device'],
    queryFn: fetchDeviceInfo,
    // Re-fetch on every app focus so post-setup registrations are sent
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: Infinity,
  });
}

/**
 * Call this after business setup completes so the admin gets the registration
 * immediately without waiting for the next app restart.
 */
export function useForceDeviceRefresh() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['device'] });
}
