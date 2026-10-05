import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { checkAndNotifyLowStock } from '../../hooks/useProducts';
import productRepository from '../../services/repositories/productRepository';
import { useExpiringBatches } from '../../hooks/useStockBatches';
import { useBusiness } from '../../hooks/useBusiness';
import { useSalesStats, useProductCount, type Period } from '../../hooks/useAnalytics';
import { useQuery } from '@tanstack/react-query';
import PeriodSelector from '../../components/analytics/PeriodSelector';
import { formatCurrency } from '../../utils/currency';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import {
  CashIcon,
  TrendingUpIcon,
  AlertIcon,
  ClockIcon,
  XCircleIcon,
  ShoppingBagIcon,
  PackageIcon,
  BoxIcon,
  UserPlusIcon,
} from '../../components/common/Icons';

const { width } = Dimensions.get('window');
const CARD_GAP = SPACING.sm;
const H_PAD = SPACING.lg;
const STAT_CARD_WIDTH = (width - H_PAD * 2 - CARD_GAP) / 2;

// ─── Mini stat card rendered inline ───────────────────────────────────────────
interface MiniStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradientColors: readonly [string, string];
  trend?: { value: string; isPositive: boolean };
  onPress?: () => void;
}

function MiniStatCard({ icon, label, value, gradientColors, trend, onPress }: MiniStatProps) {
  return (
    <TouchableOpacity
      style={[styles.miniCard, { width: STAT_CARD_WIDTH }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <LinearGradient
        colors={[gradientColors[0] + '18', gradientColors[1] + '08']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[styles.miniIconWrap, { backgroundColor: gradientColors[0] + '22' }]}>
        {icon}
      </View>
      <Text style={styles.miniValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.miniLabel}>{label}</Text>
      {trend && (
        <View style={styles.miniTrend}>
          <Text style={[
            styles.miniTrendText,
            { color: trend.isPositive ? COLORS.success : COLORS.error },
          ]}>
            {trend.isPositive ? '▲' : '▼'} {trend.value}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('daily');
  const [refreshing, setRefreshing] = useState(false);

  const { data: business } = useBusiness();
  const { data: salesStats, refetch: refetchSales } = useSalesStats(period);
  const { data: productCount, refetch: refetchProducts } = useProductCount();

  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ['products', 'lowStock'],
    queryFn: () => productRepository.getLowStock(),
    staleTime: 0,
  });
  const { data: outOfStockProducts = [] } = useQuery({
    queryKey: ['products', 'outOfStock'],
    queryFn: () => productRepository.getOutOfStock(),
    staleTime: 0,
  });
  const { data: expiringBatches = [] } = useExpiringBatches(30);

  const lowStockCount = lowStockProducts.length;
  const expiringCount = expiringBatches.length;
  const outOfStockCount = outOfStockProducts.length;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSales(), refetchProducts()]);
    setRefreshing(false);
  };

  // Refetch every time the tab comes into focus (e.g. after adding a product)
  useFocusEffect(
    useCallback(() => {
      refetchSales();
      refetchProducts();
      // Fire low-stock notifications if any products are running low
      checkAndNotifyLowStock();
    }, [period])
  );

  const totalRevenue = salesStats?.totalRevenue ?? 0;
  const revenueChange = salesStats?.revenueChange ?? 0;
  const transactions = salesStats?.totalTransactions ?? 0;
  const avgTransaction = salesStats?.averageTransactionValue ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Decorative circles */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          <Text style={styles.greeting}>{getGreeting()} 👋</Text>
          <Text style={styles.businessName} numberOfLines={1}>
            {business?.name || 'DukaPOS'}
          </Text>
        </LinearGradient>

        {/* ── Period Selector ─────────────────────────────────────────────── */}
        <View style={styles.periodWrap}>
          <PeriodSelector selected={period} onSelect={setPeriod} />
        </View>

        {/* ── Hero Revenue Card ───────────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={['#1D4ED8', '#2563EB', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* subtle pattern dots */}
            <View style={styles.heroDot1} />
            <View style={styles.heroDot2} />

            <View style={styles.heroTop}>
              <View style={styles.heroIconWrap}>
                <TrendingUpIcon size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.heroLabel}>Total Sales</Text>
            </View>

            <Text style={styles.heroValue}>{formatCurrency(totalRevenue)}</Text>

            <View style={styles.heroBottom}>
              <View style={[
                styles.heroBadge,
                { backgroundColor: revenueChange >= 0 ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.25)' },
              ]}>
                <Text style={[
                  styles.heroBadgeText,
                  { color: revenueChange >= 0 ? '#6EE7B7' : '#FCA5A5' },
                ]}>
                  {revenueChange >= 0 ? '▲' : '▼'} {Math.abs(revenueChange).toFixed(1)}% vs last period
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Stats Grid ─────────────────────────────────────────────────── */}
        <View style={styles.gridSection}>
          {/* Row 1 */}
          <View style={styles.row}>
            <MiniStatCard
              icon={<ShoppingBagIcon size={20} color="#2563EB" />}
              label="Transactions"
              value={String(transactions)}
              gradientColors={['#2563EB', '#3B82F6']}
            />
            <MiniStatCard
              icon={<CashIcon size={20} color="#059669" />}
              label="Avg. Sale"
              value={formatCurrency(avgTransaction)}
              gradientColors={['#10B981', '#34D399']}
            />
          </View>

          {/* Row 2 */}
          <View style={styles.row}>
            <MiniStatCard
              icon={<PackageIcon size={20} color="#7C3AED" />}
              label="Products"
              value={String(productCount ?? 0)}
              gradientColors={['#8B5CF6', '#A78BFA']}
              onPress={() => router.push('/(tabs)/products')}
            />
            <MiniStatCard
              icon={<AlertIcon size={20} color="#D97706" />}
              label="Low Stock"
              value={String(lowStockCount)}
              gradientColors={['#F59E0B', '#FBBF24']}
              onPress={() => router.push('/(tabs)/products')}
            />
          </View>

          {/* Row 3 */}
          <View style={styles.row}>
            <MiniStatCard
              icon={<ClockIcon size={20} color="#0284C7" />}
              label="Expiring"
              value={String(expiringCount)}
              gradientColors={['#0EA5E9', '#38BDF8']}
              onPress={() => router.push('/inventory/expiring')}
            />
            <MiniStatCard
              icon={<XCircleIcon size={20} color="#DC2626" />}
              label="Out of Stock"
              value={String(outOfStockCount)}
              gradientColors={['#EF4444', '#F87171']}
              onPress={() => router.push('/(tabs)/products')}
            />
          </View>
        </View>

        {/* ── Inventory Alerts ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Alerts</Text>

          {[
            {
              icon: <AlertIcon size={22} color={COLORS.warning} />,
              iconBg: COLORS.badgeWarning,
              accent: COLORS.warning,
              title: 'Low Stock',
              text: lowStockCount > 0
                ? `${lowStockCount} product${lowStockCount !== 1 ? 's' : ''} running low`
                : 'All products well stocked',
              count: lowStockCount,
              onPress: () => router.push('/(tabs)/products'),
            },
            {
              icon: <ClockIcon size={22} color={COLORS.info} />,
              iconBg: COLORS.badgeInfo,
              accent: COLORS.info,
              title: 'Expiring Soon',
              text: expiringCount > 0
                ? `${expiringCount} batch${expiringCount !== 1 ? 'es' : ''} expiring in 30 days`
                : 'No items expiring soon',
              count: expiringCount,
              onPress: () => router.push('/inventory/expiring'),
            },
            {
              icon: <XCircleIcon size={22} color={COLORS.error} />,
              iconBg: COLORS.badgeError,
              accent: COLORS.error,
              title: 'Out of Stock',
              text: outOfStockCount > 0
                ? `${outOfStockCount} product${outOfStockCount !== 1 ? 's' : ''} unavailable`
                : 'All products in stock',
              count: outOfStockCount,
              onPress: () => router.push('/(tabs)/products'),
            },
          ].map((alert) => (
            <TouchableOpacity
              key={alert.title}
              style={[styles.alertCard, { borderLeftColor: alert.accent }]}
              onPress={alert.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.alertIcon, { backgroundColor: alert.iconBg }]}>
                {alert.icon}
              </View>
              <View style={styles.alertBody}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertText}>{alert.text}</Text>
              </View>
              {alert.count > 0 && (
                <View style={[styles.alertBadge, { backgroundColor: alert.accent }]}>
                  <Text style={styles.alertBadgeText}>{alert.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Quick Actions ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              {
                label: 'New Sale',
                icon: <ShoppingBagIcon size={26} color="#FFF" />,
                colors: ['#10B981', '#059669'] as [string, string],
                route: '/(tabs)/pos',
              },
              {
                label: 'Add Product',
                icon: <PackageIcon size={26} color="#FFF" />,
                colors: ['#3B82F6', '#2563EB'] as [string, string],
                route: '/(tabs)/products/add',
              },
              {
                label: 'Add Stock',
                icon: <BoxIcon size={26} color="#FFF" />,
                colors: ['#8B5CF6', '#7C3AED'] as [string, string],
                route: '/(tabs)/pos',
              },
              {
                label: 'Expenses',
                icon: <CashIcon size={26} color="#FFF" />,
                colors: ['#EF4444', '#DC2626'] as [string, string],
                route: '/(tabs)/inventory/expenses',
              },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.75}
              >
                <LinearGradient
                  colors={action.colors}
                  style={styles.actionIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {action.icon}
                </LinearGradient>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scroll: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: H_PAD,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  decorCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -20,
    left: 20,
  },
  greeting: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
  },
  businessName: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  periodWrap: {
    paddingHorizontal: H_PAD,
    paddingVertical: SPACING.md,
    backgroundColor: '#F1F5F9',
  },

  // Hero revenue card
  heroWrap: {
    paddingHorizontal: H_PAD,
    marginBottom: SPACING.md,
  },
  heroCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  heroDot1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -50,
    right: -30,
  },
  heroDot2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -20,
    left: 40,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  heroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  heroLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroValue: {
    fontSize: 36,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: SPACING.md,
  },
  heroBottom: {
    flexDirection: 'row',
  },
  heroBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  heroBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  // Mini stat cards grid
  gridSection: {
    paddingHorizontal: H_PAD,
    gap: CARD_GAP,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  miniCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  miniIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  miniValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: 2,
  },
  miniLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  miniTrend: {
    marginTop: 4,
  },
  miniTrendText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  // Section
  section: {
    paddingHorizontal: H_PAD,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  // Alert cards
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  alertBody: { flex: 1 },
  alertTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  alertText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  alertBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  alertBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },

  // Quick actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  actionCard: {
    width: STAT_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    textAlign: 'center',
  },
});
