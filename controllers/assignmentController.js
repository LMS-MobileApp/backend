// import Assignment from '../models/Assignment.js';
// import User from '../models/User.js';
// import { uploadFileToS3 } from '../utils/s3.js';
// import { sendAssignmentNotification } from '../services/emailService.js';

// // Create a new assignment (Admin only) - POST /api/assignments
// export const createAssignment = async (req, res) => {
//   const { title, course, batch, subject, dueDate, dueTime, priority } = req.body;
//   const userId = req.user._id;

//   try {
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Only admins can create assignments' });
//     }

//     // Validate required fields
//     const missingFields = [];
//     if (!title) missingFields.push('title');
//     if (!course) missingFields.push('course');
//     if (!batch) missingFields.push('batch');
//     if (!subject) missingFields.push('subject');
//     if (!dueDate) missingFields.push('dueDate');
//     if (!dueTime) missingFields.push('dueTime');
//     if (!req.file) missingFields.push('pdf');

//     if (missingFields.length > 0) {
//       return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
//     }

//     // Log request data for debugging
//     console.log('Request body:', { title, course, batch, subject, dueDate, dueTime, priority });
//     console.log('Request file:', req.file);

//     const pdfUrl = await uploadFileToS3(req.file, 'assignments');

//     const assignment = new Assignment({
//       title,
//       course,
//       batch,
//       subject,
//       dueDate,
//       dueTime,
//       priority: priority || 'medium',
//       status: 'pending',
//       pdfUrl,
//       createdBy: userId,
//     });

//     await assignment.save();

//     // Fetch students in the specified course and batch
//     const students = await User.find({ role: 'student', course, batch }).select('email');
//     if (students.length > 0) {
//       const studentEmails = students.map((student) => student.email);
//       const emailData = {
//         title: `New Assignment: ${title}`,
//         message: `A new assignment has been added for your course ${course} (Batch: ${batch}). Please check the LMS for details.`,
//         course,
//         batch,
//         subject,
//         dueDate: new Date(dueDate).toLocaleDateString(),
//         dueTime,
//         priority,
//       };

//       await sendAssignmentNotification(studentEmails, 'New Assignment Notification', emailData);
//     }

//     res.status(201).json(assignment);
//   } catch (error) {
//     console.error('Create Assignment Error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };



// // Get all assignments - GET /api/assignments (admin and student)
// export const getAssignments = async (req, res) => {
//   const { status, course, subject } = req.query;

//   try {
//     const query = {};
//     if (status) query.status = status;
//     if (course) query.course = course;
//     if (subject) query.subject = subject;

//     const assignments = await Assignment.find(query).populate("createdBy", "name");
//     res.status(200).json(assignments);
//   } catch (error) {
//     console.error("Get Assignments Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };



// // Update an assignment (Admin only) - PUT /api/assignments/{id}
// export const updateAssignment = async (req, res) => {
//   const { id } = req.params;
//   const { title, course, subject, dueDate, dueTime, priority, status } = req.body;

//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ message: "Only admins can update assignments" });
//     }

//     const assignment = await Assignment.findById(id);
//     if (!assignment) {
//       return res.status(404).json({ message: "Assignment not found" });
//     }

//     if (title) assignment.title = title;
//     if (course) assignment.course = course;
//     if (subject) assignment.subject = subject;
//     if (dueDate) assignment.dueDate = dueDate;
//     if (dueTime) assignment.dueTime = dueTime;
//     if (priority) assignment.priority = priority;
//     if (status) assignment.status = status;

//     await assignment.save();
//     res.status(200).json(assignment);
//   } catch (error) {
//     console.error("Update Assignment Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Delete an assignment (Admin only) - DELETE /api/assignments/{id}
// export const deleteAssignment = async (req, res) => {
//   const { id } = req.params;

//   try {
//     console.log(`Deleting assignment with ID: ${id}, User: ${req.user.email}`);
    
