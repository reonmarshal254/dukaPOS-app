import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { formatCurrency } from '../../utils/currency';

interface PaymentMethodChartProps {
  cash: number;
  mpesa: number;
}

export default function PaymentMethodChart({ cash, mpesa }: PaymentMethodChartProps) {
  const total = cash + mpesa;
  const cashPercent = total > 0 ? (cash / total) * 100 : 0;
  const mpesaPercent = total > 0 ? (mpesa / total) * 100 : 0;

  const size = 160;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Calculate stroke dash array for donut segments
  const cashDashArray = (cashPercent / 100) * circumference;
  const mpesaDashArray = (mpesaPercent / 100) * circumference;

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {total > 0 ? (
          <Svg width={size} height={size}>
            <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
              {/* M-Pesa segment */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#10B981"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${mpesaDashArray} ${circumference}`}
                strokeLinecap="round"
              />
              {/* Cash segment */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#3B82F6"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${cashDashArray} ${circumference}`}
                strokeDashoffset={-mpesaDashArray}
                strokeLinecap="round"
              />
            </G>
          </Svg>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyText}>No data</Text>
          </View>
        )}
        
        {total > 0 && (
          <View style={styles.centerLabel}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        )}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <View style={styles.legendContent}>
            <Text style={styles.legendLabel}>Cash</Text>
            <Text style={styles.legendValue}>{formatCurrency(cash)}</Text>
            <Text style={styles.legendPercent}>{cashPercent.toFixed(1)}%</Text>
          </View>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <View style={styles.legendContent}>
            <Text style={styles.legendLabel}>M-Pesa</Text>
            <Text style={styles.legendValue}>{formatCurrency(mpesa)}</Text>
            <Text style={styles.legendPercent}>{mpesaPercent.toFixed(1)}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  emptyChart: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  legend: {
    gap: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    flex: 1,
  },
  legendValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  legendPercent: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    width: 45,
    textAlign: 'right',
  },
});
