import Assignment from "../models/Assignment.js";
import User from "../models/User.js";
import { uploadFileToS3 } from "../utils/s3.js";
import { sendSubmissionConfirmation } from "../services/emailService.js";

// Create a new assignment (Admin only) - POST /api/assignments
export const createAssignment = async (req, res) => {
  const { title, course, subject, dueDate, dueTime, priority } = req.body;
  const userId = req.user._id;

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can create assignments" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const pdfUrl = await uploadFileToS3(req.file, "assignments");

    const assignment = new Assignment({
      title,
      course,
      subject,
      dueDate,
      dueTime,
      priority: priority || "medium",
      status: "pending",
      pdfUrl,
      createdBy: userId,
    });

    await assignment.save();
    res.status(201).json(assignment);
  } catch (error) {
    console.error("Create Assignment Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all assignments - GET /api/assignments (admin and student)
export const getAssignments = async (req, res) => {
  const { status, course, subject } = req.query;

  try {
    const query = {};
    if (status) query.status = status;
    if (course) query.course = course;
    if (subject) query.subject = subject;

    const assignments = await Assignment.find(query).populate("createdBy", "name");
    res.status(200).json(assignments);
  } catch (error) {
    console.error("Get Assignments Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update an assignment (Admin only) - PUT /api/assignments/{id}
export const updateAssignment = async (req, res) => {
  const { id } = req.params;
  const { title, course, subject, dueDate, dueTime, priority, status } = req.body;

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can update assignments" });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (title) assignment.title = title;
    if (course) assignment.course = course;
    if (subject) assignment.subject = subject;
    if (dueDate) assignment.dueDate = dueDate;
    if (dueTime) assignment.dueTime = dueTime;
    if (priority) assignment.priority = priority;
    if (status) assignment.status = status;

    await assignment.save();
    res.status(200).json(assignment);
  } catch (error) {
    console.error("Update Assignment Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete an assignment (Admin only) - DELETE /api/assignments/{id}
export const deleteAssignment = async (req, res) => {
  const { id } = req.params;

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete assignments" });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    await assignment.deleteOne();
    res.status(200).json({ message: "Assignment deleted" });
  } catch (error) {
    console.error("Delete Assignment Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Submit an assignment (Student only) - POST /api/assignments/{id}/submit
export const submitAssignment = async (req, res) => {
  const { id } = req.params;
  const { link } = req.body;
  const file = req.file;
  const userId = req.user._id;
  const userEmail = req.user.email;

  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied (not student)" });
    }

    const existingSubmission = assignment.submissions.find(
      (sub) => sub.student.toString() === userId.toString()
    );
    if (existingSubmission) {
      return res.status(400).json({ message: "You have already submitted this assignment" });
    }

    let submissionUrl, submissionType;
    if (file) {
      submissionUrl = await uploadFileToS3(file, "submissions");
      submissionType = "file";
    } else if (link) {
      if (!link.startsWith("http")) {
        return res.status(400).json({ message: "Invalid link format" });
      }
      submissionUrl = link;
      submissionType = "link";
    } else {
      return res.status(400).json({ message: "Submission file or link required" });
    }

    const submittedAt = new Date().toLocaleString();
    const submission = {
      student: userId,
      submissionType,
      submissionUrl,
      submittedAt: new Date(),
    };

    assignment.submissions.push(submission);
    await assignment.save();

    await sendSubmissionConfirmation(userEmail, assignment.title, submittedAt);
    res.status(200).json({ message: "Assignment submitted", assignment });
  } catch (err) {
    console.error("Submit Assignment Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get submitted assignments by batch and course (Admin only) - GET /api/assignments/submissions
export const getSubmittedAssignments = async (req, res) => {
  const { batch, course } = req.query;

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can view submitted assignments" });
    }

    const studentQuery = { role: "student" };
    if (batch) studentQuery.batch = batch;
    if (course) studentQuery.course = course;

    const students = await User.find(studentQuery).select("_id");
    const studentIds = students.map((student) => student._id);

    const assignments = await Assignment.find({
      "submissions.student": { $in: studentIds },
    })
      .populate("submissions.student", "name email regNo batch course")
      .select("title course subject dueDate dueTime submissions");

    if (assignments.length === 0) {
      return res.status(200).json({ message: "No submissions found for the given filters", data: [] });
    }

    const formattedAssignments = assignments.map((assignment) => ({
      _id: assignment._id,
      title: assignment.title,
      course: assignment.course,
      subject: assignment.subject,
      dueDate: assignment.dueDate,
      dueTime: assignment.dueTime,
      submissions: assignment.submissions
        .filter((sub) => studentIds.some((id) => id.equals(sub.student._id)))
        .map((sub) => ({
          student: {
            _id: sub.student._id,
            name: sub.student.name,
            email: sub.student.email,
            regNo: sub.student.regNo,
            batch: sub.student.batch,
            course: sub.student.course,
          },
          submissionType: sub.submissionType,
          submissionUrl: sub.submissionUrl,
          submittedAt: sub.submittedAt,
        })),
    }));

    res.status(200).json(formattedAssignments);
  } catch (error) {
    console.error("Get Submitted Assignments Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get assignment calendar events - GET /api/assignments/calendar
export const getAssignmentCalendar = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      $or: [
        { createdBy: req.user._id }, // Admin sees their created assignments
        { "submissions.student": req.user._id }, // Student sees their submitted assignments
      ],
    }).select("title dueDate dueTime status");

    const calendarEvents = assignments.map((assignment) => ({
      _id: assignment._id,
      title: assignment.title,
      date: assignment.dueDate,
      time: assignment.dueTime,
      status: assignment.status,
    }));

    res.status(200).json(calendarEvents);
  } catch (error) {
    console.error("Get Assignment Calendar Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get monthly completed assignment stats - GET /api/assignments/stats/monthly-completed
export const getMonthlyCompletedStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const assignments = await Assignment.find({
      status: "completed",
      dueDate: {
        $gte: new Date(currentYear, 0, 1), // Start of year
        $lte: new Date(currentYear, 11, 31), // End of year
      },
      $or: [
        { createdBy: req.user._id }, // Admin stats
        { "submissions.student": req.user._id }, // Student stats
      ],
    });

    // Aggregate by month
    const monthlyStats = Array(12).fill(0); // Jan-Dec
    assignments.forEach((assignment) => {
      const month = new Date(assignment.dueDate).getMonth(); // 0-11
      monthlyStats[month]++;
    });

    res.status(200).json({
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      data: monthlyStats,
    });
  } catch (error) {
    console.error("Get Monthly Completed Stats Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};