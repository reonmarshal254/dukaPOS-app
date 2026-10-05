import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import {
  InventoryIcon,
  CashIcon,
  ChartIcon,
  ShieldCheckIcon,
  CloudSyncIcon,
  TrendingUpIcon,
} from '../../components/common/Icons';

const { width, height } = Dimensions.get('window');

// ─── Feature row item ──────────────────────────────────────────────────────────
interface FeatureProps {
  Icon: React.ComponentType<{ size: number; color: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}

function Feature({ Icon, iconBg, iconColor, title, description }: FeatureProps) {
  return (
    <View style={f.row}>
      <View style={[f.iconWrap, { backgroundColor: iconBg }]}>
        <Icon size={22} color={iconColor} />
      </View>
      <View style={f.text}>
        <Text style={f.title}>{title}</Text>
        <Text style={f.desc}>{description}</Text>
      </View>
    </View>
  );
}

const f = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    flexShrink: 0,
  },
  text: { flex: 1 },
  title: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  desc: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [checking, setChecking] = useState(false);

  const handleGetStarted = async () => {
    setChecking(true);
    try {
      // First-time setup requires internet so the device registers with the admin backend
      const res = await fetch('https://dukapos-gjfx.onrender.com/health', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      const online = res.ok || res.status < 500;
      if (!online) throw new Error('offline');
    } catch {
      setChecking(false);
      Alert.alert(
        'Internet Required',
        'Please connect to the internet to set up DukaPOS for the first time. This is only needed once during setup.',
        [{ text: 'OK' }]
      );
      return;
    }
    setChecking(false);
    router.push('/(auth)/setup');
  };

  const features: FeatureProps[] = [
    {
      Icon: InventoryIcon,
      iconBg: '#DBEAFE',
      iconColor: COLORS.primary,
      title: 'Smart Inventory',
      description: 'Track stock, batches, and expiry dates in real time',
    },
    {
      Icon: CashIcon,
      iconBg: '#D1FAE5',
      iconColor: '#059669',
      title: 'Fast Checkout',
      description: 'Accept cash, M-Pesa, and credit with receipt printing',
    },
    {
      Icon: ChartIcon,
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      title: 'Business Reports',
      description: 'Sales, profit, and inventory insights at a glance',
    },
    {
      Icon: CloudSyncIcon,
      iconBg: '#EDE9FE',
      iconColor: '#7C3AED',
      title: 'Works Offline',
      description: 'Full functionality without an internet connection',
    },
    {
      Icon: ShieldCheckIcon,
      iconBg: '#DCFCE7',
      iconColor: '#16A34A',
      title: 'Secure & Private',
      description: 'PIN protection and encrypted local storage',
    },
  ];

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── Scrollable area: hero + features ──────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: SPACING.lg }}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* ── Hero section ────────────────────────────────────────────────── */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark, '#1E3A8A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={[s.hero, { paddingTop: insets.top + SPACING.xl }]}
        >
          {/* subtle decorative circles */}
          <View style={s.circle1} />
          <View style={s.circle2} />

          {/* Logo badge */}
          <View style={s.logoBadge}>
            <TrendingUpIcon size={32} color="#FFFFFF" />
          </View>

          <Text style={s.heroTitle}>DukaPOS</Text>
          <Text style={s.heroTagline}>The smarter way to run your shop</Text>

          {/* stat pills */}
          <View style={s.pills}>
            {[
              { label: 'Offline First', emoji: '📶' },
              { label: 'Secure', emoji: '🔒' },
              { label: 'Fast', emoji: '⚡' },
            ].map((p) => (
              <View key={p.label} style={s.pill}>
                <Text style={s.pillText}>{p.emoji}  {p.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── Features list ───────────────────────────────────────────────── */}
        <View style={s.body}>
          <Text style={s.sectionLabel}>Everything you need</Text>

          {features.map((feat) => (
            <Feature key={feat.title} {...feat} />
          ))}
        </View>
      </ScrollView>

      {/* ── CTA footer — always visible ───────────────────────────────────── */}
      <View style={[s.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={handleGetStarted}
          activeOpacity={0.85}
          disabled={checking}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.ctaGradient}
          >
            {checking ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={s.ctaText}>Get Started  →</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={s.footerNote}>Free to use · No account required</Text>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const HERO_HEIGHT = height * 0.36;

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },

  // Hero
  hero: {
    height: HERO_HEIGHT,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -80,
    right: -60,
  },
  circle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 30,
    left: -40,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  heroTagline: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: SPACING.lg,
  },
  pills: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pillText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  // Body
  body: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.lg,
  },

  // Footer CTA
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ctaBtn: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  footerNote: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
