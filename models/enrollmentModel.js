import { query } from "../config/db.js";
import moment from "moment";

const EnrollmentModel = {
  async create(data) {
    const { user_id, course_id, completed_at = null, progress = 0 } = data;
    const { rows } = await query(
      `INSERT INTO enrollments (user_id, course_id, completed_at, progress)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, course_id, completed_at, progress]
    );
    return rows[0];
  },

  async findAll() {
    const { rows } = await query(
      `SELECT * FROM enrollments ORDER BY enrolled_at DESC`
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM enrollments WHERE id = $1`, [
      id,
    ]);
    return rows[0] || null;
  },

  async findByUserCourse(user_id, course_id) {
    const { rows } = await query(
      `SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2`,
      [user_id, course_id]
    );
    return rows[0] || null;
  },

  async update(id, data) {
    const { completed_at, progress } = data;
    const { rows } = await query(
      `UPDATE enrollments SET completed_at = $1, progress = $2 WHERE id = $3 RETURNING *`,
      [completed_at, progress, id]
    );
    return rows[0];
  },

  async delete(id) {
    const { rows } = await query(
      `DELETE FROM enrollments WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows[0];
  },
  
  // Count total enrollments
  async countTotalEnrollments() {
    const { rows } = await query("SELECT COUNT(*) FROM enrollments");
    return parseInt(rows[0].count, 10);
  },

  // Get enrollment statistics
  async getEnrollmentStats({ startDate, endDate, groupBy = "day" } = {}) {
    let dateTrunc = "day";

    // Validate and set the appropriate date truncation for the group by clause
    const validGroupBy = ["day", "week", "month", "year"];
    if (validGroupBy.includes(groupBy.toLowerCase())) {
      dateTrunc = groupBy.toLowerCase();
    }

    let whereClause = "";
    const queryParams = [];

    if (startDate && endDate) {
      whereClause = "WHERE enrolled_at BETWEEN $1 AND $2";
      queryParams.push(startDate, endDate);
    } else if (startDate) {
      whereClause = "WHERE enrolled_at >= $1";
      queryParams.push(startDate);
    } else if (endDate) {
      whereClause = "WHERE enrolled_at <= $1";
      queryParams.push(endDate);
    }

    const { rows } = await query(
      `SELECT 
          DATE_TRUNC($${queryParams.length + 1}, enrolled_at) as date,
          COUNT(*) as count
        FROM enrollments
        ${whereClause}
        GROUP BY date
        ORDER BY date`,
      [...queryParams, dateTrunc]
    );

    return rows;
  },

  // Get course enrollment stats
  async getCourseEnrollmentStats(limit = 10) {
    const { rows } = await query(
      `SELECT 
          c.id as course_id,
          c.title as course_title,
          COUNT(e.id) as enrollment_count,
          COUNT(DISTINCT e.user_id) as unique_students,
          AVG(e.progress) as avg_progress,
          COUNT(CASE WHEN e.completed_at IS NOT NULL THEN 1 END) as completed_count
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id
        GROUP BY c.id, c.title
        ORDER BY enrollment_count DESC
        LIMIT $1`,
      [limit]
    );
    return rows;
  },

  // Get enrollment trends over time
  async getEnrollmentTrends({ period = "month", limit = 12 } = {}) {
    const endDate = moment().endOf("day");
    let startDate, interval;

    switch (period.toLowerCase()) {
      case "day":
        startDate = moment()
          .subtract(limit - 1, "days")
          .startOf("day");
        interval = "day";
        break;
      case "week":
        startDate = moment()
          .subtract(limit - 1, "weeks")
          .startOf("week");
        interval = "week";
        break;
      case "year":
        startDate = moment()
          .subtract(limit - 1, "years")
          .startOf("year");
        interval = "year";
        break;
      case "month":
      default:
        startDate = moment()
          .subtract(limit - 1, "months")
          .startOf("month");
        interval = "month";
    }

    const { rows } = await query(
      `WITH date_series AS (
        SELECT generate_series($1::date, $2::date, $3::interval) as date
      )
      SELECT 
        ds.date,
        COUNT(e.id) as enrollment_count,
        COUNT(DISTINCT e.user_id) as new_students
      FROM date_series ds
      LEFT JOIN enrollments e ON DATE_TRUNC($4, e.enrolled_at) = ds.date
      GROUP BY ds.date
      ORDER BY ds.date`,
      [
        startDate.format("YYYY-MM-DD"),
        endDate.format("YYYY-MM-DD"),
        `1 ${interval}`,
        interval,
      ]
    );

    return {
      period,
      data: rows,
      totalEnrollments: rows.reduce(
        (sum, row) => sum + parseInt(row.enrollment_count || 0, 10),
        0
      ),
      totalNewStudents: rows.reduce(
        (sum, row) => sum + parseInt(row.new_students || 0, 10),
        0
      ),
    };
  },
  // Mark a lesson as completed
async markLessonCompleted(userId, lessonId) {
  const { rows } = await query(
    `SELECT mark_lesson_completed($1, $2)`,
    [userId, lessonId]
  );
  return rows[0].mark_lesson_completed;
},

// Mark an assignment as completed
async markAssignmentCompleted(userId, assignmentId, score) {
  const { rows } = await query(
    `INSERT INTO completed_assignments (user_id, assignment_id, score)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, assignment_id) 
     DO UPDATE SET score = EXCLUDED.score, completed_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, assignmentId, score]
  );
  return rows[0];
},

// Mark a quiz as completed
async markQuizCompleted(userId, quizId, score) {
  const { rows } = await query(
    `INSERT INTO completed_quizzes (user_id, quiz_id, score)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, quiz_id) 
     DO UPDATE SET score = EXCLUDED.score, completed_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, quizId, score]
  );
  return rows[0];
},

// Get user's progress in a course
async getUserCourseProgress(userId, courseId) {
  const { rows } = await query(
    `SELECT * FROM get_user_course_progress($1, $2)`,
    [userId, courseId]
  );
  return rows[0]?.get_user_course_progress || null;
},

async getUserEnrollmentsWithProgress(userId) {
  const { rows } = await query(
    `SELECT 
      e.id,
      e.course_id,
      e.user_id,
      e.enrolled_at,
      e.completed_at,
      e.progress,
      c.title as course_title,
      c.description as course_description,
      c.thumbnail_url,
      c.price,
      u.name as instructor_name
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE e.user_id = $1
    ORDER BY e.enrolled_at DESC`,
    [userId]
  );
  return rows;
},

};

export default EnrollmentModel;
