import { query } from "../config/db.js";
import moment from "moment";

const CourseModel = {
  async create(data) {
    const {
      title,
      description,
      instructor_id,
      category_id,
      price,
      thumbnail_url,
      is_published,
      is_approved,
    } = data;
    const { rows } = await query(
      `INSERT INTO courses 
      (title, description, instructor_id, category_id, price, thumbnail_url, is_published, is_approved)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        title,
        description,
        instructor_id,
        category_id,
        price ?? 0,
        thumbnail_url,
        is_published ?? false,
        is_approved ?? false,
      ]
    );
    return rows[0];
  },

  async findAll() {
    const { rows } = await query(
      `SELECT * FROM courses ORDER BY created_at DESC`
    );
    return rows;
  },

  async findById(id) {
    try {
      const { rows } = await query(
        `SELECT c.*, 
          cat.name as category_name,
          u.name as instructor_name,
          u.email as instructor_email
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE c.id = $1`,
        [id]
      );
      console.log('Query result:', JSON.stringify(rows[0], null, 2));
      return rows[0] || null;
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  },

  async getCoursesByCategory(category_id) {
    const {rows} = await query(`
      SELECT title, description
      FROM public.courses
      WHERE category_id = $1
    `,[category_id]) ;
    return rows;
  },

  

  async update(id, data) {
    const {
      title,
      description,
      instructor_id,
      category_id,
      price,
      thumbnail_url,
      is_published,
      is_approved,
    } = data;
    const { rows } = await query(
      `UPDATE courses SET 
        title = $1,
        description = $2,
        instructor_id = $3,
        category_id = $4,
        price = $5,
        thumbnail_url = $6,
        is_published = $7,
        is_approved = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 RETURNING *`,
      [
        title,
        description,
        instructor_id,
        category_id,
        price,
        thumbnail_url,
        is_published,
        is_approved,
        id,
      ]
    );
    return rows[0];
  },

  async delete(id) {
    const { rows } = await query(
      `DELETE FROM courses WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows[0];
  },
  // Get popular courses with enrollment counts
  async getPopularCourses({ startDate, endDate } = {}) {
    let whereClause = "";
    const queryParams = [];

    if (startDate && endDate) {
      whereClause = "WHERE e.enrolled_at BETWEEN $1 AND $2";
      queryParams.push(startDate, endDate);
    } else if (startDate) {
      whereClause = "WHERE e.enrolled_at >= $1";
      queryParams.push(startDate);
    } else if (endDate) {
      whereClause = "WHERE e.enrolled_at <= $1";
      queryParams.push(endDate);
    }

    const { rows } = await query(
      `SELECT 
          c.id, 
          c.title, 
          c.instructor_id,
          u.name as instructor_name,
          c.price,
          c.created_at,
          COUNT(e.id) as enrollment_count,
          AVG(r.rating) as average_rating,
          COUNT(r.id) as rating_count
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id
        LEFT JOIN users u ON c.instructor_id = u.id
        LEFT JOIN reviews r ON c.id = r.course_id
        ${whereClause}
        GROUP BY c.id, u.name
        ORDER BY enrollment_count DESC, average_rating DESC
        LIMIT 100`,
      queryParams
    );
    return rows;
  },

  // Get total number of courses
  async countTotalCourses() {
    const { rows } = await query("SELECT COUNT(*) FROM courses");
    return parseInt(rows[0].count, 10);
  },

  // Get course statistics
  async getCourseStatistics() {
    const [totalCourses, publishedCourses, approvedCourses, coursesByCategory] =
      await Promise.all([
        this.countTotalCourses(),
        query("SELECT COUNT(*) FROM courses WHERE is_published = true").then(
          (res) => parseInt(res.rows[0].count, 10)
        ),
        query("SELECT COUNT(*) FROM courses WHERE is_approved = true").then(
          (res) => parseInt(res.rows[0].count, 10)
        ),
        query(`
        SELECT cat.name as category_name, COUNT(c.id) as course_count
        FROM categories cat
        LEFT JOIN courses c ON cat.id = c.category_id
        GROUP BY cat.id, cat.name
        ORDER BY course_count DESC
      `).then((res) => res.rows),
      ]);

    return {
      totalCourses,
      publishedCourses,
      approvedCourses,
      coursesByCategory,
    };
  },
};

export default CourseModel;
