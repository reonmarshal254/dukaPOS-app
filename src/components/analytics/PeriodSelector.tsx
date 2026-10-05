import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

export type Period = 'daily' | 'weekly' | 'monthly';

interface PeriodSelectorProps {
  selected: Period;
  onSelect: (period: Period) => void;
}

export default function PeriodSelector({ selected, onSelect }: PeriodSelectorProps) {
  const periods: { value: Period; label: string }[] = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
  ];

  return (
    <View style={styles.container}>
      {periods.map((period) => (
        <TouchableOpacity
          key={period.value}
          style={[
            styles.tab,
            selected === period.value && styles.tabActive,
          ]}
          onPress={() => onSelect(period.value)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              selected === period.value && styles.tabTextActive,
            ]}
          >
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
    gap: SPACING.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});
