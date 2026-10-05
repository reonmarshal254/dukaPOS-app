import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getDeviceID, storeDeviceID, getBusinessID } from '../services/secureStorage';
import { executeQuerySingle, executeWrite } from '../database';
import { TABLES } from '../database/schema';
import { generateUUID } from '../utils/uuid';
import { getCurrentDateTime } from '../utils/datetime';

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

// ─── Admin API URL ─────────────────────────────────────────────────────────────
// Read from app.config.js extra — the only reliable way to pass env vars to
// React Native at runtime. Falls back to the Android emulator host.
function getAdminUrl(): string {
  return (
    (Constants.expoConfig?.extra as any)?.adminApiUrl ??
    'http://10.0.2.2:5000'
  );
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
// Fire-and-forget — never blocks the app, always logs the result so you can
// confirm it's reaching the server.
async function reportToAdmin(info: DeviceInfo, businessId: string): Promise<void> {
  try {
    const biz = await executeQuerySingle<{
      name: string; owner_name: string; phone: string; location: string;
    }>(`SELECT name, owner_name, phone, location FROM businesses WHERE id = ?`, [businessId]);

    const adminUrl = getAdminUrl();
    const payload = {
      deviceId:     info.deviceId,
      businessName: biz?.name         ?? null,
      ownerName:    biz?.owner_name   ?? null,
      phone:        biz?.phone        ?? null,
      location:     biz?.location     ?? null,
      deviceName:   info.deviceName,
      deviceModel:  info.deviceModel,
      osName:       info.osName,
      osVersion:    info.osVersion,
      appVersion:   info.appVersion,
      buildNumber:  info.appBuildNumber,
      platform:     Platform.OS,
      isPhysical:   info.isPhysicalDevice,
    };

    console.log(`[useDevice] POST ${adminUrl}/api/register`, JSON.stringify(payload));

    const res = await fetch(`${adminUrl}/api/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (res.ok) {
      console.log('[useDevice] Admin registration successful');
    } else {
      console.warn('[useDevice] Admin registration failed:', res.status, await res.text());
    }
  } catch (err: any) {
    console.warn('[useDevice] Admin registration error:', err.message);
  }
}

// ─── Local DB upsert ──────────────────────────────────────────────────────────
async function registerDeviceInDB(info: DeviceInfo): Promise<void> {
  const businessId = await getBusinessID();
  if (!businessId) {
    console.log('[useDevice] No businessId yet — skipping DB + admin registration');
    return;
  }

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
