import { View, Text, StyleSheet, ScrollView, Share, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ScreenHeader from '../../../components/common/ScreenHeader';
import Receipt from '../../../components/receipts/Receipt';
import Button from '../../../components/common/Button';
import { COLORS } from '../../../constants/colors';
import { SPACING } from '../../../constants/spacing';

export default function ReceiptScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Parse receipt data from params
  const receiptData = params.receiptData 
    ? JSON.parse(params.receiptData as string)
    : null;

  if (!receiptData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Receipt" showBackButton={false} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No receipt data available</Text>
          <Button
            title="Back to POS"
            onPress={() => router.replace('/(tabs)/pos')}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      const message = `
Receipt #${receiptData.receiptNumber}
${receiptData.businessName}
Date: ${receiptData.date} ${receiptData.time}

Items:
${receiptData.items.map((item: any) => 
  `${item.name} - ${item.quantity}x @ ${item.unitPrice} = ${item.total}`
).join('\n')}

Subtotal: ${receiptData.subtotal}
${receiptData.discount > 0 ? `Discount: -${receiptData.subtotal - receiptData.total}\n` : ''}
TOTAL: ${receiptData.total}
Paid: ${receiptData.amountPaid}
${receiptData.change > 0 ? `Change: ${receiptData.change}\n` : ''}

Thank you for your business!
Powered by DukaPOS
      `.trim();

      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  const handlePrint = () => {
    Alert.alert('Coming Soon', 'Receipt printing will be available in the next update');
  };

  const handleNewSale = () => {
    router.replace('/(tabs)/pos');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader 
        title="Receipt" 
        subtitle="Transaction Successful" 
        showBackButton={false}
      />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successBadge}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successText}>Sale Completed Successfully!</Text>
        </View>

        <Receipt {...receiptData} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Share Receipt"
          onPress={handleShare}
          variant="outline"
        />
        <Button
          title="Print Receipt"
          onPress={handlePrint}
          variant="outline"
          style={styles.buttonSpacing}
        />
        <Button
          title="New Sale"
          onPress={handleNewSale}
          style={styles.buttonSpacing}
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  successBadge: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  successIcon: {
    fontSize: 64,
    color: COLORS.success,
    marginBottom: SPACING.sm,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.success,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  button: {
    marginTop: SPACING.md,
  },
  buttonSpacing: {
    marginTop: SPACING.sm,
  },
});
