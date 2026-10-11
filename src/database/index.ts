import * as SQLite from 'expo-sqlite';
import { ALL_TABLES, CREATE_INDEXES } from './schema';
import { DB_CONFIG } from '../constants/config';

let database: SQLite.SQLiteDatabase | null = null;

/**
 * Database migrations
 */
async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Get current schema version
    const versionResult = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version;'
    );
    const currentVersion = versionResult?.user_version || 0;

    console.log(`Current database version: ${currentVersion}`);

    // Migration 1: Add SKU field to products table
    if (currentVersion < 1) {
      console.log('Running migration 1: Adding SKU field to products table');
      await db.execAsync(`
        ALTER TABLE products ADD COLUMN sku TEXT;
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      `);
      await db.execAsync('PRAGMA user_version = 1;');
      console.log('Migration 1 completed');
    }

    // Migration 2: Add rating to suppliers and date to expenses
    if (currentVersion < 2) {
      console.log('Running migration 2: Enhancing suppliers and expenses tables');
      await db.execAsync(`
        ALTER TABLE suppliers ADD COLUMN rating INTEGER DEFAULT 0;
      `);
      await db.execAsync(`
        ALTER TABLE expenses ADD COLUMN date TEXT;
      `);
      // Update existing expenses to have date = created_at
      await db.execAsync(`
        UPDATE expenses SET date = created_at WHERE date IS NULL;
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
      `);
      await db.execAsync('PRAGMA user_version = 2;');
      console.log('Migration 2 completed');
    }

    // Migration 3: Create supplier_supplies table
    if (currentVersion < 3) {
      console.log('Running migration 3: Creating supplier_supplies table');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS supplier_supplies (
          id TEXT PRIMARY KEY NOT NULL,
          supplierId TEXT NOT NULL,
          productName TEXT NOT NULL,
          quantity REAL NOT NULL,
          unit TEXT NOT NULL,
          amount INTEGER NOT NULL,
          supplyDate TEXT NOT NULL,
          notes TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE CASCADE
        );
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_supplier_supplies_supplier ON supplier_supplies(supplierId);
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_supplier_supplies_date ON supplier_supplies(supplyDate);
      `);
      await db.execAsync('PRAGMA user_version = 3;');
      console.log('Migration 3 completed');
    }

    // Migration 4: Create product_variants table
    if (currentVersion < 4) {
      console.log('Running migration 4: Creating product_variants table');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS product_variants (
          id TEXT PRIMARY KEY NOT NULL,
          productId TEXT NOT NULL,
          name TEXT NOT NULL,
          unit TEXT NOT NULL,
          sellingPrice INTEGER NOT NULL,
          purchasePrice INTEGER,
          barcode TEXT,
          sku TEXT,
          isDefault INTEGER DEFAULT 0,
          isActive INTEGER DEFAULT 1,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
        );
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(productId);
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_product_variants_barcode ON product_variants(barcode);
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
      `);
      await db.execAsync('PRAGMA user_version = 4;');
      console.log('Migration 4 completed');
    }

    // Migration 5: Create receipts table
    if (currentVersion < 5) {
      console.log('Running migration 5: Creating receipts table');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS receipts (
          id TEXT PRIMARY KEY NOT NULL,
          sale_id TEXT NOT NULL UNIQUE,
          receipt_number TEXT NOT NULL,
          receipt_data TEXT NOT NULL,
          image_path TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
        );
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_receipts_sale ON receipts(sale_id);
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_receipts_number ON receipts(receipt_number);
      `);
      await db.execAsync('PRAGMA user_version = 5;');
      console.log('Migration 5 completed');
    }

  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

/**
 * Initialize the database and run migrations
 */
export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  try {
    if (database) {
      return database;
    }

    // Open or create the database
    database = await SQLite.openDatabaseAsync(DB_CONFIG.NAME);

    // Enable foreign keys
    await database.execAsync('PRAGMA foreign_keys = ON;');

    // Create all tables
    console.log('Creating database tables...');
    for (const tableSQL of ALL_TABLES) {
      await database.execAsync(tableSQL);
    }

    // Create indexes
    console.log('Creating database indexes...');
    for (const indexSQL of CREATE_INDEXES) {
      await database.execAsync(indexSQL);
    }

    // Run migrations
    await runMigrations(database);

    console.log('Database initialized successfully');
    return database;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Get the database instance (with better error message)
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!database) {
    const error = new Error(
      'Database not initialized. The app is still loading. Please wait...'
    );
    console.error('Database access attempted before initialization');
    throw error;
  }
  return database;
}

/**
 * Execute a query with parameters (with null check)
 */
export async function executeQuery<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const db = getDatabase();
    if (!db) {
      throw new Error('Database instance is null');
    }
    const result = await db.getAllAsync<T>(sql, params);
    return result;
  } catch (error: any) {
    console.error('Query execution error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw new Error(`Query failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Execute a single query and return the first result (with null check)
 */
export async function executeQuerySingle<T = any>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  try {
    const db = getDatabase();
    if (!db) {
      throw new Error('Database instance is null');
    }
    const result = await db.getFirstAsync<T>(sql, params);
    return result || null;
  } catch (error: any) {
    console.error('Query execution error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw new Error(`Query failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Execute a write query (INSERT, UPDATE, DELETE) with null check
 */
export async function executeWrite(
  sql: string,
  params: any[] = []
): Promise<SQLite.SQLiteRunResult> {
  try {
    const db = getDatabase();
    if (!db) {
      throw new Error('Database instance is null');
    }
    const result = await db.runAsync(sql, params);
    return result;
  } catch (error: any) {
    console.error('Write execution error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw new Error(`Write operation failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Execute multiple statements in a transaction
 */
export async function executeTransaction(
  callback: (tx: SQLite.SQLiteDatabase) => Promise<void>
): Promise<void> {
  const db = getDatabase();
  
  try {
    await db.execAsync('BEGIN TRANSACTION;');
    await callback(db);
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    console.error('Transaction error:', error);
    throw error;
  }
}

/**
 * Check if database has been initialized (has business data)
 */
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    if (!database) {
      await initializeDatabase();
    }
    
    const result = await executeQuerySingle<{ count: number }>(
      'SELECT COUNT(*) as count FROM businesses'
    );
    
    return (result?.count ?? 0) > 0;
  } catch (error) {
    console.error('Error checking database initialization:', error);
    return false;
  }
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (database) {
    await database.closeAsync();
    database = null;
  }
}

/**
 * Drop all tables (for testing/reset)
 */
export async function dropAllTables(): Promise<void> {
  const db = getDatabase();
  
  const tables = [
    'audit_logs',
    'crash_reports',
    'notifications',
    'sync_logs',
    'sync_queue',
    'app_settings',
    'expenses',
    'supplier_payments',
    'customer_ledger',
    'payments',
    'sale_items',
    'sales',
    'stock_movements',
    'stock_batches',
    'purchase_items',
    'purchases',
    'customers',
    'suppliers',
    'product_images',
    'products',
    'categories',
    'devices',
    'businesses',
  ];
  
  await db.execAsync('PRAGMA foreign_keys = OFF;');
  
  for (const table of tables) {
    await db.execAsync(`DROP TABLE IF EXISTS ${table};`);
  }
  
  await db.execAsync('PRAGMA foreign_keys = ON;');
}

export default {
  initializeDatabase,
  getDatabase,
  executeQuery,
  executeQuerySingle,
  executeWrite,
  executeTransaction,
  isDatabaseInitialized,
  closeDatabase,
  dropAllTables,
};
