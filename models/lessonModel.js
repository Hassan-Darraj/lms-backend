import { query } from "../config/db.js";

const LessonModel = {
  async create(data) {
    const { module_id, title, content_type, content_url = '', duration = 0, order, is_free = false } = data;
    const { rows } = await query(
      `INSERT INTO lessons (module_id, title, content_type, content_url, duration, "order", is_free)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [module_id, title, content_type, content_url, duration, order, is_free]
    );
    return rows[0];
  },

  async findAllByModule(module_id) {
    const { rows } = await query(
      `SELECT * FROM lessons WHERE module_id = $1 ORDER BY "order" ASC`,
      [module_id]
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM lessons WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async update(id, data) {
    const { title, content_type, content_url = '', duration = 0, order, is_free = false } = data;
    const { rows } = await query(
      `UPDATE lessons
       SET title = $1, content_type = $2, content_url = $3, duration = $4, "order" = $5, is_free = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [title, content_type, content_url, duration, order, is_free, id]
    );
    return rows[0];
  },

  async delete(id) {
    const { rows } = await query(`DELETE FROM lessons WHERE id = $1 RETURNING *`, [id]);
    return rows[0];
  },
};

export default LessonModel;
