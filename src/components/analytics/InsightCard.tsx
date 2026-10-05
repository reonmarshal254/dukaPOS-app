import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

interface InsightCardProps {
  icon: string;
  title: string;
  description: string;
  type?: 'info' | 'success' | 'warning';
}

export default function InsightCard({ icon, title, description, type = 'info' }: InsightCardProps) {
  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: COLORS.badgeSuccess, text: COLORS.success };
      case 'warning':
        return { bg: COLORS.badgeWarning, text: COLORS.warning };
      default:
        return { bg: COLORS.badgeInfo, text: COLORS.info };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      <Text style={[styles.description, { color: colors.text }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    flex: 1,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.4,
  },
});
