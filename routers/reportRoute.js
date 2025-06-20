import { Router } from "express";
import ReportController from "../controllers/reportController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['admin']));

// User Activity Reports
router.get('/users/activity', ReportController.getUserActivityReport);

// Course Popularity Reports
router.get('/courses/popularity', ReportController.getCoursePopularityReport);

// System Usage Reports
router.get('/system/usage', ReportController.getSystemUsageReport);

export default router;
