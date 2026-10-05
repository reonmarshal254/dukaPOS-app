/**
 * Get current ISO datetime string
 */
export function getCurrentDateTime(): string {
  return new Date().toISOString();
}

/**
 * Format date for display
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format time for display
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Check if a date is today
 */
export function isToday(isoString: string): boolean {
  const date = new Date(isoString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Calculate days until a date
 */
export function daysUntil(isoString: string): number {
  const target = new Date(isoString);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date has passed
 */
export function isPast(isoString: string): boolean {
  const date = new Date(isoString);
  return date < new Date();
}

/**
 * Get start of day in ISO format
 */
export function getStartOfDay(date?: Date): string {
  const d = date || new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Get end of day in ISO format
 */
export function getEndOfDay(date?: Date): string {
  const d = date || new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/**
 * Add days to a date
 */
export function addDays(isoString: string, days: number): string {
  const date = new Date(isoString);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Subtract days from a date
 */
export function subtractDays(isoString: string, days: number): string {
  return addDays(isoString, -days);
}
