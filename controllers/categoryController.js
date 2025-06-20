import CategoryModel from "../models/categoryModel.js";
import { categorySchema } from "../utils/validation.js";

const CategoryController = {
  async createCategory(req, res, next) {
    try {
      const { error, value } = categorySchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, error: error.message });

      const category = await CategoryModel.create(value.name);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  },

  async getAllCategories(req, res, next) {
    try {
      const categories = await CategoryModel.findAll();
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  },

  async getCategoryById(req, res, next) {
    try {
      const category = await CategoryModel.findById(req.params.id);
      if (!category) return res.status(404).json({ success: false, error: "Category not found" });
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { error, value } = categorySchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, error: error.message });

      const category = await CategoryModel.update(req.params.id, value.name);
      if (!category) return res.status(404).json({ success: false, error: "Category not found" });
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      const category = await CategoryModel.delete(req.params.id);
      if (!category) return res.status(404).json({ success: false, error: "Category not found" });
      res.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
      if (error.code === '23503') {
        return res.status(400).json({ 
          success: false, 
          error: "Cannot delete category because it has associated courses. Please remove or reassign the courses first." 
        });
      }
      next(error);
    }
  }

};

export default CategoryController;
