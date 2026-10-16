import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useUpdateVariant } from '../../hooks/useProductVariants';
import { toMinorUnits, toMajorUnits } from '../../utils/currency';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import BarcodeScanner from '../common/BarcodeScanner';
import { ScanIcon, TrashIcon } from '../common/Icons';
import { ProductVariant } from '../../types';

interface EditVariantModalProps {
  visible: boolean;
  variant: ProductVariant | null;
  productName: string;
  onClose: () => void;
  onDelete: (variantId: string) => void;
}

export default function EditVariantModal({
  visible,
  variant,
  productName,
  onClose,
  onDelete,
}: EditVariantModalProps) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('0');
  const [stockAdjustment, setStockAdjustment] = useState('0');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);

  const updateVariant = useUpdateVariant();

  // Populate form when variant changes
  useEffect(() => {
    if (variant) {
      setName(variant.name);
      setUnit(variant.unit);
      setSellingPrice(toMajorUnits(variant.sellingPrice));
      setPurchasePrice(variant.purchasePrice ? toMajorUnits(variant.purchasePrice) : '');
      setBarcode(variant.barcode || '');
      setSku(variant.sku || '');
      setCurrentQuantity(variant.currentQuantity.toString());
      setStockAdjustment('0');
      setAdjustmentReason('');
      setIsDefault(variant.isDefault);
    }
  }, [variant]);

  const handleBarcodeScanned = (scannedCode: string) => {
    setBarcode(scannedCode);
    Alert.alert('Barcode Scanned', `Barcode: ${scannedCode}`);
    setScannerVisible(false);
  };

  const handleApplyStockAdjustment = () => {
    const adjustment = parseInt(stockAdjustment);
    if (isNaN(adjustment) || adjustment === 0) {
      Alert.alert('Invalid', 'Please enter a non-zero adjustment');
      return;
    }

    const currentQty = parseInt(currentQuantity);
    const newQty = currentQty + adjustment;

    if (newQty < 0) {
      Alert.alert('Error', 'Stock cannot be negative');
      return;
    }

    Alert.alert(
      'Adjust Stock',
      `${adjustment > 0 ? 'Add' : 'Remove'} ${Math.abs(adjustment)} ${unit}?\n\nCurrent: ${currentQty}\nNew: ${newQty}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setCurrentQuantity(newQty.toString());
            setStockAdjustment('0');
            setAdjustmentReason('');
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!variant) return;

    if (!name.trim()) {
      Alert.alert('Required', 'Please enter variant name');
      return;
    }

    if (!unit.trim()) {
      Alert.alert('Required', 'Please enter unit');
      return;
    }

    const selling = parseFloat(sellingPrice);
    if (isNaN(selling) || selling <= 0) {
      Alert.alert('Invalid', 'Please enter valid selling price');
      return;
    }

    const purchase = purchasePrice ? parseFloat(purchasePrice) : undefined;
    if (purchase !== undefined && (isNaN(purchase) || purchase < 0)) {
      Alert.alert('Invalid', 'Please enter valid purchase price');
      return;
    }

    const quantity = parseInt(currentQuantity);
    if (isNaN(quantity) || quantity < 0) {
      Alert.alert('Invalid', 'Please enter valid stock quantity');
      return;
    }

    try {
      await updateVariant.mutateAsync({
        id: variant.id,
        data: {
          name: name.trim(),
          unit: unit.trim(),
          sellingPrice: toMinorUnits(selling),
          purchasePrice: purchase ? toMinorUnits(purchase) : undefined,
          barcode: barcode.trim() || undefined,
          sku: sku.trim() || undefined,
          currentQuantity: quantity,
          isDefault,
        },
      });

      Alert.alert('Success', 'Variant updated successfully');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update variant');
    }
  };

  const handleDelete = () => {
    if (!variant) return;

    Alert.alert(
      'Delete Variant',
      `Are you sure you want to delete "${variant.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(variant.id);
            onClose();
          },
        },
      ]
    );
  };

  if (!variant) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modal}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Edit Variant</Text>
              <Text style={styles.subtitle}>{productName}</Text>
            </View>
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.deleteBtn}
            >
              <TrashIcon size={18} color={COLORS.error} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>
              Variant Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., 500ml, 1 Liter, Small, Medium"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.label}>
              Unit <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={unit}
              onChangeText={setUnit}
              placeholder="e.g., ml, L, kg, pcs"
              placeholderTextColor={COLORS.textSecondary}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>
                  Selling Price (KES) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ width: SPACING.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Purchase Price</Text>
                <TextInput
                  style={styles.input}
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Profit/Loss Calculator */}
            {(() => {
              const purchase = parseFloat(purchasePrice || '0');
              const selling = parseFloat(sellingPrice || '0');
              
              if (isNaN(purchase) || isNaN(selling) || purchase === 0 || selling === 0) {
                return null;
              }
              
              const difference = selling - purchase;
              const percentage = ((difference / purchase) * 100).toFixed(1);
              const isProfit = difference > 0;
              const isLoss = difference < 0;
              const isBreakeven = difference === 0;
              
              return (
                <View style={[
                  styles.profitLossCard,
                  isProfit && styles.profitCard,
                  isLoss && styles.lossCard,
                  isBreakeven && styles.breakevenCard,
                ]}>
                  <View style={styles.profitLossHeader}>
                    <Text style={[
                      styles.profitLossLabel,
                      isProfit && styles.profitText,
                      isLoss && styles.lossText,
                    ]}>
                      {isProfit ? '📈 Profit' : isLoss ? '📉 Loss' : '➡️ Break Even'}
                    </Text>
                    <Text style={[
                      styles.profitLossPercentage,
                      isProfit && styles.profitText,
                      isLoss && styles.lossText,
                    ]}>
                      {percentage}%
                    </Text>
                  </View>
                  <Text style={[
                    styles.profitLossAmount,
                    isProfit && styles.profitText,
                    isLoss && styles.lossText,
                  ]}>
                    {isProfit ? '+' : ''}{difference.toFixed(2)}
                  </Text>
                  <Text style={styles.profitLossNote}>
                    {isProfit 
                      ? 'Good margin for this variant!' 
                      : isLoss 
                      ? 'Warning: Selling below cost will result in loss.'
                      : 'No profit or loss at this price.'}
                  </Text>
                </View>
              );
            })()}

            <Text style={styles.label}>Barcode (Optional)</Text>
            <View style={styles.barcodeRow}>
              <TextInput
                style={[styles.input, styles.barcodeInput]}
                value={barcode}
                onChangeText={setBarcode}
                placeholder="Unique barcode for this variant"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => setScannerVisible(true)}
              >
                <ScanIcon size={20} color="#FFFFFF" />
                <Text style={styles.scanButtonText}>Scan</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>SKU (Optional)</Text>
            <TextInput
              style={styles.input}
              value={sku}
              onChangeText={setSku}
              placeholder="Unique SKU for this variant"
              placeholderTextColor={COLORS.textSecondary}
            />

            {/* Stock Management Section */}
            <View style={styles.stockSection}>
              <Text style={styles.sectionTitle}>Stock Management</Text>
              
              <View style={styles.currentStockCard}>
                <Text style={styles.currentStockLabel}>Current Stock</Text>
                <Text style={styles.currentStockValue}>
                  {currentQuantity} {unit}
                </Text>
              </View>

              <Text style={styles.label}>Quick Adjust</Text>
              <TextInput
                style={styles.input}
                value={stockAdjustment}
                onChangeText={setStockAdjustment}
                placeholder="e.g., 50 to add, -20 to remove"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
              />

              <TextInput
                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                value={adjustmentReason}
                onChangeText={setAdjustmentReason}
                placeholder="Reason (optional)"
                placeholderTextColor={COLORS.textSecondary}
                multiline
              />

              <TouchableOpacity
                style={[styles.adjustBtn, updateVariant.isPending && { opacity: 0.6 }]}
                onPress={handleApplyStockAdjustment}
                disabled={updateVariant.isPending}
              >
                <Text style={styles.adjustBtnText}>Apply Stock Adjustment</Text>
              </TouchableOpacity>

              <Text style={styles.helperText}>
                Or edit the current stock directly above
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsDefault(!isDefault)}
            >
              <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
                {isDefault && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkboxLabel}>Set as default variant</Text>
                <Text style={styles.checkboxHelper}>
                  The default variant will be pre-selected in POS
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, updateVariant.isPending && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={updateVariant.isPending}
            >
              <Text style={styles.submitBtnText}>
                {updateVariant.isPending ? 'Updating...' : 'Update Variant'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Barcode Scanner */}
      <BarcodeScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    maxHeight: '90%',
    ...SHADOWS.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.divider,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.badgeError,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
  },
  barcodeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  barcodeInput: {
    flex: 1,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
    minWidth: 80,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  stockSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  currentStockCard: {
    backgroundColor: COLORS.badgeInfo,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  currentStockLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.info,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  currentStockValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.info,
  },
  adjustBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  adjustBtnText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  checkboxLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  checkboxHelper: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitBtnText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  profitLossCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    borderWidth: 2,
  },
  profitCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  lossCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  breakevenCard: {
    backgroundColor: '#F3F4F6',
    borderColor: '#9CA3AF',
  },
  profitLossHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  profitLossLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  profitLossPercentage: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  profitLossAmount: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.xs,
  },
  profitText: {
    color: '#10B981',
  },
  lossText: {
    color: '#EF4444',
  },
  profitLossNote: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
