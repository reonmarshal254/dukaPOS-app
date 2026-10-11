import { executeQuery, executeQuerySingle, executeWrite } from '../../database';
import { ProductVariant } from '../../types';
import { generateUUID } from '../../utils/uuid';

interface CreateVariantParams {
  productId: string;
  name: string;
  unit: string;
  sellingPrice: number;
  purchasePrice?: number;
  barcode?: string;
  sku?: string;
  isDefault?: boolean;
}

interface UpdateVariantParams {
  name?: string;
  unit?: string;
  sellingPrice?: number;
  purchasePrice?: number;
  barcode?: string;
  sku?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

/**
 * Map database row to ProductVariant object
 */
function mapRowToVariant(row: any): ProductVariant {
  return {
    id: row.id,
    productId: row.productId,
    name: row.name,
    unit: row.unit,
    sellingPrice: row.sellingPrice,
    purchasePrice: row.purchasePrice || undefined,
    barcode: row.barcode || undefined,
    sku: row.sku || undefined,
    isDefault: Boolean(row.isDefault),
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Create a new product variant
 */
export async function create(params: CreateVariantParams): Promise<ProductVariant> {
  const id = generateUUID();
  const now = new Date().toISOString();

  // If this is set as default, unset other defaults for this product
  if (params.isDefault) {
    await executeWrite(
      'UPDATE product_variants SET isDefault = 0 WHERE productId = ?',
      [params.productId]
    );
  }

  await executeWrite(
    `INSERT INTO product_variants 
     (id, productId, name, unit, sellingPrice, purchasePrice, barcode, sku, isDefault, isActive, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      id,
      params.productId,
      params.name,
      params.unit,
      params.sellingPrice,
      params.purchasePrice || null,
      params.barcode || null,
      params.sku || null,
      params.isDefault ? 1 : 0,
      now,
      now,
    ]
  );

  const variant = await executeQuerySingle<any>(
    'SELECT * FROM product_variants WHERE id = ?',
    [id]
  );

  if (!variant) {
    throw new Error('Failed to retrieve created variant');
  }

  return mapRowToVariant(variant);
}

/**
 * Get variant by ID
 */
export async function getById(id: string): Promise<ProductVariant | null> {
  const row = await executeQuerySingle<any>(
    'SELECT * FROM product_variants WHERE id = ?',
    [id]
  );

  return row ? mapRowToVariant(row) : null;
}

/**
 * Get all variants for a product
 */
export async function getByProductId(productId: string): Promise<ProductVariant[]> {
  const rows = await executeQuery<any>(
    `SELECT * FROM product_variants 
     WHERE productId = ? AND isActive = 1 
     ORDER BY isDefault DESC, name ASC`,
    [productId]
  );

  return rows.map(mapRowToVariant);
}

/**
 * Get default variant for a product
 */
export async function getDefaultVariant(productId: string): Promise<ProductVariant | null> {
  const row = await executeQuerySingle<any>(
    `SELECT * FROM product_variants 
     WHERE productId = ? AND isDefault = 1 AND isActive = 1 
     LIMIT 1`,
    [productId]
  );

  return row ? mapRowToVariant(row) : null;
}

/**
 * Update a variant
 */
export async function update(
  id: string,
  params: UpdateVariantParams
): Promise<ProductVariant> {
  const updates: string[] = ['updatedAt = ?'];
  const values: any[] = [new Date().toISOString()];

  if (params.name !== undefined) {
    updates.push('name = ?');
    values.push(params.name);
  }

  if (params.unit !== undefined) {
    updates.push('unit = ?');
    values.push(params.unit);
  }

  if (params.sellingPrice !== undefined) {
    updates.push('sellingPrice = ?');
    values.push(params.sellingPrice);
  }

  if (params.purchasePrice !== undefined) {
    updates.push('purchasePrice = ?');
    values.push(params.purchasePrice || null);
  }

  if (params.barcode !== undefined) {
    updates.push('barcode = ?');
    values.push(params.barcode || null);
  }

  if (params.sku !== undefined) {
    updates.push('sku = ?');
    values.push(params.sku || null);
  }

  if (params.isActive !== undefined) {
    updates.push('isActive = ?');
    values.push(params.isActive ? 1 : 0);
  }

  if (params.isDefault !== undefined) {
    updates.push('isDefault = ?');
    values.push(params.isDefault ? 1 : 0);

    // If setting as default, unset others
    if (params.isDefault) {
      const variant = await getById(id);
      if (variant) {
        await executeWrite(
          'UPDATE product_variants SET isDefault = 0 WHERE productId = ? AND id != ?',
          [variant.productId, id]
        );
      }
    }
  }

  values.push(id);

  await executeWrite(
    `UPDATE product_variants SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const variant = await getById(id);
  if (!variant) {
    throw new Error('Failed to retrieve updated variant');
  }

  return variant;
}

/**
 * Delete a variant (soft delete)
 */
export async function deleteById(id: string): Promise<void> {
  await executeWrite(
    'UPDATE product_variants SET isActive = 0, updatedAt = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
}

/**
 * Hard delete a variant
 */
export async function hardDeleteById(id: string): Promise<void> {
  await executeWrite('DELETE FROM product_variants WHERE id = ?', [id]);
}

/**
 * Get variant by barcode
 */
export async function getByBarcode(barcode: string): Promise<ProductVariant | null> {
  const row = await executeQuerySingle<any>(
    'SELECT * FROM product_variants WHERE barcode = ? AND isActive = 1',
    [barcode]
  );

  return row ? mapRowToVariant(row) : null;
}

/**
 * Get variant by SKU
 */
export async function getBySku(sku: string): Promise<ProductVariant | null> {
  const row = await executeQuerySingle<any>(
    'SELECT * FROM product_variants WHERE sku = ? AND isActive = 1',
    [sku]
  );

  return row ? mapRowToVariant(row) : null;
}

/**
 * Check if product has variants
 */
export async function hasVariants(productId: string): Promise<boolean> {
  const result = await executeQuerySingle<{ count: number }>(
    'SELECT COUNT(*) as count FROM product_variants WHERE productId = ? AND isActive = 1',
    [productId]
  );

  return (result?.count ?? 0) > 0;
}

export default {
  create,
  getById,
  getByProductId,
  getDefaultVariant,
  update,
  deleteById,
  hardDeleteById,
  getByBarcode,
  getBySku,
  hasVariants,
};
