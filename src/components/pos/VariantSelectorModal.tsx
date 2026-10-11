import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { Product, ProductVariant } from '../../types';

interface VariantSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product;
  variants: ProductVariant[];
  onSelectVariant: (variant: ProductVariant | null) => void;
}

export default function VariantSelectorModal({
  visible,
  onClose,
  product,
  variants,
  onSelectVariant,
}: VariantSelectorModalProps) {
  const handleSelectMain = () => {
    onSelectVariant(null); // null means main product
    onClose();
  };

  const handleSelectVariant = (variant: ProductVariant) => {
    onSelectVariant(variant);
    onClose();
  };

  const formatPrice = (price: number) => {
    return `KES ${(price / 100).toFixed(2)}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
      </Pressable>

      <View style={styles.bottomSheet}>
        {/* Handle Bar */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Variant</Text>
          <Text style={styles.productName}>{product.name}</Text>
        </View>

        {/* Variants List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Product Card */}
          <TouchableOpacity
            style={[styles.variantCard, styles.mainCard]}
            onPress={handleSelectMain}
            activeOpacity={0.7}
          >
            <View style={styles.variantInfo}>
              <View style={styles.variantHeader}>
                <Text style={styles.variantName}>Main Product</Text>
                <View style={styles.mainBadge}>
                  <Text style={styles.mainBadgeText}>DEFAULT</Text>
                </View>
              </View>
              <Text style={styles.variantUnit}>{product.unit}</Text>
            </View>
            <View style={styles.variantPricing}>
              <Text style={styles.variantPrice}>{formatPrice(product.sellingPrice)}</Text>
              <View style={styles.selectButton}>
                <Text style={styles.selectButtonText}>Select</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Variant Cards */}
          {variants.map((variant) => (
            <TouchableOpacity
              key={variant.id}
              style={styles.variantCard}
              onPress={() => handleSelectVariant(variant)}
              activeOpacity={0.7}
            >
              <View style={styles.variantInfo}>
                <View style={styles.variantHeader}>
                  <Text style={styles.variantName}>{variant.name}</Text>
                  {variant.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.variantUnit}>{variant.unit}</Text>
              </View>
              <View style={styles.variantPricing}>
                <Text style={styles.variantPrice}>{formatPrice(variant.sellingPrice)}</Text>
                <View style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>Select</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    paddingBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  productName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  variantCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mainCard: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  variantInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  variantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  variantName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  variantUnit: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  mainBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  defaultBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  variantPricing: {
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  variantPrice: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  selectButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  selectButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
  cancelButton: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.border,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
});
