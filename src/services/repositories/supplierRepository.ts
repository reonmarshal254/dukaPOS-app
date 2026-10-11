import { executeQuery, executeQuerySingle, executeWrite } from '../../database';
import { Supplier, SupplierSupply, SupplierWithSupplies } from '../../types';
import { generateUUID } from '../../utils/uuid';

interface CreateSupplierParams {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  rating?: number;
  notes?: string;
}

interface UpdateSupplierParams {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  rating?: number;
  notes?: string;
}

interface CreateSupplyParams {
  supplierId: string;
  productName: string;
  quantity: number;
  unit: string;
  amount: number;
  supplyDate: string;
  notes?: string;
}

/**
 * Map database row to Supplier object
 */
function mapRowToSupplier(row: any): Supplier {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || undefined,
    email: row.email || undefined,
    address: row.address || undefined,
    rating: row.rating || 0,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to SupplierSupply object
 */
function mapRowToSupply(row: any): SupplierSupply {
  return {
    id: row.id,
    supplierId: row.supplierId,
    productName: row.productName,
    quantity: row.quantity,
    unit: row.unit,
    amount: row.amount,
    supplyDate: row.supplyDate,
    notes: row.notes || undefined,
    createdAt: row.createdAt,
  };
}

/**
 * Create a new supplier
 */
export async function create(params: CreateSupplierParams): Promise<Supplier> {
  const id = generateUUID();
  const now = new Date().toISOString();

  // Validate rating
  if (params.rating !== undefined && (params.rating < 0 || params.rating > 5)) {
    throw new Error('Rating must be between 0 and 5');
  }

  // Validate phone format (basic)
  if (params.phone && params.phone.trim().length < 10) {
    throw new Error('Phone number must be at least 10 digits');
  }

  // Validate email format (basic)
  if (params.email && !params.email.includes('@')) {
    throw new Error('Invalid email format');
  }

  await executeWrite(
    `INSERT INTO suppliers 
     (id, name, phone, email, address, rating, notes, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      params.name,
      params.phone || null,
      params.email || null,
      params.address || null,
      params.rating || 0,
      params.notes || null,
      now,
      now,
    ]
  );

  const supplier = await executeQuerySingle<any>(
    'SELECT * FROM suppliers WHERE id = ?',
    [id]
  );

  if (!supplier) {
    throw new Error('Failed to retrieve created supplier');
  }

  return mapRowToSupplier(supplier);
}

/**
 * Get supplier by ID
 */
export async function getById(id: string): Promise<Supplier | null> {
  const row = await executeQuerySingle<any>(
    'SELECT * FROM suppliers WHERE id = ?',
    [id]
  );

  return row ? mapRowToSupplier(row) : null;
}

/**
 * Get supplier with supply history
 */
export async function getByIdWithSupplies(
  id: string
): Promise<SupplierWithSupplies | null> {
  const supplier = await getById(id);
  if (!supplier) {
    return null;
  }

  const supplies = await getSuppliesBySupplierId(id);
  const totalSupplied = supplies.reduce((sum, supply) => sum + supply.amount, 0);

  return {
    ...supplier,
    supplies,
    totalSupplied,
  };
}

/**
 * Get all suppliers
 */
export async function getAll(): Promise<Supplier[]> {
  const rows = await executeQuery<any>(
    'SELECT * FROM suppliers ORDER BY name ASC'
  );

  return rows.map(mapRowToSupplier);
}

/**
 * Update a supplier
 */
export async function update(
  id: string,
  params: UpdateSupplierParams
): Promise<Supplier> {
  const updates: string[] = ['updated_at = ?'];
  const values: any[] = [new Date().toISOString()];

  if (params.name !== undefined) {
    updates.push('name = ?');
    values.push(params.name);
  }

  if (params.phone !== undefined) {
    if (params.phone && params.phone.trim().length < 10) {
      throw new Error('Phone number must be at least 10 digits');
    }
    updates.push('phone = ?');
    values.push(params.phone || null);
  }

  if (params.email !== undefined) {
    if (params.email && !params.email.includes('@')) {
      throw new Error('Invalid email format');
    }
    updates.push('email = ?');
    values.push(params.email || null);
  }

  if (params.address !== undefined) {
    updates.push('address = ?');
    values.push(params.address || null);
  }

  if (params.rating !== undefined) {
    if (params.rating < 0 || params.rating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }
    updates.push('rating = ?');
    values.push(params.rating);
  }

  if (params.notes !== undefined) {
    updates.push('notes = ?');
    values.push(params.notes || null);
  }

  values.push(id);

  await executeWrite(
    `UPDATE suppliers SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const supplier = await getById(id);
  if (!supplier) {
    throw new Error('Failed to retrieve updated supplier');
  }

  return supplier;
}

/**
 * Delete a supplier
 */
export async function deleteById(id: string): Promise<void> {
  await executeWrite('DELETE FROM suppliers WHERE id = ?', [id]);
}

/**
 * Search suppliers by name, phone, or email
 */
export async function search(searchTerm: string): Promise<Supplier[]> {
  const rows = await executeQuery<any>(
    `SELECT * FROM suppliers 
     WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
     ORDER BY name ASC`,
    [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
  );

  return rows.map(mapRowToSupplier);
}

/**
 * Get suppliers by rating
 */
export async function getByRating(minRating: number): Promise<Supplier[]> {
  const rows = await executeQuery<any>(
    'SELECT * FROM suppliers WHERE rating >= ? ORDER BY rating DESC, name ASC',
    [minRating]
  );

  return rows.map(mapRowToSupplier);
}

// ============ Supply Management ============

/**
 * Create a new supply record
 */
export async function createSupply(params: CreateSupplyParams): Promise<SupplierSupply> {
  const id = generateUUID();
  const now = new Date().toISOString();

  // Verify supplier exists
  const supplier = await getById(params.supplierId);
  if (!supplier) {
    throw new Error('Supplier not found');
  }

  if (params.quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  if (params.amount < 0) {
    throw new Error('Amount cannot be negative');
  }

  await executeWrite(
    `INSERT INTO supplier_supplies 
     (id, supplierId, productName, quantity, unit, amount, supplyDate, notes, createdAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      params.supplierId,
      params.productName,
      params.quantity,
      params.unit,
      params.amount,
      params.supplyDate,
      params.notes || null,
      now,
    ]
  );

  const supply = await executeQuerySingle<any>(
    'SELECT * FROM supplier_supplies WHERE id = ?',
    [id]
  );

  if (!supply) {
    throw new Error('Failed to retrieve created supply');
  }

  return mapRowToSupply(supply);
}

/**
 * Get all supplies for a supplier
 */
export async function getSuppliesBySupplierId(
  supplierId: string
): Promise<SupplierSupply[]> {
  const rows = await executeQuery<any>(
    'SELECT * FROM supplier_supplies WHERE supplierId = ? ORDER BY supplyDate DESC',
    [supplierId]
  );

  return rows.map(mapRowToSupply);
}

/**
 * Get supply by ID
 */
export async function getSupplyById(id: string): Promise<SupplierSupply | null> {
  const row = await executeQuerySingle<any>(
    'SELECT * FROM supplier_supplies WHERE id = ?',
    [id]
  );

  return row ? mapRowToSupply(row) : null;
}

/**
 * Delete a supply record
 */
export async function deleteSupplyById(id: string): Promise<void> {
  await executeWrite('DELETE FROM supplier_supplies WHERE id = ?', [id]);
}

/**
 * Get total amount supplied by a supplier
 */
export async function getTotalSupplied(supplierId: string): Promise<number> {
  const result = await executeQuerySingle<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM supplier_supplies WHERE supplierId = ?',
    [supplierId]
  );

  return result?.total || 0;
}

/**
 * Get recent supplies (last N days)
 */
export async function getRecentSupplies(days: number = 30): Promise<SupplierSupply[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const rows = await executeQuery<any>(
    'SELECT * FROM supplier_supplies WHERE supplyDate >= ? ORDER BY supplyDate DESC',
    [startDate.toISOString()]
  );

  return rows.map(mapRowToSupply);
}

export default {
  create,
  getById,
  getByIdWithSupplies,
  getAll,
  update,
  deleteById,
  search,
  getByRating,
  createSupply,
  getSuppliesBySupplierId,
  getSupplyById,
  deleteSupplyById,
  getTotalSupplied,
  getRecentSupplies,
};
