// PRICING_REMOVED: Licence checking imports disabled
// import { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import CustomTabBar from '../../components/navigation/CustomTabBar';
// import { getCachedLicence, checkLicence, getAdminUrl, invalidateLicenceCache } from '../../services/licenceService';
// import { getDeviceID, isInGracePeriod } from '../../services/secureStorage';

// Check expiry every 5 minutes while app is open
// const EXPIRY_CHECK_INTERVAL = 5 * 60 * 1000;
// Check connectivity every 2 minutes to enforce billing when online
// const ONLINE_CHECK_INTERVAL = 2 * 60 * 1000;

export default function TabsLayout() {
  // PRICING_REMOVED: No router or timer refs needed
  // const router  = useRouter();
  // const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // PRICING_REMOVED: All background licence enforcement disabled
  // App is now free — no subscription checks running
  // Original enforcement code commented below for future restoration:
  /*
  useEffect(() => {
    const checkExpiry = async () => {
      try {
        const cached = await getCachedLicence();
        if (!cached) return;
        // Auto-lock if locally expired
        if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
          if (timerRef.current) clearInterval(timerRef.current);
          const deviceId = await getDeviceID();
          router.replace({
            pathname: '/(auth)/payment-required',
            params: { deviceId: deviceId ?? '', reason: 'expired' },
          });
        }
      } catch { /* non-fatal *\/ }
    };

    const checkOnlineEnforcement = async () => {
      try {
        // Quick ping — skip everything if offline
        const ping = await fetch(`${getAdminUrl()}/health`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(3000),
        });
        if (!ping.ok && ping.status >= 500) return;

        const deviceId = await getDeviceID();
        if (!deviceId) return;

        // Force-clear cache TTL so we get a fresh server response
        await invalidateLicenceCache();

        const licence = await checkLicence(deviceId);

        if (!licence.valid && !licence.offline) {
          // Online + server confirmed invalid → enforce payment gate
          const inGrace = await isInGracePeriod();
          if (!inGrace) {
            if (timerRef.current) clearInterval(timerRef.current);
            router.replace({
              pathname: '/(auth)/payment-required',
              params: { deviceId, reason: licence.reason ?? 'no_licence' },
            });
          }
        }
      } catch {
        // Offline or transient error — never block
      }
    };

    // Run both immediately, then on intervals
    checkExpiry();
    checkOnlineEnforcement();

    timerRef.current = setInterval(() => {
      checkExpiry();
      checkOnlineEnforcement();
    }, EXPIRY_CHECK_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  */

  return (
    <Tabs
      tabBar={() => <CustomTabBar />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="products" />
      <Tabs.Screen name="pos" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="settings" />

      {/* Nested routes — hidden from tab bar */}
      <Tabs.Screen name="pos/cart"                     options={{ href: null }} />
      <Tabs.Screen name="pos/checkout"                 options={{ href: null }} />
      <Tabs.Screen name="pos/receipt"                  options={{ href: null }} />
      <Tabs.Screen name="products/[id]"                options={{ href: null }} />
      <Tabs.Screen name="products/add"                 options={{ href: null }} />
      <Tabs.Screen name="settings/biometric"           options={{ href: null }} />
      <Tabs.Screen name="settings/change-pin"          options={{ href: null }} />
      <Tabs.Screen name="settings/business-profile"    options={{ href: null }} />
      <Tabs.Screen name="settings/backup-restore"      options={{ href: null }} />
      <Tabs.Screen name="settings/notifications"       options={{ href: null }} />
      <Tabs.Screen name="inventory/adjustment"         options={{ href: null }} />
      <Tabs.Screen name="inventory/damaged"            options={{ href: null }} />
      <Tabs.Screen name="inventory/expiring"           options={{ href: null }} />
      <Tabs.Screen name="inventory/expenses"           options={{ href: null }} />
    </Tabs>
  );
}
