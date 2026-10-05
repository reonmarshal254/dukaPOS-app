import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';
import { useCartStore } from '../../../stores/cartStore';
import Button from '../../../components/common/Button';
import { CashIcon } from '../../../components/common/Icons';
import { formatCurrency, toMajorUnits, toMinorUnits } from '../../../utils/currency';
import { PaymentMethod } from '../../../types';
import { executeTransaction } from '../../../database';
import { TABLES } from '../../../database/schema';
import { generateUUID } from '../../../utils/uuid';
import { getCurrentDateTime } from '../../../utils/datetime';
import stockBatchRepository from '../../../services/repositories/stockBatchRepository';
import productRepository from '../../../services/repositories/productRepository';
import { checkAndNotifyLowStock } from '../../../hooks/useProducts';

const { width } = Dimensions.get('window');

type PaymentEntry = {
  id: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
};

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, discount, getSubtotal, getTotal, clearCart } = useCartStore();

  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
  const [cashTendered, setCashTendered] = useState('');
  const [mobileMoneyReference, setMobileMoneyReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getSubtotal();
  const total = getTotal();
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - totalPaid;

  /**
   * Generate receipt number in format RCP-YYYYMMDD-NNNN
   */
  const generateReceiptNumber = async (): Promise<string> => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Get today's count
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    const { getDatabase, executeQuerySingle } = await import('../../../database');
    const countResult = await executeQuerySingle<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${TABLES.SALES} 
       WHERE created_at >= ? AND created_at <= ?`,
      [startOfDay.toISOString(), endOfDay.toISOString()]
    );

    const count = (countResult?.count ?? 0) + 1;
    const sequence = String(count).padStart(4, '0');
    return `RCP-${dateStr}-${sequence}`;
  };

  /**
   * Validate stock availability before checkout
   */
  const validateStock = async (): Promise<boolean> => {
    for (const item of items) {
      // Re-fetch product to get current stock level
      const product = await productRepository.getById(item.product.id);
      if (!product) {
        Alert.alert('Error', `Product ${item.product.name} not found`);
        return false;
      }

      if (product.currentQuantity < item.quantity) {
        Alert.alert(
          'Insufficient Stock',
          `Insufficient stock for ${product.name}.\nAvailable: ${product.currentQuantity}, Requested: ${item.quantity}`
        );
        return false;
      }
    }
    return true;
  };

  /**
   * Add payment to the list
   */
  const handleAddPayment = () => {
    let amount = 0;
    let reference: string | undefined;

    if (currentPaymentMethod === PaymentMethod.CASH) {
      const tendered = toMinorUnits(parseFloat(cashTendered) || 0);
      if (tendered <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid cash amount');
        return;
      }
      amount = Math.min(tendered, remaining);
    } else if (currentPaymentMethod === PaymentMethod.MOBILE_MONEY) {
      const payAmount = toMinorUnits(parseFloat(paymentAmount) || 0);
      if (payAmount <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid amount');
        return;
      }
      if (!mobileMoneyReference.trim()) {
        Alert.alert('Missing Reference', 'Please enter mobile money reference number');
        return;
      }
      amount = Math.min(payAmount, remaining);
      reference = mobileMoneyReference.trim();
    } else if (currentPaymentMethod === PaymentMethod.CREDIT) {
      Alert.alert('Coming Soon', 'Credit sales will be available in the next update');
      return;
    }

    const newPayment: PaymentEntry = {
      id: generateUUID(),
      method: currentPaymentMethod,
      amount,
      reference,
    };

    setPayments([...payments, newPayment]);

    // Reset form
    setCashTendered('');
    setMobileMoneyReference('');
    setPaymentAmount('');
  };

  /**
   * Remove payment from the list
   */
  const handleRemovePayment = (id: string) => {
    setPayments(payments.filter((p) => p.id !== id));
  };

  /**
   * Complete the sale with atomic transaction
   */
  const handleCompleteSale = async () => {
    try {
      setIsProcessing(true);

      // Validate we have full payment
      if (remaining > 0) {
        Alert.alert('Incomplete Payment', 'Please complete payment before checkout');
        return;
      }

      // Validate stock availability
      const stockValid = await validateStock();
      if (!stockValid) {
        return;
      }

      // Ensure database is ready
      const { getDatabase } = await import('../../../database');
      try {
        getDatabase(); // This will throw if database is not initialized
      } catch (error: any) {
        console.error('Database not ready:', error);
        Alert.alert('Error', 'Database not ready. Please wait a moment and try again.');
        return;
      }

      // Generate receipt number
      const receiptNumber = await generateReceiptNumber();

      // Execute atomic transaction
      await executeTransaction(async (db) => {
        const saleId = generateUUID();
        const now = getCurrentDateTime();

        // Calculate change (only for single cash payment scenario)
        let change = 0;
        if (
          payments.length === 1 &&
          payments[0].method === PaymentMethod.CASH &&
          cashTendered
        ) {
          const tendered = toMinorUnits(parseFloat(cashTendered));
          change = Math.max(0, tendered - total);
        }

        // Insert sale record
        await db.runAsync(
          `INSERT INTO ${TABLES.SALES} (
            id, customer_id, receipt_number, subtotal, discount, total,
            amount_paid, change, credit_amount, notes, created_at, sync_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            saleId,
            null, // customer_id (credit sales in FEAT-004)
            receiptNumber,
            subtotal,
            discount,
            total,
            totalPaid,
            change,
            0, // credit_amount (FEAT-004)
            null,
            now,
            'PENDING',
          ]
        );

        // Process each cart item
        for (const item of items) {
          // Allocate stock using FEFO
          const allocations = await stockBatchRepository.allocateStock(
            item.product.id,
            item.quantity
          );

          let totalCOGS = 0;

          // Deduct from each batch and record sale items
          for (const allocation of allocations) {
            // Get current batch
            const batch = await stockBatchRepository.getById(allocation.batchId);
            if (!batch) {
              throw new Error(`Batch ${allocation.batchId} not found`);
            }

            // Deduct from batch
            const newRemaining = batch.remainingQuantity - allocation.quantity;
            await db.runAsync(
              `UPDATE ${TABLES.STOCK_BATCHES} SET remaining_quantity = ? WHERE id = ?`,
              [newRemaining, allocation.batchId]
            );

            totalCOGS += allocation.cost;

            // Insert sale item (one per batch allocation)
            await db.runAsync(
              `INSERT INTO ${TABLES.SALE_ITEMS} (
                id, sale_id, product_id, batch_id, product_name, quantity,
                unit_price, discount, total, cost_of_goods_sold
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                generateUUID(),
                saleId,
                item.product.id,
                allocation.batchId,
                item.product.name,
                allocation.quantity,
                item.product.sellingPrice,
                item.discount,
                Math.round((item.total * allocation.quantity) / item.quantity), // proportional total
                allocation.cost,
              ]
            );
          }

          // Update product quantity
          const product = await productRepository.getById(item.product.id);
          if (product) {
            const newQuantity = product.currentQuantity - item.quantity;
            await db.runAsync(
              `UPDATE ${TABLES.PRODUCTS} SET current_quantity = ?, updated_at = ? WHERE id = ?`,
              [newQuantity, now, item.product.id]
            );
          }

          // Record stock movement
          await db.runAsync(
            `INSERT INTO ${TABLES.STOCK_MOVEMENTS} (
              id, product_id, batch_id, type, quantity, reference_id,
              reference_type, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              generateUUID(),
              item.product.id,
              null, // batch_id null for aggregated movement
              'SALE',
              item.quantity,
              saleId,
              'SALE',
              `Sale ${receiptNumber}`,
              now,
            ]
          );
        }

        // Insert payment records
        for (const payment of payments) {
          await db.runAsync(
            `INSERT INTO ${TABLES.PAYMENTS} (
              id, sale_id, customer_id, method, amount, reference, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              payment.id,
              saleId,
              null,
              payment.method,
              payment.amount,
              payment.reference || null,
              null,
              now,
            ]
          );
        }
      });

      // Success - clear cart and show receipt
      clearCart();

      // Check for low stock after sale deducts inventory
      checkAndNotifyLowStock();
      
      // Prepare receipt data
      const receiptData = {
        receiptNumber,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        items: items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
          total: item.total,
        })),
        subtotal,
        discount,
        total,
        amountPaid: totalPaid,
        change: Math.max(0, totalPaid - total),
        paymentMethod: payments.length === 1 ? payments[0].method : 'Multiple',
        businessName: 'DukaPOS',
      };

      // Navigate to receipt screen
      router.replace({
        pathname: '/(tabs)/pos/receipt',
        params: {
          receiptData: JSON.stringify(receiptData),
        },
      });
    } catch (error: any) {
      console.error('Checkout error:', error);
      Alert.alert('Error', error.message || 'Failed to complete sale. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Simplified Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: SPACING.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cart Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          
          {items.map((item, index) => (
            <View key={item.product.id} style={[
              styles.cartItem,
              index === items.length - 1 && styles.cartItemLast
            ]}>
              <View style={styles.cartItemLeft}>
                <Text style={styles.cartItemName}>{item.product.name}</Text>
                <Text style={styles.cartItemDetail}>
                  {item.quantity} × {formatCurrency(item.product.sellingPrice)}
                </Text>
              </View>
              <Text style={styles.cartItemTotal}>{formatCurrency(item.total)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>

          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount ({discount}%)</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                -{formatCurrency(subtotal - total)}
              </Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Payment Method Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          
          <View style={styles.paymentMethods}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                currentPaymentMethod === PaymentMethod.CASH && styles.methodButtonActive,
              ]}
              onPress={() => setCurrentPaymentMethod(PaymentMethod.CASH)}
              activeOpacity={0.7}
            >
              <CashIcon 
                size={24} 
                color={currentPaymentMethod === PaymentMethod.CASH ? '#FFFFFF' : COLORS.text} 
              />
              <Text
                style={[
                  styles.methodButtonText,
                  currentPaymentMethod === PaymentMethod.CASH && styles.methodButtonTextActive,
                ]}
              >
                Cash
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodButton,
                currentPaymentMethod === PaymentMethod.MOBILE_MONEY && styles.methodButtonActive,
              ]}
              onPress={() => setCurrentPaymentMethod(PaymentMethod.MOBILE_MONEY)}
              activeOpacity={0.7}
            >
              <CashIcon 
                size={24} 
                color={currentPaymentMethod === PaymentMethod.MOBILE_MONEY ? '#FFFFFF' : COLORS.text} 
              />
              <Text
                style={[
                  styles.methodButtonText,
                  currentPaymentMethod === PaymentMethod.MOBILE_MONEY && styles.methodButtonTextActive,
                ]}
              >
                M-Pesa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodButton,
                currentPaymentMethod === PaymentMethod.CREDIT && styles.methodButtonActive,
              ]}
              onPress={() => setCurrentPaymentMethod(PaymentMethod.CREDIT)}
              activeOpacity={0.7}
            >
              <CashIcon 
                size={24} 
                color={currentPaymentMethod === PaymentMethod.CREDIT ? '#FFFFFF' : COLORS.text} 
              />
              <Text
                style={[
                  styles.methodButtonText,
                  currentPaymentMethod === PaymentMethod.CREDIT && styles.methodButtonTextActive,
                ]}
              >
                Credit
              </Text>
            </TouchableOpacity>
          </View>

          {/* Payment Form */}
          {currentPaymentMethod === PaymentMethod.CASH && (
            <View style={styles.paymentForm}>
              <Text style={styles.inputLabel}>Cash Tendered</Text>
              <TextInput
                style={styles.input}
                value={cashTendered}
                onChangeText={setCashTendered}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={COLORS.textSecondary}
              />
              {cashTendered && (
                <View style={styles.changeContainer}>
                  <Text style={styles.changeLabel}>Change:</Text>
                  <Text style={styles.changeValue}>
                    {formatCurrency(Math.max(0, toMinorUnits(parseFloat(cashTendered)) - remaining))}
                  </Text>
                </View>
              )}
            </View>
          )}

          {currentPaymentMethod === PaymentMethod.MOBILE_MONEY && (
            <View style={styles.paymentForm}>
              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                style={styles.input}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={COLORS.textSecondary}
              />
              <Text style={styles.inputLabel}>M-Pesa Code</Text>
              <TextInput
                style={styles.input}
                value={mobileMoneyReference}
                onChangeText={setMobileMoneyReference}
                placeholder="e.g., QA12BC3DEF"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="characters"
              />
            </View>
          )}

          {currentPaymentMethod === PaymentMethod.CREDIT && (
            <View style={styles.comingSoonContainer}>
              <Text style={styles.comingSoonText}>🚀 Coming Soon</Text>
              <Text style={styles.comingSoonDescription}>
                Credit sales will be available in the next update
              </Text>
            </View>
          )}

          {remaining > 0 && currentPaymentMethod !== PaymentMethod.CREDIT && (
            <Button
              title={`Add Payment - ${formatCurrency(Math.min(remaining, toMinorUnits(parseFloat(cashTendered || paymentAmount) || 0)))}`}
              onPress={handleAddPayment}
            />
          )}
        </View>

        {/* Payments Added */}
        {payments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payments Added</Text>
            {payments.map((payment) => (
              <View key={payment.id} style={styles.paymentItem}>
                <View style={styles.paymentLeft}>
                  <Text style={styles.paymentMethod}>{payment.method}</Text>
                  {payment.reference && (
                    <Text style={styles.paymentReference}>{payment.reference}</Text>
                  )}
                </View>
                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                  <TouchableOpacity 
                    onPress={() => handleRemovePayment(payment.id)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Payment Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Total Amount</Text>
            <Text style={styles.statusValue}>{formatCurrency(total)}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Amount Paid</Text>
            <Text style={[styles.statusValue, styles.paidValue]}>{formatCurrency(totalPaid)}</Text>
          </View>
          <View style={[styles.statusRow, styles.remainingRow]}>
            <Text style={styles.remainingLabel}>Balance Due</Text>
            <Text
              style={[
                styles.remainingValue,
                remaining === 0 && styles.remainingValueZero,
              ]}
            >
              {formatCurrency(remaining)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Button
          title={isProcessing ? "Processing..." : "Complete Sale"}
          onPress={handleCompleteSale}
          disabled={remaining > 0 || items.length === 0 || isProcessing}
          loading={isProcessing}
          style={styles.completeButton}
        />
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          style={styles.cancelButton}
          disabled={isProcessing}
        />
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    color: COLORS.text,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cartItemLast: {
    borderBottomWidth: 0,
  },
  cartItemLeft: {
    flex: 1,
  },
  cartItemName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cartItemDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  cartItemTotal: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  discountValue: {
    color: COLORS.success,
  },
  totalRow: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    gap: SPACING.xs,
  },
  methodButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  methodButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  methodButtonTextActive: {
    color: '#FFFFFF',
  },
  paymentForm: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  changeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.badgeSuccess,
    borderRadius: BORDER_RADIUS.md,
  },
  changeLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.success,
  },
  changeValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
  },
  comingSoonContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  comingSoonDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentLeft: {
    flex: 1,
  },
  paymentMethod: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  paymentReference: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  removeButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  removeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  statusCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  statusValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  paidValue: {
    color: COLORS.success,
  },
  remainingRow: {
    paddingTop: SPACING.sm,
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
    marginBottom: 0,
  },
  remainingLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  remainingValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.error,
  },
  remainingValueZero: {
    color: COLORS.success,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  completeButton: {
    flex: 2,
    marginTop: 0,
  },
  cancelButton: {
    flex: 1,
    marginTop: 0,
  },
});
