// Core type definitions
export type UUID = string;
export type ISODateTime = string;

// Business entity
export interface Business {
  id: UUID;
  name: string;
  ownerName: string;
  phone: string;
  location: string;
  logoUrl?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// Device entity
export interface Device {
  id: UUID;
  businessId: UUID;
  deviceName: string;
  deviceModel: string;
  osVersion: string;
  appVersion: string;
  registeredAt: ISODateTime;
  lastHeartbeat?: ISODateTime;
  isActive: boolean;
}

// Category entity
export interface Category {
  id: UUID;
  name: string;
  description?: string;
  createdAt: ISODateTime;
}

// Product entity
export interface Product {
  id: UUID;
  name: string;
  description?: string;
  categoryId?: UUID;
  barcode?: string;
  sku?: string;
  imageUrl?: string;
  localImagePath?: string;
  purchasePrice: number; // in minor currency units (cents)
  sellingPrice: number;
  currentQuantity: number;
  minStockThreshold: number;
  unit: string;
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// Product Variant entity
export interface ProductVariant {
  id: UUID;
  productId: UUID;
  name: string; // e.g., "500ml", "1 Liter", "Small", "Medium"
  unit: string;
  sellingPrice: number; // in minor currency units
  purchasePrice?: number;
  barcode?: string;
  sku?: string;
  isDefault: boolean; // one variant should be default
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// Product with variants
export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

// Supplier entity
export interface Supplier {
  id: UUID;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  rating?: number; // 1-5 stars
  notes?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// Supplier supply entity
export interface SupplierSupply {
  id: UUID;
  supplierId: UUID;
  productName: string;
  quantity: number;
  unit: string;
  amount: number; // in minor units
  supplyDate: ISODateTime;
  notes?: string;
  createdAt: ISODateTime;
}

// Supplier with supply history
export interface SupplierWithSupplies extends Supplier {
  supplies: SupplierSupply[];
  totalSupplied: number; // total amount in minor units
}

// Customer entity
export interface Customer {
  id: UUID;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  currentBalance: number; // debt amount in minor units
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// Stock batch entity
export interface StockBatch {
  id: UUID;
  productId: UUID;
  supplierId?: UUID;
  batchNumber: string;
  receivedQuantity: number;
  remainingQuantity: number;
  purchaseCost: number; // per unit in minor units
  manufacturingDate?: ISODateTime;
  expiryDate?: ISODateTime;
  receivedAt: ISODateTime;
  createdAt: ISODateTime;
}

// Stock movement types
export enum StockMovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  DAMAGE = 'DAMAGE',
  EXPIRY = 'EXPIRY',
  CUSTOMER_RETURN = 'CUSTOMER_RETURN',
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT',
  SUPPLIER_RETURN = 'SUPPLIER_RETURN',
}

// Stock movement entity
export interface StockMovement {
  id: UUID;
  productId: UUID;
  batchId?: UUID;
  type: StockMovementType;
  quantity: number;
  referenceId?: UUID; // sale_id, purchase_id, etc.
  referenceType?: string;
  notes?: string;
  createdAt: ISODateTime;
}

// Purchase entity
export interface Purchase {
  id: UUID;
  supplierId: UUID;
  totalAmount: number; // in minor units
  amountPaid: number;
  supplierBalance: number;
  notes?: string;
  createdAt: ISODateTime;
}

// Purchase item entity
export interface PurchaseItem {
  id: UUID;
  purchaseId: UUID;
  productId: UUID;
  batchId: UUID;
  quantity: number;
  unitCost: number; // in minor units
  totalCost: number;
}

// Payment method types
export enum PaymentMethod {
  CASH = 'CASH',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CREDIT = 'CREDIT',
}

// Sale entity
export interface Sale {
  id: UUID;
  customerId?: UUID;
  receiptNumber: string;
  subtotal: number; // in minor units
  discount: number;
  total: number;
  amountPaid: number;
  change: number;
  creditAmount: number;
  notes?: string;
  createdAt: ISODateTime;
  syncStatus: SyncStatus;
}

// Sale item entity
export interface SaleItem {
  id: UUID;
  saleId: UUID;
  productId: UUID;
  batchId?: UUID;
  productName: string;
  quantity: number;
  unitPrice: number; // in minor units
  discount: number;
  total: number;
  costOfGoodsSold: number; // actual cost from batch
}

// Payment entity
export interface Payment {
  id: UUID;
  saleId?: UUID;
  customerId?: UUID;
  method: PaymentMethod;
  amount: number; // in minor units
  reference?: string; // for mobile money
  notes?: string;
  createdAt: ISODateTime;
}

// Customer credit ledger
export interface CustomerLedgerEntry {
  id: UUID;
  customerId: UUID;
  type: 'CREDIT_SALE' | 'PAYMENT';
  amount: number; // in minor units
  balance: number; // running balance
  referenceId?: UUID;
  notes?: string;
  createdAt: ISODateTime;
}

// Expense categories
export enum ExpenseCategory {
  ELECTRICITY = 'Electricity',
  FARE = 'Fare/Transport',
  STOCK_PURCHASE = 'Stock Purchase',
  RENT = 'Rent',
  EXPIRED_PRODUCT = 'Expired Product',
  DAMAGED_PRODUCT = 'Damaged Product',
  OTHERS = 'Others',
}

// Expense entity
export interface Expense {
  id: UUID;
  category: string;
  description: string;
  amount: number; // in minor units
  paymentMethod: PaymentMethod;
  date: ISODateTime; // when expense occurred
  notes?: string;
  createdAt: ISODateTime;
}

// Sync status
export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCING = 'SYNCING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
}

// Sync queue entry
export interface SyncQueueEntry {
  id: UUID;
  entityType: string;
  entityId: UUID;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: string; // JSON string
  status: SyncStatus;
  retryCount: number;
  createdAt: ISODateTime;
  syncedAt?: ISODateTime;
}

// App settings
export interface AppSettings {
  key: string;
  value: string;
  updatedAt: ISODateTime;
}

// Notification entity
export interface NotificationRecord {
  id: UUID;
  type: string;
  title: string;
  message: string;
  data?: string; // JSON string
  isRead: boolean;
  createdAt: ISODateTime;
}

// Error/crash report
export interface CrashReport {
  id: UUID;
  errorMessage: string;
  errorStack?: string;
  appVersion: string;
  osVersion: string;
  deviceModel: string;
  createdAt: ISODateTime;
  syncStatus: SyncStatus;
}

// Dashboard statistics
export interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  todayCash: number;
  todayMobileMoney: number;
  todayCredit: number;
  outstandingDebt: number;
  lowStockCount: number;
  expiringProductsCount: number;
  outOfStockCount: number;
}

// Product with inventory info
export interface ProductWithInventory extends Product {
  category?: Category;
  batches?: StockBatch[];
  isLowStock: boolean;
  isOutOfStock: boolean;
  hasExpiringBatches: boolean;
}

// Sale with items and payments
export interface SaleWithDetails extends Sale {
  items: SaleItem[];
  payments: Payment[];
  customer?: Customer;
}

// Cart item (for POS)
export interface CartItem {
  product: Product;
  variant?: ProductVariant; // Optional variant if product has variants
  quantity: number;
  discount: number;
  total: number;
}

// Receipt entity for saved receipts
export interface SavedReceipt {
  id: UUID;
  saleId: UUID;
  receiptNumber: string;
  receiptData: string; // JSON string
  imagePath?: string;
  createdAt: ISODateTime;
}

// Receipt data structure (used for display and storage)
export interface ReceiptData {
  receiptNumber: string;
  date: string;
  time: string;
  items: ReceiptItem[];
  subtotal: number; // minor units
  discount: number; // percentage
  total: number; // minor units
  amountPaid: number; // minor units
  change: number; // minor units
  balance: number; // same as change, for display
  cashTendered?: number; // for cash payments, in minor units
  paymentMethod: string;
  paymentMethods?: PaymentEntry[]; // for split payments
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  cashier?: string;
}

// Receipt item structure
export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number; // minor units
  total: number; // minor units
}

// Payment entry for receipts
export interface PaymentEntry {
  method: string;
  amount: number; // minor units
  reference?: string;
}