//     // Check if user is admin
//     if (req.user.role !== "admin") {
//       console.log("Unauthorized: User is not an admin");
//       return res.status(403).json({ message: "Only admins can delete assignments" });
//     }

//     // Find the assignment
//     const assignment = await Assignment.findById(id);
//     if (!assignment) {
//       console.log(`Assignment not found: ${id}`);
//       return res.status(404).json({ message: "Assignment not found" });
//     }

//     // Delete the assignment
//     await Assignment.findByIdAndDelete(id);
//     console.log(`Assignment deleted: ${id}`);
    
//     res.status(200).json({ 
//       message: "Assignment deleted successfully",
//       deletedId: id 
//     });
//   } catch (error) {
//     console.error("Delete Assignment Error:", error);
//     res.status(500).json({ 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };


// // Submit an assignment (Student only) - POST /api/assignments/{id}/submit
// export const submitAssignment = async (req, res) => {
//   const { id } = req.params;
//   const { link } = req.body;
//   const file = req.file;
//   const userId = req.user._id;
//   const userEmail = req.user.email;

//   try {
//     const assignment = await Assignment.findById(id);
//     if (!assignment) {
//       return res.status(404).json({ message: "Assignment not found" });
//     }
//     if (req.user.role !== "student") {
//       return res.status(403).json({ message: "Access denied (not student)" });
//     }

//     const existingSubmission = assignment.submissions.find(
//       (sub) => sub.student.toString() === userId.toString()
//     );
//     if (existingSubmission) {
//       return res.status(400).json({ message: "You have already submitted this assignment" });
//     }

//     let submissionUrl, submissionType;
//     if (file) {
//       submissionUrl = await uploadFileToS3(file, "submissions");
//       submissionType = "file";
//     } else if (link) {
//       if (!link.startsWith("http")) {
//         return res.status(400).json({ message: "Invalid link format" });
//       }
//       submissionUrl = link;
//       submissionType = "link";
//     } else {
//       return res.status(400).json({ message: "Submission file or link required" });
//     }

//     const submittedAt = new Date().toLocaleString();
//     const submission = {
//       student: userId,
//       submissionType,
//       submissionUrl,
//       submittedAt: new Date(),
//     };

//     assignment.submissions.push(submission);
//     await assignment.save();

//     await sendSubmissionConfirmation(userEmail, assignment.title, submittedAt);
//     res.status(200).json({ message: "Assignment submitted", assignment });
//   } catch (err) {
//     console.error("Submit Assignment Error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// // Get submitted assignments by batch and course (Admin only) - GET /api/assignments/submissions
// export const getSubmittedAssignments = async (req, res) => {
//   const { batch, course } = req.query;

//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ message: "Only admins can view submitted assignments" });
//     }

//     const studentQuery = { role: "student" };
//     if (batch) studentQuery.batch = batch;
//     if (course) studentQuery.course = course;

//     const students = await User.find(studentQuery).select("_id");
//     const studentIds = students.map((student) => student._id);

//     const assignments = await Assignment.find({
//       "submissions.student": { $in: studentIds },
//     })
//       .populate("submissions.student", "name email regNo batch course")
//       .select("title course subject dueDate dueTime submissions");

//     if (assignments.length === 0) {
//       return res.status(200).json({ message: "No submissions found for the given filters", data: [] });
//     }

//     const formattedAssignments = assignments.map((assignment) => ({
//       _id: assignment._id,
//       title: assignment.title,
//       course: assignment.course,
//       subject: assignment.subject,
//       dueDate: assignment.dueDate,
//       dueTime: assignment.dueTime,
//       submissions: assignment.submissions
//         .filter((sub) => studentIds.some((id) => id.equals(sub.student._id)))
//         .map((sub) => ({
//           student: {
//             _id: sub.student._id,
//             name: sub.student.name,
//             email: sub.student.email,
//             regNo: sub.student.regNo,
//             batch: sub.student.batch,
//             course: sub.student.course,
//           },
//           submissionType: sub.submissionType,
//           submissionUrl: sub.submissionUrl,
//           submittedAt: sub.submittedAt,
//         })),
//     }));

