import { query } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import moment from "moment";

const UserModel = {
  async create({ email, password, name, role = "student" }) {
    try {
      const hashedPassword = await bcrypt.hash(
        password,
        parseInt(process.env.BCRYPT_SALT_ROUNDS)
      );
      const { rows } = await query(
        `INSERT INTO users (email,password_hash,name,role) 
            VALUES ($1,$2,$3,$4)
            RETURNING *`,
        [email, hashedPassword, name, role]
      );
      return rows[0];
    } catch (error) {
      if (error.code === "23505") {
        throw new Error("Email Already Exist");
      }
      throw error;
    }
  },

  async findByEmail(email) {
    try {
      const { rows } = await query(
        `SELECT id, email, password_hash, name, role, created_at, updated_at, is_active 
        FROM users WHERE email = $1`,
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  async findById(id) {
    try {
      const { rows } = await query(
        `SELECT id, oauth_id, email, name, avatar, oauth_provider, role, is_active 
       FROM users WHERE id = $1`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });
  },

  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  },

  async updatePassword(userId, newPassword) {
    try {
      const hashedNewPassword = await bcrypt.hash(
        newPassword,
        parseInt(process.env.BCRYPT_SALT_ROUNDS)
      );
      await query(
        `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id=$2`,
        [hashedNewPassword, userId]
      );
    } catch (error) {
      throw error;
    }
  },

  async delete(id) {
    try {
      const { rows } = await query(
        `DELETE FROM users WHERE id=$1 RETURNING *`,
        [id]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async findAll(limit = 50, offset = 0) {
    try {
      const { rows } = await query(
        `SELECT id, email, name, role, created_at, updated_at, is_active 
                 FROM users 
                 ORDER BY created_at DESC 
                 LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async update(id, updates) {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updates).forEach((key) => {
        if (updates[key] !== undefined) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(updates[key]);
          paramIndex++;
        }
      });

      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const { rows } = await query(
        `UPDATE users SET ${fields.join(", ")} 
                 WHERE id = $${paramIndex} 
                 RETURNING id, email, name, role, updated_at`,
        values
      );

      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  },

  async findUserByGoogleId(oauth_id, oauth_provider) {
    try {
      const { rows } = await query(
        "SELECT * FROM users WHERE oauth_id = $1 AND oauth_provider = $2",
        [oauth_id, oauth_provider]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  async createUserGoogle({ oauth_id, email, name, avatar, oauth_provider }) {
    try {
      const { rows } = await query(
        `INSERT INTO users (oauth_id, email, name, avatar, oauth_provider, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'student', true, NOW(), NOW()) RETURNING *`,
        [oauth_id, email, name, avatar, oauth_provider]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },
  // Report-related methods
  async getUserActivity({ startDate, endDate } = {}) {
    let whereClause = "";
    const queryParams = [];

    if (startDate && endDate) {
      whereClause = `WHERE last_login BETWEEN $1 AND $2`;
      queryParams.push(startDate, endDate);
    } else if (startDate) {
      whereClause = "WHERE last_login >= $1";
      queryParams.push(startDate);
    } else if (endDate) {
      whereClause = "WHERE last_login <= $1";
      queryParams.push(endDate);
    }

    const { rows } = await query(
      `SELECT 
        id, email, name, role, 
         created_at, 
        (SELECT COUNT(*) FROM enrollments WHERE user_id = users.id) as course_count
       FROM users
       ${whereClause}
      `,
      queryParams
    );
    return rows;
  },

  async countTotalUsers() {
    const { rows } = await query("SELECT COUNT(*) FROM users");
    return parseInt(rows[0].count, 10);
  },

  async countActiveUsersThisMonth() {
    const startOfMonth = moment().startOf("month").format("YYYY-MM-DD");
    const { rows } = await query(
      "SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE last_activity >= $1",
      [startOfMonth]
    );
    return parseInt(rows[0].count, 10);
  },
};

export default UserModel;
