// import express from "express";
// import multer from "multer";
// import { auth, restrictTo } from "../middleware/authMiddleware.js";
// import {
//   createAssignment,
//   getAssignments,
//   updateAssignment,
//   deleteAssignment,
//   submitAssignment,
//   getSubmittedAssignments,
//   getAssignmentCalendar,
//   getMonthlyCompletedStats,
//   getUserAssignmentCalendar,
//   getMinimalAssignments,
// } from "../controllers/assignmentController.js";

// const router = express.Router();

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype === "application/pdf") {
//       cb(null, true);
//     } else {
//       cb(new Error("Only PDFs are allowed"), false);
//     }
//   },
// });

// router.post("/", auth, restrictTo("admin"), upload.single("pdf"), createAssignment);
// router.get("/", auth, getAssignments);
// router.put("/:id", auth, restrictTo("admin"), updateAssignment);
// router.delete('/:id', auth, restrictTo('admin'), deleteAssignment);
// router.post("/:id/submit", auth, restrictTo("student"), upload.single("submission"), submitAssignment);
// router.post("/assignments/:id/submit", upload.single("submission"), submitAssignment);
// //router.get("/submissions", auth, restrictTo("admin"), getSubmittedAssignments);

// router.get("/calendar", auth, getAssignmentCalendar);
// router.get("/stats/monthly-completed", auth, getMonthlyCompletedStats);
// router.get('/user-calendar', auth, getUserAssignmentCalendar);
// router.get("/minimal", auth, getMinimalAssignments);

// export default router;


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
  getUserAssignmentCalendar,
  getMinimalAssignments,
  getAssignmentCounts,
  getAllAssignmentCalendar,
  getAssignmentProgress,
  getAllPdfAssignments,
  getUserSubmittedAssignments,
} from "../controllers/assignmentController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDFs are allowed"), false);
    }
  },
});

router.post("/", auth, restrictTo("admin"), upload.single("pdf"), createAssignment);
router.get("/", auth, getAssignments);
router.put("/:id", auth, restrictTo("admin"), updateAssignment);
router.delete("/:id", auth, restrictTo("admin"), deleteAssignment);
router.post("/:id/submit", auth, restrictTo("student"), upload.single("submission"), submitAssignment);
router.get("/calendar", auth, getAssignmentCalendar);
router.get("/stats/monthly-completed", auth, getMonthlyCompletedStats);
router.get("/user-calendar", auth, getUserAssignmentCalendar);
router.get("/minimal", auth, getMinimalAssignments);
router.get("/counts", auth, getAssignmentCounts);
router.get("/submissions", auth, restrictTo("admin"), getSubmittedAssignments);

router.get('/all-calendar', auth, getAllAssignmentCalendar);

router.get('/progress', auth, getAssignmentProgress);

router.get("/pdfs", auth, getAllPdfAssignments);
router.get("/submissions", auth, restrictTo("admin"), getUserSubmittedAssignments);

export default router;