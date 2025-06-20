import { query } from "../config/db.js";

const SearchModel = {
  // Global search across multiple entities
  async globalSearch(searchTerm, filters = {}) {
    const { 
      entityTypes = ['courses', 'users', 'categories'], 
      limit = 50,
      offset = 0 
    } = filters;
    
    const results = {};
    const searchPattern = `%${searchTerm}%`;

    try {
      // Search in courses
      if (entityTypes.includes('courses')) {
        const { rows: courses } = await query(
          `SELECT id, title, description, instructor_id, price, is_published, is_approved, created_at,
                  'course' as entity_type
           FROM courses 
           WHERE (title ILIKE $1 OR description ILIKE $1) 
           AND is_published = true 
           ORDER BY 
             CASE 
               WHEN title ILIKE $1 THEN 1
               WHEN description ILIKE $1 THEN 2
               ELSE 3
             END
           LIMIT $2 OFFSET $3`,
          [searchPattern, limit, offset]
        );
        results.courses = courses;
      }

      // Search in users (only instructors for public search)
      if (entityTypes.includes('users')) {
        const { rows: users } = await query(
          `SELECT id, name, email, role, created_at,
                  'user' as entity_type
           FROM users 
           WHERE (name ILIKE $1 OR email ILIKE $1) 
           AND role = 'instructor' 
           AND is_active = true
           ORDER BY 
             CASE 
               WHEN name ILIKE $1 THEN 1
               WHEN email ILIKE $1 THEN 2
               ELSE 3
             END
           LIMIT $2 OFFSET $3`,
          [searchPattern, limit, offset]
        );
        results.users = users;
      }

      // Search in categories
      if (entityTypes.includes('categories')) {
        const { rows: categories } = await query(
          `SELECT id, name, created_at,
                  'category' as entity_type
           FROM categories 
           WHERE name ILIKE $1
           ORDER BY name
           LIMIT $2 OFFSET $3`,
          [searchPattern, limit, offset]
        );
        results.categories = categories;
      }

      // Search in lessons (if course modules are searchable)
      if (entityTypes.includes('lessons')) {
        const { rows: lessons } = await query(
          `SELECT l.id, l.title, l.content_type, l.duration, l.is_free, 
                  l.module_id, m.course_id, c.title as course_title,
                  'lesson' as entity_type
           FROM lessons l
           JOIN modules m ON l.module_id = m.id
           JOIN courses c ON m.course_id = c.id
           WHERE l.title ILIKE $1 
           AND c.is_published = true
           ORDER BY l.title
           LIMIT $2 OFFSET $3`,
          [searchPattern, limit, offset]
        );
        results.lessons = lessons;
      }

      return results;
    } catch (error) {
      throw error;
    }
  },

  // Search courses with advanced filters
  async searchCourses(searchTerm, filters = {}) {
    const {
      categoryId,
      instructorId,
      priceMin,
      priceMax,
      isPublished = true,
      isApproved = true,
      sortBy = 'relevance', // relevance, price_asc, price_desc, newest, oldest
      limit = 20,
      offset = 0
    } = filters;

    let whereConditions = ['(title ILIKE $1 OR description ILIKE $1)'];
    let queryParams = [`%${searchTerm}%`];
    let paramIndex = 2;

    // Add filters
    if (categoryId) {
      whereConditions.push(`category_id = $${paramIndex}`);
      queryParams.push(categoryId);
      paramIndex++;
    }

    if (instructorId) {
      whereConditions.push(`instructor_id = $${paramIndex}`);
      queryParams.push(instructorId);
      paramIndex++;
    }

    if (priceMin !== undefined) {
      whereConditions.push(`price >= $${paramIndex}`);
      queryParams.push(priceMin);
      paramIndex++;
    }

    if (priceMax !== undefined) {
      whereConditions.push(`price <= $${paramIndex}`);
      queryParams.push(priceMax);
      paramIndex++;
    }

    if (isPublished !== undefined) {
      whereConditions.push(`is_published = $${paramIndex}`);
      queryParams.push(isPublished);
      paramIndex++;
    }

    if (isApproved !== undefined) {
      whereConditions.push(`is_approved = $${paramIndex}`);
      queryParams.push(isApproved);
      paramIndex++;
    }

    // Build ORDER BY clause
    let orderBy = '';
    switch (sortBy) {
      case 'price_asc':
        orderBy = 'ORDER BY price ASC';
        break;
      case 'price_desc':
        orderBy = 'ORDER BY price DESC';
        break;
      case 'newest':
        orderBy = 'ORDER BY created_at DESC';
        break;
      case 'oldest':
        orderBy = 'ORDER BY created_at ASC';
        break;
      case 'relevance':
      default:
        orderBy = `ORDER BY 
          CASE 
            WHEN title ILIKE $1 THEN 1
            WHEN description ILIKE $1 THEN 2
            ELSE 3
          END`;
        break;
    }

    // Add LIMIT and OFFSET
    queryParams.push(limit, offset);
    const limitOffset = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const searchQuery = `
      SELECT c.*, 
             cat.name as category_name,
             u.name as instructor_name,
             COUNT(e.id) as enrollment_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY c.id, cat.name, u.name
      ${orderBy}
      ${limitOffset}
    `;

    const { rows } = await query(searchQuery, queryParams);
    return rows;
  },

  // Search users with filters (admin only)
  async searchUsers(searchTerm, filters = {}) {
    const {
      role,
      isActive,
      limit = 20,
      offset = 0
    } = filters;

    let whereConditions = ['(name ILIKE $1 OR email ILIKE $1)'];
    let queryParams = [`%${searchTerm}%`];
    let paramIndex = 2;

    if (role) {
      whereConditions.push(`role = $${paramIndex}`);
      queryParams.push(role);
      paramIndex++;
    }

    if (isActive !== undefined) {
      whereConditions.push(`is_active = $${paramIndex}`);
      queryParams.push(isActive);
      paramIndex++;
    }

    queryParams.push(limit, offset);

    const { rows } = await query(
      `SELECT id, name, email, role, is_active, created_at
       FROM users 
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY 
         CASE 
           WHEN name ILIKE $1 THEN 1
           WHEN email ILIKE $1 THEN 2
           ELSE 3
         END
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    );

    return rows;
  },

  // Get search suggestions/autocomplete
  async getSearchSuggestions(searchTerm, limit = 10) {
    const searchPattern = `%${searchTerm}%`;
    
    const { rows } = await query(
      `(SELECT title as suggestion, 'course' as type FROM courses 
        WHERE title ILIKE $1 AND is_published = true LIMIT $2)
       UNION ALL
       (SELECT name as suggestion, 'category' as type FROM categories 
        WHERE name ILIKE $1 LIMIT $2)
       UNION ALL
       (SELECT name as suggestion, 'instructor' as type FROM users 
        WHERE name ILIKE $1 AND role = 'instructor' AND is_active = true LIMIT $2)
       ORDER BY suggestion
       LIMIT $2`,
      [searchPattern, limit]
    );

    return rows;
  }
};

export default SearchModel;