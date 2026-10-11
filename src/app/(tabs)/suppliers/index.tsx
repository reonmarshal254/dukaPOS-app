import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSuppliers, useDeleteSupplier } from '../../../hooks/useSuppliers';
import { TruckIcon, SearchIcon, PlusIcon, StarIcon, PhoneIcon } from '../../../components/common/Icons';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';

export default function SuppliersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: suppliers = [], refetch } = useSuppliers();
  const deleteSupplier = useDeleteSupplier();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'This supplier has no phone number registered');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Supplier',
      `Delete "${name}"? This will also delete all supply records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSupplier.mutate(id),
        },
      ]
    );
  };

  // Filter suppliers by search query
  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStars = (rating: number = 0) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            size={14}
            color={star <= rating ? COLORS.warning : COLORS.border}
            filled={star <= rating}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerDecor} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Suppliers</Text>
            <Text style={styles.headerSub}>{suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/suppliers/add')}
            activeOpacity={0.8}
          >
            <PlusIcon size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <SearchIcon size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search suppliers..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Supplier list */}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {filteredSuppliers.length === 0 ? (
          <View style={styles.empty}>
            <TruckIcon size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No suppliers found' : 'No suppliers yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try a different search term'
                : 'Add your first supplier to track supplies and manage relationships'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/(tabs)/suppliers/add')}
              >
                <Text style={styles.emptyBtnText}>Add Supplier</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredSuppliers.map((supplier) => (
            <TouchableOpacity
              key={supplier.id}
              style={styles.supplierCard}
              onPress={() => router.push(`/(tabs)/suppliers/${supplier.id}` as any)}
              onLongPress={() => handleDelete(supplier.id, supplier.name)}
              activeOpacity={0.7}
            >
              <View style={styles.supplierIcon}>
                <TruckIcon size={24} color={COLORS.primary} />
              </View>
              <View style={styles.supplierInfo}>
                <Text style={styles.supplierName} numberOfLines={1}>
                  {supplier.name}
                </Text>
                {renderStars(supplier.rating)}
                <View style={styles.supplierMeta}>
                  {supplier.phone && (
                    <Text style={styles.supplierPhone} numberOfLines={1}>
                      📱 {supplier.phone}
                    </Text>
                  )}
                  {supplier.email && (
                    <Text style={styles.supplierEmail} numberOfLines={1}>
                      ✉️ {supplier.email}
                    </Text>
                  )}
                </View>
              </View>
              {supplier.phone && (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCall(supplier.phone);
                  }}
                >
                  <PhoneIcon size={18} color={COLORS.success} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button - Alternative to header button */}
      {suppliers.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(tabs)/suppliers/add')}
          activeOpacity={0.9}
        >
          <PlusIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },

  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    overflow: 'hidden',
  },
  headerDecor: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  backBtn: { padding: SPACING.xs },
  backText: { fontSize: 22, color: '#FFFFFF' },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  addBtnText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: '#FFFFFF',
  },
  clearSearch: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },

  list: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING['3xl'],
  },

  supplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  supplierIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supplierInfo: { flex: 1 },
  supplierName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  supplierMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  supplierPhone: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  supplierEmail: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  empty: {
    alignItems: 'center',
    paddingTop: SPACING['3xl'],
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  emptyBtnText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },

  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
});
