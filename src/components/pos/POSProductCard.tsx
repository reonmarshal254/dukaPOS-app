import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

interface POSProductCardProps {
  product: Product;
  onAddToCart: () => void;
  quantityInCart?: number;
}

export default function POSProductCard({ 
  product, 
  onAddToCart,
  quantityInCart = 0,
}: POSProductCardProps) {
  const isLowStock = product.currentQuantity <= product.minStockThreshold;
  const isOutOfStock = product.currentQuantity === 0;
  const imageSource = product.localImagePath || product.imageUrl;

  return (
    <View style={styles.card}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image
            source={{ uri: imageSource }}
            style={[styles.image, isOutOfStock && styles.imageDisabled]}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.imagePlaceholder, isOutOfStock && styles.imageDisabled]}>
            <Text style={styles.placeholderEmoji}>📦</Text>
          </View>
        )}
        
        {/* Quantity Badge */}
        {quantityInCart > 0 && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityBadgeText}>{quantityInCart}</Text>
          </View>
        )}
      </View>

      {/* Content Section - Compact */}
      <View style={styles.content}>
        <Text 
          style={[styles.name, isOutOfStock && styles.nameDisabled]} 
          numberOfLines={2} 
          ellipsizeMode="tail"
        >
          {product.name}
        </Text>
        
        <Text style={[styles.price, isOutOfStock && styles.priceDisabled]}>
          {formatCurrency(product.sellingPrice)}
        </Text>

        {/* Stock Badge - Compact */}
        {isOutOfStock && (
          <View style={[styles.badge, styles.badgeError]}>
            <Text style={styles.badgeErrorText}>Out</Text>
          </View>
        )}
        {!isOutOfStock && isLowStock && (
          <View style={[styles.badge, styles.badgeWarning]}>
            <Text style={styles.badgeWarningText}>Low</Text>
          </View>
        )}
      </View>

      {/* Add to Cart Button - Compact */}
      <TouchableOpacity
        style={[
          styles.addButton,
          isOutOfStock && styles.addButtonDisabled,
        ]}
        onPress={onAddToCart}
        disabled={isOutOfStock}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.addButtonText,
          isOutOfStock && styles.addButtonTextDisabled,
        ]}>
          {isOutOfStock ? 'Out' : '+'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageDisabled: {
    opacity: 0.4,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  quantityBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  quantityBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  content: {
    padding: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
    minHeight: TYPOGRAPHY.fontSize.sm * 2 * 1.4,
  },
  nameDisabled: {
    color: COLORS.textSecondary,
  },
  price: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs / 2,
  },
  priceDisabled: {
    color: COLORS.textSecondary,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs / 2,
  },
  badgeWarning: {
    backgroundColor: COLORS.badgeWarning,
  },
  badgeWarningText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.badgeWarningText,
  },
  badgeError: {
    backgroundColor: COLORS.badgeError,
  },
  badgeErrorText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.badgeErrorText,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  addButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
});
