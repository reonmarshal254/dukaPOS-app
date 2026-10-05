// Application color scheme
export const COLORS = {
  // Primary colors
  primary: '#2563EB', // Blue
  primaryDark: '#1E40AF',
  primaryLight: '#3B82F6',
  
  // Secondary colors
  secondary: '#10B981', // Green
  secondaryDark: '#059669',
  secondaryLight: '#34D399',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral colors
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceDark: '#F3F4F6',
  border: '#E5E7EB',
  divider: '#D1D5DB',
  
  // Text colors
  text: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Component colors
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',
  inputBackground: '#FFFFFF',
  inputBorder: '#D1D5DB',
  inputFocus: '#2563EB',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Status badges
  badgeSuccess: '#D1FAE5',
  badgeSuccessText: '#065F46',
  badgeWarning: '#FEF3C7',
  badgeWarningText: '#92400E',
  badgeError: '#FEE2E2',
  badgeErrorText: '#991B1B',
  badgeInfo: '#DBEAFE',
  badgeInfoText: '#1E40AF',
} as const;

export type ColorName = keyof typeof COLORS;
