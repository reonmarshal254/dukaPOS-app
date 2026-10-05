import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { PLANS } from '../../services/licenceService';
import { getGraceRemainingMs } from '../../services/secureStorage';

export default function PaymentRequiredScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { deviceId, reason } = useLocalSearchParams<{ deviceId: string; reason: string }>();
  const [graceHours, setGraceHours] = useState(0);

  useEffect(() => {
    getGraceRemainingMs().then((ms) => setGraceHours(Math.ceil(ms / 3_600_000)));
  }, []);

  const isExpired   = reason === 'expired';
  const isSuspended = reason === 'suspended';

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark, '#1E3A8A']}
      start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={s.circle1} /><View style={s.circle2} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={[s.container, { paddingBottom: insets.bottom }]}>

          {/* Lock icon */}
          <View style={s.lockWrap}>
            <Text style={s.lockEmoji}>{isSuspended ? '🚫' : '🔒'}</Text>
          </View>

          <Text style={s.title}>
            {isSuspended ? 'Account Suspended' : isExpired ? 'Subscription Expired' : 'Subscription Required'}
          </Text>
          <Text style={s.subtitle}>
            {isSuspended
              ? 'Your account has been suspended. Please contact support to resolve this.'
              : isExpired
              ? 'Your subscription has expired. Renew now to continue using DukaPOS.'
              : 'You need an active subscription to use DukaPOS.'}
          </Text>

          {/* Quick plan pills */}
          {!isSuspended && (
            <View style={s.planRow}>
              {(Object.entries(PLANS) as any[]).map(([key, p]: any) => (
                <TouchableOpacity
                  key={key}
                  style={s.planPill}
                  activeOpacity={0.8}
                  onPress={() => router.push({
                    pathname: '/(auth)/payment',
                    params: { plan: key, deviceId },
                  })}
                >
                  <Text style={s.planPillLabel}>{p.label}</Text>
                  <Text style={s.planPillPrice}>KES {p.price.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Grace period banner for new users */}
          {graceHours > 0 && !isSuspended && (
            <View style={s.graceBanner}>
              <Text style={s.graceText}>
                🎁 You have {graceHours}h free trial remaining. Subscribe before it expires to keep access.
              </Text>
            </View>
          )}

          {/* Primary CTA */}
          {!isSuspended && (
            <TouchableOpacity
              style={s.ctaBtn}
              activeOpacity={0.88}
              onPress={() => router.push({ pathname: '/(auth)/pricing', params: { deviceId } })}
            >
              <Text style={s.ctaText}>View Plans  →</Text>
            </TouchableOpacity>
          )}

          {/* Support link for suspended */}
          {isSuspended && (
            <View style={s.supportCard}>
              <Text style={s.supportText}>
                Contact support to resolve your account suspension.
              </Text>
              <Text style={s.supportEmail}>support@dukapos.app</Text>
            </View>
          )}

          {/* Device ID note */}
          <View style={s.deviceNote}>
            <Text style={s.deviceNoteText}>
              Device ID: {deviceId ? `${deviceId.slice(0, 10)}…` : 'unknown'}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.lg, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  circle1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.05)', top: -80, right: -60 },
  circle2: { position: 'absolute', width: 160, height: 160, borderRadius: 80,  backgroundColor: 'rgba(255,255,255,0.04)', bottom: 60, left: -40 },

  lockWrap: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  lockEmoji: { fontSize: 44 },

  title: { fontSize: TYPOGRAPHY.fontSize['2xl'], fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF', textAlign: 'center' },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.sm, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 22, maxWidth: 300 },

  planRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, justifyContent: 'center', width: '100%' },
  planPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BORDER_RADIUS.xl, paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', minWidth: 80,
  },
  planPillLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.4 },
  planPillPrice: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF', marginTop: 2 },

  ctaBtn: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.xl, paddingVertical: SPACING.md + 2, alignItems: 'center', ...SHADOWS.md },
  ctaText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primary },

  supportCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', width: '100%' },
  supportText:  { fontSize: TYPOGRAPHY.fontSize.sm, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: SPACING.sm },
  supportEmail: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FBBF24' },

  deviceNote: { marginTop: SPACING.sm },
  deviceNoteText: { fontSize: TYPOGRAPHY.fontSize.xs, color: 'rgba(255,255,255,0.35)', textAlign: 'center' },

  graceBanner: {
    width: '100%',
    backgroundColor: 'rgba(251,191,36,0.2)',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.4)',
  },
  graceText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#FBBF24',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});
