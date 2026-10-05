import { useEffect, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import CustomTabBar from '../../components/navigation/CustomTabBar';
import { getCachedLicence } from '../../services/licenceService';
import { getDeviceID } from '../../services/secureStorage';

// Check every 5 minutes while app is open
const EXPIRY_CHECK_INTERVAL = 5 * 60 * 1000;

export default function TabsLayout() {
  const router  = useRouter();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const checkExpiry = async () => {
      try {
        const cached = await getCachedLicence();
        if (!cached) return;

        // Auto-lock if expired
        if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
          if (timerRef.current) clearInterval(timerRef.current);
          const deviceId = await getDeviceID();
          router.replace({
            pathname: '/(auth)/payment-required',
            params: { deviceId: deviceId ?? '', reason: 'expired' },
          });
        }
      } catch { /* non-fatal */ }
    };

    // Check immediately, then on interval
    checkExpiry();
    timerRef.current = setInterval(checkExpiry, EXPIRY_CHECK_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
