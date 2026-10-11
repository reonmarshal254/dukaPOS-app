import { View, Text, StyleSheet, ScrollView, Share, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import ScreenHeader from '../../../components/common/ScreenHeader';
import Receipt from '../../../components/receipts/Receipt';
import Button from '../../../components/common/Button';
import { DownloadIcon, ShareIcon, PrintIcon } from '../../../components/common/Icons';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../../constants/spacing';
import receiptRepository from '../../../services/repositories/receiptRepository';
import { ReceiptData } from '../../../types';

export default function ReceiptScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const receiptViewRef = useRef<View>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Parse receipt data from params or load from database
  const saleId = params.saleId as string;
  const receiptDataParam = params.receiptData as string;

  // Load receipt data on mount
  useEffect(() => {
    if (receiptDataParam) {
      try {
        const parsed = JSON.parse(receiptDataParam);
        setReceiptData(parsed);
      } catch (error) {
        console.error('Error parsing receipt data:', error);
      }
    }
  }, [receiptDataParam]);

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

  const handleDownloadPNG = async () => {
    try {
      setIsDownloading(true);

      if (!receiptViewRef.current) {
        Alert.alert('Error', 'Receipt view not ready. Please try again.');
        return;
      }

      // Capture the receipt as image
      const imageUri = await captureRef(receiptViewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      // Update database with image path
      if (saleId) {
        try {
          await receiptRepository.updateReceiptImage(saleId, imageUri);
        } catch (error) {
          console.error('Failed to update receipt image in database:', error);
        }
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/png',
          dialogTitle: 'Save Receipt Image',
        });
        Alert.alert('Success', 'Receipt image ready to save!');
      } else {
        Alert.alert('Success', 'Receipt image captured successfully!');
      }
    } catch (error) {
      console.error('Error downloading receipt as PNG:', error);
      Alert.alert('Error', 'Failed to save receipt as image. Please try again.');
    } finally {
      setIsDownloading(false);
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

        <View ref={receiptViewRef} collapsable={false}>
          <Receipt {...receiptData} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {/* Icon Action Buttons */}
        <View style={styles.iconButtonsRow}>
          <TouchableOpacity
            style={[styles.iconButton, isDownloading && styles.iconButtonDisabled]}
            onPress={handleDownloadPNG}
            disabled={isDownloading}
            activeOpacity={0.7}
          >
            <DownloadIcon size={24} color={isDownloading ? COLORS.textSecondary : COLORS.primary} />
            <Text style={[styles.iconButtonLabel, isDownloading && styles.iconButtonLabelDisabled]}>
              {isDownloading ? 'Saving...' : 'Download'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <ShareIcon size={24} color={COLORS.primary} />
            <Text style={styles.iconButtonLabel}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handlePrint}
            activeOpacity={0.7}
          >
            <PrintIcon size={24} color={COLORS.primary} />
            <Text style={styles.iconButtonLabel}>Print</Text>
          </TouchableOpacity>
        </View>

        {/* Primary Action Button */}
        <Button
          title="New Sale"
          onPress={handleNewSale}
          style={styles.newSaleButton}
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
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  iconButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    minWidth: 80,
    gap: SPACING.xs,
  },
  iconButtonDisabled: {
    backgroundColor: COLORS.background,
    opacity: 0.6,
  },
  iconButtonLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
  iconButtonLabelDisabled: {
    color: COLORS.textSecondary,
  },
  newSaleButton: {
    marginTop: 0,
  },
  button: {
    marginTop: SPACING.md,
  },
  buttonSpacing: {
    marginTop: SPACING.sm,
  },
});
