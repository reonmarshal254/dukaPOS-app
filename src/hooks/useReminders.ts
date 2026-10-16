import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllReminders,
  getEnabledReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  toggleReminderEnabled,
  type CreateReminderData,
  type UpdateReminderData,
} from '../services/repositories/reminderRepository';
import {
  scheduleReminder,
  updateReminder as updateNotification,
  cancelReminder,
} from '../services/notificationService';

/**
 * Hook to get all reminders
 */
export function useReminders() {
  return useQuery({
    queryKey: ['reminders'],
    queryFn: getAllReminders,
  });
}

/**
 * Hook to get enabled reminders only
 */
export function useEnabledReminders() {
  return useQuery({
    queryKey: ['reminders', 'enabled'],
    queryFn: getEnabledReminders,
  });
}

/**
 * Hook to create a new reminder
 */
export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReminderData) => {
      // Create reminder in database
      const reminder = await createReminder(data);
      
      // Schedule notification if enabled
      if (reminder.isEnabled) {
        const notificationId = await scheduleReminder({
          id: reminder.id,
          title: reminder.title,
          description: reminder.description,
          reminderType: reminder.reminderType,
          scheduledTime: reminder.scheduledTime,
          scheduledDays: reminder.scheduledDays,
          isEnabled: reminder.isEnabled,
          notificationId: reminder.notificationId,
        });

        // Update reminder with notification ID
        if (notificationId) {
          await updateReminder(reminder.id, { notificationId });
        }
      }

      return reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

/**
 * Hook to update a reminder
 */
export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateReminderData;
    }) => {
      // Update reminder in database
      const reminder = await updateReminder(id, data);

      // Update notification
      if (reminder.isEnabled) {
        const notificationId = await updateNotification({
          id: reminder.id,
          title: reminder.title,
          description: reminder.description,
          reminderType: reminder.reminderType,
          scheduledTime: reminder.scheduledTime,
          scheduledDays: reminder.scheduledDays,
          isEnabled: reminder.isEnabled,
          notificationId: reminder.notificationId,
        });

        // Update reminder with new notification ID if changed
        if (notificationId && notificationId !== reminder.notificationId) {
          await updateReminder(reminder.id, { notificationId });
        }
      } else if (reminder.notificationId) {
        // Cancel notification if disabled
        await cancelReminder(reminder.notificationId);
      }

      return reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

/**
 * Hook to delete a reminder
 */
export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get reminder first to cancel notification
      const reminders = await getAllReminders();
      const reminder = reminders.find(r => r.id === id);

      if (reminder?.notificationId) {
        await cancelReminder(reminder.notificationId);
      }

      // Delete reminder from database
      await deleteReminder(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

/**
 * Hook to toggle reminder enabled status
 */
export function useToggleReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Toggle in database
      const reminder = await toggleReminderEnabled(id);

      // Update notification
      if (reminder.isEnabled) {
        const notificationId = await scheduleReminder({
          id: reminder.id,
          title: reminder.title,
          description: reminder.description,
          reminderType: reminder.reminderType,
          scheduledTime: reminder.scheduledTime,
          scheduledDays: reminder.scheduledDays,
          isEnabled: reminder.isEnabled,
          notificationId: reminder.notificationId,
        });

        if (notificationId && notificationId !== reminder.notificationId) {
          await updateReminder(reminder.id, { notificationId });
        }
      } else if (reminder.notificationId) {
        await cancelReminder(reminder.notificationId);
      }

      return reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}
