import LessonModel from "../models/lessonModel.js";
import { lessonSchema } from "../utils/validation.js";

const LessonController = {
  async createLesson(req, res, next) {
    try {
      if (req.file) {
      req.body.content_url = req.file.path;
    }
      const { error, value } = lessonSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, error: error.message });

      const lesson = await LessonModel.create(value);
      res.status(201).json({ success: true, data: lesson });
    } catch (error) {
      next(error);
    }
  },

  async getLessonsByModule(req, res, next) {
    try {
      const lessons = await LessonModel.findAllByModule(req.params.module_id);
      res.json({ success: true, data: lessons });
    } catch (error) {
      next(error);
    }
  },

  async getLessonById(req, res, next) {
    try {
      const lesson = await LessonModel.findById(req.params.id);
      if (!lesson) return res.status(404).json({ success: false, error: "Lesson not found" });
      res.json({ success: true, data: lesson });
    } catch (error) {
      next(error);
    }
  },

  async updateLesson(req, res, next) {
    try {
      const { error, value } = lessonSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, error: error.message });

      const lesson = await LessonModel.update(req.params.id, value);
      if (!lesson) return res.status(404).json({ success: false, error: "Lesson not found" });
      res.json({ success: true, data: lesson });
    } catch (error) {
      next(error);
    }
  },

  async deleteLesson(req, res, next) {
    try {
      const lesson = await LessonModel.delete(req.params.id);
      if (!lesson) return res.status(404).json({ success: false, error: "Lesson not found" });
      res.json({ success: true, message: "Lesson deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};

export default LessonController;
