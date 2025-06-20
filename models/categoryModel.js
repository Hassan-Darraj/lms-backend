import { query } from "../config/db.js";

const CategoryModel = {
  async create(name) {
    const { rows } = await query(
      `INSERT INTO categories (name) VALUES ($1) RETURNING *`,
      [name]
    );
    return rows[0];
  },

  async findAll() {
    const { rows } = await query(
      `SELECT id, name, created_at FROM categories ORDER BY created_at DESC`
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT id, name, created_at FROM categories WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async update(id, name) {
    const { rows } = await query(
      `UPDATE categories SET name = $1 WHERE id = $2 RETURNING *`,
      [name, id]
    );
    return rows[0];
  },

  async hasCourses(id) {
    const { rows } = await query(
      `SELECT 1 FROM courses WHERE category_id = $1 LIMIT 1`,
      [id]
    );
    return rows.length > 0;
  },

  async delete(id) {
    // First check if category has any courses
    const hasCourses = await this.hasCourses(id);
    if (hasCourses) {
      const error = new Error('Cannot delete category with associated courses');
      error.code = '23503'; // Foreign key violation code
      throw error;
    }

    const { rows } = await query(
      `DELETE FROM categories WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows[0];
  },
};

export default CategoryModel;
