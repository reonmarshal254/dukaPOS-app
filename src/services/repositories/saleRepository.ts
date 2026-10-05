import { executeQuery, executeQuerySingle, executeWrite } from '../../database';
import { TABLES } from '../../database/schema';
import { SyncStatus, Sale, SaleWithDetails, SaleItem, Payment } from '../../types';
import { generateUUID } from '../../utils/uuid';
import { getCurrentDateTime } from '../../utils/datetime';

export class SaleRepository {
  /**
   * Get all sales with optional filters
   */
  async getAll(filters?: {
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Sale[]> {
    let query = `SELECT * FROM ${TABLES.SALES} WHERE 1=1`;
    const params: any[] = [];

    if (filters?.customerId) {
      query += ' AND customer_id = ?';
      params.push(filters.customerId);
    }

    if (filters?.startDate) {
      query += ' AND created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ' AND created_at <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY created_at DESC';

    const results = await executeQuery<any>(query, params);
    return results.map(this.mapRowToSale);
  }

  /**
   * Get sale by ID
   */
  async getById(id: string): Promise<Sale | null> {
    const row = await executeQuerySingle<any>(
      `SELECT * FROM ${TABLES.SALES} WHERE id = ?`,
      [id]
    );

    if (!row) return null;
    return this.mapRowToSale(row);
  }

  /**
   * Get sale with items and payments
   */
  async getSaleWithDetails(id: string): Promise<SaleWithDetails | null> {
    const sale = await this.getById(id);
    if (!sale) return null;

    // Get sale items
    const itemRows = await executeQuery<any>(
      `SELECT * FROM ${TABLES.SALE_ITEMS} WHERE sale_id = ?`,
      [id]
    );
    const items = itemRows.map(this.mapRowToSaleItem);

    // Get payments
    const paymentRows = await executeQuery<any>(
      `SELECT * FROM ${TABLES.PAYMENTS} WHERE sale_id = ?`,
      [id]
    );
    const payments = paymentRows.map(this.mapRowToPayment);

    return {
      ...sale,
      items,
      payments,
    };
  }

  /**
   * Create a new sale
   */
  async create(data: {
    customerId?: string;
    receiptNumber: string;
    subtotal: number;
    discount: number;
    total: number;
    amountPaid: number;
    change: number;
    creditAmount: number;
    notes?: string;
  }): Promise<Sale> {
    const id = generateUUID();
    const now = getCurrentDateTime();

    await executeWrite(
      `INSERT INTO ${TABLES.SALES} (
        id, customer_id, receipt_number, subtotal, discount, total,
        amount_paid, change, credit_amount, notes, created_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.customerId || null,
        data.receiptNumber,
        data.subtotal,
        data.discount,
        data.total,
        data.amountPaid,
        data.change,
        data.creditAmount,
        data.notes || null,
        now,
        'PENDING',
      ]
    );

    return {
      id,
      customerId: data.customerId,
      receiptNumber: data.receiptNumber,
      subtotal: data.subtotal,
      discount: data.discount,
      total: data.total,
      amountPaid: data.amountPaid,
      change: data.change,
      creditAmount: data.creditAmount,
      notes: data.notes,
      createdAt: now,
      syncStatus: SyncStatus.PENDING,
    };
  }

  /**
   * Get today's sales count for receipt number generation
   */
  async getTodayCount(): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const result = await executeQuerySingle<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${TABLES.SALES} 
       WHERE created_at >= ? AND created_at <= ?`,
      [startOfDay.toISOString(), endOfDay.toISOString()]
    );

    return result?.count ?? 0;
  }

  /**
   * Map database row to Sale object
   */
  private mapRowToSale(row: any): Sale {
    return {
      id: row.id,
      customerId: row.customer_id,
      receiptNumber: row.receipt_number,
      subtotal: row.subtotal,
      discount: row.discount,
      total: row.total,
      amountPaid: row.amount_paid,
      change: row.change,
      creditAmount: row.credit_amount,
      notes: row.notes,
      createdAt: row.created_at,
      syncStatus: row.sync_status,
    };
  }

  /**
   * Map database row to SaleItem object
   */
  private mapRowToSaleItem(row: any): SaleItem {
    return {
      id: row.id,
      saleId: row.sale_id,
      productId: row.product_id,
      batchId: row.batch_id,
      productName: row.product_name,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      discount: row.discount,
      total: row.total,
      costOfGoodsSold: row.cost_of_goods_sold,
    };
  }

  /**
   * Map database row to Payment object
   */
  private mapRowToPayment(row: any): Payment {
    return {
      id: row.id,
      saleId: row.sale_id,
      customerId: row.customer_id,
      method: row.method,
      amount: row.amount,
      reference: row.reference,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }
}

export default new SaleRepository();
