// Database schema definitions
export const TABLES = {
  BUSINESSES: 'businesses',
  DEVICES: 'devices',
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
  PRODUCT_IMAGES: 'product_images',
  SUPPLIERS: 'suppliers',
  CUSTOMERS: 'customers',
  PURCHASES: 'purchases',
  PURCHASE_ITEMS: 'purchase_items',
  STOCK_BATCHES: 'stock_batches',
  STOCK_MOVEMENTS: 'stock_movements',
  SALES: 'sales',
  SALE_ITEMS: 'sale_items',
  PAYMENTS: 'payments',
  CUSTOMER_LEDGER: 'customer_ledger',
  SUPPLIER_PAYMENTS: 'supplier_payments',
  EXPENSES: 'expenses',
  APP_SETTINGS: 'app_settings',
  SYNC_QUEUE: 'sync_queue',
  SYNC_LOGS: 'sync_logs',
  NOTIFICATIONS: 'notifications',
  CRASH_REPORTS: 'crash_reports',
  AUDIT_LOGS: 'audit_logs',
} as const;

// Create businesses table
export const CREATE_BUSINESSES_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.BUSINESSES} (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  logo_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

// Create devices table
export const CREATE_DEVICES_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.DEVICES} (
  id TEXT PRIMARY KEY NOT NULL,
  business_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_model TEXT NOT NULL,
  os_version TEXT NOT NULL,
  app_version TEXT NOT NULL,
  registered_at TEXT NOT NULL,
  last_heartbeat TEXT,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (business_id) REFERENCES ${TABLES.BUSINESSES}(id)
);
`;

// Create categories table
export const CREATE_CATEGORIES_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.CATEGORIES} (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL
);
`;

// Create products table
export const CREATE_PRODUCTS_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.PRODUCTS} (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category_id TEXT,
  barcode TEXT,
  image_url TEXT,
  local_image_path TEXT,
  purchase_price INTEGER NOT NULL,
  selling_price INTEGER NOT NULL,
  current_quantity INTEGER DEFAULT 0,
  min_stock_threshold INTEGER DEFAULT 10,
  unit TEXT DEFAULT 'pcs',
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES ${TABLES.CATEGORIES}(id)
);
`;

// Create product images table
export const CREATE_PRODUCT_IMAGES_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.PRODUCT_IMAGES} (
  id TEXT PRIMARY KEY NOT NULL,
  product_id TEXT NOT NULL,
  local_path TEXT NOT NULL,
  remote_url TEXT,
  uploaded INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES ${TABLES.PRODUCTS}(id) ON DELETE CASCADE
);
`;

// Create suppliers table
export const CREATE_SUPPLIERS_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.SUPPLIERS} (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

// Create customers table
export const CREATE_CUSTOMERS_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.CUSTOMERS} (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  current_balance INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

// Create purchases table
export const CREATE_PURCHASES_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.PURCHASES} (
  id TEXT PRIMARY KEY NOT NULL,
  supplier_id TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL,
  supplier_balance INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (supplier_id) REFERENCES ${TABLES.SUPPLIERS}(id)
);
`;

// Create purchase items table
export const CREATE_PURCHASE_ITEMS_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.PURCHASE_ITEMS} (
  id TEXT PRIMARY KEY NOT NULL,
  purchase_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost INTEGER NOT NULL,
  total_cost INTEGER NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES ${TABLES.PURCHASES}(id),
  FOREIGN KEY (product_id) REFERENCES ${TABLES.PRODUCTS}(id),
  FOREIGN KEY (batch_id) REFERENCES ${TABLES.STOCK_BATCHES}(id)
);
`;

// Create stock batches table
export const CREATE_STOCK_BATCHES_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.STOCK_BATCHES} (
  id TEXT PRIMARY KEY NOT NULL,
  product_id TEXT NOT NULL,
  supplier_id TEXT,
  batch_number TEXT NOT NULL,
  received_quantity INTEGER NOT NULL,
  remaining_quantity INTEGER NOT NULL,
  purchase_cost INTEGER NOT NULL,
  manufacturing_date TEXT,
  expiry_date TEXT,
  received_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES ${TABLES.PRODUCTS}(id),
  FOREIGN KEY (supplier_id) REFERENCES ${TABLES.SUPPLIERS}(id)
);
`;

// Create stock movements table
export const CREATE_STOCK_MOVEMENTS_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.STOCK_MOVEMENTS} (
  id TEXT PRIMARY KEY NOT NULL,
  product_id TEXT NOT NULL,
  batch_id TEXT,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reference_id TEXT,
  reference_type TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES ${TABLES.PRODUCTS}(id),
  FOREIGN KEY (batch_id) REFERENCES ${TABLES.STOCK_BATCHES}(id)
);
`;

// Create sales table
export const CREATE_SALES_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.SALES} (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT,
  receipt_number TEXT NOT NULL UNIQUE,
  subtotal INTEGER NOT NULL,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL,
  change INTEGER DEFAULT 0,
  credit_amount INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  sync_status TEXT DEFAULT 'PENDING',
  FOREIGN KEY (customer_id) REFERENCES ${TABLES.CUSTOMERS}(id)
);
`;

// Create sale items table
export const CREATE_SALE_ITEMS_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.SALE_ITEMS} (
  id TEXT PRIMARY KEY NOT NULL,
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  batch_id TEXT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  cost_of_goods_sold INTEGER NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES ${TABLES.SALES}(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES ${TABLES.PRODUCTS}(id),
  FOREIGN KEY (batch_id) REFERENCES ${TABLES.STOCK_BATCHES}(id)
);
`;

