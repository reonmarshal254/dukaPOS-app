import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CartItem as CartItemType } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.product.id, item.quantity - 1);
    }
  };

  const handleIncrease = () => {
    onUpdateQuantity(item.product.id, item.quantity + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.product.name}
        </Text>
        <Text style={styles.unitPrice}>
          {formatCurrency(item.product.sellingPrice)} × {item.quantity} {item.product.unit}
        </Text>
        {item.discount > 0 && (
          <Text style={styles.discount}>Discount: {item.discount}%</Text>
        )}
      </View>

      <View style={styles.controls}>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={handleDecrease}
            activeOpacity={0.7}
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>
          
          <Text style={styles.quantity}>{item.quantity}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={handleIncrease}
            activeOpacity={0.7}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.total}>{formatCurrency(item.total)}</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(item.product.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: SPACING.md,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  unitPrice: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  discount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.warning,
    marginTop: SPACING.xs,
  },
  controls: {
    alignItems: 'flex-end',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quantityButton: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  quantity: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginHorizontal: SPACING.md,
    minWidth: 32,
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  total: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginRight: SPACING.md,
  },
  removeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
