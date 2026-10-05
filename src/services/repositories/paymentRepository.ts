import { executeQuery, executeQuerySingle, executeWrite } from '../../database';
import { TABLES } from '../../database/schema';
import { Payment, PaymentMethod } from '../../types';
import { generateUUID } from '../../utils/uuid';
import { getCurrentDateTime } from '../../utils/datetime';

export class PaymentRepository {
  /**
   * Get all payments with optional filters
   */
  async getAll(filters?: {
    saleId?: string;
    customerId?: string;
    method?: PaymentMethod;
  }): Promise<Payment[]> {
    let query = `SELECT * FROM ${TABLES.PAYMENTS} WHERE 1=1`;
    const params: any[] = [];

    if (filters?.saleId) {
      query += ' AND sale_id = ?';
      params.push(filters.saleId);
    }

    if (filters?.customerId) {
      query += ' AND customer_id = ?';
      params.push(filters.customerId);
    }

    if (filters?.method) {
      query += ' AND method = ?';
      params.push(filters.method);
    }

    query += ' ORDER BY created_at DESC';

    const results = await executeQuery<any>(query, params);
    return results.map(this.mapRowToPayment);
  }

  /**
   * Get payment by ID
   */
  async getById(id: string): Promise<Payment | null> {
    const row = await executeQuerySingle<any>(
      `SELECT * FROM ${TABLES.PAYMENTS} WHERE id = ?`,
      [id]
    );

    if (!row) return null;
    return this.mapRowToPayment(row);
  }

  /**
   * Create a new payment
   */
  async create(data: {
    saleId?: string;
    customerId?: string;
    method: PaymentMethod;
    amount: number;
    reference?: string;
    notes?: string;
  }): Promise<Payment> {
    const id = generateUUID();
    const now = getCurrentDateTime();

    await executeWrite(
      `INSERT INTO ${TABLES.PAYMENTS} (
        id, sale_id, customer_id, method, amount, reference, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.saleId || null,
        data.customerId || null,
        data.method,
        data.amount,
        data.reference || null,
        data.notes || null,
        now,
      ]
    );

    return {
      id,
      saleId: data.saleId,
      customerId: data.customerId,
      method: data.method,
      amount: data.amount,
      reference: data.reference,
      notes: data.notes,
      createdAt: now,
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

export default new PaymentRepository();
