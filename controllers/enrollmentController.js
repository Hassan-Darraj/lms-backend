import EnrollmentModel from "../models/enrollmentModel.js";
import { enrollmentSchema } from "../utils/validation.js";

const EnrollmentController = {
  async enrollUser(req, res, next) {
    try {
      const { error, value } = enrollmentSchema.validate(req.body);
      if (error)
        return res.status(400).json({ success: false, error: error.message });

      // تحقق إن المستخدم مش مسجل بالفعل في نفس الكورس
      const existing = await EnrollmentModel.findByUserCourse(
        value.user_id,
        value.course_id
      );
      if (existing)
        return res
          .status(409)
          .json({
            success: false,
            error: "User already enrolled in this course",
          });

      const enrollment = await EnrollmentModel.create(value);
      res.status(201).json({ success: true, data: enrollment });
    } catch (error) {
      next(error);
    }
  },

  async getAllEnrollments(req, res, next) {
    try {
      const enrollments = await EnrollmentModel.findAll();
      res.json({ success: true, data: enrollments });
    } catch (error) {
      next(error);
    }
  },

  async getEnrollmentById(req, res, next) {
    try {
      const enrollment = await EnrollmentModel.findById(req.params.id);
      if (!enrollment)
        return res
          .status(404)
          .json({ success: false, error: "Enrollment not found" });
      res.json({ success: true, data: enrollment });
    } catch (error) {
      next(error);
    }
  },

  async updateEnrollment(req, res, next) {
    try {
      const { error, value } = enrollmentSchema.validate(req.body);
      if (error)
        return res.status(400).json({ success: false, error: error.message });

      const enrollment = await EnrollmentModel.update(req.params.id, value);
      if (!enrollment)
        return res
          .status(404)
          .json({ success: false, error: "Enrollment not found" });
      res.json({ success: true, data: enrollment });
    } catch (error) {
      next(error);
    }
  },

  async deleteEnrollment(req, res, next) {
    try {
      const enrollment = await EnrollmentModel.delete(req.params.id);
      if (!enrollment)
        return res
          .status(404)
          .json({ success: false, error: "Enrollment not found" });
      res.json({ success: true, message: "Enrollment deleted successfully" });
    } catch (error) {
      next(error);
    }
  },

  async markLessonCompleted(req, res, next) {
    try {
      const { userId } = req.params;
      const { lessonId } = req.body;

      if (!lessonId) {
        return res
          .status(400)
          .json({ success: false, error: "Lesson ID is required" });
      }

      const result = await EnrollmentModel.markLessonCompleted(
        userId,
        lessonId
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async markAssignmentCompleted(req, res, next) {
    try {
      const { userId } = req.params;
      const { assignmentId, score } = req.body;

      if (!assignmentId || score === undefined) {
        return res.status(400).json({
          success: false,
          error: "Assignment ID and score are required",
        });
      }

      const result = await EnrollmentModel.markAssignmentCompleted(
        userId,
        assignmentId,
        score
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async markQuizCompleted(req, res, next) {
    try {
      const { userId } = req.params;
      const { quizId, score } = req.body;

      if (!quizId || score === undefined) {
        return res.status(400).json({
          success: false,
          error: "Quiz ID and score are required",
        });
      }

      const result = await EnrollmentModel.markQuizCompleted(
        userId,
        quizId,
        score
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getCourseProgress(req, res, next) {
    try {
      const { userId, courseId } = req.params;

      const progress = await EnrollmentModel.getCourseProgress(
        userId,
        courseId
      );
      if (!progress) {
        return res.status(404).json({
          success: false,
          error: "No progress found for this user and course",
        });
      }

      res.json({ success: true, data: progress });
    } catch (error) {
      next(error);
    }
  },

  async getUserEnrollmentsWithProgress(req, res, next) {
    try {
      const { userId } = req.params;

      const enrollments = await EnrollmentModel.getUserEnrollmentsWithProgress(
        userId
      );
      res.json({ success: true, data: enrollments });
    } catch (error) {
      next(error);
    }
  },

  async getEnrollmentStats(req, res, next) {
    try {
      const { startDate, endDate, groupBy } = req.query;
      const stats = await EnrollmentModel.getEnrollmentStats({
        startDate,
        endDate,
        groupBy,
      });
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  async getEnrollmentTrends(req, res, next) {
    try {
      const { period, limit } = req.query;
      const trends = await EnrollmentModel.getEnrollmentTrends({
        period,
        limit: limit ? parseInt(limit, 10) : undefined,
      });
      res.json({ success: true, data: trends });
    } catch (error) {
      next(error);
    }
  },
};

export default EnrollmentController;
