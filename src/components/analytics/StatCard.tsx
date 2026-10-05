import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: string;
}

export default function StatCard({ icon, label, value, trend, color = COLORS.primary }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        {icon}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
        
        <View style={styles.trendContainer}>
          {trend ? (
            <Text style={[
              styles.trendText,
              { color: trend.isPositive ? COLORS.success : COLORS.error }
            ]}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </Text>
          ) : (
            <Text style={styles.trendPlaceholder}> </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    minHeight: 100,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  trendContainer: {
    marginTop: SPACING.xs,
    minHeight: 16,
  },
  trendText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  trendPlaceholder: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    height: 16,
  },
});
