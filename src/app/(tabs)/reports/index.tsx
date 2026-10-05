import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Polyline, Line, Rect, Text as SvgText } from 'react-native-svg';
import PeriodSelector from '../../../components/analytics/PeriodSelector';
import {
  useSalesStats,
  useTopProducts,
  usePaymentMethodStats,
  useHourlyStats,
  type Period,
} from '../../../hooks/useAnalytics';
import { formatCurrency } from '../../../utils/currency';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';
import {
  TrendingUpIcon,
  ShoppingBagIcon,
  CashIcon,
  PackageIcon,
} from '../../../components/common/Icons';

const { width } = Dimensions.get('window');
const H_PAD = SPACING.lg;
const CARD_W = width - H_PAD * 2;

// ─── Palette ───────────────────────────────────────────────────────────────────
const CASH_COLOR  = '#2563EB';
const MPESA_COLOR = '#10B981';
const LINE_COLOR  = '#3B82F6';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pct(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0;
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  trend,
  accent,
  Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: { value: string; positive: boolean };
  accent: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
}) {
  return (
    <View style={[kpi.card, { borderLeftColor: accent }]}>
      <View style={[kpi.iconWrap, { backgroundColor: accent + '18' }]}>
        <Icon size={20} color={accent} />
      </View>
      <Text style={kpi.label}>{label}</Text>
      <Text style={kpi.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {trend && (
        <View style={kpi.trendRow}>
          <Text style={[kpi.trendText, { color: trend.positive ? MPESA_COLOR : COLORS.error }]}>
            {trend.positive ? '▲' : '▼'} {trend.value}
          </Text>
          <Text style={kpi.trendSub}> vs prev</Text>
        </View>
      )}
      {sub && !trend && <Text style={kpi.sub}>{sub}</Text>}
    </View>
  );
}

const KPI_W = (CARD_W - SPACING.sm) / 2;
const kpi = StyleSheet.create({
  card: {
    width: KPI_W,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
    gap: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    minWidth: 0,
  },
  trendRow: { flexDirection: 'row', alignItems: 'center' },
  trendText: { fontSize: 12, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  trendSub: { fontSize: 11, color: COLORS.textSecondary },
  sub: { fontSize: 11, color: COLORS.textSecondary },
});

// ─── Donut pie chart ──────────────────────────────────────────────────────────
function DonutChart({ cash, mpesa }: { cash: number; mpesa: number }) {
  const total = cash + mpesa;
  const SIZE = 140;
  const SW = 26;
  const R = (SIZE - SW) / 2;
  const C = R * 2 * Math.PI;

  const mpesaArc = (mpesa / (total || 1)) * C;
  const cashArc  = (cash  / (total || 1)) * C;

  return (
    <View style={donut.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <G rotation="-90" origin={`${SIZE / 2},${SIZE / 2}`}>
          {/* background ring */}
          <Circle cx={SIZE/2} cy={SIZE/2} r={R} stroke="#F1F5F9" strokeWidth={SW} fill="none" />
          {/* mpesa arc */}
          <Circle
            cx={SIZE/2} cy={SIZE/2} r={R}
            stroke={MPESA_COLOR} strokeWidth={SW} fill="none"
            strokeDasharray={`${mpesaArc} ${C}`}
            strokeLinecap="butt"
          />
          {/* cash arc offset after mpesa */}
          <Circle
            cx={SIZE/2} cy={SIZE/2} r={R}
            stroke={CASH_COLOR} strokeWidth={SW} fill="none"
            strokeDasharray={`${cashArc} ${C}`}
            strokeDashoffset={-mpesaArc}
            strokeLinecap="butt"
          />
        </G>
      </Svg>
      {/* Centre label */}
      <View style={donut.centre}>
        <Text style={donut.centreValue}>{total > 0 ? `${pct(mpesa, total).toFixed(0)}%` : '--'}</Text>
        <Text style={donut.centreLabel}>M-Pesa</Text>
      </View>
    </View>
  );
}

const donut = StyleSheet.create({
  wrap: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  centre: { position: 'absolute', alignItems: 'center' },
  centreValue: { fontSize: 20, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text },
  centreLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },
});

// ─── Legend row ───────────────────────────────────────────────────────────────
function LegendRow({
  color, label, value, pctVal,
}: { color: string; label: string; value: number; pctVal: number }) {
  return (
    <View style={leg.row}>
      <View style={[leg.dot, { backgroundColor: color }]} />
      <Text style={leg.label}>{label}</Text>
      <View style={leg.barBg}>
        <View style={[leg.barFill, { width: `${pctVal}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={leg.pct}>{pctVal.toFixed(0)}%</Text>
      <Text style={leg.val}>{formatCurrency(value)}</Text>
    </View>
  );
}

const leg = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  label: { fontSize: 13, color: COLORS.text, fontWeight: TYPOGRAPHY.fontWeight.medium, width: 52 },
  barBg: { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  pct: { fontSize: 11, color: COLORS.textSecondary, width: 30, textAlign: 'right' },
  val: { fontSize: 12, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text, width: 72, textAlign: 'right' },
});

// ─── Line chart ───────────────────────────────────────────────────────────────
function LineChart({ data }: { data: Array<{ hour: number; revenue: number }> }) {
  const CW = CARD_W - SPACING.lg * 2;
  const CH = 140;
  const PAD_L = 48;
  const PAD_B = 28;
  const PAD_T = 12;
  const PAD_R = 12;

  if (data.length < 2) {
    return (
      <View style={[lc.empty, { height: CH + PAD_B + PAD_T }]}>
        <Text style={lc.emptyText}>Not enough data for trend</Text>
      </View>
    );
  }

  const maxRev = Math.max(...data.map(d => d.revenue), 1);
  const minRev = 0;
  const plotW = CW - PAD_L - PAD_R;
  const plotH = CH - PAD_T - PAD_B;

  const toX = (i: number) => PAD_L + (i / (data.length - 1)) * plotW;
  const toY = (v: number) => PAD_T + (1 - (v - minRev) / (maxRev - minRev)) * plotH;

  // Build polyline points
  const points = data.map((d, i) => `${toX(i)},${toY(d.revenue)}`).join(' ');

  // Y-axis ticks (3 levels)
  const yTicks = [0, maxRev / 2, maxRev];

  // X-axis labels — show every other hour to avoid crowding
  const xLabels = data.filter((_, i) => i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 4) === 0);

  return (
    <Svg width={CW} height={CH + PAD_B + PAD_T}>
      {/* Y gridlines */}
      {yTicks.map((tick, i) => {
        const y = toY(tick);
        return (
          <G key={i}>
            <Line x1={PAD_L} y1={y} x2={CW - PAD_R} y2={y}
              stroke="#E2E8F0" strokeWidth={1} strokeDasharray="4,3" />
            <SvgText x={PAD_L - 4} y={y + 4}
              fontSize={9} fill={COLORS.textSecondary} textAnchor="end">
              {tick > 0 ? formatCurrency(tick).replace(/,.*/, 'k').replace(/\..*/, '') : '0'}
            </SvgText>
          </G>
        );
      })}

      {/* Area fill — simple gradient-like with lighter colour */}
      <Polyline
        points={`${PAD_L},${toY(0)} ${points} ${CW - PAD_R},${toY(0)}`}
        fill={LINE_COLOR + '18'}
        stroke="none"
      />

      {/* Line */}
      <Polyline
        points={points}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data dots */}
      {data.map((d, i) => (
        <Circle key={i} cx={toX(i)} cy={toY(d.revenue)}
          r={3} fill="#FFFFFF" stroke={LINE_COLOR} strokeWidth={2} />
      ))}

      {/* X-axis labels */}
      {xLabels.map((d) => {
        const i = data.indexOf(d);
        return (
          <SvgText key={d.hour} x={toX(i)} y={CH + PAD_T + 14}
            fontSize={9} fill={COLORS.textSecondary} textAnchor="middle">
            {String(d.hour).padStart(2, '0')}:00
          </SvgText>
        );
      })}

      {/* Axes */}
      <Line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + plotH}
        stroke="#CBD5E1" strokeWidth={1} />
      <Line x1={PAD_L} y1={PAD_T + plotH} x2={CW - PAD_R} y2={PAD_T + plotH}
        stroke="#CBD5E1" strokeWidth={1} />
    </Svg>
  );
}

const lc = StyleSheet.create({
  empty: { justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 13, color: COLORS.textSecondary },
});

// ─── Top product row ──────────────────────────────────────────────────────────
function ProductRow({
  rank, name, qty, revenue, maxRevenue,
}: { rank: number; name: string; qty: number; revenue: number; maxRevenue: number }) {
  const fillPct = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : undefined;

  return (
    <View style={pr.row}>
      <Text style={pr.rank}>{medal ?? `#${rank}`}</Text>
      <View style={pr.info}>
        <View style={pr.nameRow}>
          <Text style={pr.name} numberOfLines={1}>{name}</Text>
          <Text style={pr.revenue}>{formatCurrency(revenue)}</Text>
        </View>
        <View style={pr.barRow}>
          <View style={pr.barBg}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[pr.barFill, { width: `${fillPct}%` as any }]}
            />
          </View>
          <Text style={pr.qty}>{qty} sold</Text>
        </View>
      </View>
    </View>
  );
}

const pr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.sm },
  rank: { fontSize: 18, width: 32, textAlign: 'center' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontSize: 13, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text, flex: 1, marginRight: 8 },
  revenue: { fontSize: 13, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primary },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barBg: { flex: 1, height: 6, backgroundColor: '#EFF6FF', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  qty: { fontSize: 11, color: COLORS.textSecondary, width: 48, textAlign: 'right' },
});

// ─── Insight card ─────────────────────────────────────────────────────────────
const INSIGHT_STYLES = {
  success: { bg: '#F0FDF4', border: '#86EFAC', icon: '#16A34A', text: '#166534' },
  warning: { bg: '#FFFBEB', border: '#FCD34D', icon: '#D97706', text: '#92400E' },
  danger:  { bg: '#FFF1F2', border: '#FDA4AF', icon: '#E11D48', text: '#9F1239' },
  info:    { bg: '#EFF6FF', border: '#93C5FD', icon: '#2563EB', text: '#1E40AF' },
};

function Insight({
  emoji, title, body, type = 'info',
}: { emoji: string; title: string; body: string; type?: keyof typeof INSIGHT_STYLES }) {
  const c = INSIGHT_STYLES[type];
  return (
    <View style={[ins.card, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={ins.emoji}>{emoji}</Text>
      <View style={ins.content}>
        <Text style={[ins.title, { color: c.text }]}>{title}</Text>
        <Text style={[ins.body, { color: c.text + 'CC' }]}>{body}</Text>
      </View>
    </View>
  );
}

const ins = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  emoji: { fontSize: 22, marginTop: 1 },
  content: { flex: 1 },
  title: { fontSize: 13, fontWeight: TYPOGRAPHY.fontWeight.bold, marginBottom: 2 },
  body: { fontSize: 12, lineHeight: 18 },
});

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sec.wrap}>
      <Text style={sec.title}>{title}</Text>
      {children}
    </View>
  );
}

