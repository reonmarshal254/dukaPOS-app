import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { isDatabaseInitialized } from '../database';
import { isPINSet, getDeviceID, isInGracePeriod, getGraceRemainingMs } from '../services/secureStorage';
import { checkLicence } from '../services/licenceService';
import { COLORS } from '../constants/colors';

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('Loading DukaPOS…');

  useEffect(() => {
    async function checkAppState() {
      try {
        // ── 1. First-run setup ─────────────────────────────────────────────
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

        // ── 3. Licence gate ────────────────────────────────────────────────
        // checkLicence is offline-safe:
        //  - Online  → verifies with server, blocks if truly invalid
        //  - Offline → trusts valid cache OR grants grace period so POS works
        // Subscriptions can only be purchased when online (enforced in payment.tsx)
        const deviceId = await getDeviceID();

        if (deviceId) {
          setStatus('Checking subscription…');
          const licence = await checkLicence(deviceId);

          if (!licence.valid) {
            // New users get a 24h grace period before payment is required
            const grace = await isInGracePeriod();
            if (grace) {
              const remainingMs = await getGraceRemainingMs();
              const remainingHrs = Math.ceil(remainingMs / 3_600_000);
              console.log(`[licence] Grace period active — ${remainingHrs}h remaining`);
              // Continue to unlock — grace period applies
            } else {
              router.replace({
                pathname: '/(auth)/payment-required',
                params: { deviceId, reason: licence.reason ?? 'no_licence' },
              });
              return;
            }
          }
        }

        // ── 4. Unlock ──────────────────────────────────────────────────────
        router.replace('/(auth)/unlock');
      } catch (error) {
        console.error('Error checking app state:', error);
        // On unexpected error → unlock anyway so POS is never hard-blocked
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
