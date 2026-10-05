import { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import BarcodeScanner from '../../../components/common/BarcodeScanner';
import CategoryModal from '../../../components/products/CategoryModal';
import { ScanIcon, PlusIcon } from '../../../components/common/Icons';
import { useCreateProduct } from '../../../hooks/useProducts';
import { useCategories } from '../../../hooks/useCategories';
import { toMinorUnits } from '../../../utils/currency';
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
  initialStock: z.string().min(1, 'Initial stock is required'),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function AddProductScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const createProduct = useCreateProduct();
  const { data: categories = [] } = useCategories();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
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
      initialStock: '0',
    },
  });

  const handlePickImage = async () => {
    Alert.alert(
      'Product Image',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Upload from Gallery',
          onPress: handleUploadFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera access to take product photos'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleUploadFromGallery = async () => {
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
        allowsEditing: false,
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

  const handleBarcodeScanned = (barcode: string) => {
    setValue('barcode', barcode);
    setScannerVisible(false);
    Alert.alert('Barcode Scanned', `Barcode: ${barcode}`);
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
    } catch (error: any) {
      console.error('Error creating product:', error);
      
      // Check if it's a duplicate barcode error
      if (error.message && error.message.includes('already exists')) {
        Alert.alert('Duplicate Barcode', error.message);
      } else {
        Alert.alert('Error', 'Failed to create product. Please try again.');
      }
    }
  };

  const saveProduct = async (data: ProductFormData) => {
    const minThreshold = parseInt(data.minStockThreshold);

    if (isNaN(minThreshold) || minThreshold < 0) {
      Alert.alert('Error', 'Please enter a valid minimum stock threshold');
      return;
    }

    const initialStock = parseInt(data.initialStock);

    if (isNaN(initialStock) || initialStock < 0) {
      Alert.alert('Error', 'Please enter a valid initial stock quantity');
      return;
    }

    await createProduct.mutateAsync({
      name: data.name,
      description: data.description || undefined,
      barcode: data.barcode || undefined,
      categoryId: data.categoryId || undefined,
      purchasePrice: toMinorUnits(parseFloat(data.purchasePrice)),
      sellingPrice: toMinorUnits(parseFloat(data.sellingPrice)),
      unit: data.unit,
      minStockThreshold: minThreshold,
      initialQuantity: initialStock,
      localImagePath: imageUri,
    });

    // Clear form and image for the next product
    reset();
    setImageUri(undefined);

    Alert.alert('Success', 'Product created successfully', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

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
          <Text style={styles.title}>Add Product</Text>
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
              <Text style={styles.imageLabel}>Product Image (Optional)</Text>
              <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholderContent}>
                    <Text style={styles.imageButtonIcon}>📷</Text>
                    <Text style={styles.imageButtonText}>Add Photo</Text>
                    <Text style={styles.imageButtonSubtext}>Take photo or upload from gallery</Text>
                  </View>
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
                <View>
                  <Input
                    label="Barcode (Optional)"
                    placeholder="e.g., 1234567890123"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity
                    style={styles.scanBarcodeButton}
                    onPress={() => setScannerVisible(true)}
                    activeOpacity={0.7}
                  >
                    <ScanIcon size={20} color={COLORS.primary} />
                    <Text style={styles.scanText}>Scan Barcode</Text>
                  </TouchableOpacity>
                </View>
              )}
            />

            {categories.length > 0 && (
              <Controller
                control={control}
                name="categoryId"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.categorySection}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryLabel}>Category (Optional)</Text>
                      <TouchableOpacity
                        style={styles.addCategoryButton}
                        onPress={() => setCategoryModalVisible(true)}
                        activeOpacity={0.7}
                      >
                        <PlusIcon size={16} color={COLORS.primary} />
                        <Text style={styles.addCategoryText}>New</Text>
                      </TouchableOpacity>
                    </View>
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

            {/* Show create category button if no categories */}
            {categories.length === 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryLabel}>Category (Optional)</Text>
                <TouchableOpacity
                  style={styles.createFirstCategoryButton}
                  onPress={() => setCategoryModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <PlusIcon size={20} color={COLORS.primary} />
                  <Text style={styles.createFirstCategoryText}>Create your first category</Text>
                </TouchableOpacity>
              </View>
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

            <Controller
              control={control}
              name="initialStock"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Initial Stock Quantity"
                  placeholder="0"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  error={errors.initialStock?.message}
                  required
                  helperText="Starting quantity in stock"
                />
              )}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Create Product"
            onPress={handleSubmit(onSubmit)}
            loading={createProduct.isPending}
            disabled={createProduct.isPending}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Category Modal */}
      <CategoryModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
      />
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
  imagePlaceholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageButtonIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  imageButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  imageButtonSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
  },
  scanBarcodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  scanText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  addCategoryText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  createFirstCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xs,
  },
  createFirstCategoryText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
});
