import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PLANS, type Plan } from '../../services/licenceService';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

const { width } = Dimensions.get('window');

const FEATURES = [
  'Unlimited products & categories',
  'Full POS & checkout',
  'Inventory management',
  'Sales reports & analytics',
  'Offline-first — works without internet',
  'Barcode scanning',
  'Receipt printing',
  'Low-stock notifications',
];

export default function PricingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId } = useLocalSearchParams<{ deviceId: string }>();
  const [selected, setSelected] = useState<Plan>('monthly');

  const plan = PLANS[selected];

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark, '#1E3A8A']}
      start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={s.circle1} /><View style={s.circle2} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={s.backText}>←</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>DukaPOS Pricing</Text>
          </View>

          <Text style={s.heroTitle}>Unlock your full{'\n'}business toolkit</Text>
          <Text style={s.heroSub}>Choose a plan that works for you. Cancel anytime.</Text>

          {/* Plan selector */}
          <View style={s.planGrid}>
            {(Object.entries(PLANS) as [Plan, typeof PLANS[Plan]][]).map(([key, p]) => {
              const active = selected === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[s.planCard, active && s.planCardActive]}
                  onPress={() => setSelected(key)}
                  activeOpacity={0.8}
                >
                  {p.popular && (
                    <View style={s.popularBadge}>
                      <Text style={s.popularText}>Popular</Text>
                    </View>
                  )}
                  <Text style={[s.planLabel, active && s.planLabelActive]}>{p.label}</Text>
                  <Text style={[s.planPrice, active && s.planPriceActive]}>
                    KES {p.price.toLocaleString()}
                  </Text>
                  <Text style={[s.planDuration, active && s.planDurationActive]}>{p.duration}</Text>
                  {active && <View style={s.checkmark}><Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '700' }}>✓</Text></View>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Features */}
          <View style={s.featuresCard}>
            <Text style={s.featuresTitle}>What's included</Text>
            {FEATURES.map((f) => (
              <View key={f} style={s.featureRow}>
                <Text style={s.featureCheck}>✓</Text>
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={s.ctaBtn}
            activeOpacity={0.88}
            onPress={() => router.push({
              pathname: '/(auth)/payment',
              params: { plan: selected, deviceId: deviceId ?? '' },
            })}
          >
            <Text style={s.ctaText}>
              Subscribe — KES {plan.price.toLocaleString()} / {plan.duration}
            </Text>
          </TouchableOpacity>

          <Text style={s.note}>
            Payments secured by Paystack · Licence tied to this device
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: SPACING.lg },
  circle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.05)', top: -80, right: -60 },
  circle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90,  backgroundColor: 'rgba(255,255,255,0.04)', bottom: 60, left: -50 },

  header: { flexDirection: 'row', alignItems: 'center', paddingTop: SPACING.md, marginBottom: SPACING.xl },
  backBtn: { marginRight: SPACING.md },
  backText: { fontSize: 22, color: '#FFFFFF' },
  headerTitle: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: 'rgba(255,255,255,0.8)' },

  heroTitle: { fontSize: TYPOGRAPHY.fontSize['3xl'], fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF', lineHeight: 40, marginBottom: SPACING.sm },
  heroSub:   { fontSize: TYPOGRAPHY.fontSize.sm, color: 'rgba(255,255,255,0.65)', marginBottom: SPACING.xl },

  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  planCard: {
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    position: 'relative', overflow: 'hidden',
  },
  planCardActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  planLabel:    { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  planLabelActive: { color: COLORS.textSecondary },
  planPrice:    { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF', marginBottom: 2 },
  planPriceActive: { color: COLORS.primary },
  planDuration: { fontSize: TYPOGRAPHY.fontSize.xs, color: 'rgba(255,255,255,0.55)' },
  planDurationActive: { color: COLORS.textSecondary },
  checkmark: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  popularBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#FBBF24', paddingHorizontal: 8, paddingVertical: 3, borderBottomLeftRadius: 8 },
  popularText: { fontSize: 9, fontWeight: '800', color: '#1E1B4B' },

  featuresCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  featuresTitle: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF', marginBottom: SPACING.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.sm },
  featureCheck: { fontSize: 14, color: '#34D399', fontWeight: '700', width: 18 },
  featureText:  { fontSize: TYPOGRAPHY.fontSize.sm, color: 'rgba(255,255,255,0.85)', flex: 1 },

  ctaBtn: { backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.xl, paddingVertical: SPACING.md + 2, alignItems: 'center', marginBottom: SPACING.md, ...SHADOWS.lg },
  ctaText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primary },
  note: { fontSize: TYPOGRAPHY.fontSize.xs, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: SPACING.lg },
});
