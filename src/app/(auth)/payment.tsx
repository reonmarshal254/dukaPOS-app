import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { chargeMpesa, pollPayment, PLANS, getAdminUrl, type Plan } from '../../services/licenceService';
import { useDevice } from '../../hooks/useDevice';

type Step = 'input' | 'waiting' | 'verifying';

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS        = 40;   // 40 × 3s = 2 min max

export default function PaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { plan, deviceId: paramDeviceId } = useLocalSearchParams<{ plan: Plan; deviceId: string }>();
  const { data: deviceInfo } = useDevice();

  const deviceId = paramDeviceId || deviceInfo?.deviceId || '';
  const planInfo = PLANS[plan as Plan] ?? PLANS.monthly;

  const [digits, setDigits]       = useState('');   // last 9 digits after +254
  const [step, setStep]           = useState<Step>('input');
  const [reference, setReference] = useState('');
  const [pollCount, setPollCount] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => { if (pollTimer.current) clearTimeout(pollTimer.current); };
  }, []);

  // ── Phone formatting ─────────────────────────────────────────────────────
  const fullPhone = `+254${digits.replace(/\D/g, '').slice(0, 9)}`;
  const phoneReady = digits.replace(/\D/g, '').length === 9;

  // ── Submit ───────────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!phoneReady) {
      Alert.alert('Invalid Number', 'Please enter all 9 digits after +254');
      return;
    }
    if (!deviceId) {
      Alert.alert('Error', 'Device not identified. Please restart the app.');
      return;
    }

    // Subscription requires internet — check before doing anything
    setStep('waiting');
    setStatusMsg('Checking connection…');
    try {
      const ping = await fetch(`${getAdminUrl()}/health`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(4000),
      });
      if (!ping.ok && ping.status >= 500) throw new Error('server error');
    } catch {
      setStep('input');
      Alert.alert(
        'No Internet Connection',
        'Subscribing to DukaPOS requires an active internet connection. Please connect and try again.'
      );
      return;
    }

    setStatusMsg('Sending M-Pesa prompt to your phone…');

    try {
      const result = await chargeMpesa(deviceId, plan as Plan, fullPhone);
      setReference(result.reference);
      setStatusMsg(result.displayText || 'Check your phone for the M-Pesa prompt');
      startPolling(result.reference);
    } catch (err: any) {
      Alert.alert('Payment Failed', err.message || 'Could not initiate payment. Try again.');
      setStep('input');
    }
  };

  // ── Polling ──────────────────────────────────────────────────────────────
  const startPolling = (ref: string, count = 0) => {
    setPollCount(count);
    if (count >= MAX_POLLS) {
      Alert.alert('Timed Out', 'Payment confirmation took too long. If you completed the M-Pesa payment, contact support with reference: ' + ref);
      setStep('input');
      return;
    }

    pollTimer.current = setTimeout(async () => {
      try {
        const result = await pollPayment(ref);

        if (result.status === 'success') {
          setStep('verifying');
          router.replace({
            pathname: '/(auth)/payment-success',
            params: {
              licenceKey: result.licenceKey ?? '',
              plan:       result.plan ?? plan,
              expiresAt:  result.expiresAt ?? '',
            },
          });
          return;
        }

        if (result.status === 'failed') {
          Alert.alert('Payment Failed', 'The M-Pesa payment was not completed. Please try again.');
          setStep('input');
          return;
        }

        // Still pending — update message and keep polling
        const elapsed = Math.round(((count + 1) * POLL_INTERVAL_MS) / 1000);
        setStatusMsg(`Waiting for confirmation… (${elapsed}s)`);
        startPolling(ref, count + 1);
      } catch {
        // Network hiccup — retry silently
        startPolling(ref, count + 1);
      }
    }, POLL_INTERVAL_MS);
  };

  // ── Cancel ───────────────────────────────────────────────────────────────
  const handleCancel = () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    setStep('input');
    setReference('');
  };

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark, '#1E3A8A']}
      start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={s.circle1} /><View style={s.circle2} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={[s.header, { marginBottom: SPACING.xl }]}>
            <TouchableOpacity
              onPress={() => step === 'waiting' ? handleCancel() : router.back()}
              style={s.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={s.backText}>←</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>M-Pesa Payment</Text>
          </View>

          {/* ── Input step ──────────────────────────────────────────────── */}
          {step === 'input' && (
            <View style={s.body}>
              {/* Plan summary */}
              <View style={s.planBadge}>
                <Text style={s.planBadgeLabel}>{planInfo.label} Plan</Text>
                <Text style={s.planBadgePrice}>KES {planInfo.price.toLocaleString()}</Text>
                <Text style={s.planBadgeDuration}>{planInfo.duration}</Text>
              </View>

              <Text style={s.prompt}>Enter your M-Pesa number</Text>
              <Text style={s.hint}>You'll receive an STK push to confirm</Text>

              {/* Phone input */}
              <View style={s.inputRow}>
                <View style={s.prefix}>
                  <Text style={s.prefixText}>🇰🇪  +254</Text>
                </View>
                <TextInput
                  style={s.input}
                  value={digits}
                  onChangeText={(t) => setDigits(t.replace(/\D/g, '').slice(0, 9))}
                  placeholder="712 345 678"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  keyboardType="number-pad"
                  maxLength={9}
                  autoFocus
                />
              </View>

              {/* Preview */}
              {digits.length > 0 && (
                <Text style={s.preview}>
                  Sending to: <Text style={{ fontWeight: '700' }}>{fullPhone}</Text>
                </Text>
              )}

              <TouchableOpacity
                style={[s.payBtn, !phoneReady && s.payBtnDisabled]}
                onPress={handlePay}
                disabled={!phoneReady}
                activeOpacity={0.85}
              >
                <Text style={s.payBtnText}>
                  Pay KES {planInfo.price.toLocaleString()} →
                </Text>
              </TouchableOpacity>

              <Text style={s.secureNote}>🔒 Secured by Paystack · Instant M-Pesa</Text>
            </View>
          )}

          {/* ── Waiting / polling step ──────────────────────────────────── */}
          {(step === 'waiting' || step === 'verifying') && (
            <View style={s.waitingBody}>
              {/* Phone icon animation */}
              <View style={s.phoneIconWrap}>
                <Text style={s.phoneIcon}>📱</Text>
              </View>

              <Text style={s.waitingTitle}>
                {step === 'verifying' ? 'Confirmed! Activating…' : 'Check your phone'}
              </Text>
              <Text style={s.waitingMsg}>{statusMsg}</Text>

              <View style={s.stepsCard}>
                {[
                  'A prompt appeared on your screen',
                  `Enter your M-Pesa PIN`,
                  'Confirm the KES ' + planInfo.price.toLocaleString() + ' payment',
                  'Your licence activates instantly',
                ].map((t, i) => (
                  <View key={i} style={s.stepRow}>
                    <View style={[s.stepDot, i === 0 && s.stepDotActive]}>
                      <Text style={s.stepNum}>{i + 1}</Text>
                    </View>
                    <Text style={s.stepText}>{t}</Text>
                  </View>
                ))}
              </View>

              <ActivityIndicator size="large" color="#FFFFFF" style={{ marginBottom: SPACING.lg }} />

              {step === 'waiting' && (
                <TouchableOpacity style={s.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
                  <Text style={s.cancelText}>Cancel &amp; go back</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  circle1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.05)', top: -80, right: -60 },
  circle2: { position: 'absolute', width: 160, height: 160, borderRadius: 80,  backgroundColor: 'rgba(255,255,255,0.04)', bottom: 60, left: -40 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, gap: SPACING.md,
  },
  backBtn:     { padding: SPACING.xs },
  backText:    { fontSize: 22, color: '#FFFFFF' },
  headerTitle: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF' },

  // ── Input ──
  body: { flex: 1, paddingHorizontal: SPACING.lg, justifyContent: 'center', gap: SPACING.md },

  planBadge: {
    alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.xl, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: SPACING.sm,
  },
  planBadgeLabel:    { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.6 },
  planBadgePrice:    { fontSize: TYPOGRAPHY.fontSize['3xl'], fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF', marginVertical: 2 },
  planBadgeDuration: { fontSize: TYPOGRAPHY.fontSize.xs, color: 'rgba(255,255,255,0.55)' },

  prompt: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF', textAlign: 'center' },
  hint:   { fontSize: TYPOGRAPHY.fontSize.sm, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: -SPACING.xs },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)', overflow: 'hidden',
  },
  prefix: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.md,
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)',
  },
  prefixText: { fontSize: TYPOGRAPHY.fontSize.base, color: '#FFFFFF', fontWeight: TYPOGRAPHY.fontWeight.semibold },
  input: {
    flex: 1, fontSize: TYPOGRAPHY.fontSize.xl, color: '#FFFFFF',
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.md,
    letterSpacing: 2, fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  preview: { fontSize: TYPOGRAPHY.fontSize.sm, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },

  payBtn: {
    backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md + 2, alignItems: 'center', ...SHADOWS.md,
  },
  payBtnDisabled: { opacity: 0.45 },
  payBtnText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primary },

  secureNote: { fontSize: TYPOGRAPHY.fontSize.xs, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },

  // ── Waiting ──
  waitingBody: { flex: 1, paddingHorizontal: SPACING.lg, alignItems: 'center', justifyContent: 'center', gap: SPACING.lg },
  phoneIconWrap: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  phoneIcon:    { fontSize: 44 },
  waitingTitle: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF', textAlign: 'center' },
  waitingMsg:   { fontSize: TYPOGRAPHY.fontSize.sm, color: 'rgba(255,255,255,0.65)', textAlign: 'center', maxWidth: 280 },

  stepsCard: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', gap: SPACING.sm,
  },
  stepRow:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  stepDot:     { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepNum:     { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  stepText:    { fontSize: TYPOGRAPHY.fontSize.sm, color: 'rgba(255,255,255,0.8)', flex: 1 },

  cancelBtn:  { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg },
  cancelText: { fontSize: TYPOGRAPHY.fontSize.sm, color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' } as any,
});
