import SearchModel from "../models/searchModel.js";

const SearchController = {
  // Global search endpoint
  async globalSearch(req, res, next) {
    try {
      const { q: searchTerm, types, limit = 50, offset = 0 } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: "Search term must be at least 2 characters long"
        });
      }

      const entityTypes = types ? types.split(',') : ['courses', 'users', 'categories'];
      
      const results = await SearchModel.globalSearch(searchTerm.trim(), {
        entityTypes,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Calculate total results
      const totalResults = Object.values(results).reduce(
        (sum, arr) => sum + arr.length, 0
      );

      res.json({
        success: true,
        data: {
          searchTerm,
          totalResults,
          results
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Advanced course search
  async searchCourses(req, res, next) {
    try {
      const { 
        q: searchTerm, 
        category_id, 
        instructor_id, 
        price_min, 
        price_max,
        is_published,
        is_approved,
        sort_by,
        limit = 20, 
        offset = 0 
      } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: "Search term must be at least 2 characters long"
        });
      }

      const filters = {
        categoryId: category_id ? parseInt(category_id) : undefined,
        instructorId: instructor_id ? parseInt(instructor_id) : undefined,
        priceMin: price_min ? parseFloat(price_min) : undefined,
        priceMax: price_max ? parseFloat(price_max) : undefined,
        isPublished: is_published !== undefined ? is_published === 'true' : true,
        isApproved: is_approved !== undefined ? is_approved === 'true' : true,
        sortBy: sort_by || 'relevance',
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      const courses = await SearchModel.searchCourses(searchTerm.trim(), filters);

      res.json({
        success: true,
        data: {
          searchTerm,
          totalResults: courses.length,
          courses,
          filters: filters
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Search users (admin only)
  async searchUsers(req, res, next) {
    try {
      const { 
        q: searchTerm, 
        role, 
        is_active,
        limit = 20, 
        offset = 0 
      } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: "Search term must be at least 2 characters long"
        });
      }

      const filters = {
        role,
        isActive: is_active !== undefined ? is_active === 'true' : undefined,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      const users = await SearchModel.searchUsers(searchTerm.trim(), filters);

      res.json({
        success: true,
        data: {
          searchTerm,
          totalResults: users.length,
          users,
          filters
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get search suggestions for autocomplete
  async getSearchSuggestions(req, res, next) {
    try {
      const { q: searchTerm, limit = 10 } = req.query;

      if (!searchTerm || searchTerm.trim().length < 1) {
        return res.json({
          success: true,
          data: {
            suggestions: []
          }
        });
      }

      const suggestions = await SearchModel.getSearchSuggestions(
        searchTerm.trim(), 
        parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          searchTerm,
          suggestions
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

export default SearchController;
