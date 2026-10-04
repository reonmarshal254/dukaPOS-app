import { executeQuery, executeQuerySingle, executeWrite, executeTransaction } from '../../database';
import { TABLES } from '../../database/schema';
import { Product, ProductWithInventory } from '../../types';
import { generateUUID } from '../../utils/uuid';
import { getCurrentDateTime } from '../../utils/datetime';

export class ProductRepository {
  /**
   * Get all products
   */
  async getAll(options?: {
    categoryId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<Product[]> {
    let query = `SELECT * FROM ${TABLES.PRODUCTS} WHERE 1=1`;
    const params: any[] = [];

    if (options?.categoryId) {
      query += ' AND category_id = ?';
      params.push(options.categoryId);
    }

    if (options?.isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(options.isActive ? 1 : 0);
    }

    if (options?.search) {
      query += ' AND (name LIKE ? OR barcode LIKE ?)';
      const searchTerm = `%${options.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY name ASC';

    const results = await executeQuery<any>(query, params);
    return results.map(this.mapRowToProduct);
  }

  /**
   * Get product by ID
   */
  async getById(id: string): Promise<Product | null> {
    const row = await executeQuerySingle<any>(
      `SELECT * FROM ${TABLES.PRODUCTS} WHERE id = ?`,
      [id]
    );

    if (!row) return null;
    return this.mapRowToProduct(row);
  }

  /**
   * Get product by barcode
   */
  async getByBarcode(barcode: string): Promise<Product | null> {
    const row = await executeQuerySingle<any>(
      `SELECT * FROM ${TABLES.PRODUCTS} WHERE barcode = ?`,
      [barcode]
    );

    if (!row) return null;
    return this.mapRowToProduct(row);
  }

  /**
   * Create a new product
   */
  async create(data: {
    name: string;
    description?: string;
    categoryId?: string;
    barcode?: string;
    imageUrl?: string;
    localImagePath?: string;
    purchasePrice: number;
    sellingPrice: number;
    minStockThreshold?: number;
    unit?: string;
    initialQuantity?: number;
  }): Promise<Product> {
    const id = generateUUID();
    const now = getCurrentDateTime();

    await executeWrite(
      `INSERT INTO ${TABLES.PRODUCTS} (
        id, name, description, category_id, barcode, image_url, local_image_path,
        purchase_price, selling_price, current_quantity, min_stock_threshold,
        unit, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.description || null,
        data.categoryId || null,
        data.barcode || null,
        data.imageUrl || null,
        data.localImagePath || null,
        data.purchasePrice,
        data.sellingPrice,
        data.initialQuantity ?? 0,
        data.minStockThreshold || 10,
        data.unit || 'pcs',
        1, // is_active
        now,
        now,
      ]
    );

    return {
      id,
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      barcode: data.barcode,
      imageUrl: data.imageUrl,
      localImagePath: data.localImagePath,
      purchasePrice: data.purchasePrice,
      sellingPrice: data.sellingPrice,
      currentQuantity: data.initialQuantity ?? 0,
      minStockThreshold: data.minStockThreshold || 10,
      unit: data.unit || 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Update a product
   */
  async update(id: string, data: Partial<Product>): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }

    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }

    if (data.categoryId !== undefined) {
      updates.push('category_id = ?');
      values.push(data.categoryId);
    }

    if (data.barcode !== undefined) {
      updates.push('barcode = ?');
      values.push(data.barcode);
    }

    if (data.imageUrl !== undefined) {
      updates.push('image_url = ?');
      values.push(data.imageUrl);
    }

    if (data.localImagePath !== undefined) {
      updates.push('local_image_path = ?');
      values.push(data.localImagePath);
    }

    if (data.purchasePrice !== undefined) {
      updates.push('purchase_price = ?');
      values.push(data.purchasePrice);
    }

    if (data.sellingPrice !== undefined) {
      updates.push('selling_price = ?');
      values.push(data.sellingPrice);
    }

    if (data.minStockThreshold !== undefined) {
      updates.push('min_stock_threshold = ?');
      values.push(data.minStockThreshold);
    }

    if (data.unit !== undefined) {
      updates.push('unit = ?');
      values.push(data.unit);
    }

    if (data.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(data.isActive ? 1 : 0);
    }

    if (updates.length === 0) return;

    updates.push('updated_at = ?');
    values.push(getCurrentDateTime());

    values.push(id);

    await executeWrite(
      `UPDATE ${TABLES.PRODUCTS} SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  /**
   * Update product quantity
   */
  async updateQuantity(id: string, quantity: number): Promise<void> {
    await executeWrite(
      `UPDATE ${TABLES.PRODUCTS} SET current_quantity = ?, updated_at = ? WHERE id = ?`,
      [quantity, getCurrentDateTime(), id]
    );
  }

  /**
   * Delete a product
   */
  async delete(id: string): Promise<void> {
    await executeWrite(
      `UPDATE ${TABLES.PRODUCTS} SET is_active = 0, updated_at = ? WHERE id = ?`,
      [getCurrentDateTime(), id]
    );
  }

  /**
   * Get low stock products
   */
  async getLowStock(): Promise<Product[]> {
    const results = await executeQuery<any>(
      `SELECT * FROM ${TABLES.PRODUCTS} 
       WHERE is_active = 1 
       AND current_quantity <= min_stock_threshold
       ORDER BY current_quantity ASC`
    );

    return results.map(this.mapRowToProduct);
  }

  /**
   * Get out of stock products
   */
  async getOutOfStock(): Promise<Product[]> {
    const results = await executeQuery<any>(
      `SELECT * FROM ${TABLES.PRODUCTS} 
       WHERE is_active = 1 
       AND current_quantity = 0
       ORDER BY name ASC`
    );

    return results.map(this.mapRowToProduct);
  }

  /**
   * Check if barcode exists
   */
  async existsByBarcode(barcode: string, excludeId?: string): Promise<boolean> {
    let query = `SELECT COUNT(*) as count FROM ${TABLES.PRODUCTS} WHERE barcode = ?`;
    const params: any[] = [barcode];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const result = await executeQuerySingle<{ count: number }>(query, params);
    return (result?.count ?? 0) > 0;
  }

  /**
   * Map database row to Product object
   */
  private mapRowToProduct(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      categoryId: row.category_id,
      barcode: row.barcode,
      imageUrl: row.image_url,
      localImagePath: row.local_image_path,
      purchasePrice: row.purchase_price,
      sellingPrice: row.selling_price,
      currentQuantity: row.current_quantity,
      minStockThreshold: row.min_stock_threshold,
      unit: row.unit,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default new ProductRepository();
