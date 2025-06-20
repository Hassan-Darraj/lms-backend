import { Router } from "express";
import AssignmentController from "../controllers/assignmentController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize(["admin", "instructor"]), AssignmentController.createAssignment);
router.get("/lesson/:lesson_id", authorize(["admin", "instructor", "student"]), AssignmentController.getAssignmentsByLesson);
router.get("/:id", authorize(["admin", "instructor", "student"]), AssignmentController.getAssignmentById);
router.put("/:id", authorize(["admin", "instructor"]), AssignmentController.updateAssignment);
router.delete("/:id", authorize(["admin"]), AssignmentController.deleteAssignment);

export default router;
