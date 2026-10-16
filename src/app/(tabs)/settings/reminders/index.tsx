import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../../../constants/spacing';
import { TYPOGRAPHY } from '../../../../constants/typography';
import { ArrowLeftIcon, AlertIcon, TrashIcon, PlusIcon, ClockIcon, CalendarIcon } from '../../../../components/common/Icons';
import { useReminders, useToggleReminder, useDeleteReminder } from '../../../../hooks/useReminders';
import type { Reminder } from '../../../../services/repositories/reminderRepository';

const REMINDER_TYPE_LABELS: Record<string, string> = {
  daily_sales: 'Daily Sales Summary',
  morning_opening: 'Morning Reminder',
  low_stock: 'Low Stock Alert',
  custom: 'Custom Reminder',
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RemindersScreen() {
  const router = useRouter();
  const { data: reminders = [], isLoading } = useReminders();
  const toggleMutation = useToggleReminder();
  const deleteMutation = useDeleteReminder();

  const handleToggle = (reminder: Reminder) => {
    toggleMutation.mutate(reminder.id);
  };

  const handleDelete = (reminder: Reminder) => {
    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete "${reminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(reminder.id),
        },
      ]
    );
  };

  const handleEdit = (reminder: Reminder) => {
    router.push({
      pathname: '/(tabs)/settings/reminders/add',
      params: { id: reminder.id },
    });
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const formatDays = (daysJson?: string) => {
    if (!daysJson) return 'Daily';
    try {
      const days = JSON.parse(daysJson) as number[];
      if (days.length === 7) return 'Daily';
      if (days.length === 0) return 'Never';
      return days.map(d => DAYS_OF_WEEK[d]).join(', ');
    } catch {
      return 'Daily';
    }
  };

  const renderReminder = ({ item }: { item: Reminder }) => (
    <TouchableOpacity
      style={styles.reminderCard}
      onPress={() => handleEdit(item)}
      activeOpacity={0.7}
    >
      <View style={styles.reminderIcon}>
        <AlertIcon size={20} color={item.isEnabled ? COLORS.primary : COLORS.textSecondary} />
      </View>

      <View style={styles.reminderContent}>
        <Text style={styles.reminderTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.reminderDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <View style={styles.reminderMeta}>
          <Text style={styles.reminderType}>
            {REMINDER_TYPE_LABELS[item.reminderType] || 'Custom'}
          </Text>
          <Text style={styles.reminderDot}>•</Text>
          <Text style={styles.reminderTime}>{formatTime(item.scheduledTime)}</Text>
          <Text style={styles.reminderDot}>•</Text>
          <Text style={styles.reminderDays}>{formatDays(item.scheduledDays)}</Text>
        </View>
      </View>

      <View style={styles.reminderActions}>
        <Switch
          value={item.isEnabled}
          onValueChange={() => handleToggle(item)}
          trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
          thumbColor={item.isEnabled ? COLORS.primary : COLORS.textSecondary}
          ios_backgroundColor={COLORS.border}
        />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <TrashIcon size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <AlertIcon size={48} color={COLORS.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No reminders yet</Text>
      <Text style={styles.emptyText}>
        Create reminders to stay on top of your business tasks
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/(tabs)/settings/reminders/add')}
      >
        <Text style={styles.emptyButtonText}>Create First Reminder</Text>
      </TouchableOpacity>
    </View>
  );

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
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Reminders</Text>
            <Text style={styles.headerSubtitle}>
              {reminders.length} {reminders.length === 1 ? 'reminder' : 'reminders'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* List */}
      <FlatList
        data={reminders}
        keyExtractor={item => item.id}
        renderItem={renderReminder}
        contentContainerStyle={[
          styles.list,
          reminders.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Add Button */}
      {reminders.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(tabs)/settings/reminders/add')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.fabGradient}
          >
            <PlusIcon size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
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
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  list: {
    padding: SPACING.lg,
  },
  listEmpty: {
    flexGrow: 1,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  reminderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderContent: {
    flex: 1,
    gap: 4,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  reminderDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  reminderType: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  reminderDot: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  reminderTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  reminderDays: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    ...SHADOWS.lg,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
