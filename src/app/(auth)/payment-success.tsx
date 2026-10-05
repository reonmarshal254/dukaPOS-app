import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import type { Plan } from '../../services/licenceService';

export default function PaymentSuccessScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { licenceKey, plan, expiresAt } = useLocalSearchParams<{
    licenceKey: string; plan: Plan; expiresAt: string;
  }>();

  const expiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Never (Lifetime)';

  return (
    <LinearGradient
      colors={['#059669', '#10B981', '#34D399']}
      start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={s.circle1} /><View style={s.circle2} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Success animation placeholder */}
          <View style={s.iconWrap}>
            <Text style={s.iconEmoji}>✅</Text>
          </View>

          <Text style={s.title}>Payment Successful!</Text>
          <Text style={s.subtitle}>Your DukaPOS licence has been activated</Text>

          {/* Licence card */}
          <View style={s.licenceCard}>
            <Text style={s.cardLabel}>Licence Details</Text>

            <View style={s.row}>
              <Text style={s.rowLabel}>Plan</Text>
              <Text style={s.rowValue}>{plan?.charAt(0).toUpperCase() + plan?.slice(1)}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLabel}>Expires</Text>
              <Text style={s.rowValue}>{expiry}</Text>
            </View>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Text style={s.rowLabel}>Licence Key</Text>
              <Text style={[s.rowValue, s.monospace]}>{licenceKey}</Text>
            </View>

            <View style={s.noteBanner}>
              <Text style={s.noteText}>
                🔒 This licence is tied to this device only and cannot be transferred.
              </Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={s.ctaBtn}
            activeOpacity={0.88}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={s.ctaText}>Start using DukaPOS →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: SPACING.lg, alignItems: 'center' },
  circle1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.07)', top: -80, right: -60 },
  circle2: { position: 'absolute', width: 160, height: 160, borderRadius: 80,  backgroundColor: 'rgba(255,255,255,0.05)', bottom: 80, left: -40 },

  iconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginTop: SPACING['2xl'], marginBottom: SPACING.lg },
  iconEmoji: { fontSize: 52 },

  title:    { fontSize: TYPOGRAPHY.fontSize['3xl'], fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF', textAlign: 'center', marginBottom: SPACING.sm },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.base, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: SPACING.xl },

  licenceCard: {
    width: '100%', backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg,
    marginBottom: SPACING.xl, ...SHADOWS.lg,
  },
  cardLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  rowLabel: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
  rowValue: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text, maxWidth: '60%', textAlign: 'right' },
  monospace: { fontFamily: 'monospace', fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.primary },
  noteBanner: { marginTop: SPACING.md, backgroundColor: '#EFF6FF', borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, borderWidth: 1, borderColor: '#BFDBFE' },
  noteText: { fontSize: TYPOGRAPHY.fontSize.xs, color: '#1E40AF', lineHeight: 18 },

  ctaBtn: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.xl, paddingVertical: SPACING.md + 2, alignItems: 'center', ...SHADOWS.md },
  ctaText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#059669' },
});