//     res.status(200).json(formattedAssignments);
//   } catch (error) {
//     console.error("Get Submitted Assignments Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Get assignment calendar events - GET /api/assignments/calendar
// export const getAssignmentCalendar = async (req, res) => {
//   try {
//     const assignments = await Assignment.find({
//       $or: [
//         { createdBy: req.user._id }, // Admin sees their created assignments
//         { "submissions.student": req.user._id }, // Student sees their submitted assignments
//       ],
//     }).select("title dueDate dueTime status");

//     const calendarEvents = assignments.map((assignment) => ({
//       _id: assignment._id,
//       title: assignment.title,
//       date: assignment.dueDate,
//       time: assignment.dueTime,
//       status: assignment.status,
//     }));

//     res.status(200).json(calendarEvents);
//   } catch (error) {
//     console.error("Get Assignment Calendar Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Get monthly completed assignment stats - GET /api/assignments/stats/monthly-completed
// export const getMonthlyCompletedStats = async (req, res) => {
//   try {
//     const currentYear = new Date().getFullYear();
//     const assignments = await Assignment.find({
//       status: "completed",
//       dueDate: {
//         $gte: new Date(currentYear, 0, 1), // Start of year
//         $lte: new Date(currentYear, 11, 31), // End of year
//       },
//       $or: [
//         { createdBy: req.user._id }, // Admin stats
//         { "submissions.student": req.user._id }, // Student stats
//       ],
//     });

//     // Aggregate by month
//     const monthlyStats = Array(12).fill(0); // Jan-Dec
//     assignments.forEach((assignment) => {
//       const month = new Date(assignment.dueDate).getMonth(); // 0-11
//       monthlyStats[month]++;
//     });

//     res.status(200).json({
//       labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
//       data: monthlyStats,
//     });
//   } catch (error) {
//     console.error("Get Monthly Completed Stats Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };






//                     //calander related codes 


// // Get user-specific assignment calendar events - GET /api/assignments/user-calendar
// export const getUserAssignmentCalendar = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).select('course batch');
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const { course, batch } = user;
//     console.log('User:', { userId: req.user._id, course, batch });

//     if (!course || !batch) {
//       return res.status(400).json({ message: 'User course or batch missing' });
//     }

//     const assignments = await Assignment.find({
//       course: { $regex: new RegExp(`^${course}$`, 'i') },
//       batch: { $regex: new RegExp(`^${batch}$`, 'i') },
//     }).select('title dueDate');

//     console.log('Assignments:', assignments.length, assignments);

//     const calendarEvents = assignments.map((assignment) => ({
//       _id: assignment._id,
//       title: assignment.title,
//       date: assignment.dueDate,
//     }));

//     res.status(200).json(calendarEvents);
//   } catch (error) {
//     console.error('Get User Assignment Calendar Error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };







import Assignment from '../models/Assignment.js';
import User from '../models/User.js';
import { uploadFileToS3 } from '../utils/s3.js';
import { sendAssignmentNotification } from '../services/emailService.js';


