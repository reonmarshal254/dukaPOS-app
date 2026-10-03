import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpiringBatches } from '../../../hooks/useStockBatches';
import { useProducts } from '../../../hooks/useProducts';
import { formatDate, daysUntil } from '../../../utils/datetime';
import { COLORS } from '../../../constants/colors';
import { SPACING, SHADOWS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';
import { StockBatch, Product } from '../../../types';

interface ExpiringProduct {
  product: Product;
  batch: StockBatch;
  daysUntilExpiry: number;
}

export default function ExpiringProductsScreen() {
  const { data: batches = [], isLoading, refetch, isRefetching } = useExpiringBatches(30);
  const { data: products = [] } = useProducts({ isActive: true });

  // Group batches by product
  const expiringProducts: ExpiringProduct[] = batches.map((batch) => {
    const product = products.find((p) => p.id === batch.productId);
    const days = batch.expiryDate ? daysUntil(batch.expiryDate) : 0;

    return {
      product: product!,
      batch,
      daysUntilExpiry: days,
    };
  }).filter((item) => item.product); // Filter out items without product

  // Sort by days until expiry (most urgent first)
  expiringProducts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  const getUrgencyColor = (days: number) => {
    if (days < 7) return '#EF4444'; // red
    if (days < 14) return '#F97316'; // orange
    return '#EAB308'; // yellow
  };

  const getUrgencyLabel = (days: number) => {
    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    return `${days} days left`;
  };

  const renderItem = ({ item }: { item: ExpiringProduct }) => {
    const urgencyColor = getUrgencyColor(item.daysUntilExpiry);
    
    return (
      <View style={[styles.card, { borderLeftColor: urgencyColor, borderLeftWidth: 4 }]}>
        <View style={styles.cardContent}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.product.name}</Text>
            <Text style={styles.batchNumber}>Batch: {item.batch.batchNumber}</Text>
            <Text style={styles.quantity}>Quantity: {item.batch.remainingQuantity} {item.product.unit}</Text>
          </View>
          
          <View style={styles.expiryInfo}>
            <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
              <Text style={styles.urgencyText}>{getUrgencyLabel(item.daysUntilExpiry)}</Text>
            </View>
            {item.batch.expiryDate && (
              <Text style={styles.expiryDate}>
                Expires: {formatDate(item.batch.expiryDate)}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>✅</Text>
      <Text style={styles.emptyTitle}>No Expiring Products</Text>
      <Text style={styles.emptyText}>
        All products are good! No items expiring within the next 30 days.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Expiring Products</Text>
        <Text style={styles.subtitle}>Products expiring within 30 days</Text>
      </View>

      <FlatList
        data={expiringProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.batch.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  listContent: {
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  productName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  batchNumber: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  quantity: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  expiryInfo: {
    alignItems: 'flex-end',
  },
  urgencyBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    marginBottom: SPACING.xs,
  },
  urgencyText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  expiryDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['3xl'],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
