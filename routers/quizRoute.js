import { Router } from "express";
import QuizController from "../controllers/quizController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize(["admin", "instructor"]), QuizController.createQuiz);
router.get("/lesson/:lesson_id", authorize(["admin", "instructor", "student"]), QuizController.getQuizzesByLesson);
router.get("/:id", authorize(["admin", "instructor", "student"]), QuizController.getQuizById);
router.put("/:id", authorize(["admin", "instructor"]), QuizController.updateQuiz);
router.delete("/:id", authorize(["admin"]), QuizController.deleteQuiz);

export default router;
