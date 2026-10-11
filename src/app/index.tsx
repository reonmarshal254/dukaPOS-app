import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { isDatabaseInitialized } from '../database';
import { isPINSet } from '../services/secureStorage';
// PRICING_REMOVED: Licence checking imports disabled
// import { getDeviceID, isInGracePeriod, getGraceRemainingMs } from '../services/secureStorage';
// import { checkLicence } from '../services/licenceService';
import { COLORS } from '../constants/colors';

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('Loading DukaPOS…');

  useEffect(() => {
    async function checkAppState() {
      try {
        // ── 1. First-run ───────────────────────────────────────────────────
        const isInitialized = await isDatabaseInitialized();
        if (!isInitialized) {
          router.replace('/(auth)/welcome');
          return;
        }

        // ── 2. PIN ─────────────────────────────────────────────────────────
        const hasPIN = await isPINSet();
        if (!hasPIN) {
          router.replace('/(auth)/set-pin');
          return;
        }

        // ── 3. Licence gate (DISABLED — App is now free) ──────────────────
        // PRICING_REMOVED: All subscription checks disabled
        // Payment flow screens preserved for future use but not enforced
        // Original code commented below:
        /*
        const deviceId = await getDeviceID();
        if (deviceId) {
          setStatus('Checking subscription…');
          const licence = await checkLicence(deviceId);

          if (!licence.valid) {
            if (licence.offline) {
              // Offline + no valid cache → apply 24h new-user grace period only
              const grace = await isInGracePeriod();
              if (grace) {
                const hrs = Math.ceil((await getGraceRemainingMs()) / 3_600_000);
                console.log(`[licence] Offline grace — ${hrs}h left`);
                // Allow through
              } else {
                // Offline, no grace, no valid licence — still allow through
                // The tabs layout will enforce as soon as the device is online
                console.log('[licence] Offline, no grace — will enforce when online');
              }
            } else {
              // Online + server confirmed invalid → hard block
              router.replace({
                pathname: '/(auth)/payment-required',
                params: { deviceId, reason: licence.reason ?? 'no_licence' },
              });
              return;
            }
          }
        }
        */

        // ── 4. Unlock ──────────────────────────────────────────────────────
        router.replace('/(auth)/unlock');
      } catch (error) {
        console.error('Error checking app state:', error);
        router.replace('/(auth)/unlock');
      } finally {
        setIsLoading(false);
      }
    }

    checkAppState();
  }, []);

  return (
    <View style={styles.container}>
      {isLoading && (
        <>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.text}>{status}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  text: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },
});
