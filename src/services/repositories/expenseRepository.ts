import { executeQuery, executeQuerySingle, executeWrite } from '../../database';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import { generateUUID } from '../../utils/uuid';

interface CreateExpenseParams {
  category: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  notes?: string;
}

interface UpdateExpenseParams {
  category?: string;
  description?: string;
  amount?: number;
  paymentMethod?: PaymentMethod;
  date?: string;
  notes?: string;
}

interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Map database row to Expense object
 */
function mapRowToExpense(row: any): Expense {
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    amount: row.amount,
    paymentMethod: row.payment_method as PaymentMethod,
    date: row.date,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

/**
 * Create a new expense
 */
export async function create(params: CreateExpenseParams): Promise<Expense> {
  const id = generateUUID();
  const now = new Date().toISOString();

  await executeWrite(
    `INSERT INTO expenses 
     (id, category, description, amount, payment_method, date, notes, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      params.category,
      params.description,
      params.amount,
      params.paymentMethod,
      params.date,
      params.notes || null,
      now,
    ]
  );

  const expense = await executeQuerySingle<any>(
    'SELECT * FROM expenses WHERE id = ?',
    [id]
  );

  if (!expense) {
    throw new Error('Failed to retrieve created expense');
  }

  return mapRowToExpense(expense);
}

/**
 * Get expense by ID
 */
export async function getById(id: string): Promise<Expense | null> {
  const row = await executeQuerySingle<any>(
    'SELECT * FROM expenses WHERE id = ?',
    [id]
  );

  return row ? mapRowToExpense(row) : null;
}

/**
 * Get all expenses with optional filters
 */
export async function getAll(filters?: ExpenseFilters): Promise<Expense[]> {
  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params: any[] = [];

  if (filters?.category) {
    query += ' AND category = ?';
    params.push(filters.category);
  }

  if (filters?.startDate) {
    query += ' AND date >= ?';
    params.push(filters.startDate);
  }

  if (filters?.endDate) {
    query += ' AND date <= ?';
    params.push(filters.endDate);
  }

  if (filters?.minAmount !== undefined) {
    query += ' AND amount >= ?';
    params.push(filters.minAmount);
  }

  if (filters?.maxAmount !== undefined) {
    query += ' AND amount <= ?';
    params.push(filters.maxAmount);
  }

  query += ' ORDER BY date DESC, created_at DESC';

  const rows = await executeQuery<any>(query, params);
  return rows.map(mapRowToExpense);
}

/**
 * Update an expense
 */
export async function update(
  id: string,
  params: UpdateExpenseParams
): Promise<Expense> {
  const updates: string[] = [];
  const values: any[] = [];

  if (params.category !== undefined) {
    updates.push('category = ?');
    values.push(params.category);
  }

  if (params.description !== undefined) {
    updates.push('description = ?');
    values.push(params.description);
  }

  if (params.amount !== undefined) {
    updates.push('amount = ?');
    values.push(params.amount);
  }

  if (params.paymentMethod !== undefined) {
    updates.push('payment_method = ?');
    values.push(params.paymentMethod);
  }

  if (params.date !== undefined) {
    updates.push('date = ?');
    values.push(params.date);
  }

  if (params.notes !== undefined) {
    updates.push('notes = ?');
    values.push(params.notes || null);
  }

  if (updates.length === 0) {
    const expense = await getById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }
    return expense;
  }

  values.push(id);

  await executeWrite(
    `UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const expense = await getById(id);
  if (!expense) {
    throw new Error('Failed to retrieve updated expense');
  }

  return expense;
}

/**
 * Delete an expense
 */
export async function deleteById(id: string): Promise<void> {
  await executeWrite('DELETE FROM expenses WHERE id = ?', [id]);
}

/**
 * Get expense summary by category
 */
export async function getSummaryByCategory(
  startDate?: string,
  endDate?: string
): Promise<{ category: string; total: number; count: number }[]> {
  let query = `
    SELECT 
      category,
      SUM(amount) as total,
      COUNT(*) as count
    FROM expenses
    WHERE 1=1
  `;
  const params: any[] = [];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  query += ' GROUP BY category ORDER BY total DESC';

  const rows = await executeQuery<any>(query, params);
  return rows.map((row) => ({
    category: row.category,
    total: row.total,
    count: row.count,
  }));
}

/**
 * Get total expenses for a date range
 */
export async function getTotalForPeriod(
  startDate?: string,
  endDate?: string
): Promise<number> {
  let query = 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE 1=1';
  const params: any[] = [];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  const result = await executeQuerySingle<{ total: number }>(query, params);
  return result?.total || 0;
}

/**
 * Get expenses for a specific month
 */
export async function getByMonth(year: number, month: number): Promise<Expense[]> {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  return getAll({ startDate, endDate });
}

/**
 * Search expenses
 */
export async function search(searchTerm: string): Promise<Expense[]> {
  const rows = await executeQuery<any>(
    `SELECT * FROM expenses 
     WHERE description LIKE ? OR notes LIKE ? OR category LIKE ?
     ORDER BY date DESC, created_at DESC`,
    [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
  );

  return rows.map(mapRowToExpense);
}

export default {
  create,
  getById,
  getAll,
  update,
  deleteById,
  getSummaryByCategory,
  getTotalForPeriod,
  getByMonth,
  search,
};
