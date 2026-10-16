import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../../../constants/spacing';
import { TYPOGRAPHY } from '../../../../constants/typography';
import { ArrowLeftIcon, ClockIcon, CalendarIcon } from '../../../../components/common/Icons';
import { useCreateReminder, useUpdateReminder, useReminders } from '../../../../hooks/useReminders';

const REMINDER_TYPES = [
  { value: 'daily_sales', label: 'Daily Sales Summary', icon: '📊' },
  { value: 'morning_opening', label: 'Morning Reminder', icon: '☀️' },
  { value: 'low_stock', label: 'Low Stock Alert', icon: '📦' },
  { value: 'custom', label: 'Custom Reminder', icon: '🔔' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', full: 'Sunday' },
  { value: 1, label: 'Mon', full: 'Monday' },
  { value: 2, label: 'Tue', full: 'Tuesday' },
  { value: 3, label: 'Wed', full: 'Wednesday' },
  { value: 4, label: 'Thu', full: 'Thursday' },
  { value: 5, label: 'Fri', full: 'Friday' },
  { value: 6, label: 'Sat', full: 'Saturday' },
];

export default function AddReminderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!params.id;

  const { data: reminders = [] } = useReminders();
  const createMutation = useCreateReminder();
  const updateMutation = useUpdateReminder();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderType, setReminderType] = useState('custom');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  // Load existing reminder data when editing
  useEffect(() => {
    if (isEditing && params.id) {
      const reminder = reminders.find(r => r.id === params.id);
      if (reminder) {
        setTitle(reminder.title);
        setDescription(reminder.description || '');
        setReminderType(reminder.reminderType);
        
        // Parse time
        const [hour, minute] = reminder.scheduledTime.split(':').map(Number);
        const timeDate = new Date();
        timeDate.setHours(hour, minute);
        setTime(timeDate);

        // Parse days
        if (reminder.scheduledDays) {
          try {
            const days = JSON.parse(reminder.scheduledDays) as number[];
            setSelectedDays(days);
          } catch {
            setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
          }
        }
      }
    }
  }, [isEditing, params.id, reminders]);

  const handleTimeChange = (_event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    const scheduledTime = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    const scheduledDays = JSON.stringify(selectedDays);

    try {
      if (isEditing && params.id) {
        await updateMutation.mutateAsync({
          id: params.id,
          data: {
            title: title.trim(),
            description: description.trim() || undefined,
            reminderType,
            scheduledTime,
            scheduledDays,
          },
        });
        Alert.alert('Success', 'Reminder updated successfully');
      } else {
        await createMutation.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
          reminderType,
          scheduledTime,
          scheduledDays,
          isEnabled: true,
        });
        Alert.alert('Success', 'Reminder created successfully');
      }
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save reminder');
      console.error('Save reminder error:', error);
    }
  };

  const formatTime = () => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeftIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Reminder' : 'New Reminder'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Check inventory"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add notes or details (optional)"
            placeholderTextColor={COLORS.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Reminder Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeGrid}>
            {REMINDER_TYPES.map(type => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeCard,
                  reminderType === type.value && styles.typeCardActive,
                ]}
                onPress={() => setReminderType(type.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text
                  style={[
                    styles.typeLabel,
                    reminderType === type.value && styles.typeLabelActive,
                  ]}
                  numberOfLines={2}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Time</Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <ClockIcon size={20} color={COLORS.primary} />
            <Text style={styles.timeText}>{formatTime()}</Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Days */}
        <View style={styles.section}>
          <Text style={styles.label}>Repeat on</Text>
          <View style={styles.daysContainer}>
            {DAYS_OF_WEEK.map(day => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayButton,
                  selectedDays.includes(day.value) && styles.dayButtonActive,
                ]}
                onPress={() => toggleDay(day.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    selectedDays.includes(day.value) && styles.dayLabelActive,
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedDays.length === 0 && (
            <Text style={styles.errorText}>Please select at least one day</Text>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!title.trim() || selectedDays.length === 0) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!title.trim() || selectedDays.length === 0}
        >
          <LinearGradient
            colors={
              !title.trim() || selectedDays.length === 0
                ? [COLORS.border, COLORS.border]
                : [COLORS.primary, COLORS.primaryDark]
            }
            style={styles.saveButtonGradient}
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update Reminder' : 'Create Reminder'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
    paddingVertical: SPACING.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 80,
    paddingTop: SPACING.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  typeCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  typeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '10',
  },
  typeIcon: {
    fontSize: 28,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text,
    textAlign: 'center',
  },
  typeLabelActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeText: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text,
    flex: 1,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dayButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  dayButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  dayLabelActive: {
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  saveButton: {
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
});