const sec = StyleSheet.create({
  wrap: { paddingHorizontal: H_PAD, marginBottom: SPACING.lg },
  title: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: SPACING.md,
  },
});

// ─── White card shell ─────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[cd.card, style]}>{children}</View>;
}

const cd = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('daily');
  const [refreshing, setRefreshing] = useState(false);

  const { data: salesStats, refetch: rs } = useSalesStats(period);
  const { data: topProducts = [], refetch: rp } = useTopProducts(period, 8);
  const { data: paymentStats, refetch: rw } = usePaymentMethodStats(period);
  const { data: hourlyData = [] } = useHourlyStats(period);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([rs(), rp(), rw()]);
    setRefreshing(false);
  };

  const totalRevenue   = salesStats?.totalRevenue       ?? 0;
  const transactions   = salesStats?.totalTransactions  ?? 0;
  const avgTransaction = salesStats?.averageTransactionValue ?? 0;
  const revenueChange  = salesStats?.revenueChange      ?? 0;
  const cashAmt        = paymentStats?.cash  ?? 0;
  const mpesaAmt       = paymentStats?.mpesa ?? 0;
  const payTotal       = cashAmt + mpesaAmt;

  const maxProductRevenue = topProducts[0]?.revenue ?? 1;

  const periodLabel = period === 'daily' ? 'today' : period === 'weekly' ? 'this week' : 'this month';

  // ── Smart insights ───────────────────────────────────────────────────────────
  const insights: Array<{ emoji: string; title: string; body: string; type: keyof typeof INSIGHT_STYLES }> = [];

  if (totalRevenue > 0) {
    if (Math.abs(revenueChange) > 5) {
      insights.push({
        emoji: revenueChange > 0 ? '📈' : '📉',
        title: `Revenue ${revenueChange > 0 ? 'up' : 'down'} ${Math.abs(revenueChange).toFixed(1)}%`,
        body: revenueChange > 0
          ? 'Sales are trending upward. Keep your bestsellers well stocked.'
          : 'Sales are lower than the previous period. Consider a promotion or bundle deal.',
        type: revenueChange > 0 ? 'success' : 'warning',
      });
    }

    if (avgTransaction > 0) {
      insights.push({
        emoji: '💡',
        title: 'Boost your average sale',
        body: `Current average is ${formatCurrency(avgTransaction)}. Try bundling slow-moving stock with bestsellers to lift basket size.`,
        type: 'info',
      });
    }

    if (payTotal > 0 && pct(mpesaAmt, payTotal) > 65) {
      insights.push({
        emoji: '📱',
        title: 'M-Pesa dominant',
        body: `${pct(mpesaAmt, payTotal).toFixed(0)}% of payments are via M-Pesa. Keep your float topped up to avoid disruptions.`,
        type: 'info',
      });
    }

    if (payTotal > 0 && pct(cashAmt, payTotal) > 80) {
      insights.push({
        emoji: '💵',
        title: 'Mostly cash sales',
        body: 'Consider promoting M-Pesa to reduce cash-handling risk and speed up checkout.',
        type: 'warning',
      });
    }

    if (topProducts.length > 0) {
      insights.push({
        emoji: '🏆',
        title: `Top seller: ${topProducts[0].name}`,
        body: `${topProducts[0].name} drove ${formatCurrency(topProducts[0].revenue)} in revenue with ${topProducts[0].quantitySold} units sold ${periodLabel}. Prioritise restocking.`,
        type: 'success',
      });
    }

    if (transactions >= 10 && topProducts.length >= 3) {
      const top3 = topProducts.slice(0, 3).map(p => p.name).join(', ');
      insights.push({
        emoji: '📦',
        title: 'Stock your heroes',
        body: `${top3} account for the bulk of your revenue. Running out of any of these will directly hurt sales.`,
        type: 'warning',
      });
    }
  } else {
    insights.push({
      emoji: '🚀',
      title: 'No sales recorded yet',
      body: `Make your first sale ${periodLabel} and your analytics will appear here.`,
      type: 'info',
    });
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark, '#1E3A8A']}
          start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={s.header}
        >
          <View style={s.headerDecor1} />
          <View style={s.headerDecor2} />
          <Text style={s.headerTitle}>Analytics</Text>
          <Text style={s.headerSub}>Track your business performance</Text>
          <View style={s.periodWrap}>
            <PeriodSelector selected={period} onSelect={setPeriod} />
          </View>
        </LinearGradient>

        {/* ── KPI grid ────────────────────────────────────────────────────── */}
        <View style={s.kpiGrid}>
          <KpiCard
            label="Total Revenue"
            value={formatCurrency(totalRevenue)}
            trend={salesStats ? {
              value: `${Math.abs(revenueChange).toFixed(1)}%`,
              positive: revenueChange >= 0,
            } : undefined}
            accent={COLORS.primary}
            Icon={TrendingUpIcon}
          />
          <KpiCard
            label="Transactions"
            value={String(transactions)}
            sub={transactions > 0 ? `${formatCurrency(avgTransaction)} avg` : undefined}
            accent="#10B981"
            Icon={ShoppingBagIcon}
          />
          <KpiCard
            label="Avg Sale"
            value={formatCurrency(avgTransaction)}
            accent="#F59E0B"
            Icon={CashIcon}
          />
          <KpiCard
            label="Cash In"
            value={formatCurrency(cashAmt)}
            sub={payTotal > 0 ? `${pct(cashAmt, payTotal).toFixed(0)}% of payments` : undefined}
            accent="#8B5CF6"
            Icon={PackageIcon}
          />
        </View>

        {/* ── Revenue trend line chart ─────────────────────────────────────── */}
        {hourlyData.length > 0 && (
          <Section title="Revenue Trend">
            <Card>
              <Text style={s.chartTitle}>
                {period === 'daily' ? 'Hourly revenue today' : 'Revenue over time'}
              </Text>
              <LineChart data={hourlyData} />
            </Card>
          </Section>
        )}

        {/* ── Payment method pie + legend ──────────────────────────────────── */}
        <Section title="Payment Methods">
          <Card style={s.payCard}>
            <DonutChart cash={cashAmt} mpesa={mpesaAmt} />
            <View style={s.payLegend}>
              <Text style={s.payLegendTitle}>Breakdown</Text>
              <LegendRow
                color={MPESA_COLOR}
                label="M-Pesa"
                value={mpesaAmt}
                pctVal={pct(mpesaAmt, payTotal)}
              />
              <LegendRow
                color={CASH_COLOR}
                label="Cash"
                value={cashAmt}
                pctVal={pct(cashAmt, payTotal)}
              />
              <View style={s.payTotal}>
                <Text style={s.payTotalLabel}>Total collected</Text>
                <Text style={s.payTotalValue}>{formatCurrency(payTotal)}</Text>
              </View>
            </View>
          </Card>
        </Section>

        {/* ── Top products ─────────────────────────────────────────────────── */}
        {topProducts.length > 0 && (
          <Section title="Top Selling Products">
            <Card>
              {topProducts.slice(0, 8).map((p, i) => (
                <ProductRow
                  key={p.id}
                  rank={i + 1}
                  name={p.name}
                  qty={p.quantitySold}
                  revenue={p.revenue}
                  maxRevenue={maxProductRevenue}
                />
              ))}
            </Card>
          </Section>
        )}

        {/* ── Smart insights ───────────────────────────────────────────────── */}
        <Section title="💡 Insights & Recommendations">
          {insights.map((ins, i) => (
            <Insight key={i} {...ins} />
          ))}
        </Section>

        {/* ── Summary highlights ───────────────────────────────────────────── */}
        {totalRevenue > 0 && (
          <Section title="Period Highlights">
            <Card>
              {[
                {
                  label: 'Best payment method',
                  value: mpesaAmt >= cashAmt ? 'M-Pesa' : 'Cash',
                  sub: `${pct(Math.max(mpesaAmt, cashAmt), payTotal).toFixed(0)}% share`,
                  color: mpesaAmt >= cashAmt ? MPESA_COLOR : CASH_COLOR,
                },
                {
                  label: 'Revenue vs previous period',
                  value: revenueChange >= 0
                    ? `+${revenueChange.toFixed(1)}%`
                    : `${revenueChange.toFixed(1)}%`,
                  sub: `Previous: ${formatCurrency(salesStats?.previousPeriodRevenue ?? 0)}`,
                  color: revenueChange >= 0 ? MPESA_COLOR : COLORS.error,
                },
                ...(topProducts[0] ? [{
                  label: 'Top product',
                  value: topProducts[0].name,
                  sub: `${topProducts[0].quantitySold} units · ${formatCurrency(topProducts[0].revenue)}`,
                  color: COLORS.primary,
                }] : []),
              ].map((item, i, arr) => (
                <View
                  key={item.label}
                  style={[
                    hi.row,
                    i < arr.length - 1 && hi.rowBorder,
                  ]}
                >
                  <Text style={hi.label}>{item.label}</Text>
                  <View style={hi.right}>
                    <Text style={[hi.value, { color: item.color }]} numberOfLines={1}>
                      {item.value}
                    </Text>
                    <Text style={hi.sub}>{item.sub}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Highlights row ───────────────────────────────────────────────────────────
const hi = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  label: { fontSize: 13, color: COLORS.textSecondary, flex: 1, marginRight: 8 },
  right: { alignItems: 'flex-end' },
  value: { fontSize: 14, fontWeight: TYPOGRAPHY.fontWeight.bold },
  sub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
});

// ─── Screen styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scroll: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: H_PAD,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -50,
  },
  headerDecor2: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, left: 20,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSub: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: SPACING.md,
  },
  periodWrap: { marginTop: SPACING.xs },

  // KPI grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingHorizontal: H_PAD,
    paddingTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },

  // Chart title
  chartTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.sm,
  },

  // Payment card layout
  payCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.lg,
  },
  payLegend: { flex: 1 },
  payLegendTitle: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  payTotal: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  payTotalLabel: { fontSize: 11, color: COLORS.textSecondary },
  payTotalValue: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginTop: 2,
  },
});
