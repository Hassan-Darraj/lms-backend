import { query } from "../config/db.js";

const ModuleModel = {
  async create(data) {
    const { course_id, title, description = '', order } = data;
    const { rows } = await query(
      `INSERT INTO modules (course_id, title, description, "order")
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [course_id, title, description, order]
    );
    return rows[0];
  },

  async findAllByCourse(course_id) {
    const { rows } = await query(
      `SELECT * FROM modules WHERE course_id = $1 ORDER BY "order" ASC`,
      [course_id]
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM modules WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async update(id, data) {
    const { title, description, order } = data;
    const { rows } = await query(
      `UPDATE modules SET title = $1, description = $2, "order" = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`,
      [title, description, order, id]
    );
    return rows[0];
  },

  async delete(id) {
    const { rows } = await query(`DELETE FROM modules WHERE id = $1 RETURNING *`, [id]);
    return rows[0];
  },
};

export default ModuleModel;
