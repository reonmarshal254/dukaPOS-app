import { executeQuery, executeQuerySingle, executeWrite } from '../../database';
import { TABLES } from '../../database/schema';
import { Category } from '../../types';
import { generateUUID } from '../../utils/uuid';
import { getCurrentDateTime } from '../../utils/datetime';

export class CategoryRepository {
  /**
   * Get all categories
   */
  async getAll(): Promise<Category[]> {
    const results = await executeQuery<any>(
      `SELECT * FROM ${TABLES.CATEGORIES} ORDER BY name ASC`
    );

    return results.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
    }));
  }

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<Category | null> {
    const row = await executeQuerySingle<any>(
      `SELECT * FROM ${TABLES.CATEGORIES} WHERE id = ?`,
      [id]
    );

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
    };
  }

  /**
   * Create a new category
   */
  async create(data: { name: string; description?: string }): Promise<Category> {
    const id = generateUUID();
    const now = getCurrentDateTime();

    await executeWrite(
      `INSERT INTO ${TABLES.CATEGORIES} (id, name, description, created_at)
       VALUES (?, ?, ?, ?)`,
      [id, data.name, data.description || null, now]
    );

    return {
      id,
      name: data.name,
      description: data.description,
      createdAt: now,
    };
  }

  /**
   * Update a category
   */
  async update(
    id: string,
    data: { name?: string; description?: string }
  ): Promise<void> {
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

    if (updates.length === 0) return;

    values.push(id);

    await executeWrite(
      `UPDATE ${TABLES.CATEGORIES} SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  /**
   * Delete a category
   */
  async delete(id: string): Promise<void> {
    await executeWrite(
      `DELETE FROM ${TABLES.CATEGORIES} WHERE id = ?`,
      [id]
    );
  }

  /**
   * Check if category name exists
   */
  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    let query = `SELECT COUNT(*) as count FROM ${TABLES.CATEGORIES} WHERE name = ?`;
    const params: any[] = [name];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const result = await executeQuerySingle<{ count: number }>(query, params);
    return (result?.count ?? 0) > 0;
  }
}

export default new CategoryRepository();
