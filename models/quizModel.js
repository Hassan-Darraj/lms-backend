import { query } from "../config/db.js";

const QuizModel = {
  async create(data) {
    const { lesson_id, question, options, correct_answer, max_score = 10 } = data;
    const { rows } = await query(
      `INSERT INTO quizzes (lesson_id, question, options, correct_answer, max_score)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [lesson_id, question, options, correct_answer, max_score]
    );
    return rows[0];
  },

  async findAllByLesson(lesson_id) {
    const { rows } = await query(
      `SELECT * FROM quizzes WHERE lesson_id = $1 ORDER BY created_at ASC`,
      [lesson_id]
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM quizzes WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async update(id, data) {
    const { question, options, correct_answer, max_score = 10 } = data;
    const { rows } = await query(
      `UPDATE quizzes
       SET question = $1, options = $2, correct_answer = $3, max_score = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [question, options, correct_answer, max_score, id]
    );
    return rows[0];
  },

  async delete(id) {
    const { rows } = await query(`DELETE FROM quizzes WHERE id = $1 RETURNING *`, [id]);
    return rows[0];
  },
};

export default QuizModel;
