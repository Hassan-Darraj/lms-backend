import { Router } from "express";
import LessonController from "../controllers/lessonController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { uploadLessonContent } from "../config/multerConfig.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize(["admin", "instructor"]), LessonController.createLesson);
router.get("/module/:module_id", authorize(["admin", "instructor", "student"]), LessonController.getLessonsByModule);
router.get("/:id", authorize(["admin", "instructor", "student"]), LessonController.getLessonById);
router.put("/:id", authorize(["admin", "instructor"]), LessonController.updateLesson);
router.delete("/:id", authorize(["admin"]), LessonController.deleteLesson);
router.post(
  "/",
  authorize(["admin", "instructor"]),
  uploadLessonContent.single("content"),
  LessonController.createLesson
);

export default router;
