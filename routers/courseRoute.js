import { Router } from "express";
import CourseController from "../controllers/courseController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { uploadThumbnail } from "../config/multerConfig.js";

const router = Router();

router.use(authenticate);

router.get("/", CourseController.getAllCourses);
router.get("/:id", CourseController.getCourseById);

// فقط المدرسين أو الأدمن يمكنهم إنشاء وتحديث وحذف الكورسات
router.get('/category/:categoryId',authenticate, authorize(["admin"]), CourseController.getCoursesByCategory);
router.put(
  "/:id",
  authorize(["admin", "instructor"]),
  CourseController.updateCourse
);
router.delete(
  "/:id",
  authorize(["admin", "instructor"]),
  CourseController.deleteCourse
);
router.post(
  "/",
  authorize(["admin", "instructor"]),
  uploadThumbnail.single("thumbnail"),
  CourseController.createCourse
);

export default router;
