import { executeQuery, executeQuerySingle, executeWrite } from '../../database';
import { TABLES } from '../../database/schema';
import { StockMovement, StockMovementType } from '../../types';
import { generateUUID } from '../../utils/uuid';
import { getCurrentDateTime } from '../../utils/datetime';

interface StockMovementFilters {
  productId?: string;
  type?: StockMovementType;
  startDate?: string;
  endDate?: string;
}

export class StockMovementRepository {
  /**
   * Get all stock movements with optional filters
   */
  async getAll(filters?: StockMovementFilters): Promise<StockMovement[]> {
    let query = `SELECT * FROM ${TABLES.STOCK_MOVEMENTS} WHERE 1=1`;
    const params: any[] = [];

    if (filters?.productId) {
      query += ' AND product_id = ?';
      params.push(filters.productId);
    }

    if (filters?.type) {
      query += ' AND type = ?';
      params.push(filters.type);
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
    return results.map(this.mapRowToStockMovement);
  }

  /**
   * Get stock movement by ID
   */
  async getById(id: string): Promise<StockMovement | null> {
    const row = await executeQuerySingle<any>(
      `SELECT * FROM ${TABLES.STOCK_MOVEMENTS} WHERE id = ?`,
      [id]
    );

    if (!row) return null;
    return this.mapRowToStockMovement(row);
  }

  /**
   * Create a new stock movement record
   */
  async create(data: {
    productId: string;
    batchId?: string;
    type: StockMovementType;
    quantity: number;
    referenceId?: string;
    referenceType?: string;
    notes?: string;
  }): Promise<StockMovement> {
    const id = generateUUID();
    const now = getCurrentDateTime();

    await executeWrite(
      `INSERT INTO ${TABLES.STOCK_MOVEMENTS} (
        id, product_id, batch_id, type, quantity, reference_id,
        reference_type, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.productId,
        data.batchId || null,
        data.type,
        data.quantity,
        data.referenceId || null,
        data.referenceType || null,
        data.notes || null,
        now,
      ]
    );

    return {
      id,
      productId: data.productId,
      batchId: data.batchId,
      type: data.type,
      quantity: data.quantity,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
      notes: data.notes,
      createdAt: now,
    };
  }

  /**
   * Map database row to StockMovement object
   */
  private mapRowToStockMovement(row: any): StockMovement {
    return {
      id: row.id,
      productId: row.product_id,
      batchId: row.batch_id,
      type: row.type as StockMovementType,
      quantity: row.quantity,
      referenceId: row.reference_id,
      referenceType: row.reference_type,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }
}

export default new StockMovementRepository();
