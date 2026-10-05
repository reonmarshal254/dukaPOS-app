import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';
import { useProducts } from '../../../hooks/useProducts';
import { useCartStore } from '../../../stores/cartStore';
import POSProductCard from '../../../components/pos/POSProductCard';
import BarcodeScanner from '../../../components/common/BarcodeScanner';
import { ScanIcon } from '../../../components/common/Icons';
import { Product } from '../../../types';
import productRepository from '../../../services/repositories/productRepository';

export default function POSScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);
  
  const { data: products = [], isLoading, refetch } = useProducts({
    isActive: true,
    search: searchQuery,
  });

  const { items, addItem } = useCartStore();

  // Refetch products when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleAddToCart = (product: Product) => {
    if (product.currentQuantity === 0) {
      Alert.alert('Out of Stock', `${product.name} is currently out of stock.`);
      return;
    }
    addItem(product, 1);
  };

  const getQuantityInCart = (productId: string): number => {
    const item = items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const handleCartPress = () => {
    if (items.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to cart first');
      return;
    }
    router.push('/(tabs)/pos/cart');
  };

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      // Find product by barcode
      const product = await productRepository.getByBarcode(barcode);
      
      if (!product) {
        Alert.alert('Product Not Found', `No product found with barcode: ${barcode}`);
        return;
      }

      if (!product.isActive) {
        Alert.alert('Product Inactive', `${product.name} is not available for sale`);
        return;
      }

      if (product.currentQuantity === 0) {
        Alert.alert('Out of Stock', `${product.name} is currently out of stock`);
        return;
      }

      // Add to cart
      addItem(product, 1);
      setScannerVisible(false);
      
      // Show success message
      Alert.alert('Added to Cart', `${product.name} has been added to your cart`);
    } catch (error) {
      console.error('Error finding product:', error);
      Alert.alert('Error', 'Failed to find product. Please try again.');
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setScannerVisible(true)}
            activeOpacity={0.7}
          >
            <ScanIcon size={20} color={COLORS.primary} />
          </TouchableOpacity>
          
          {items.length > 0 && (
            <TouchableOpacity
              style={styles.cartButton}
              onPress={handleCartPress}
              activeOpacity={0.7}
            >
              <Text style={styles.cartIcon}>🛒</Text>
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>

      {/* Product Grid */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productGrid}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.productCardWrapper}>
            <POSProductCard
              product={item}
              onAddToCart={() => handleAddToCart(item)}
              quantityInCart={getQuantityInCart(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📦</Text>
            <Text style={styles.emptyStateText}>
              {isLoading ? 'Loading products...' : searchQuery ? 'No products found' : 'No products available'}
            </Text>
          </View>
        }
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  scanButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartIcon: {
    fontSize: 20,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  searchContainer: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInput: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  productGrid: {
    padding: SPACING.sm,
  },
  columnWrapper: {
    gap: SPACING.sm,
  },
  productCardWrapper: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
