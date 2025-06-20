import QuizModel from "../models/quizModel.js";
import { quizSchema } from "../utils/validation.js";

const QuizController = {
  async createQuiz(req, res, next) {
    try {
      const { error, value } = quizSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, error: error.message });

      const quiz = await QuizModel.create(value);
      res.status(201).json({ success: true, data: quiz });
    } catch (error) {
      next(error);
    }
  },

  async getQuizzesByLesson(req, res, next) {
    try {
      const quizzes = await QuizModel.findAllByLesson(req.params.lesson_id);
      res.json({ success: true, data: quizzes });
    } catch (error) {
      next(error);
    }
  },

  async getQuizById(req, res, next) {
    try {
      const quiz = await QuizModel.findById(req.params.id);
      if (!quiz) return res.status(404).json({ success: false, error: "Quiz not found" });
      res.json({ success: true, data: quiz });
    } catch (error) {
      next(error);
    }
  },

  async updateQuiz(req, res, next) {
    try {
      const { error, value } = quizSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, error: error.message });

      const quiz = await QuizModel.update(req.params.id, value);
      if (!quiz) return res.status(404).json({ success: false, error: "Quiz not found" });
      res.json({ success: true, data: quiz });
    } catch (error) {
      next(error);
    }
  },

  async deleteQuiz(req, res, next) {
    try {
      const quiz = await QuizModel.delete(req.params.id);
      if (!quiz) return res.status(404).json({ success: false, error: "Quiz not found" });
      res.json({ success: true, message: "Quiz deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};

export default QuizController;
