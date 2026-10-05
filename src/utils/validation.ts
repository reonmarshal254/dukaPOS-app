/**
 * Validate phone number (Kenyan format)
 */
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Kenyan phone numbers: 07XX XXX XXX or +254 7XX XXX XXX
  return /^(0|254)?7\d{8}$/.test(cleaned);
}

/**
 * Validate email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate PIN (4-6 digits)
 */
export function validatePIN(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

/**
 * Validate barcode
 */
export function validateBarcode(barcode: string): boolean {
  return barcode.length >= 8 && barcode.length <= 13 && /^\d+$/.test(barcode);
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(value: number): boolean {
  return !isNaN(value) && value > 0;
}

/**
 * Validate non-negative number
 */
export function validateNonNegativeNumber(value: number): boolean {
  return !isNaN(value) && value >= 0;
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Validate required field
 */
export function validateRequired(value: any): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
}