// Create payments table
export const CREATE_PAYMENTS_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.PAYMENTS} (
  id TEXT PRIMARY KEY NOT NULL,
  sale_id TEXT,
  customer_id TEXT,
  method TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reference TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES ${TABLES.SALES}(id),
  FOREIGN KEY (customer_id) REFERENCES ${TABLES.CUSTOMERS}(id)
);
`;

// Create customer ledger table
export const CREATE_CUSTOMER_LEDGER_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.CUSTOMER_LEDGER} (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance INTEGER NOT NULL,
  reference_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES ${TABLES.CUSTOMERS}(id)
);
`;

// Create supplier payments table
export const CREATE_SUPPLIER_PAYMENTS_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.SUPPLIER_PAYMENTS} (
  id TEXT PRIMARY KEY NOT NULL,
  supplier_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  method TEXT NOT NULL,
  reference TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (supplier_id) REFERENCES ${TABLES.SUPPLIERS}(id)
);
`;

// Create expenses table
export const CREATE_EXPENSES_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.EXPENSES} (
  id TEXT PRIMARY KEY NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL
);
`;

// Create app settings table
export const CREATE_APP_SETTINGS_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.APP_SETTINGS} (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

// Create sync queue table
export const CREATE_SYNC_QUEUE_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.SYNC_QUEUE} (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  retry_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  synced_at TEXT
);
`;

// Create sync logs table
export const CREATE_SYNC_LOGS_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.SYNC_LOGS} (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,
  created_at TEXT NOT NULL
);
`;

// Create notifications table
export const CREATE_NOTIFICATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.NOTIFICATIONS} (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
`;

// Create crash reports table
export const CREATE_CRASH_REPORTS_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.CRASH_REPORTS} (
  id TEXT PRIMARY KEY NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  app_version TEXT NOT NULL,
  os_version TEXT NOT NULL,
  device_model TEXT NOT NULL,
  created_at TEXT NOT NULL,
  sync_status TEXT DEFAULT 'PENDING'
);
`;

// Create audit logs table
export const CREATE_AUDIT_LOGS_TABLE = `
CREATE TABLE IF NOT EXISTS ${TABLES.AUDIT_LOGS} (
  id TEXT PRIMARY KEY NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  user_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL
);
`;

// Indexes for performance
export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_products_category ON ${TABLES.PRODUCTS}(category_id);`,
  `CREATE INDEX IF NOT EXISTS idx_products_barcode ON ${TABLES.PRODUCTS}(barcode);`,
  `CREATE INDEX IF NOT EXISTS idx_products_active ON ${TABLES.PRODUCTS}(is_active);`,
  `CREATE INDEX IF NOT EXISTS idx_stock_batches_product ON ${TABLES.STOCK_BATCHES}(product_id);`,
  `CREATE INDEX IF NOT EXISTS idx_stock_batches_expiry ON ${TABLES.STOCK_BATCHES}(expiry_date);`,
  `CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON ${TABLES.STOCK_MOVEMENTS}(product_id);`,
  `CREATE INDEX IF NOT EXISTS idx_stock_movements_batch ON ${TABLES.STOCK_MOVEMENTS}(batch_id);`,
  `CREATE INDEX IF NOT EXISTS idx_sales_customer ON ${TABLES.SALES}(customer_id);`,
  `CREATE INDEX IF NOT EXISTS idx_sales_created ON ${TABLES.SALES}(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_sales_sync_status ON ${TABLES.SALES}(sync_status);`,
  `CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON ${TABLES.SALE_ITEMS}(sale_id);`,
  `CREATE INDEX IF NOT EXISTS idx_payments_sale ON ${TABLES.PAYMENTS}(sale_id);`,
  `CREATE INDEX IF NOT EXISTS idx_payments_customer ON ${TABLES.PAYMENTS}(customer_id);`,
  `CREATE INDEX IF NOT EXISTS idx_customer_ledger_customer ON ${TABLES.CUSTOMER_LEDGER}(customer_id);`,
  `CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON ${TABLES.SYNC_QUEUE}(status);`,
  `CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON ${TABLES.SYNC_QUEUE}(entity_type, entity_id);`,
];

// All table creation statements
export const ALL_TABLES = [
  CREATE_BUSINESSES_TABLE,
  CREATE_DEVICES_TABLE,
  CREATE_CATEGORIES_TABLE,
  CREATE_PRODUCTS_TABLE,
  CREATE_PRODUCT_IMAGES_TABLE,
  CREATE_SUPPLIERS_TABLE,
  CREATE_CUSTOMERS_TABLE,
  CREATE_PURCHASES_TABLE,
  CREATE_PURCHASE_ITEMS_TABLE,
  CREATE_STOCK_BATCHES_TABLE,
  CREATE_STOCK_MOVEMENTS_TABLE,
  CREATE_SALES_TABLE,
  CREATE_SALE_ITEMS_TABLE,
  CREATE_PAYMENTS_TABLE,
  CREATE_CUSTOMER_LEDGER_TABLE,
  CREATE_SUPPLIER_PAYMENTS_TABLE,
  CREATE_EXPENSES_TABLE,
  CREATE_APP_SETTINGS_TABLE,
  CREATE_SYNC_QUEUE_TABLE,
  CREATE_SYNC_LOGS_TABLE,
  CREATE_NOTIFICATIONS_TABLE,
  CREATE_CRASH_REPORTS_TABLE,
  CREATE_AUDIT_LOGS_TABLE,
];
