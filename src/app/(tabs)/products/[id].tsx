import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { useProduct, useUpdateProduct, useDeleteProduct } from '../../../hooks/useProducts';
import { useCategories } from '../../../hooks/useCategories';
import { toMinorUnits, toMajorUnits } from '../../../utils/currency';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  purchasePrice: z.string().min(1, 'Purchase price is required'),
  sellingPrice: z.string().min(1, 'Selling price is required'),
  unit: z.string().min(1, 'Unit is required'),
  minStockThreshold: z.string().min(1, 'Min stock threshold is required'),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [imageUri, setImageUri] = useState<string | undefined>();
  
  const { data: product, isLoading } = useProduct(id);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { data: categories = [] } = useCategories();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      barcode: '',
      categoryId: '',
      purchasePrice: '',
      sellingPrice: '',
      unit: 'pcs',
      minStockThreshold: '10',
    },
  });

  // Populate form when product data loads
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description || '',
        barcode: product.barcode || '',
        categoryId: product.categoryId || '',
        purchasePrice: toMajorUnits(product.purchasePrice),
        sellingPrice: toMajorUnits(product.sellingPrice),
        unit: product.unit,
        minStockThreshold: product.minStockThreshold.toString(),
      });
      setImageUri(product.localImagePath);
    }
  }, [product, reset]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to upload product images'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      const purchasePrice = parseFloat(data.purchasePrice);
      const sellingPrice = parseFloat(data.sellingPrice);

      if (isNaN(purchasePrice) || purchasePrice < 0) {
        Alert.alert('Error', 'Please enter a valid purchase price');
        return;
      }

      if (isNaN(sellingPrice) || sellingPrice < 0) {
        Alert.alert('Error', 'Please enter a valid selling price');
        return;
      }

      if (sellingPrice < purchasePrice) {
        Alert.alert(
          'Warning',
          'Selling price is lower than purchase price. Continue anyway?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', onPress: () => saveProduct(data) },
          ]
        );
        return;
      }

      await saveProduct(data);
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product. Please try again.');
    }
  };

  const saveProduct = async (data: ProductFormData) => {
    const minThreshold = parseInt(data.minStockThreshold);

    if (isNaN(minThreshold) || minThreshold < 0) {
      Alert.alert('Error', 'Please enter a valid minimum stock threshold');
      return;
    }

    await updateProduct.mutateAsync({
      id,
      data: {
        name: data.name,
        description: data.description || undefined,
        barcode: data.barcode || undefined,
        categoryId: data.categoryId || undefined,
        purchasePrice: toMinorUnits(parseFloat(data.purchasePrice)),
        sellingPrice: toMinorUnits(parseFloat(data.sellingPrice)),
        unit: data.unit,
        minStockThreshold: minThreshold,
        localImagePath: imageUri,
      },
    });

    Alert.alert('Success', 'Product updated successfully', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct.mutateAsync(id);
              Alert.alert('Success', 'Product deleted successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Product not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Product</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            {/* Image Picker */}
            <View style={styles.imageSection}>
              <Text style={styles.imageLabel}>Product Image</Text>
              <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                ) : (
                  <Text style={styles.imageButtonText}>📷 Upload Image</Text>
                )}
              </TouchableOpacity>
            </View>

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Product Name"
                  placeholder="e.g., Coca Cola 500ml"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  required
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Description (Optional)"
                  placeholder="Brief description of the product"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={3}
                  style={styles.textArea}
                />
              )}
            />

            <Controller
              control={control}
              name="barcode"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Barcode (Optional)"
                  placeholder="e.g., 1234567890123"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                />
              )}
            />

            {categories.length > 0 && (
              <Controller
                control={control}
                name="categoryId"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.categorySection}>
                    <Text style={styles.categoryLabel}>Category (Optional)</Text>
                    <View style={styles.categoryChips}>
                      {categories.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.categoryChip,
                            value === category.id && styles.categoryChipActive,
                          ]}
                          onPress={() =>
                            onChange(value === category.id ? '' : category.id)
                          }
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              value === category.id && styles.categoryChipTextActive,
                            ]}
                          >
                            {category.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              />
            )}

            <Controller
              control={control}
              name="purchasePrice"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Purchase Price"
                  placeholder="0.00"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  error={errors.purchasePrice?.message}
                  required
                />
              )}
            />

            <Controller
              control={control}
              name="sellingPrice"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Selling Price"
                  placeholder="0.00"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  error={errors.sellingPrice?.message}
                  required
                />
              )}
            />

            <Controller
              control={control}
              name="unit"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Unit"
                  placeholder="e.g., pcs, kg, ltr"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.unit?.message}
                  required
                />
              )}
            />

            <Controller
              control={control}
              name="minStockThreshold"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Minimum Stock Threshold"
                  placeholder="10"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  error={errors.minStockThreshold?.message}
                  required
                  helperText="You'll be notified when stock falls below this level"
                />
              )}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Delete Product"
            onPress={handleDelete}
            variant="danger"
            disabled={updateProduct.isPending || deleteProduct.isPending}
            style={styles.deleteButton}
          />
          <Button
            title="Update Product"
            onPress={handleSubmit(onSubmit)}
            loading={updateProduct.isPending}
            disabled={updateProduct.isPending || deleteProduct.isPending}
            style={styles.updateButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.error,
    marginBottom: SPACING.lg,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  form: {
    marginBottom: SPACING.lg,
  },
  imageSection: {
    marginBottom: SPACING.lg,
  },
  imageLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  imageButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.lg,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.lg,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categorySection: {
    marginBottom: SPACING.md,
  },
  categoryLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
  },
  categoryChipTextActive: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    gap: SPACING.md,
  },
  deleteButton: {
    flex: 1,
  },
  updateButton: {
    flex: 1,
  },
});
