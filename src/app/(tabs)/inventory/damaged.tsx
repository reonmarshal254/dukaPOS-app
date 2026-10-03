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
import { executeTransaction } from '../../../database';
import { TABLES } from '../../../database/schema';
import { getCurrentDateTime } from '../../../utils/datetime';
import { generateUUID } from '../../../utils/uuid';
import { StockMovementType } from '../../../types';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';
import { useQueryClient } from '@tanstack/react-query';

const damagedGoodsSchema = z.object({
  productId: z.string().min(1, 'Please select a product'),
  batchId: z.string().min(1, 'Please select a batch'),
  quantity: z.string().min(1, 'Quantity is required'),
  notes: z.string().optional(),
});

type DamagedGoodsFormData = z.infer<typeof damagedGoodsSchema>;

export default function DamagedGoodsScreen() {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: products = [] } = useProducts({ isActive: true });
  const { data: batches = [] } = useStockBatches(selectedProductId);
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<DamagedGoodsFormData>({
    resolver: zodResolver(damagedGoodsSchema),
    defaultValues: {
      productId: '',
      batchId: '',
      quantity: '',
      notes: '',
    },
  });

  const watchedProductId = watch('productId');
  const watchedBatchId = watch('batchId');

  // Update selected product when productId changes
  if (watchedProductId !== selectedProductId) {
    setSelectedProductId(watchedProductId);
    setValue('batchId', ''); // Reset batch selection when product changes
  }

  const selectedBatch = batches.find((b) => b.id === watchedBatchId);

  const onSubmit = async (data: DamagedGoodsFormData) => {
    try {
      const quantity = parseInt(data.quantity);

      if (isNaN(quantity) || quantity <= 0) {
        Alert.alert('Error', 'Please enter a valid quantity');
        return;
      }

      const batch = batches.find((b) => b.id === data.batchId);
      if (!batch) {
        Alert.alert('Error', 'Selected batch not found');
        return;
      }

      if (quantity > batch.remainingQuantity) {
        Alert.alert(
          'Error',
          `Quantity exceeds available stock. Available: ${batch.remainingQuantity}`
        );
        return;
      }

      setIsSubmitting(true);

      await executeTransaction(async (db) => {
        const now = getCurrentDateTime();
        const movementId = generateUUID();

        // 1. Deduct from stock_batches.remaining_quantity
        await db.runAsync(
          `UPDATE ${TABLES.STOCK_BATCHES} SET remaining_quantity = remaining_quantity - ? WHERE id = ?`,
          [quantity, data.batchId]
        );

        // 2. Update products.current_quantity
        await db.runAsync(
          `UPDATE ${TABLES.PRODUCTS} SET current_quantity = current_quantity - ?, updated_at = ? WHERE id = ?`,
          [quantity, now, data.productId]
        );

        // 3. Insert stock_movements record
        await db.runAsync(
          `INSERT INTO ${TABLES.STOCK_MOVEMENTS} (
            id, product_id, batch_id, type, quantity, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            movementId,
            data.productId,
            data.batchId,
            StockMovementType.DAMAGE,
            quantity,
            data.notes || null,
            now,
          ]
        );
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stockBatches'] });
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });

      Alert.alert('Success', 'Damaged goods recorded successfully');
      reset();
      setSelectedProductId('');
    } catch (error) {
      console.error('Error recording damaged goods:', error);
      Alert.alert('Error', 'Failed to record damaged goods. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Record Damaged Goods</Text>
          <Text style={styles.subtitle}>Track damaged or spoiled inventory</Text>
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
                          Stock: {product.currentQuantity} {product.unit}
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

            {/* Batch Picker */}
            {selectedProductId && (
              <Controller
                control={control}
                name="batchId"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.pickerSection}>
                    <Text style={styles.pickerLabel}>Batch *</Text>
                    {batches.length > 0 ? (
                      <View style={styles.pickerOptions}>
                        {batches
                          .filter((batch) => batch.remainingQuantity > 0)
                          .map((batch) => (
                            <TouchableOpacity
                              key={batch.id}
                              style={[
                                styles.pickerOption,
                                value === batch.id && styles.pickerOptionActive,
                              ]}
                              onPress={() => onChange(batch.id)}
                            >
                              <Text
                                style={[
                                  styles.pickerOptionText,
                                  value === batch.id && styles.pickerOptionTextActive,
                                ]}
                              >
                                {batch.batchNumber}
                              </Text>
                              <Text
                                style={[
                                  styles.pickerOptionSubtext,
                                  value === batch.id && styles.pickerOptionSubtextActive,
                                ]}
                              >
                                Available: {batch.remainingQuantity}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    ) : (
                      <Text style={styles.noBatchesText}>No batches available for this product</Text>
                    )}
                    {errors.batchId && (
                      <Text style={styles.errorText}>{errors.batchId.message}</Text>
                    )}
                  </View>
                )}
              />
            )}

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
                    selectedBatch
                      ? `Available: ${selectedBatch.remainingQuantity}`
                      : undefined
                  }
                />
              )}
            />

            {/* Notes/Reason */}
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Reason / Notes"
                  placeholder="e.g., Broken packaging, expired, water damage"
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
            title="Record Damaged Goods"
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
  noBatchesText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    padding: SPACING.md,
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
