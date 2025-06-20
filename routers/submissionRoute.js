import { Router } from "express";
import SubmissionController from "../controllers/submissionController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { uploadSubmission } from "../config/multerConfig.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize(["student"]), SubmissionController.createSubmission);
router.get(
  "/assignment/:assignment_id",
  authorize(["admin", "instructor"]),
  SubmissionController.getSubmissionsByAssignment
);
router.get(
  "/user/:user_id",
  authorize(["admin", "student"]),
  SubmissionController.getSubmissionsByUser
);
router.get(
  "/:id",
  authorize(["admin", "instructor", "student"]),
  SubmissionController.getSubmissionById
);
router.put(
  "/:id/grade",
  authorize(["instructor", "admin"]),
  SubmissionController.gradeSubmission
);
router.post(
  "/upload",
  authorize(["student"]),
  uploadSubmission.single("file"),
  async (req, res, next) => {
    try {
      const { assignment_id, user_id } = req.body;
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, error: "No file uploaded" });

      const submission_url = `/uploads/submissions/${req.file.filename}`;

      const submission = await SubmissionModel.create({
        assignment_id,
        user_id,
        submission_url,
      });

      res.status(201).json({ success: true, data: submission });
    } catch (err) {
      next(err);
    }
  }
);
export default router;
