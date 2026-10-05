/**
 * notificationService.ts
 *
 * expo-notifications throws a hard error at module-load time in Expo Go (SDK 53+).
 * We catch that error once synchronously at startup and store null — every
 * exported function checks for null and returns a safe no-op.
 *
 * In a development build or production build, the module loads normally and
 * all notification features work as expected.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ─── Capture the module (or null if we're in Expo Go) ─────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
let N: typeof import('expo-notifications') | null = null;
try {
  // require() — not import() — so the error is thrown synchronously here
  // and we can catch it before any notification code runs.
  N = require('expo-notifications');
} catch {
  console.log(
    '[notifications] expo-notifications unavailable (Expo Go). ' +
    'Use a development build for real notifications.'
  );
}

// ─── Keys stored in SecureStore ───────────────────────────────────────────────
const KEYS = {
  MORNING_ID:    'notif_morning_id',
  LOW_STOCK_IDS: 'notif_low_stock_ids',
  ENABLED:       'notif_enabled',
};

// ─── Foreground handler ───────────────────────────────────────────────────────
function setupForegroundHandler(): void {
  if (!N) return;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert:  true,
      shouldPlaySound:  true,
      shouldSetBadge:   true,
      shouldShowBanner: true,
      shouldShowList:   true,
    }),
  });
}

// ─── Android channels ─────────────────────────────────────────────────────────
export async function createNotificationChannels(): Promise<void> {
  if (!N || Platform.OS !== 'android') return;
  await N.setNotificationChannelAsync('dukapos-alerts', {
    name: 'DukaPOS Alerts',
    description: 'Stock alerts and business reminders',
    importance: N.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2563EB',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });
  await N.setNotificationChannelAsync('dukapos-reminders', {
    name: 'Daily Reminders',
    description: 'Morning shop opening reminder',
    importance: N.AndroidImportance.DEFAULT,
    sound: 'default',
    showBadge: true,
  });
}

// ─── Permissions ──────────────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (!N) return false;
  const { status: existing } = await N.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await N.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  const granted = status === 'granted';
  await SecureStore.setItemAsync(KEYS.ENABLED, granted ? '1' : '0');
  return granted;
}

export async function getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (!N) return 'denied';
  const { status } = await N.getPermissionsAsync();
  return status as 'granted' | 'denied' | 'undetermined';
}

export async function isNotificationsEnabled(): Promise<boolean> {
  if (!N) return false;
  const stored = await SecureStore.getItemAsync(KEYS.ENABLED);
  if (stored !== null) return stored === '1';
  return (await getPermissionStatus()) === 'granted';
}

// ─── 7 AM daily reminder ──────────────────────────────────────────────────────
export async function scheduleMorningReminder(): Promise<void> {
  if (!N) return;
  await cancelMorningReminder();
  const id = await N.scheduleNotificationAsync({
    content: {
      title: '🏪 Good morning! Shop time.',
      body:  'Open DukaPOS, check your stock and get ready for the day.',
      sound: 'default',
      badge: 1,
      data:  { type: 'morning_reminder' },
      ...(Platform.OS === 'android' && { channelId: 'dukapos-reminders' }),
    },
    trigger: {
      type:   N.SchedulableTriggerInputTypes.DAILY,
      hour:   7,
      minute: 0,
    },
  });
  await SecureStore.setItemAsync(KEYS.MORNING_ID, id);
}

export async function cancelMorningReminder(): Promise<void> {
  if (!N) return;
  const id = await SecureStore.getItemAsync(KEYS.MORNING_ID);
  if (id) {
    await N.cancelScheduledNotificationAsync(id).catch(() => {});
    await SecureStore.deleteItemAsync(KEYS.MORNING_ID);
  }
}

export async function isMorningReminderScheduled(): Promise<boolean> {
  if (!N) return false;
  const id = await SecureStore.getItemAsync(KEYS.MORNING_ID);
  if (!id) return false;
  const scheduled = await N.getAllScheduledNotificationsAsync();
  return scheduled.some(n => n.identifier === id);
}

// ─── Low-stock alerts ─────────────────────────────────────────────────────────
export async function sendLowStockNotification(
  products: Array<{ id: string; name: string; currentQuantity: number; unit: string }>
): Promise<void> {
  if (!N || products.length === 0) return;

  const raw = await SecureStore.getItemAsync(KEYS.LOW_STOCK_IDS);
  const notifiedIds: string[] = raw ? JSON.parse(raw) : [];
  const fresh = products.filter(p => !notifiedIds.includes(p.id));
  if (fresh.length === 0) return;

  if (fresh.length === 1) {
    const p = fresh[0];
    await N.scheduleNotificationAsync({
      content: {
        title: '⚠️ Low Stock Alert',
        body:  `${p.name} is running low — only ${p.currentQuantity} ${p.unit} left.`,
        sound: 'default',
        badge: 1,
        data:  { type: 'low_stock', productId: p.id },
        ...(Platform.OS === 'android' && { channelId: 'dukapos-alerts' }),
      },
      trigger: null,
    });
  } else {
    await N.scheduleNotificationAsync({
      content: {
        title: `⚠️ ${fresh.length} items running low`,
        body:  fresh.map(p => `${p.name} (${p.currentQuantity} ${p.unit})`).join(', '),
        sound: 'default',
        badge: fresh.length,
        data:  { type: 'low_stock_bulk', count: fresh.length },
        ...(Platform.OS === 'android' && { channelId: 'dukapos-alerts' }),
      },
      trigger: null,
    });
  }

  const updated = [...notifiedIds, ...fresh.map(p => p.id)].slice(-50);
  await SecureStore.setItemAsync(KEYS.LOW_STOCK_IDS, JSON.stringify(updated));
}

export async function clearLowStockNotifiedId(productId: string): Promise<void> {
  const raw = await SecureStore.getItemAsync(KEYS.LOW_STOCK_IDS);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  await SecureStore.setItemAsync(
    KEYS.LOW_STOCK_IDS,
    JSON.stringify(ids.filter(id => id !== productId))
  );
}

// ─── Notification response listener (for deep-linking on tap) ─────────────────
export function addNotificationResponseListener(
  handler: (data: Record<string, unknown>) => void
): { remove: () => void } {
  if (!N) return { remove: () => {} };
  const sub = N.addNotificationResponseReceivedListener((response) => {
    handler(response.notification.request.content.data as Record<string, unknown>);
  });
  return sub;
}

// ─── Full initialisation (call once on app start) ──────────────────────────────
export async function initNotifications(): Promise<boolean> {
  if (!N) return false;
  setupForegroundHandler();
  await createNotificationChannels();
  const granted = await requestNotificationPermission();
  if (granted) {
    const alreadyScheduled = await isMorningReminderScheduled();
    if (!alreadyScheduled) await scheduleMorningReminder();
  }
  return granted;
}

// ─── Test helper ──────────────────────────────────────────────────────────────
export async function sendTestNotification(): Promise<boolean> {
  if (!N) return false;
  await N.scheduleNotificationAsync({
    content: {
      title: '🏪 DukaPOS Test',
      body:  'Notifications are working correctly!',
      sound: 'default',
      badge: 1,
    },
    trigger: null,
  });
  return true;
}
