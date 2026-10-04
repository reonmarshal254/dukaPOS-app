import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
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

  const imageSource = product.localImagePath || product.imageUrl;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image
            source={{ uri: imageSource }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>📦</Text>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">
          {product.name}
        </Text>
        
        <Text style={styles.price}>
          {formatCurrency(product.sellingPrice)}
        </Text>

        {/* Badges */}
        {(isOutOfStock || isLowStock) && (
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
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  content: {
    padding: SPACING.md,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    minHeight: TYPOGRAPHY.fontSize.base * 2 * 1.5, // 2 lines with line-height
  },
  price: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
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
