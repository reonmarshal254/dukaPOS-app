/**
 * Format amount in minor units to currency string
 * @param amountInMinorUnits Amount in cents/minor units
 * @param currency Currency code (default: KSh for Kenyan Shilling)
 */
export function formatCurrency(
  amountInMinorUnits: number,
  currency: string = 'KSh'
): string {
  const amount = amountInMinorUnits / 100;
  return `${currency} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Parse currency input to minor units
 * @param input Currency string or number
 * @returns Amount in minor units (cents)
 */
export function parseCurrency(input: string | number): number {
  if (typeof input === 'number') {
    return Math.round(input * 100);
  }
  
  const cleaned = input.replace(/[^0-9.]/g, '');
  const amount = parseFloat(cleaned) || 0;
  return Math.round(amount * 100);
}

/**
 * Convert minor units to major units (for display in input fields)
 */
export function toMajorUnits(amountInMinorUnits: number): string {
  return (amountInMinorUnits / 100).toFixed(2);
}

/**
 * Convert major units to minor units
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(amount: number, percentage: number): number {
  return Math.round((amount * percentage) / 100);
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  originalAmount: number,
  discountPercentage: number
): number {
  return calculatePercentage(originalAmount, discountPercentage);
}

/**
 * Apply discount to amount
 */
export function applyDiscount(
  originalAmount: number,
  discountPercentage: number
): number {
  const discount = calculateDiscount(originalAmount, discountPercentage);
  return originalAmount - discount;
}
