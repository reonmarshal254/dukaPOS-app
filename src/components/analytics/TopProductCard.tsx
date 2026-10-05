import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { formatCurrency } from '../../utils/currency';

interface TopProductCardProps {
  rank: number;
  name: string;
  imageUrl: string | null;
  quantitySold: number;
  revenue: number;
}

export default function TopProductCard({ rank, name, imageUrl, quantitySold, revenue }: TopProductCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{rank}</Text>
      </View>
      
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.imagePlaceholderText}>📦</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <Text style={styles.quantity}>{quantitySold} sold</Text>
        <Text style={styles.revenue}>{formatCurrency(revenue)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  rankBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  rankText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  imagePlaceholder: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 40,
  },
  content: {
    gap: SPACING.xs,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.3,
  },
  quantity: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  revenue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
});
