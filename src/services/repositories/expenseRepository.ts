import { executeQuery, executeQuerySingle, executeWrite } from '../../database';
import { TABLES } from '../../database/schema';
import { Expense, PaymentMethod } from '../../types';
import { generateUUID } from '../../utils/uuid';
import { getCurrentDateTime } from '../../utils/datetime';

interface CreateExpenseData {
  category: string;
  description: string;
  amount: number;         // minor units
  paymentMethod: PaymentMethod;
  notes?: string;
}

interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
}

export class ExpenseRepository {
  async getAll(filters?: ExpenseFilters): Promise<Expense[]> {
    let query = `SELECT * FROM ${TABLES.EXPENSES} WHERE 1=1`;
    const params: any[] = [];

    if (filters?.category) {
      query += ' AND category = ?';
      params.push(filters.category);
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
    const rows = await executeQuery<any>(query, params);
    return rows.map(this.mapRow);
  }

  async getById(id: string): Promise<Expense | null> {
    const row = await executeQuerySingle<any>(
      `SELECT * FROM ${TABLES.EXPENSES} WHERE id = ?`, [id]
    );
    return row ? this.mapRow(row) : null;
  }

  async create(data: CreateExpenseData): Promise<Expense> {
    const id  = generateUUID();
    const now = getCurrentDateTime();

    await executeWrite(
      `INSERT INTO ${TABLES.EXPENSES}
        (id, category, description, amount, payment_method, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.category, data.description, data.amount,
       data.paymentMethod, data.notes ?? null, now]
    );

    return {
      id,
      category:      data.category,
      description:   data.description,
      amount:        data.amount,
      paymentMethod: data.paymentMethod,
      notes:         data.notes,
      createdAt:     now,
    };
  }

  async delete(id: string): Promise<void> {
    await executeWrite(`DELETE FROM ${TABLES.EXPENSES} WHERE id = ?`, [id]);
  }

  async getTotalByPeriod(startDate: string, endDate: string): Promise<number> {
    const row = await executeQuerySingle<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM ${TABLES.EXPENSES}
       WHERE created_at >= ? AND created_at <= ?`,
      [startDate, endDate]
    );
    return row?.total ?? 0;
  }

  async getCategoryTotals(startDate: string, endDate: string): Promise<Array<{ category: string; total: number }>> {
    const rows = await executeQuery<{ category: string; total: number }>(
      `SELECT category, COALESCE(SUM(amount), 0) AS total
       FROM ${TABLES.EXPENSES}
       WHERE created_at >= ? AND created_at <= ?
       GROUP BY category
       ORDER BY total DESC`,
      [startDate, endDate]
    );
    return rows;
  }

  private mapRow(row: any): Expense {
    return {
      id:            row.id,
      category:      row.category,
      description:   row.description,
      amount:        row.amount,
      paymentMethod: row.payment_method as PaymentMethod,
      notes:         row.notes ?? undefined,
      createdAt:     row.created_at,
    };
  }
}

export default new ExpenseRepository();
