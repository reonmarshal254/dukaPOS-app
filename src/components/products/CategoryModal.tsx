import { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../common/Input';
import Button from '../common/Button';
import { useCreateCategory, useUpdateCategory } from '../../hooks/useCategories';
import { Category } from '../../types';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  category?: Category | null;
}

export default function CategoryModal({
  visible,
  onClose,
  category,
}: CategoryModalProps) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  // Safe area insets — gives us the Android nav-bar height via bottom
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (visible) {
      reset({
        name: category?.name ?? '',
        description: category?.description ?? '',
      });
    }
  }, [visible, category, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (category) {
        await updateCategory.mutateAsync({
          id: category.id,
          data: { name: data.name, description: data.description || undefined },
        });
      } else {
        await createCategory.mutateAsync({
          name: data.name,
          description: data.description || undefined,
        });
      }
      reset();
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleClose = () => { reset(); onClose(); };
  const isLoading = createCategory.isPending || updateCategory.isPending;

  // Bottom padding: whichever is larger — the system nav bar or our baseline
  const safeBottom = Math.max(insets.bottom, SPACING.lg);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent           // lets the gradient show under the status bar
      onRequestClose={handleClose}
    >
      {/* Dim backdrop — tap to dismiss */}
      <Pressable style={styles.backdrop} onPress={handleClose} />

      {/*
        KeyboardAvoidingView wraps only the sheet.
        On Android we use 'padding' so the sheet lifts above the keyboard
        while still sitting above the nav bar.
      */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.kavWrapper}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.sheet, { paddingBottom: safeBottom }]}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {category ? 'Edit Category' : 'New Category'}
              </Text>
              <Text style={styles.subtitle}>
                {category
                  ? 'Update category details'
                  : 'Organise your products with categories'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form fields */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Category Name"
                  placeholder="e.g., Beverages"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  required
                  autoFocus
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Description (Optional)"
                  placeholder="Short description of this category"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={2}
                  style={styles.textArea}
                />
              )}
            />
          </View>

          {/* Action buttons — always above the nav bar */}
          <View style={styles.actions}>
            <Button
              title="Cancel"
              onPress={handleClose}
              variant="outline"
              style={styles.btnHalf}
              disabled={isLoading}
            />
            <Button
              title={category ? 'Update' : 'Create'}
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              style={styles.btnHalf}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Semi-transparent backdrop — fills screen behind the sheet
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // KeyboardAvoidingView anchored to the bottom
  kavWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },

  // The bottom sheet itself
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    ...SHADOWS.lg,
  },

  // Drag handle
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.divider,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },

  // Header row
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeBtnText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },

  // Form
  form: {
    marginBottom: SPACING.md,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },

  // Actions row
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  btnHalf: {
    flex: 1,
    marginTop: 0,
  },
});
