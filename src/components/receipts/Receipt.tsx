import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '../../utils/currency';

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
      {/* Header */}
      <Text style={styles.businessName}>{businessName}</Text>
      {businessAddress && <Text style={styles.businessInfo}>{businessAddress}</Text>}
      {businessPhone && <Text style={styles.businessInfo}>{businessPhone}</Text>}
      
      <Text style={styles.divider}>{'='.repeat(32)}</Text>
      
      {/* Receipt Info */}
      <Text style={styles.receiptNumber}>Receipt: #{receiptNumber}</Text>
      <Text style={styles.info}>Date: {date}</Text>
      <Text style={styles.info}>Time: {time}</Text>
      <Text style={styles.info}>Cashier: {cashier}</Text>
      
      <Text style={styles.divider}>{'='.repeat(32)}</Text>
      
      {/* Items Header */}
      <View style={styles.itemRow}>
        <Text style={[styles.itemText, styles.itemName]}>Item</Text>
        <Text style={[styles.itemText, styles.itemQty]}>Qty</Text>
        <Text style={[styles.itemText, styles.itemPrice]}>Price</Text>
        <Text style={[styles.itemText, styles.itemTotal]}>Total</Text>
      </View>
      
      <Text style={styles.line}>{'-'.repeat(32)}</Text>
      
      {/* Items */}
      {items.map((item, index) => (
        <View key={index}>
          <View style={styles.itemRow}>
            <Text style={[styles.itemText, styles.itemName]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.itemText, styles.itemQty]}>
              {item.quantity}
            </Text>
            <Text style={[styles.itemText, styles.itemPrice]}>
              {formatCurrency(item.unitPrice)}
            </Text>
            <Text style={[styles.itemText, styles.itemTotal]}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        </View>
      ))}
      
      <Text style={styles.divider}>{'='.repeat(32)}</Text>
      
      {/* Totals */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Subtotal:</Text>
        <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
      </View>
      
      {discount > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Discount ({discount}%):</Text>
          <Text style={styles.totalValue}>-{formatCurrency(subtotal - total)}</Text>
        </View>
      )}
      
      <View style={styles.totalRow}>
        <Text style={styles.grandTotalLabel}>TOTAL:</Text>
        <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
      </View>
      
      <Text style={styles.line}>{'-'.repeat(32)}</Text>
      
      {/* Payment Details */}
      {paymentMethods && paymentMethods.length > 1 ? (
        paymentMethods.map((payment, index) => (
          <View key={index} style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {payment.method}
              {payment.reference ? ` (${payment.reference})` : ''}:
            </Text>
            <Text style={styles.totalValue}>{formatCurrency(payment.amount)}</Text>
          </View>
        ))
      ) : (
        <>
          {cashTendered && cashTendered > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Cash Tendered:</Text>
              <Text style={styles.totalValue}>{formatCurrency(cashTendered)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Paid ({paymentMethod}):
            </Text>
            <Text style={styles.totalValue}>{formatCurrency(amountPaid)}</Text>
          </View>
        </>
      )}
      
      {showBalance && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Change:</Text>
          <Text style={styles.totalValue}>{formatCurrency(balance)}</Text>
        </View>
      )}
      
      <Text style={styles.divider}>{'='.repeat(32)}</Text>
      
      {/* Footer */}
      <Text style={styles.thankYou}>Thank You!</Text>
      <Text style={styles.footerText}>Please come again</Text>
      <Text style={styles.footerText}>Powered by DukaPOS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  businessInfo: {
    fontSize: 12,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 2,
  },
  divider: {
    fontSize: 12,
    color: '#000000',
    marginVertical: 8,
    fontFamily: 'monospace',
  },
  line: {
    fontSize: 12,
    color: '#000000',
    marginVertical: 4,
    fontFamily: 'monospace',
  },
  receiptNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  info: {
    fontSize: 12,
    color: '#000000',
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 11,
    color: '#000000',
    fontFamily: 'monospace',
  },
  itemName: {
    flex: 2,
  },
  itemQty: {
    flex: 1,
    textAlign: 'center',
  },
  itemPrice: {
    flex: 1,
    textAlign: 'right',
  },
  itemTotal: {
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 12,
    color: '#000000',
  },
  totalValue: {
    fontSize: 12,
    color: '#000000',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  thankYou: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 11,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 2,
  },
});
