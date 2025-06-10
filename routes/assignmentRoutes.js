import express from "express";
import multer from "multer";
import { auth, restrictTo } from "../middleware/authMiddleware.js";
import {
  createAssignment,
  getAssignments,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmittedAssignments,
  getAssignmentCalendar,
  getMonthlyCompletedStats,
} from "../controllers/assignmentController.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDFs are allowed"), false);
    }
  },
});

// Existing routes
router.post("/", auth, restrictTo("admin"), upload.single("pdf"), createAssignment);
router.get("/", auth, getAssignments);
router.put("/:id", auth, restrictTo("admin"), updateAssignment);
router.delete("/:id", auth, restrictTo("admin"), deleteAssignment);
router.post("/:id/submit", auth, restrictTo("student"), upload.single("submission"), submitAssignment);
router.get("/submissions", auth, restrictTo("admin"), getSubmittedAssignments);

// New routes - explicitly defined
router.get("/calendar", auth, getAssignmentCalendar);
router.get("/stats/monthly-completed", auth, getMonthlyCompletedStats);

export default router;