import { executeQuery, executeQuerySingle, executeWrite } from '../../database';
import { generateUUID } from '../../utils/uuid';

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  reminderType: string;
  scheduledTime: string;
  scheduledDays?: string;
  isEnabled: boolean;
  notificationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderData {
  title: string;
  description?: string;
  reminderType: string;
  scheduledTime: string;
  scheduledDays?: string;
  isEnabled?: boolean;
  notificationId?: string;
}

export interface UpdateReminderData {
  title?: string;
  description?: string;
  reminderType?: string;
  scheduledTime?: string;
  scheduledDays?: string;
  isEnabled?: boolean;
  notificationId?: string;
}

/**
 * Create a new reminder
 */
export async function createReminder(data: CreateReminderData): Promise<Reminder> {
  const id = generateUUID();
  const now = new Date().toISOString();

  await executeWrite(
    `INSERT INTO reminders (
      id, title, description, reminder_type, scheduled_time, 
      scheduled_days, is_enabled, notification_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title,
      data.description || null,
      data.reminderType,
      data.scheduledTime,
      data.scheduledDays || null,
      data.isEnabled !== false ? 1 : 0,
      data.notificationId || null,
      now,
      now,
    ]
  );

  const reminder = await getReminderById(id);
  if (!reminder) {
    throw new Error('Failed to create reminder');
  }

  return reminder;
}

/**
 * Get reminder by ID
 */
export async function getReminderById(id: string): Promise<Reminder | null> {
  const result = await executeQuerySingle<any>(
    `SELECT * FROM reminders WHERE id = ?`,
    [id]
  );

  if (!result) {
    return null;
  }

  return mapDbRowToReminder(result);
}

/**
 * Get all reminders
 */
export async function getAllReminders(): Promise<Reminder[]> {
  const results = await executeQuery<any>(
    `SELECT * FROM reminders ORDER BY created_at DESC`
  );

  return results.map(mapDbRowToReminder);
}

/**
 * Get enabled reminders only
 */
export async function getEnabledReminders(): Promise<Reminder[]> {
  const results = await executeQuery<any>(
    `SELECT * FROM reminders WHERE is_enabled = 1 ORDER BY created_at DESC`
  );

  return results.map(mapDbRowToReminder);
}

/**
 * Update a reminder
 */
export async function updateReminder(
  id: string,
  data: UpdateReminderData
): Promise<Reminder> {
  const now = new Date().toISOString();
  
  const updates: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description || null);
  }
  if (data.reminderType !== undefined) {
    updates.push('reminder_type = ?');
    values.push(data.reminderType);
  }
  if (data.scheduledTime !== undefined) {
    updates.push('scheduled_time = ?');
    values.push(data.scheduledTime);
  }
  if (data.scheduledDays !== undefined) {
    updates.push('scheduled_days = ?');
    values.push(data.scheduledDays || null);
  }
  if (data.isEnabled !== undefined) {
    updates.push('is_enabled = ?');
    values.push(data.isEnabled ? 1 : 0);
  }
  if (data.notificationId !== undefined) {
    updates.push('notification_id = ?');
    values.push(data.notificationId || null);
  }

  updates.push('updated_at = ?');
  values.push(now);

  values.push(id);

  await executeWrite(
    `UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const reminder = await getReminderById(id);
  if (!reminder) {
    throw new Error('Failed to update reminder');
  }

  return reminder;
}

/**
 * Delete a reminder
 */
export async function deleteReminder(id: string): Promise<void> {
  await executeWrite(`DELETE FROM reminders WHERE id = ?`, [id]);
}

/**
 * Toggle reminder enabled status
 */
export async function toggleReminderEnabled(id: string): Promise<Reminder> {
  const reminder = await getReminderById(id);
  if (!reminder) {
    throw new Error('Reminder not found');
  }

  return updateReminder(id, { isEnabled: !reminder.isEnabled });
}

/**
 * Map database row to Reminder object
 */
function mapDbRowToReminder(row: any): Reminder {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    reminderType: row.reminder_type,
    scheduledTime: row.scheduled_time,
    scheduledDays: row.scheduled_days || undefined,
    isEnabled: Boolean(row.is_enabled),
    notificationId: row.notification_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
