import SubmissionModel from "../models/submissionModel.js";
import { submissionSchema } from "../utils/validation.js";

const SubmissionController = {
  async createSubmission(req, res, next) {
    try {
      const { error, value } = submissionSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, error: error.message });

      const submission = await SubmissionModel.create(value);
      res.status(201).json({ success: true, data: submission });
    } catch (error) {
      next(error);
    }
  },

  async getSubmissionsByAssignment(req, res, next) {
    try {
      const submissions = await SubmissionModel.findByAssignment(req.params.assignment_id);
      res.json({ success: true, data: submissions });
    } catch (error) {
      next(error);
    }
  },

  async getSubmissionsByUser(req, res, next) {
    try {
      const submissions = await SubmissionModel.findByUser(req.params.user_id);
      res.json({ success: true, data: submissions });
    } catch (error) {
      next(error);
    }
  },

  async getSubmissionById(req, res, next) {
    try {
      const submission = await SubmissionModel.findById(req.params.id);
      if (!submission) return res.status(404).json({ success: false, error: "Submission not found" });
      res.json({ success: true, data: submission });
    } catch (error) {
      next(error);
    }
  },

  async gradeSubmission(req, res, next) {
    try {
      const { grade, feedback } = req.body;
      const submission = await SubmissionModel.update(req.params.id, { grade, feedback });
      if (!submission) return res.status(404).json({ success: false, error: "Submission not found" });
      res.json({ success: true, data: submission });
    } catch (error) {
      next(error);
    }
  },
};

export default SubmissionController;
