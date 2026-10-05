import { executeQuery, executeQuerySingle, executeWrite } from '../../database';
import { TABLES } from '../../database/schema';
import { StockBatch } from '../../types';
import { generateUUID } from '../../utils/uuid';
import { getCurrentDateTime, daysUntil } from '../../utils/datetime';

export class StockBatchRepository {
  /**
   * Get all stock batches, optionally filtered by product
   */
  async getAll(productId?: string): Promise<StockBatch[]> {
    let query = `SELECT * FROM ${TABLES.STOCK_BATCHES} WHERE 1=1`;
    const params: any[] = [];

    if (productId) {
      query += ' AND product_id = ?';
      params.push(productId);
    }

    query += ' ORDER BY received_at DESC';

    const results = await executeQuery<any>(query, params);
    return results.map(this.mapRowToStockBatch);
  }

  /**
   * Get stock batch by ID
   */
  async getById(id: string): Promise<StockBatch | null> {
    const row = await executeQuerySingle<any>(
      `SELECT * FROM ${TABLES.STOCK_BATCHES} WHERE id = ?`,
      [id]
    );

    if (!row) return null;
    return this.mapRowToStockBatch(row);
  }

  /**
   * Create a new stock batch
   */
  async create(data: {
    productId: string;
    supplierId?: string;
    batchNumber: string;
    receivedQuantity: number;
    purchaseCost: number;
    manufacturingDate?: string;
    expiryDate?: string;
  }): Promise<StockBatch> {
    const id = generateUUID();
    const now = getCurrentDateTime();

    await executeWrite(
      `INSERT INTO ${TABLES.STOCK_BATCHES} (
        id, product_id, supplier_id, batch_number, received_quantity,
        remaining_quantity, purchase_cost, manufacturing_date, expiry_date,
        received_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.productId,
        data.supplierId || null,
        data.batchNumber,
        data.receivedQuantity,
        data.receivedQuantity, // initially remaining = received
        data.purchaseCost,
        data.manufacturingDate || null,
        data.expiryDate || null,
        now,
        now,
      ]
    );

    return {
      id,
      productId: data.productId,
      supplierId: data.supplierId,
      batchNumber: data.batchNumber,
      receivedQuantity: data.receivedQuantity,
      remainingQuantity: data.receivedQuantity,
      purchaseCost: data.purchaseCost,
      manufacturingDate: data.manufacturingDate,
      expiryDate: data.expiryDate,
      receivedAt: now,
      createdAt: now,
    };
  }

  /**
   * Get available batches for a product, sorted by expiry date (FEFO)
   * Batches with earliest expiry dates come first
   * NULL expiry dates come last
   */
  async getAvailableBatches(productId: string): Promise<StockBatch[]> {
    const results = await executeQuery<any>(
      `SELECT * FROM ${TABLES.STOCK_BATCHES} 
       WHERE product_id = ? AND remaining_quantity > 0
       ORDER BY 
         CASE WHEN expiry_date IS NULL THEN 1 ELSE 0 END,
         expiry_date ASC`,
      [productId]
    );

    return results.map(this.mapRowToStockBatch);
  }

  /**
   * Get batches expiring within specified days
   */
  async getExpiringBatches(daysUntilExpiry: number = 30): Promise<StockBatch[]> {
    const now = getCurrentDateTime();
    const results = await executeQuery<any>(
      `SELECT * FROM ${TABLES.STOCK_BATCHES} 
       WHERE expiry_date IS NOT NULL 
       AND remaining_quantity > 0
       ORDER BY expiry_date ASC`
    );

    const batches = results.map(this.mapRowToStockBatch);
    
    // Filter batches that expire within the specified days
    return batches.filter(batch => {
      if (!batch.expiryDate) return false;
      const days = daysUntil(batch.expiryDate);
      return days >= 0 && days <= daysUntilExpiry;
    });
  }

  /**
   * Get expired batches
   */
  async getExpiredBatches(): Promise<StockBatch[]> {
    const now = getCurrentDateTime();
    const results = await executeQuery<any>(
      `SELECT * FROM ${TABLES.STOCK_BATCHES} 
       WHERE expiry_date IS NOT NULL 
       AND expiry_date < ?
       AND remaining_quantity > 0
       ORDER BY expiry_date ASC`,
      [now]
    );

    return results.map(this.mapRowToStockBatch);
  }

  /**
   * Allocate stock using FEFO (First Expiry First Out) logic.
   * Returns array of allocations with batch ID, quantity, and cost.
   *
   * If a product has current_quantity > 0 but no batch rows (e.g. legacy data
   * whose initial batch INSERT failed), a synthetic batch is created on the fly
   * so the sale can proceed without data loss.
   */
  async allocateStock(
    productId: string,
    quantityNeeded: number
  ): Promise<Array<{ batchId: string; quantity: number; cost: number }>> {
    let availableBatches = await this.getAvailableBatches(productId);

    // ── Self-healing: product has stock but no batches ──────────────────────
    // This can happen when the initial batch INSERT failed on older data.
    // Reconstruct a batch from the product record so the sale can complete.
    if (availableBatches.length === 0) {
      const productRow = await executeQuerySingle<{
        current_quantity: number;
        purchase_price: number;
      }>(
        `SELECT current_quantity, purchase_price FROM products WHERE id = ?`,
        [productId]
      );

      if (productRow && productRow.current_quantity >= quantityNeeded) {
        // Create a recovery batch
        const recoveryBatch = await this.create({
          productId,
          batchNumber: `RECOVERY-${Date.now()}`,
          receivedQuantity: productRow.current_quantity,
          purchaseCost: productRow.purchase_price ?? 0,
        });
        availableBatches = [recoveryBatch];
      }
    }
    // ───────────────────────────────────────────────────────────────────────

    const allocations: Array<{ batchId: string; quantity: number; cost: number }> = [];
    let remainingQuantity = quantityNeeded;

    for (const batch of availableBatches) {
      if (remainingQuantity <= 0) break;

      const quantityFromBatch = Math.min(batch.remainingQuantity, remainingQuantity);
      
      allocations.push({
        batchId: batch.id,
        quantity: quantityFromBatch,
        cost: batch.purchaseCost * quantityFromBatch,
      });

      remainingQuantity -= quantityFromBatch;
    }

    if (remainingQuantity > 0) {
      throw new Error(`Insufficient stock: need ${quantityNeeded}, available ${quantityNeeded - remainingQuantity}`);
    }

    return allocations;
  }

  /**
   * Update remaining quantity of a batch
   */
  async updateRemainingQuantity(id: string, quantity: number): Promise<void> {
    await executeWrite(
      `UPDATE ${TABLES.STOCK_BATCHES} SET remaining_quantity = ? WHERE id = ?`,
      [quantity, id]
    );
  }

  /**
   * Map database row to StockBatch object
   */
  private mapRowToStockBatch(row: any): StockBatch {
    return {
      id: row.id,
      productId: row.product_id,
      supplierId: row.supplier_id,
      batchNumber: row.batch_number,
      receivedQuantity: row.received_quantity,
      remainingQuantity: row.remaining_quantity,
      purchaseCost: row.purchase_cost,
      manufacturingDate: row.manufacturing_date,
      expiryDate: row.expiry_date,
      receivedAt: row.received_at,
      createdAt: row.created_at,
    };
  }
}

export default new StockBatchRepository();
