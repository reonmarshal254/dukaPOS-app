import { executeQuery, executeQuerySingle, executeWrite } from '../../database';
import { TABLES } from '../../database/schema';
import { SavedReceipt, ReceiptData } from '../../types';
import { generateUUID } from '../../utils/uuid';
import { getCurrentDateTime } from '../../utils/datetime';

class ReceiptRepository {
  /**
   * Save a receipt to the database
   */
  async saveReceipt(
    saleId: string,
    receiptNumber: string,
    receiptData: ReceiptData,
    imagePath?: string
  ): Promise<void> {
    const id = generateUUID();
    const now = getCurrentDateTime();
    const receiptDataString = JSON.stringify(receiptData);

    await executeWrite(
      `INSERT INTO ${TABLES.RECEIPTS} (
        id, sale_id, receipt_number, receipt_data, image_path, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, saleId, receiptNumber, receiptDataString, imagePath || null, now]
    );
  }

  /**
   * Get receipt by sale ID
   */
  async getReceiptBySaleId(saleId: string): Promise<SavedReceipt | null> {
    const result = await executeQuerySingle<any>(
      `SELECT * FROM ${TABLES.RECEIPTS} WHERE sale_id = ?`,
      [saleId]
    );

    if (!result) return null;

    return {
      id: result.id,
      saleId: result.sale_id,
      receiptNumber: result.receipt_number,
      receiptData: result.receipt_data,
      imagePath: result.image_path || undefined,
      createdAt: result.created_at,
    };
  }

  /**
   * Get receipt by receipt number
   */
  async getReceiptByNumber(receiptNumber: string): Promise<SavedReceipt | null> {
    const result = await executeQuerySingle<any>(
      `SELECT * FROM ${TABLES.RECEIPTS} WHERE receipt_number = ?`,
      [receiptNumber]
    );

    if (!result) return null;

    return {
      id: result.id,
      saleId: result.sale_id,
      receiptNumber: result.receipt_number,
      receiptData: result.receipt_data,
      imagePath: result.image_path || undefined,
      createdAt: result.created_at,
    };
  }

  /**
   * Get all receipts (most recent first)
   */
  async getAllReceipts(limit: number = 50): Promise<SavedReceipt[]> {
    const results = await executeQuery<any>(
      `SELECT * FROM ${TABLES.RECEIPTS} 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [limit]
    );

    return results.map((result) => ({
      id: result.id,
      saleId: result.sale_id,
      receiptNumber: result.receipt_number,
      receiptData: result.receipt_data,
      imagePath: result.image_path || undefined,
      createdAt: result.created_at,
    }));
  }

  /**
   * Update receipt image path
   */
  async updateReceiptImage(saleId: string, imagePath: string): Promise<void> {
    await executeWrite(
      `UPDATE ${TABLES.RECEIPTS} SET image_path = ? WHERE sale_id = ?`,
      [imagePath, saleId]
    );
  }

  /**
   * Delete receipt by sale ID
   */
  async deleteReceipt(saleId: string): Promise<void> {
    await executeWrite(
      `DELETE FROM ${TABLES.RECEIPTS} WHERE sale_id = ?`,
      [saleId]
    );
  }

  /**
   * Parse receipt data from JSON string
   */
  parseReceiptData(receiptDataString: string): ReceiptData {
    return JSON.parse(receiptDataString) as ReceiptData;
  }
}

export default new ReceiptRepository();
