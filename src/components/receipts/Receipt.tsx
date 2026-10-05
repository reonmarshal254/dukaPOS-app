import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { formatCurrency } from '../../utils/currency';
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
  paymentMethod: string;
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
  paymentMethod,
  cashier = 'Cashier',
  businessName = 'DukaPOS',
  businessAddress = '',
  businessPhone = '',
}: ReceiptProps) {
  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerIcon}>
          <ShieldCheckIcon size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.businessName}>{businessName}</Text>
        {businessAddress && (
          <Text style={styles.businessInfo}>{businessAddress}</Text>
        )}
        {businessPhone && (
          <Text style={styles.businessInfo}>{businessPhone}</Text>
        )}
      </LinearGradient>

      {/* Receipt Number Badge */}
      <View style={styles.receiptBadge}>
        <Text style={styles.receiptBadgeText}>#{receiptNumber}</Text>
      </View>

      {/* Date and Time */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{date}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Time:</Text>
          <Text style={styles.infoValue}>{time}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cashier:</Text>
          <Text style={styles.infoValue}>{cashier}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Items */}
      <View style={styles.itemsSection}>
        <View style={styles.itemsHeader}>
          <Text style={[styles.itemsHeaderText, { flex: 2 }]}>Item</Text>
          <Text style={[styles.itemsHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
          <Text style={[styles.itemsHeaderText, { flex: 1, textAlign: 'right' }]}>Price</Text>
          <Text style={[styles.itemsHeaderText, { flex: 1, textAlign: 'right' }]}>Total</Text>
        </View>

        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={{ flex: 2 }}>
              <Text style={styles.itemName}>{item.name}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemQty}>{item.quantity}×</Text>
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

      <View style={styles.divider} />

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>
        
        {discount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount:</Text>
            <Text style={[styles.totalValue, styles.discountValue]}>
              -{formatCurrency(subtotal - total)}
            </Text>
          </View>
        )}

        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>TOTAL:</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
        </View>

        <View style={styles.dividerDashed} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Paid ({paymentMethod}):</Text>
          <Text style={styles.totalValue}>{formatCurrency(amountPaid)}</Text>
        </View>

        {change > 0 && (
          <View style={[styles.totalRow, styles.changeRow]}>
            <Text style={styles.changeLabel}>Change:</Text>
            <Text style={styles.changeValue}>{formatCurrency(change)}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Thank You for Your Business!</Text>
        <Text style={styles.footerSubtext}>Please Come Again</Text>
        
        <View style={styles.footerBadge}>
          <Text style={styles.footerBadgeText}>✓ Powered by DukaPOS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  header: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: SPACING.sm,
  },
  businessName: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  businessInfo: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  receiptBadge: {
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginTop: -SPACING.lg, // Pull up into header
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  receiptBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  infoSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  dividerDashed: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemsSection: {
    paddingHorizontal: SPACING.lg,
  },
  itemsHeader: {
    flexDirection: 'row',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  itemsHeaderText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  itemName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  itemQty: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  itemTotal: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textAlign: 'right',
  },
  totalsSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
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
  grandTotalRow: {
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  grandTotalLabel: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  grandTotalValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  changeRow: {
    backgroundColor: COLORS.badgeSuccess,
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },
  changeLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
  },
  changeValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
  },
  footer: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
    marginTop: SPACING.lg,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  footerSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  footerBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.sm,
  },
  footerBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});
