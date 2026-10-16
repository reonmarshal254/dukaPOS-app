import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCreateReminder, useUpdateReminder } from '../../hooks/useReminders';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

interface ReminderModalProps {
  visible: boolean;
  reminder?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const REMINDER_TYPES = [
  { value: 'stock_order', label: 'Stock Order' },
  { value: 'shop_opening', label: 'Shop Opening' },
  { value: 'shop_closing', label: 'Shop Closing' },
  { value: 'inventory_check', label: 'Inventory Check' },
  { value: 'custom', label: 'Custom' },
];

export default function ReminderModal({
  visible,
  reminder,
  onClose,
  onSuccess,
}: ReminderModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderType, setReminderType] = useState('custom');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setDescription(reminder.description || '');
      setReminderType(reminder.reminderType);
      
      // Parse time
      const [hour, minute] = reminder.scheduledTime.split(':').map(Number);
      const date = new Date();
      date.setHours(hour, minute);
      setTime(date);
    } else {
      resetForm();
    }
  }, [reminder, visible]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setReminderType('custom');
    const defaultTime = new Date();
    defaultTime.setHours(9, 0);
    setTime(defaultTime);
  };

  const formatTimeForDB = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatTimeDisplay = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for the reminder');
      return;
    }

    try {
      const reminderData = {
        title: title.trim(),
        description: description.trim() || undefined,
        reminderType,
        scheduledTime: formatTimeForDB(time),
        isEnabled: true,
      };

      if (reminder) {
        await updateReminder.mutateAsync({
          id: reminder.id,
          data: reminderData,
        });
        Alert.alert('Success', 'Reminder updated successfully');
      } else {
        await createReminder.mutateAsync(reminderData);
        Alert.alert('Success', 'Reminder created successfully');
      }

      onSuccess();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save reminder');
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTime(selectedDate);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modal}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {reminder ? 'Edit Reminder' : 'Add Reminder'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <Text style={styles.label}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Order stock, Open shop"
              placeholderTextColor={COLORS.textSecondary}
            />

            {/* Description */}
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add notes about this reminder"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={3}
            />

            {/* Type */}
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeGrid}>
              {REMINDER_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    reminderType === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() => setReminderType(type.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      reminderType === type.value && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time */}
            <Text style={styles.label}>
              Time <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.timeButtonText}>
                {formatTimeDisplay(time)}
              </Text>
              <Text style={styles.timeButtonIcon}>🕐</Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={handleTimeChange}
              />
            )}

            {/* Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                ℹ️ You'll receive a notification daily at the selected time
              </Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (createReminder.isPending || updateReminder.isPending) && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={createReminder.isPending || updateReminder.isPending}
              activeOpacity={0.7}
            >
              <Text style={styles.saveBtnText}>
                {createReminder.isPending || updateReminder.isPending
                  ? 'Saving...'
                  : reminder
                  ? 'Update Reminder'
                  : 'Create Reminder'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    maxHeight: '85%',
    ...SHADOWS.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.divider,
    alignSelf: 'center',
    marginBottom: SPACING.md,
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
  closeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Type Grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  typeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },

  // Time Button
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  timeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  timeButtonIcon: {
    fontSize: 24,
  },

  // Info Card
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#1E40AF',
  },

  // Save Button
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
});
