import * as SQLite from 'expo-sqlite';
import { ALL_TABLES, CREATE_INDEXES } from './schema';
import { DB_CONFIG } from '../constants/config';

let database: SQLite.SQLiteDatabase | null = null;

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
