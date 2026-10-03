import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Product, Category } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

interface ProductCardProps {
  product: Product;
  category?: Category | null;
  onPress?: () => void;
}

export default function ProductCard({ product, category, onPress }: ProductCardProps) {
  const isLowStock = product.currentQuantity <= product.minStockThreshold;
  const isOutOfStock = product.currentQuantity === 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          
          {category && (
            <Text style={styles.category} numberOfLines={1}>
              {category.name}
            </Text>
          )}
          
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {formatCurrency(product.sellingPrice)}
            </Text>
            <Text style={styles.stock}>
              Stock: {product.currentQuantity} {product.unit}
            </Text>
          </View>
        </View>

        <View style={styles.badges}>
          {isOutOfStock && (
            <View style={[styles.badge, styles.badgeError]}>
              <Text style={[styles.badgeText, styles.badgeErrorText]}>
                Out of Stock
              </Text>
            </View>
          )}
          {!isOutOfStock && isLowStock && (
            <View style={[styles.badge, styles.badgeWarning]}>
              <Text style={[styles.badgeText, styles.badgeWarningText]}>
                Low Stock
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  content: {
    padding: SPACING.md,
  },
  info: {
    marginBottom: SPACING.sm,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  category: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  stock: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  badgeWarning: {
    backgroundColor: COLORS.badgeWarning,
  },
  badgeWarningText: {
    color: COLORS.badgeWarningText,
  },
  badgeError: {
    backgroundColor: COLORS.badgeError,
  },
  badgeErrorText: {
    color: COLORS.badgeErrorText,
  },
});
