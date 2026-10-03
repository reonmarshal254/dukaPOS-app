import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import productRepository from '../../services/repositories/productRepository';
import { useExpiringBatches } from '../../hooks/useStockBatches';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { SHADOWS } from '../../constants/spacing';

export default function HomeScreen() {
  const router = useRouter();
  
  // Fetch inventory data
  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ['products', 'lowStock'],
    queryFn: () => productRepository.getLowStock(),
  });

  const { data: outOfStockProducts = [] } = useQuery({
    queryKey: ['products', 'outOfStock'],
    queryFn: () => productRepository.getOutOfStock(),
  });

  const { data: expiringBatches = [] } = useExpiringBatches(30);

  const lowStockCount = lowStockProducts.length;
  const expiringCount = expiringBatches.length;
  const outOfStockCount = outOfStockProducts.length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning! 👋</Text>
          <Text style={styles.businessName}>DukaPOS</Text>
        </View>

        {/* Today's Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Sales</Text>
          <View style={styles.card}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>KSh 0.00</Text>
                <Text style={styles.statLabel}>Total Sales</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Transactions</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>KSh 0.00</Text>
                <Text style={styles.statLabel}>Cash</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>KSh 0.00</Text>
                <Text style={styles.statLabel}>Mobile Money</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>KSh 0.00</Text>
                <Text style={styles.statLabel}>Credit</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Alerts</Text>
          
          <TouchableOpacity 
            style={[styles.card, styles.alertCard]}
            onPress={() => router.push('/products')}
          >
            <View style={styles.alertIcon}>
              <Text style={styles.alertEmoji}>📦</Text>
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {lowStockCount} Low Stock Item{lowStockCount !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.alertText}>
                {lowStockCount > 0 
                  ? 'Products running low on stock'
                  : 'All products are well stocked'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, styles.alertCard]}
            onPress={() => router.push('/inventory/expiring')}
          >
            <View style={styles.alertIcon}>
              <Text style={styles.alertEmoji}>⏰</Text>
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {expiringCount} Expiring Product{expiringCount !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.alertText}>
                {expiringCount > 0
                  ? 'Products expiring within 30 days'
                  : 'No products expiring soon'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, styles.alertCard]}
            onPress={() => router.push('/products')}
          >
            <View style={styles.alertIcon}>
              <Text style={styles.alertEmoji}>❌</Text>
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {outOfStockCount} Out of Stock Item{outOfStockCount !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.alertText}>
                {outOfStockCount > 0
                  ? 'Products completely out of stock'
                  : 'All products have stock'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <View style={styles.actionCard}>
              <Text style={styles.actionIcon}>🛒</Text>
              <Text style={styles.actionLabel}>New Sale</Text>
            </View>
            <View style={styles.actionCard}>
              <Text style={styles.actionIcon}>📦</Text>
              <Text style={styles.actionLabel}>Add Product</Text>
            </View>
            <View style={styles.actionCard}>
              <Text style={styles.actionIcon}>📥</Text>
              <Text style={styles.actionLabel}>Record Purchase</Text>
            </View>
            <View style={styles.actionCard}>
              <Text style={styles.actionIcon}>👤</Text>
              <Text style={styles.actionLabel}>Add Customer</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  greeting: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textInverse,
    marginBottom: SPACING.xs,
  },
  businessName: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.lg,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  alertEmoji: {
    fontSize: 24,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  alertText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    width: '47%',
    ...SHADOWS.sm,
  },
  actionIcon: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text,
    textAlign: 'center',
  },
});
