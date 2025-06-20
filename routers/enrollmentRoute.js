import { Router } from "express";
import EnrollmentController from "../controllers/enrollmentController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize(["admin"]), EnrollmentController.getAllEnrollments);
router.get("/:id", authorize(["admin", "instructor", "student"]), EnrollmentController.getEnrollmentById);

// الطالب أو الإدمن فقط يقدر يسجل نفسه أو يحدّث التقدم
router.post("/", authorize(["admin", "student"]), EnrollmentController.enrollUser);
router.put("/:id", authorize(["admin", "student"]), EnrollmentController.updateEnrollment);
router.delete("/:id", authorize(["admin"]), EnrollmentController.deleteEnrollment);


router.get("/stats", authorize(["admin"]), EnrollmentController.getEnrollmentStats);
router.get("/trends", authorize(["admin"]), EnrollmentController.getEnrollmentTrends);
router.post(
  "/:userId/lessons/completed",
  authorize(["student"]),
  EnrollmentController.markLessonCompleted
);
router.post(
  "/:userId/assignments/completed",
  authorize(["student"]),
  EnrollmentController.markAssignmentCompleted
);
router.post(
  "/:userId/quizzes/completed",
  authorize(["student"]),
  EnrollmentController.markQuizCompleted
);
router.get(
  "/:userId/courses/:courseId/progress",
  authorize(["student", "instructor", "admin"]),
  EnrollmentController.getCourseProgress
);

router.get(
  "/users/:userId/enrollments",
  authorize(["student", "instructor", "admin"]),
  EnrollmentController.getUserEnrollmentsWithProgress
);

export default router;