// Create a new assignment (Admin only) - POST /api/assignments
export const createAssignment = async (req, res) => {
 const { title, course, batch, subject, dueDate, dueTime, priority } = req.body;
 const userId = req.user._id;


 try {
   if (req.user.role !== 'admin') {
     return res.status(403).json({ message: 'Only admins can create assignments' });
   }


   // Validate required fields
   const missingFields = [];
   if (!title) missingFields.push('title');
   if (!course) missingFields.push('course');
   if (!batch) missingFields.push('batch');
   if (!subject) missingFields.push('subject');
   if (!dueDate) missingFields.push('dueDate');
   if (!dueTime) missingFields.push('dueTime');
   if (!req.file) missingFields.push('pdf');


   if (missingFields.length > 0) {
     return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
   }


   // Log request data for debugging
   console.log('Request body:', { title, course, batch, subject, dueDate, dueTime, priority });
   console.log('Request file:', req.file);


   const pdfUrl = await uploadFileToS3(req.file, 'assignments');


   const assignment = new Assignment({
     title,
     course,
     batch,
     subject,
     dueDate,
     dueTime,
     priority: priority || 'medium',
     status: 'pending',
     pdfUrl,
     createdBy: userId,
   });


   await assignment.save();


   // Fetch students in the specified course and batch
   const students = await User.find({ role: 'student', course, batch }).select('email');
   if (students.length > 0) {
     const studentEmails = students.map((student) => student.email);
     const emailData = {
       title: `New Assignment: ${title}`,
       message: `A new assignment has been added for your course ${course} (Batch: ${batch}). Please check the LMS for details.`,
       course,
       batch,
       subject,
       dueDate: new Date(dueDate).toLocaleDateString(),
       dueTime,
       priority,
     };


     await sendAssignmentNotification(studentEmails, 'New Assignment Notification', emailData);
   }


   res.status(201).json(assignment);
 } catch (error) {
   console.error('Create Assignment Error:', error);
   res.status(500).json({ message: 'Server error', error: error.message });
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
   console.log(`Deleting assignment with ID: ${id}, User: ${req.user.email}`);
  
   // Check if user is admin
   if (req.user.role !== "admin") {
     console.log("Unauthorized: User is not an admin");
     return res.status(403).json({ message: "Only admins can delete assignments" });
   }


   // Find the assignment
   const assignment = await Assignment.findById(id);
   if (!assignment) {
     console.log(`Assignment not found: ${id}`);
     return res.status(404).json({ message: "Assignment not found" });
   }


   // Delete the assignment
   await Assignment.findByIdAndDelete(id);
   console.log(`Assignment deleted: ${id}`);
  
   res.status(200).json({
     message: "Assignment deleted successfully",
     deletedId: id
   });
 } catch (error) {
   console.error("Delete Assignment Error:", error);
   res.status(500).json({
     message: "Server error",
     error: error.message
   });
 }
};


// ... (other imports and functions remain unchanged)

export const submitAssignment = async (req, res) => {
  const { id } = req.params;
  const { link } = req.body;
  const file = req.file;
  const userId = req.user?._id;
  const userEmail = req.user?.email;

  if (!userId || !userEmail) {
    return res.status(401).json({ message: "User authentication failed" });
  }

  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can submit assignments" });
    }

    const existingSubmission = assignment.submissions.find(
      (sub) => sub.student.toString() === userId.toString()
    );
    if (existingSubmission) {
      return res.status(400).json({ message: "You have already submitted this assignment" });
    }

    let submissionUrl, submissionType;
    const missingFields = [];
    if (!file && !link) missingFields.push("submission (file or link)");

    if (missingFields.length > 0) {
      return res.status(400).json({ message: `Missing required fields: ${missingFields.join(", ")}` });
    }

    if (file && link) {
      return res.status(400).json({ message: "Please submit either a file or a link, not both" });
    }

    console.log("Request body:", { link });
    console.log("Request file:", file);

    if (file) {
      if (!file.buffer || !file.mimetype) {
        console.log("Invalid file received:", file);
        return res.status(400).json({ message: "Invalid file data" });
      }
      try {
        submissionUrl = await uploadFileToS3(file, "submissions");
        submissionType = "file";
      } catch (uploadError) {
        console.error("S3 Upload Error:", uploadError);
        return res.status(500).json({ message: "Failed to upload file to S3", error: uploadError.message });
      }
    } else if (link) {
      if (!link.startsWith("http")) {
        return res.status(400).json({ message: "Invalid link format" });
      }
      submissionUrl = link;
      submissionType = "link";
    }

    const submittedAt = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const submission = {
      student: userId,
      submissionType,
      submissionUrl,
      submittedAt: new Date(),
    };

    assignment.submissions.push(submission);
    assignment.status = "completed"; // Update status to completed on submission
    await assignment.save();

    const emailData = {
      title: "Assignment Submission Confirmation",
      message: `Your assignment "${assignment.title}" has been successfully submitted on ${submittedAt}.`,
      assignmentTitle: assignment.title,
      submittedAt,
    };
    try {
      await sendSubmissionConfirmation(userEmail, "Assignment Submission Confirmation", emailData);
      console.log(`Confirmation email sent to ${userEmail} for assignment ${assignment.title}`);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
    }

    res.status(200).json({ message: "Assignment submitted successfully", assignment });
  } catch (error) {
    console.error("Submit Assignment Error:", error);
    res.status(500).json({ message: "Server error occurred", error: error.message });
  }
};


