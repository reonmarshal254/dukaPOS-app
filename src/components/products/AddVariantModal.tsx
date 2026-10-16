import { useState } from 'react';
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
import { useCreateVariant } from '../../hooks/useProductVariants';
import { toMinorUnits } from '../../utils/currency';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import BarcodeScanner from '../common/BarcodeScanner';
import { ScanIcon } from '../common/Icons';

interface AddVariantModalProps {
  visible: boolean;
  productId: string;
  productName: string;
  onClose: () => void;
}

export default function AddVariantModal({
  visible,
  productId,
  productName,
  onClose,
}: AddVariantModalProps) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('0');
  const [isDefault, setIsDefault] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanTarget, setScanTarget] = useState<'barcode' | 'sku'>('barcode');

  const createVariant = useCreateVariant();

  const reset = () => {
    setName('');
    setUnit('');
    setSellingPrice('');
    setPurchasePrice('');
    setBarcode('');
    setSku('');
    setCurrentQuantity('0');
    setIsDefault(false);
    setScannerVisible(false);
  };

  const handleBarcodeScanned = (scannedCode: string) => {
    if (scanTarget === 'barcode') {
      setBarcode(scannedCode);
      Alert.alert('Barcode Scanned', `Barcode: ${scannedCode}`);
    } else {
      setSku(scannedCode);
      Alert.alert('SKU Scanned', `SKU: ${scannedCode}`);
    }
    setScannerVisible(false);
  };

  const openScanner = (target: 'barcode' | 'sku') => {
    setScanTarget(target);
    setScannerVisible(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter variant name (e.g., 500ml, 1L)');
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
      await createVariant.mutateAsync({
        productId,
        name: name.trim(),
        unit: unit.trim(),
        sellingPrice: toMinorUnits(selling),
        purchasePrice: purchase ? toMinorUnits(purchase) : undefined,
        barcode: barcode.trim() || undefined,
        sku: sku.trim() || undefined,
        currentQuantity: quantity,
        isDefault,
      });

      reset();
      onClose();
      Alert.alert('Success', 'Variant added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add variant');
    }
  };

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
            <View>
              <Text style={styles.title}>Add Variant</Text>
              <Text style={styles.subtitle}>{productName}</Text>
            </View>
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
                onPress={() => openScanner('barcode')}
              >
                <ScanIcon size={20} color="#FFFFFF" />
                <Text style={styles.scanButtonText}>Scan</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>SKU (Optional)</Text>
            <View style={styles.barcodeRow}>
              <TextInput
                style={[styles.input, styles.barcodeInput]}
                value={sku}
                onChangeText={setSku}
                placeholder="Unique SKU for this variant"
                placeholderTextColor={COLORS.textSecondary}
              />
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => openScanner('sku')}
              >
                <ScanIcon size={20} color="#FFFFFF" />
                <Text style={styles.scanButtonText}>Scan</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Initial Stock Quantity</Text>
            <TextInput
              style={styles.input}
              value={currentQuantity}
              onChangeText={setCurrentQuantity}
              placeholder="0"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="number-pad"
            />

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
              style={[styles.submitBtn, createVariant.isPending && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={createVariant.isPending}
            >
              <Text style={styles.submitBtnText}>
                {createVariant.isPending ? 'Adding...' : 'Add Variant'}
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
    maxHeight: '85%',
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.md,
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
