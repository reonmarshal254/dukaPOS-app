import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { useProducts } from '../../../hooks/useProducts';
import { useStockBatches } from '../../../hooks/useStockBatches';
import stockBatchRepository from '../../../services/repositories/stockBatchRepository';
import { executeTransaction } from '../../../database';
import { TABLES } from '../../../database/schema';
import { getCurrentDateTime } from '../../../utils/datetime';
import { generateUUID } from '../../../utils/uuid';
import { StockMovementType } from '../../../types';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';
import { useQueryClient } from '@tanstack/react-query';

type AdjustmentType = 'ADD' | 'REMOVE';

const adjustmentSchema = z.object({
  productId: z.string().min(1, 'Please select a product'),
  adjustmentType: z.enum(['ADD', 'REMOVE']),
  quantity: z.string().min(1, 'Quantity is required'),
  reason: z.string().min(1, 'Please select a reason'),
  notes: z.string().optional(),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

const REASONS = [
  { value: 'stocktake_correction', label: 'Stocktake Correction' },
  { value: 'theft', label: 'Theft' },
  { value: 'found_stock', label: 'Found Stock' },
  { value: 'other', label: 'Other' },
];

export default function StockAdjustmentScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: products = [] } = useProducts({ isActive: true });
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      productId: '',
      adjustmentType: 'ADD',
      quantity: '',
      reason: '',
      notes: '',
    },
  });

  const watchedProductId = watch('productId');
  const watchedAdjustmentType = watch('adjustmentType');
  const selectedProduct = products.find((p) => p.id === watchedProductId);

  const onSubmit = async (data: AdjustmentFormData) => {
    try {
      const quantity = parseInt(data.quantity);

      if (isNaN(quantity) || quantity <= 0) {
        Alert.alert('Error', 'Please enter a valid quantity');
        return;
      }

      const product = products.find((p) => p.id === data.productId);
      if (!product) {
        Alert.alert('Error', 'Selected product not found');
        return;
      }

      // For REMOVE, check if sufficient stock exists
      if (data.adjustmentType === 'REMOVE' && quantity > product.currentQuantity) {
        Alert.alert(
          'Error',
          `Insufficient stock. Available: ${product.currentQuantity}`
        );
        return;
      }

      setIsSubmitting(true);

      if (data.adjustmentType === 'ADD') {
        await handleAddStock(data, quantity);
      } else {
        await handleRemoveStock(data, quantity);
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stockBatches'] });
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });

      Alert.alert('Success', 'Stock adjustment recorded successfully');
      reset();
    } catch (error: any) {
      console.error('Error recording stock adjustment:', error);
      Alert.alert('Error', error.message || 'Failed to record adjustment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStock = async (data: AdjustmentFormData, quantity: number) => {
    await executeTransaction(async (db) => {
      const now = getCurrentDateTime();
      const batchId = generateUUID();
      const movementId = generateUUID();
      const batchNumber = `ADJ-${Date.now()}`;

      // 1. Create new stock batch
      await db.runAsync(
        `INSERT INTO ${TABLES.STOCK_BATCHES} (
          id, product_id, batch_number, received_quantity, remaining_quantity,
          purchase_cost, received_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          batchId,
          data.productId,
          batchNumber,
          quantity,
          quantity,
          0, // Cost is 0 for adjustments
          now,
          now,
        ]
      );

      // 2. Update products.current_quantity
      await db.runAsync(
        `UPDATE ${TABLES.PRODUCTS} SET current_quantity = current_quantity + ?, updated_at = ? WHERE id = ?`,
        [quantity, now, data.productId]
      );

      // 3. Record stock movement
      await db.runAsync(
        `INSERT INTO ${TABLES.STOCK_MOVEMENTS} (
          id, product_id, batch_id, type, quantity, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          movementId,
          data.productId,
          batchId,
          StockMovementType.STOCK_ADJUSTMENT,
          quantity,
          `${data.reason}: ${data.notes || 'Stock added via adjustment'}`,
          now,
        ]
      );
    });
  };

  const handleRemoveStock = async (data: AdjustmentFormData, quantity: number) => {
    // Use FEFO allocation to determine which batches to deduct from
    const allocations = await stockBatchRepository.allocateStock(data.productId, quantity);

    await executeTransaction(async (db) => {
      const now = getCurrentDateTime();

      // Deduct from batches according to FEFO allocation
      for (const allocation of allocations) {
        // 1. Deduct from stock_batches.remaining_quantity
        await db.runAsync(
          `UPDATE ${TABLES.STOCK_BATCHES} SET remaining_quantity = remaining_quantity - ? WHERE id = ?`,
          [allocation.quantity, allocation.batchId]
        );

        // 2. Record stock movement for each batch
        const movementId = generateUUID();
        await db.runAsync(
          `INSERT INTO ${TABLES.STOCK_MOVEMENTS} (
            id, product_id, batch_id, type, quantity, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            movementId,
            data.productId,
            allocation.batchId,
            StockMovementType.STOCK_ADJUSTMENT,
            allocation.quantity,
            `${data.reason}: ${data.notes || 'Stock removed via adjustment'}`,
            now,
          ]
        );
      }

      // 3. Update products.current_quantity
      await db.runAsync(
        `UPDATE ${TABLES.PRODUCTS} SET current_quantity = current_quantity - ?, updated_at = ? WHERE id = ?`,
        [quantity, now, data.productId]
      );
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Stock Adjustment</Text>
          <Text style={styles.subtitle}>Manually adjust inventory levels</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            {/* Product Picker */}
            <Controller
              control={control}
              name="productId"
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerSection}>
                  <Text style={styles.pickerLabel}>Product *</Text>
                  <View style={styles.pickerOptions}>
                    {products.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        style={[
                          styles.pickerOption,
                          value === product.id && styles.pickerOptionActive,
                        ]}
                        onPress={() => onChange(product.id)}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            value === product.id && styles.pickerOptionTextActive,
                          ]}
                        >
                          {product.name}
                        </Text>
                        <Text
                          style={[
                            styles.pickerOptionSubtext,
                            value === product.id && styles.pickerOptionSubtextActive,
                          ]}
                        >
                          Current Stock: {product.currentQuantity} {product.unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {errors.productId && (
                    <Text style={styles.errorText}>{errors.productId.message}</Text>
                  )}
                </View>
              )}
            />

            {/* Adjustment Type */}
            <Controller
              control={control}
              name="adjustmentType"
              render={({ field: { onChange, value } }) => (
                <View style={styles.radioSection}>
                  <Text style={styles.radioLabel}>Adjustment Type *</Text>
                  <View style={styles.radioGroup}>
                    <TouchableOpacity
                      style={[
                        styles.radioOption,
                        value === 'ADD' && styles.radioOptionActive,
                      ]}
                      onPress={() => onChange('ADD')}
                    >
                      <View style={styles.radioCircle}>
                        {value === 'ADD' && <View style={styles.radioCircleInner} />}
                      </View>
                      <Text
                        style={[
                          styles.radioText,
                          value === 'ADD' && styles.radioTextActive,
                        ]}
                      >
                        Add Stock
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.radioOption,
                        value === 'REMOVE' && styles.radioOptionActive,
                      ]}
                      onPress={() => onChange('REMOVE')}
                    >
                      <View style={styles.radioCircle}>
                        {value === 'REMOVE' && <View style={styles.radioCircleInner} />}
                      </View>
                      <Text
                        style={[
                          styles.radioText,
                          value === 'REMOVE' && styles.radioTextActive,
                        ]}
                      >
                        Remove Stock
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />

            {/* Quantity Input */}
            <Controller
              control={control}
              name="quantity"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Quantity"
                  placeholder="Enter quantity"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  error={errors.quantity?.message}
                  required
                  helperText={
                    selectedProduct && watchedAdjustmentType === 'REMOVE'
                      ? `Available: ${selectedProduct.currentQuantity}`
                      : undefined
                  }
                />
              )}
            />

            {/* Reason Dropdown */}
            <Controller
              control={control}
              name="reason"
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerSection}>
                  <Text style={styles.pickerLabel}>Reason *</Text>
                  <View style={styles.reasonOptions}>
                    {REASONS.map((reason) => (
                      <TouchableOpacity
                        key={reason.value}
                        style={[
                          styles.reasonOption,
                          value === reason.value && styles.reasonOptionActive,
                        ]}
                        onPress={() => onChange(reason.value)}
                      >
                        <Text
                          style={[
                            styles.reasonText,
                            value === reason.value && styles.reasonTextActive,
                          ]}
                        >
                          {reason.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {errors.reason && (
                    <Text style={styles.errorText}>{errors.reason.message}</Text>
                  )}
                </View>
              )}
            />

            {/* Notes */}
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Additional Notes (Optional)"
                  placeholder="Enter any additional details..."
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={3}
                  style={styles.textArea}
                />
              )}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Record Adjustment"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
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
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  form: {
    marginBottom: SPACING.lg,
  },
  pickerSection: {
    marginBottom: SPACING.lg,
  },
  pickerLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  pickerOptions: {
    gap: SPACING.sm,
  },
  pickerOption: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  pickerOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pickerOptionText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  pickerOptionTextActive: {
    color: COLORS.textInverse,
  },
  pickerOptionSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  pickerOptionSubtextActive: {
    color: COLORS.textInverse,
    opacity: 0.9,
  },
  radioSection: {
    marginBottom: SPACING.lg,
  },
  radioLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  radioOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  radioOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight || COLORS.surface,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  radioTextActive: {
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  reasonOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  reasonOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reasonOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  reasonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
  },
  reasonTextActive: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