// ... (other functions remain unchanged)


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


//Get assignment calendar events - GET /api/assignments/calendar
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
    const currentYear = new Date().getFullYear(); // 2025
    const assignments = await Assignment.find({
      status: "completed",
      dueDate: {
        $gte: new Date(currentYear, 0, 1), // Start of 2025
        $lte: new Date(currentYear, 11, 31), // End of 2025
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
      datasets: [{ data: monthlyStats, color: (opacity = 1) => `rgba(34, 128, 176, ${opacity})` }],
    });
  } catch (error) {
    console.error("Get Monthly Completed Stats Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Get user-specific assignment calendar events - GET /api/assignments/user-calendar
export const getUserAssignmentCalendar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('course batch');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { course, batch } = user;
    console.log('User Details:', { userId: req.user._id, course, batch });

    if (!course || !batch) {
      return res.status(400).json({ message: 'User course or batch missing' });
    }

    // Debug: Fetch all assignments to check available data
    const allAssignments = await Assignment.find().select('course batch dueDate');
    console.log('All Assignments in DB:', allAssignments);

    // Fetch assignments for the user's course and batch
    const assignments = await Assignment.find({
      course: { $regex: new RegExp(`^${course}$`, 'i') },
      batch: { $regex: new RegExp(`^${batch}$`, 'i') },
      dueDate: { $exists: true, $ne: null, $type: "date" }, // Ensure dueDate is a valid Date
    }).select('title dueDate dueTime status submissions');

    console.log('Fetched Assignments for User:', assignments);

    if (!assignments.length) {
      console.log('No assignments found for user course and batch. Possible mismatch.');
      return res.status(200).json([]);
    }

    const calendarEvents = assignments.map((assignment) => ({
      _id: assignment._id,
      title: assignment.title,
      date: assignment.dueDate.toISOString().split('T')[0],
      time: assignment.dueTime,
      status: assignment.status || 'pending',
      submitted: assignment.submissions.some(s => s.student.toString() === req.user._id.toString()),
    }));

    console.log('Formatted Calendar Events:', calendarEvents);
    res.status(200).json(calendarEvents);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get minimal assignments - GET /api/assignments/minimal
export const getMinimalAssignments = async (req, res) => {
 try {
   const assignments = await Assignment.find({}, 'title _id'); // Fetch only title and _id
   res.status(200).json(assignments);
 } catch (error) {
   console.error("Get Minimal Assignments Error:", error);
   res.status(500).json({ message: "Server error", error: error.message });
 }
};


// Get assignment counts for user - GET /api/assignments/counts
export const getAssignmentCounts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('course batch');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { course, batch } = user;
    console.log('User:', { userId: req.user._id, course, batch });

    if (!course || !batch) {
      return res.status(400).json({ message: 'User course or batch missing' });
    }

    const assignments = await Assignment.find({
      course: { $regex: new RegExp(`^${course}$`, 'i') },
      batch: { $regex: new RegExp(`^${batch}$`, 'i') },
    }).select('status submissions');

    const dueCount = assignments.filter((a) => {
      const userSubmitted = a.submissions.some(s => s.student.toString() === req.user._id.toString());
      return a.status === 'pending' && !userSubmitted;
    }).length;

    const completedCount = assignments.filter((a) => {
      const userSubmitted = a.submissions.some(s => s.student.toString() === req.user._id.toString());
      return a.status === 'completed' || userSubmitted;
    }).length;

    res.status(200).json({ dueCount, completedCount });
  } catch (error) {
    console.error("Get Assignment Counts Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Get all assignment calendar events - GET /api/assignments/all-calendar
export const getAllAssignmentCalendar = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      dueDate: { $exists: true, $ne: null, $type: "date" },
    }).select('title dueDate dueTime status submissions');

    console.log('All Assignments Fetched:', assignments);

    if (!assignments.length) {
      console.log('No assignments found in the database');
      return res.status(200).json([]);
    }

    const calendarEvents = assignments.map((assignment) => ({
      _id: assignment._id,
      title: assignment.title,
      date: assignment.dueDate.toISOString().split('T')[0],
      time: assignment.dueTime,
      status: assignment.status || 'pending',
      submitted: assignment.submissions.some(s => s.student.toString() === req.user._id.toString()),
    }));

    console.log('Formatted Calendar Events:', calendarEvents);
    res.status(200).json(calendarEvents);
  } catch (error) {
    console.error('Error fetching all assignments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};






// Get assignment progress for the user - GET /api/assignments/progress

export const getAssignmentProgress = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(req.user._id).select('course');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { course } = user;
    if (!course) {
      return res.status(400).json({ message: 'User course missing' });
    }

    console.log(`Fetching assignments for course: ${course}`);

    // Fetch all assignments for the user's course
    const assignments = await Assignment.find({
      course: { $regex: new RegExp(`^${course}$`, 'i') },
    }).select('status');

    console.log(`Found ${assignments.length} assignments`);

    const totalAssignments = assignments.length;
    if (totalAssignments === 0) {
      console.log('No assignments found for the given course');
      return res.status(200).json({ total: 0, completed: 0, progress: 0 });
    }

    // Count assignments with status "completed"
    const completedCount = assignments.filter((a) => a.status === 'completed').length;
    console.log(`Completed assignments: ${completedCount}`);

    const progress = totalAssignments > 0 ? (completedCount / totalAssignments) * 100 : 0;

    res.status(200).json({ total: totalAssignments, completed: completedCount, progress });
  } catch (error) {
    console.error("Get Assignment Progress Error:", error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format', error: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




// Get all PDF assignments with download links
export const getAllPdfAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      pdfUrl: { $exists: true, $ne: null }, // Ensure pdfUrl exists and is not null
    }).select("title pdfUrl createdAt");

    if (!assignments.length) {
      return res.status(404).json({ message: "No PDF assignments found" });
    }

    res.status(200).json(assignments);
  } catch (error) {
    console.error("Get All PDF Assignments Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getUserSubmittedAssignments = async (req, res) => {
  try {
    const { course, batch } = req.query;

    // Build query based on filters
    const query = {};
    if (course) query.course = course;
    if (batch) query.batch = batch;

    // Fetch assignments with submissions and populate student details
    const assignments = await Assignment.find(query)
      .populate({
        path: "submissions.student",
        select: "name batch course",
      })
      .lean();

    // Transform data to include only relevant submission details
    const responseData = assignments.map((assignment) => ({
      _id: assignment._id,
      title: assignment.title,
      course: assignment.course,
      batch: assignment.batch,
      submittedAt: assignment.submissions.length > 0 ? assignment.submissions[0].submittedAt : null,
      submissions: assignment.submissions.map((submission) => ({
        student: submission.student,
        submittedAt: submission.submittedAt,
        submissionType: submission.submissionType,
        submissionUrl: submission.submissionUrl,
      })),
    }));

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching user submitted assignments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};