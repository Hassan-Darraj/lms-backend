import { Router } from "express";
import ModuleController from "../controllers/moduleController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize(["admin", "instructor"]), ModuleController.createModule);
router.get("/course/:course_id", authorize(["admin", "instructor", "student"]), ModuleController.getModulesByCourse);
router.get("/:id", authorize(["admin", "instructor", "student"]), ModuleController.getModuleById);
router.put("/:id", authorize(["admin", "instructor"]), ModuleController.updateModule);
router.delete("/:id", authorize(["admin"]), ModuleController.deleteModule);

export default router;
