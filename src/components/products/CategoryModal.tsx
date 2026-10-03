import { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../common/Input';
import Button from '../common/Button';
import { useCreateCategory, useUpdateCategory } from '../../hooks/useCategories';
import { Category } from '../../types';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';
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

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Reset form when modal opens with category data
  useEffect(() => {
    if (visible) {
      reset({
        name: category?.name || '',
        description: category?.description || '',
      });
    }
  }, [visible, category, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (category) {
        // Update existing category
        await updateCategory.mutateAsync({
          id: category.id,
          data: {
            name: data.name,
            description: data.description || undefined,
          },
        });
      } else {
        // Create new category
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

  const handleClose = () => {
    reset();
    onClose();
  };

  const isLoading = createCategory.isPending || updateCategory.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>
                  {category ? 'Edit Category' : 'Add Category'}
                </Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.form}>
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
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Description (Optional)"
                      placeholder="Brief description of the category"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      multiline
                      numberOfLines={3}
                      style={styles.textArea}
                    />
                  )}
                />
              </ScrollView>

              <View style={styles.footer}>
                <Button
                  title="Cancel"
                  onPress={handleClose}
                  variant="outline"
                  style={styles.cancelButton}
                  disabled={isLoading}
                />
                <Button
                  title={category ? 'Update' : 'Create'}
                  onPress={handleSubmit(onSubmit)}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.submitButton}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
  },
  modalContent: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    color: COLORS.textSecondary,
  },
  form: {
    marginBottom: SPACING.lg,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});
