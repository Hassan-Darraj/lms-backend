import { Router } from "express";
import CategoryController from "../controllers/categoryController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// كل العمليات تحتاج توثيق المستخدم
router.use(authenticate);

// الكل يمكنه رؤية الفئات
router.get("/", CategoryController.getAllCategories);
router.get("/:id", CategoryController.getCategoryById);

// فقط الأدمن يمكنه إنشاء وتعديل وحذف الفئات
router.post("/", authorize(["admin"]), CategoryController.createCategory);
router.put("/:id", authorize(["admin"]), CategoryController.updateCategory);
router.delete("/:id", authorize(["admin"]), CategoryController.deleteCategory);

export default router;
