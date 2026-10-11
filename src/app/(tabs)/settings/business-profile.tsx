import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useBusiness } from '../../../hooks/useBusiness';
// PRICING_REMOVED: Licence checking imports disabled
// import { checkLicence, type LicenceInfo, type Plan } from '../../../services/licenceService';
// import { getDeviceID } from '../../../services/secureStorage';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';

// ─── Plan display helpers ──────────────────────────────────────────────────────
const PLAN_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  daily:    { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' },
  weekly:   { bg: '#EDE9FE', text: '#5B21B6', border: '#C4B5FD' },
  monthly:  { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
  lifetime: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
};

function timeUntilExpiry(expiresAt: string | null | undefined): string {
  if (!expiresAt) return 'Lifetime — never expires';
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const hours = Math.floor(ms / 3_600_000);
  const days  = Math.floor(hours / 24);
  if (days >= 2)  return `${days} days remaining`;
  if (hours >= 1) return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
  const mins = Math.floor(ms / 60_000);
  return `${mins} minute${mins !== 1 ? 's' : ''} remaining`;
}

function urgencyColour(expiresAt: string | null | undefined): string {
  if (!expiresAt) return COLORS.success;
  const ms   = new Date(expiresAt).getTime() - Date.now();
  const days = ms / 86_400_000;
  if (days <= 0) return COLORS.error;
  if (days <= 1) return COLORS.error;
  if (days <= 3) return COLORS.warning;
  return COLORS.success;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value || '—'}</Text>
    </View>
  );
}

export default function BusinessProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: business, isLoading } = useBusiness();
  
  // PRICING_REMOVED: Licence checking disabled
  // App is now free - always show as active
  /*
  const [licence, setLicence]   = useState<LicenceInfo | null>(null);
  const [licLoading, setLicLoading] = useState(true);

  const loadLicence = useCallback(async () => {
    setLicLoading(true);
    try {
      const deviceId = await getDeviceID();
      if (deviceId) {
        const info = await checkLicence(deviceId);
        setLicence(info);
      }
    } catch { /* ignore *\/ }
    finally { setLicLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { loadLicence(); }, [loadLicence]));

  const planColours = licence?.plan ? PLAN_COLOURS[licence.plan] : null;
  const expiryText  = licence?.valid ? timeUntilExpiry(licence.expiresAt) : null;
  const expiryColor = licence?.valid ? urgencyColour(licence.expiresAt) : COLORS.error;

  const handleRenew = async () => {
    const deviceId = await getDeviceID();
    router.push({ pathname: '/(auth)/pricing', params: { deviceId: deviceId ?? '' } });
  };
  */

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={s.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Business Profile</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={s.loading}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={s.loadingText}>Loading profile…</Text>
          </View>
        ) : (
          <>
            {/* Avatar + name */}
            <View style={s.avatarWrap}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.avatar}>
                <Text style={s.avatarLetter}>
                  {business?.name?.charAt(0)?.toUpperCase() ?? 'B'}
                </Text>
              </LinearGradient>
              <Text style={s.avatarName}>{business?.name ?? '—'}</Text>

              {/* PRICING_REMOVED: Always show as Active */}
              <View style={[s.planBadge, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}>
                <Text style={[s.planBadgeText, { color: '#166534' }]}>
                  Active  ✓
                </Text>
              </View>
            </View>

            {/* PRICING_REMOVED: Subscription card removed - app is now free */}
            {/* Original subscription display code preserved below for future restoration */}
            {/*
            <View style={s.card}>
              <Text style={s.cardTitle}>Subscription</Text>
              ...subscription details...
            </View>
            */}

            {/* Business details */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Business Details</Text>
              <Field label="Business Name" value={business?.name} />
              <Field label="Owner"         value={business?.owner_name} />
              <Field label="Phone"         value={business?.phone} />
              <Field label="Location"      value={business?.location} />
              <Field
                label="Registered"
                value={
                  business?.created_at
                    ? new Date(business.created_at).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })
                    : undefined
                }
              />
            </View>

            {/* PRICING_REMOVED: Subscription note removed */}
            {/*
            <View style={s.noteCard}>
              <Text style={s.noteIcon}>ℹ️</Text>
              <Text style={s.noteText}>
                Your subscription is tied to this device. Reinstalling the app will not affect your plan — it will resume automatically.
              </Text>
            </View>
            */}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  backBtn: { padding: SPACING.xs },
  backText: { fontSize: 22, color: '#FFFFFF' },
  headerTitle: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF' },
  scroll: { padding: SPACING.lg },
  loading: { alignItems: 'center', marginTop: SPACING['3xl'], gap: SPACING.md },
  loadingText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },

  avatarWrap: { alignItems: 'center', marginBottom: SPACING.xl, gap: SPACING.sm },
  avatar: { width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', ...SHADOWS.md },
  avatarLetter: { fontSize: 36, fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF' },
  avatarName: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text },

  planBadge: {
    borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md,
    paddingVertical: 5, borderWidth: 1,
  },
  planBadgeText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.bold },

  card: { backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.sm },
  cardTitle: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: SPACING.md },
  field: { paddingVertical: SPACING.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border, gap: 2 },
  fieldLabel: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.medium, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldValue: { fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.text, fontWeight: TYPOGRAPHY.fontWeight.semibold },

  expiryBanner: { marginTop: SPACING.md, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, gap: SPACING.sm },
  expiryBannerText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.medium, lineHeight: 20 },
  renewBtn: { alignSelf: 'flex-start', borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2 },
  renewBtnText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF' },

  noLicence: { gap: SPACING.md, paddingVertical: SPACING.sm },
  noLicenceText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, lineHeight: 20 },
  subscribeBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center' },
  subscribeBtnText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF' },

  noteCard: { flexDirection: 'row', backgroundColor: '#EFF6FF', borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, gap: SPACING.sm, alignItems: 'flex-start', borderWidth: 1, borderColor: '#BFDBFE' },
  noteIcon: { fontSize: 18 },
  noteText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.sm, color: '#1E40AF', lineHeight: 20 },
});
