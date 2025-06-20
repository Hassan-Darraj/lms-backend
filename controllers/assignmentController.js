import AssignmentModel from "../models/assignmentModel.js";
import { assignmentSchema } from "../utils/validation.js";

const AssignmentController = {
  async createAssignment(req, res, next) {
    try {
      const { error, value } = assignmentSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, error: error.message });

      const assignment = await AssignmentModel.create(value);
      res.status(201).json({ success: true, data: assignment });
    } catch (error) {
      next(error);
    }
  },

  async getAssignmentsByLesson(req, res, next) {
    try {
      const assignments = await AssignmentModel.findAllByLesson(req.params.lesson_id);
      res.json({ success: true, data: assignments });
    } catch (error) {
      next(error);
    }
  },

  async getAssignmentById(req, res, next) {
    try {
      const assignment = await AssignmentModel.findById(req.params.id);
      if (!assignment) return res.status(404).json({ success: false, error: "Assignment not found" });
      res.json({ success: true, data: assignment });
    } catch (error) {
      next(error);
    }
  },

  async updateAssignment(req, res, next) {
    try {
      const { error, value } = assignmentSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, error: error.message });

      const assignment = await AssignmentModel.update(req.params.id, value);
      if (!assignment) return res.status(404).json({ success: false, error: "Assignment not found" });
      res.json({ success: true, data: assignment });
    } catch (error) {
      next(error);
    }
  },

  async deleteAssignment(req, res, next) {
    try {
      const assignment = await AssignmentModel.delete(req.params.id);
      if (!assignment) return res.status(404).json({ success: false, error: "Assignment not found" });
      res.json({ success: true, message: "Assignment deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};

export default AssignmentController;
