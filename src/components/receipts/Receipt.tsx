import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { formatCurrency, toMajorUnits } from '../../utils/currency';
import { ShieldCheckIcon } from '../common/Icons';

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ReceiptProps {
  receiptNumber: string;
  date: string;
  time: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  change: number;
  balance: number;
  cashTendered?: number;
  paymentMethod: string;
  paymentMethods?: Array<{ method: string; amount: number; reference?: string }>;
  cashier?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
}

export default function Receipt({
  receiptNumber,
  date,
  time,
  items,
  subtotal,
  discount,
  total,
  amountPaid,
  change,
  balance,
  cashTendered,
  paymentMethod,
  paymentMethods,
  cashier = 'Cashier',
  businessName = 'DukaPOS',
  businessAddress = '',
  businessPhone = '',
}: ReceiptProps) {
  const showBalance = balance > 0 && (paymentMethod === 'CASH' || paymentMethod === 'Cash');

  return (
    <View style={styles.container}>
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={['#2563EB', '#1E40AF', '#1E3A8A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decorative corner accents */}
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        
        {/* Business logo placeholder */}
        <View style={styles.logoCircle}>
          <ShieldCheckIcon size={40} color="#FFFFFF" />
        </View>
        
        <Text style={styles.businessName}>{businessName}</Text>
        {businessAddress && (
          <Text style={styles.businessInfo}>{businessAddress}</Text>
        )}
        {businessPhone && (
          <Text style={styles.businessInfo}>{businessPhone}</Text>
        )}
        
        {/* Receipt badge */}
        <View style={styles.receiptBadge}>
          <Text style={styles.receiptBadgeLabel}>RECEIPT</Text>
          <Text style={styles.receiptBadgeNumber}>#{receiptNumber}</Text>
        </View>
      </LinearGradient>

      {/* Status badge */}
      <View style={styles.statusBadge}>
        <View style={styles.statusCheckmark}>
          <Text style={styles.statusCheckmarkText}>✓</Text>
        </View>
        <Text style={styles.statusText}>PAID</Text>
      </View>

      {/* Date and Time Section */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{date}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>{time}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Cashier</Text>
            <Text style={styles.infoValue}>{cashier}</Text>
          </View>
        </View>
      </View>

      {/* Items Section */}
      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>ITEMS PURCHASED</Text>
        
        <View style={styles.itemsHeader}>
          <Text style={[styles.headerText, { flex: 2 }]}>Item</Text>
          <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
          <Text style={[styles.headerText, { flex: 1, textAlign: 'right' }]}>Price</Text>
          <Text style={[styles.headerText, { flex: 1, textAlign: 'right' }]}>Total</Text>
        </View>

        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={{ flex: 2 }}>
              <Text style={styles.itemName}>{item.name}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemQty}>{item.quantity}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemPrice}>{formatCurrency(item.unitPrice)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Gradient divider */}
      <LinearGradient
        colors={['transparent', COLORS.border, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientDivider}
      />

      {/* Totals Section */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>
        
        {discount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount ({discount}%)</Text>
            <Text style={[styles.totalValue, styles.discountValue]}>
              -{formatCurrency(subtotal - total)}
            </Text>
          </View>
        )}

        {/* Grand total card */}
        <View style={styles.grandTotalCard}>
          <Text style={styles.grandTotalLabel}>TOTAL AMOUNT</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
        </View>

        {/* Payment details */}
        <View style={styles.paymentDetails}>
          {paymentMethods && paymentMethods.length > 1 ? (
            // Multiple payment methods
            paymentMethods.map((payment, index) => (
              <View key={index} style={styles.paymentMethodRow}>
                <Text style={styles.paymentLabel}>
                  {payment.method}
                  {payment.reference ? ` (${payment.reference})` : ''}
                </Text>
                <Text style={styles.paymentValue}>{formatCurrency(payment.amount)}</Text>
              </View>
            ))
          ) : (
            // Single payment method
            <>
              {cashTendered && cashTendered > 0 && (
                <View style={styles.paymentMethodRow}>
                  <Text style={styles.paymentLabel}>Cash Tendered</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(cashTendered)}</Text>
                </View>
              )}
              <View style={styles.paymentMethodRow}>
                <Text style={styles.paymentLabel}>
                  Paid ({paymentMethod})
                  {paymentMethods?.[0]?.reference ? ` - ${paymentMethods[0].reference}` : ''}
                </Text>
                <Text style={styles.paymentValue}>{formatCurrency(amountPaid)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Balance/Change card (only for cash payments) */}
        {showBalance && (
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Balance Given</Text>
              <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.dashedLine} />
        
        <Text style={styles.thankYouText}>Thank You!</Text>
        <Text style={styles.footerSubtext}>We appreciate your business</Text>
        
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrText}>📱</Text>
          <Text style={styles.qrSubtext}>Scan for digital receipt</Text>
        </View>

        <View style={styles.poweredBy}>
          <Text style={styles.poweredByText}>Powered by </Text>
          <Text style={styles.poweredByBrand}>DukaPOS</Text>
        </View>
      </View>

      {/* Decorative bottom wave */}
      <View style={styles.bottomDecor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  
  // Header styles
  header: {
    paddingTop: SPACING.xl * 1.5,
    paddingBottom: SPACING.xl * 2,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: 60,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    borderTopRightRadius: BORDER_RADIUS.xl,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  businessName: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
    textAlign: 'center',
    letterSpacing: 1,
  },
  businessInfo: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: SPACING.xs / 2,
  },
  receiptBadge: {
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  receiptBadgeLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  receiptBadgeNumber: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginTop: SPACING.xs / 2,
  },

  // Status badge
  statusBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.badgeSuccess,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginTop: -SPACING.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    gap: SPACING.sm,
  },
  statusCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCheckmarkText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
    letterSpacing: 1,
  },

  // Info card
  infoCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    backgroundColor: '#F8FAFC',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs / 2,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  // Items section
  itemsSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  itemsHeader: {
    flexDirection: 'row',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  headerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    paddingRight: SPACING.sm,
  },
  itemQty: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  itemTotal: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'right',
  },

  // Gradient divider
  gradientDivider: {
    height: 1,
    marginVertical: SPACING.lg,
    marginHorizontal: SPACING.lg,
  },

  // Totals section
  totalsSection: {
    paddingHorizontal: SPACING.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  discountValue: {
    color: COLORS.success,
  },

  // Grand total card
  grandTotalCard: {
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    letterSpacing: 1,
  },
  grandTotalValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },

  // Payment details
  paymentDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  paymentLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    flex: 1,
  },
  paymentValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },

  // Balance card
  balanceCard: {
    backgroundColor: COLORS.badgeSuccess,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
  },
  balanceValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
  },

  // Footer
  footer: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.lg,
  },
  dashedLine: {
    width: '100%',
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  thankYouText: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  footerSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  qrPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#F1F5F9',
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qrText: {
    fontSize: 32,
  },
  qrSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  poweredBy: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poweredByText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  poweredByBrand: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },

  // Bottom decoration
  bottomDecor: {
    height: 8,
    backgroundColor: COLORS.primary,
  },
});
