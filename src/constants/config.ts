// Application configuration
export const APP_CONFIG = {
  NAME: process.env.APP_NAME || 'DukaPOS',
  VERSION: process.env.APP_VERSION || '1.0.0',
  API_BASE_URL: process.env.API_BASE_URL || 'http://10.0.2.2:8000/api/v1',
  DEBUG_MODE: process.env.DEBUG_MODE === 'true',
} as const;

export const FEATURE_FLAGS = {
  ENABLE_SYNC: process.env.ENABLE_SYNC !== 'false',
  ENABLE_MONITORING: process.env.ENABLE_MONITORING !== 'false',
  ENABLE_CRASH_REPORTING: process.env.ENABLE_CRASH_REPORTING !== 'false',
} as const;

// Database configuration
export const DB_CONFIG = {
  NAME: 'dukapos.db',
  VERSION: 1,
} as const;

// Synchronization configuration
export const SYNC_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  MAX_RETRY_DELAY_MS: 60000,
  BATCH_SIZE: 50,
  HEARTBEAT_INTERVAL_MS: 300000, // 5 minutes
} as const;

// Security configuration
export const SECURITY_CONFIG = {
  PIN_LENGTH_MIN: 6,
  PIN_LENGTH_MAX: 6,
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 300000, // 5 minutes
  AUTO_LOCK_TIMEOUT_MS: 300000, // 5 minutes
} as const;

// Inventory configuration
export const INVENTORY_CONFIG = {
  LOW_STOCK_THRESHOLD_DAYS: 7,
  EXPIRY_WARNING_DAYS: [30, 14, 7, 3, 1],
  DEFAULT_UNIT: 'pcs',
} as const;

// Receipt configuration
export const RECEIPT_CONFIG = {
  MAX_WIDTH: 300,
  FONT_SIZE: 12,
  LINE_HEIGHT: 20,
} as const;

// Image configuration
export const IMAGE_CONFIG = {
  MAX_WIDTH: 1024,
  MAX_HEIGHT: 1024,
  QUALITY: 0.8,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;
