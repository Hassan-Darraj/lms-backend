import { Router } from "express";
import SearchController from "../controllers/searchController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// Public search routes
router.get("/", SearchController.globalSearch);
router.get("/courses", SearchController.searchCourses);
router.get("/suggestions", SearchController.getSearchSuggestions);

// Admin-only search routes
router.get("/users", authenticate, authorize(["admin"]), SearchController.searchUsers);

export default router;
