import { query } from "../config/db.js";

const SubmissionModel = {
  async create(data) {
    const { assignment_id, user_id, submission_url, grade = null } = data;
    const { rows } = await query(
      `INSERT INTO submissions (assignment_id, user_id, submission_url, grade)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [assignment_id, user_id, submission_url, grade]
    );
    return rows[0];
  },

  async findByAssignment(assignment_id) {
    const { rows } = await query(
      `SELECT * FROM submissions WHERE assignment_id = $1 ORDER BY submitted_at DESC`,
      [assignment_id]
    );
    return rows;
  },

  async findByUser(user_id) {
    const { rows } = await query(
      `SELECT * FROM submissions WHERE user_id = $1 ORDER BY submitted_at DESC`,
      [user_id]
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM submissions WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async update(id, data) {
    const { grade, feedback } = data;
    const { rows } = await query(
      `UPDATE submissions SET grade = $1, feedback = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [grade, feedback, id]
    );
    return rows[0];
  },
};

export default SubmissionModel;
