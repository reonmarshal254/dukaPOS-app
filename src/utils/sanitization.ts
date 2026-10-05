/**
 * Security sanitization utilities to prevent injection attacks
 */

/**
 * Sanitize SQL input to prevent SQL injection
 * Note: Always use parameterized queries. This is a secondary defense.
 */
export function sanitizeSQLInput(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('SQL input must be a string');
  }

  // Remove dangerous SQL characters and keywords
  return input
    .replace(/['";\\]/g, '') // Remove quotes and special chars
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment start
    .replace(/\*\//g, '') // Remove block comment end
    .trim();
}

/**
 * Validate and sanitize file path
 */
export function sanitizeFilePath(path: string): string {
  if (typeof path !== 'string') {
    throw new Error('File path must be a string');
  }

  // Remove path traversal attempts
  const sanitized = path
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
    .trim();

  // Ensure path doesn't start with /
  if (sanitized.startsWith('/')) {
    throw new Error('Invalid file path');
  }

  return sanitized;
}

/**
 * Sanitize HTML/XSS in user input
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate numeric input
 */
export function sanitizeNumericInput(input: any): number {
  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num) || !isFinite(num)) {
    throw new Error('Invalid numeric input');
  }

  return num;
}

/**
 * Validate and sanitize phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Basic length validation
  if (cleaned.length < 9 || cleaned.length > 15) {
    throw new Error('Invalid phone number length');
  }

  return cleaned;
}

/**
 * Sanitize barcode input
 */
export function sanitizeBarcode(barcode: string): string {
  // Remove non-alphanumeric characters
  const cleaned = barcode.replace(/[^a-zA-Z0-9]/g, '');

  if (cleaned.length < 8 || cleaned.length > 13) {
    throw new Error('Invalid barcode format');
  }

  return cleaned;
}

/**
 * Sanitize amount input (prevent negative amounts, invalid decimals)
 */
export function sanitizeAmount(amount: number | string): number {
  const num = sanitizeNumericInput(amount);

  if (num < 0) {
    throw new Error('Amount cannot be negative');
  }

  // Round to 2 decimal places (currency precision)
  return Math.round(num * 100) / 100;
}

/**
 * Deep sanitize object (recursive)
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeHTML(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}
