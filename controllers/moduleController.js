import ModuleModel from "../models/moduleModel.js";
import { moduleSchema } from "../utils/validation.js";

const ModuleController = {
  async createModule(req, res, next) {
    try {
      const { error, value } = moduleSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, error: error.message });

      const module = await ModuleModel.create(value);
      res.status(201).json({ success: true, data: module });
    } catch (error) {
      next(error);
    }
  },

  async getModulesByCourse(req, res, next) {
    try {
      const modules = await ModuleModel.findAllByCourse(req.params.course_id);
      res.json({ success: true, data: modules });
    } catch (error) {
      next(error);
    }
  },

  async getModuleById(req, res, next) {
    try {
      const module = await ModuleModel.findById(req.params.id);
      if (!module) return res.status(404).json({ success: false, error: "Module not found" });
      res.json({ success: true, data: module });
    } catch (error) {
      next(error);
    }
  },

  async updateModule(req, res, next) {
    try {
      const { error, value } = moduleSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, error: error.message });

      const module = await ModuleModel.update(req.params.id, value);
      if (!module) return res.status(404).json({ success: false, error: "Module not found" });
      res.json({ success: true, data: module });
    } catch (error) {
      next(error);
    }
  },

  async deleteModule(req, res, next) {
    try {
      const module = await ModuleModel.delete(req.params.id);
      if (!module) return res.status(404).json({ success: false, error: "Module not found" });
      res.json({ success: true, message: "Module deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};

export default ModuleController;
