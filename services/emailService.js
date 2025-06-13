import nodemailer from "nodemailer";
import { config } from "../config.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log email configuration
console.log("Email Config:", {
  host: config.EMAIL_HOST,
  port: config.EMAIL_PORT,
  user: config.EMAIL_USER,
  pass: config.EMAIL_PASS ? "[REDACTED]" : undefined,
});

const transporter = nodemailer.createTransport({
  host: config.EMAIL_HOST,
  port: parseInt(config.EMAIL_PORT, 10),
  secure: false, // Use true for port 465, false for 587 (STARTTLS)
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
  family: 4,
  tls: {
    rejectUnauthorized: true,
  },
  logger: true,
  debug: true,
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("SMTP server is ready to take messages");
  }
});

// Function to render the email template
const renderTemplate = async (templateName, data) => {
  const templatePath = path.join(__dirname, "..", "templates", `${templateName}.html`);
  let template = await fs.readFile(templatePath, "utf-8");

  // Replace placeholders with data
  for (const [key, value] of Object.entries(data)) {
    template = template.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return template;
};

// General send email function
const sendEmail = async (to, subject, data, templateName = "assignmentNotification") => {
  try {
    if (!config.EMAIL_USER || !config.EMAIL_PASS) {
      throw new Error("Email credentials are not configured");
    }

    const html = await renderTemplate(templateName, data);

    const mailOptions = {
      from: config.EMAIL_USER,
      to: Array.isArray(to) ? to.join(",") : to,
      subject,
      html,
    };

    console.log("Sending email with options:", mailOptions);
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
    return info;
  } catch (err) {
    console.error("Email sending error:", err);
    throw err;
  }
};

// Specific function for submission confirmation
export const sendSubmissionConfirmation = async (to, assignmentTitle, submittedAt) => {
  const data = {
    title: "Assignment Submission Confirmation",
    message: `Your assignment "${assignmentTitle}" has been successfully submitted on ${submittedAt}.`,
    assignmentTitle,
    submittedAt,
  };
  return sendEmail(to, "Assignment Submission Confirmation", data, "submissionConfirmation");
};

// Function for assignment creation notification
export const sendAssignmentNotification = async (to, subject, data) => {
  return sendEmail(to, subject, data, "assignmentNotification");
};

export default sendEmail;