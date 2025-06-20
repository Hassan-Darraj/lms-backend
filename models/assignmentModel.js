import { query } from "../config/db.js";

const AssignmentModel = {
  async create(data) {
    const { lesson_id, title, description, deadline, max_score = 100 } = data;
    const { rows } = await query(
      `INSERT INTO assignments (lesson_id, title, description, deadline, max_score)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [lesson_id, title, description, deadline, max_score]
    );
    return rows[0];
  },

  async findAllByLesson(lesson_id) {
    const { rows } = await query(
      `SELECT * FROM assignments WHERE lesson_id = $1 ORDER BY created_at ASC`,
      [lesson_id]
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM assignments WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async update(id, data) {
    const { title, description, deadline, max_score = 100 } = data;
    const { rows } = await query(
      `UPDATE assignments
       SET title = $1, description = $2, deadline = $3, max_score = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [title, description, deadline, max_score, id]
    );
    return rows[0];
  },

  async delete(id) {
    const { rows } = await query(`DELETE FROM assignments WHERE id = $1 RETURNING *`, [id]);
    return rows[0];
  },
};

export default AssignmentModel;
