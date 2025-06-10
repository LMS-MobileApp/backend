import axios from "axios";
import dotenv from "dotenv";
import Assignment from "../models/Assignment.js";
import User from "../models/User.js";
import Note from "../models/Note.js";
import GroupChat from "../models/GroupChat.js";
import Message from "../models/Message.js";

dotenv.config();

const GPT_TOKEN = process.env.GPT_TOKEN;
const GPT_ENDPOINT = process.env.GPT_ENDPOINT;
const GPT_MODEL = process.env.GPT_MODEL;

// Fetch data from database based on user context
const fetchDatabaseContext = async (userId) => {
  const [assignments, notes, groupChats, messages, users] = await Promise.all([
    Assignment.find({ "submissions.student": { $ne: userId } })
      .select("title course dueDate dueTime submissions")
      .lean(),
    Note.find({ user: userId }).select("assignment content type createdAt").lean(),
    GroupChat.find({ members: userId }).select("name assignment members").lean(),
    Message.find({ "sender._id": userId }).select("groupChat content sentAt").lean(),
    User.findOne({ _id: userId }).select("name email course batch regNo").lean(),
  ]);

  return {
    assignments: assignments.map((a) => ({
      title: a.title,
      course: a.course,
      dueDate: `${a.dueDate} ${a.dueTime}`,
      submitted: a.submissions.some((sub) => sub.student.toString() === userId.toString()),
    })),
    notes: notes.map((n) => ({
      assignment: n.assignment.toString(),
      content: n.content,
      type: n.type,
      createdAt: n.createdAt,
    })),
    groupChats: groupChats.map((g) => ({
      name: g.name,
      assignment: g.assignment.toString(),
      members: g.members.length,
    })),
    messages: messages.map((m) => ({
      groupChat: m.groupChat.toString(),
      content: m.content,
      sentAt: m.sentAt,
    })),
    user: {
      name: users.name,
      email: users.email,
      course: users.course,
      batch: users.batch,
      regNo: users.regNo,
    },
  };
};

// Call GPT-4o with context
const callGPT = async (message, context) => {
  const prompt = `
    You are a chatbot for a Learning Management System (LMS). The user asked: "${message}".
    Use the following database context to provide an accurate, concise, and natural response.
    If the query is unclear or outside the context, offer a helpful suggestion.

    Context:
    - User: ${JSON.stringify(context.user)}
    - Assignments: ${JSON.stringify(context.assignments)}
    - Notes: ${JSON.stringify(context.notes)}
    - Group Chats: ${JSON.stringify(context.groupChats)}
    - Messages: ${JSON.stringify(context.messages)}

    Respond naturally, as if talking to the user.
  `;

  try {
    const response = await axios.post(
      `${GPT_ENDPOINT}/chat/completions`,
      {
        model: GPT_MODEL,
        messages: [
          { role: "system", content: "You are a helpful LMS assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${GPT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("GPT-4o Error:", error.response?.data || error.message);
    throw new Error("Sorry, I couldn’t process that right now.");
  }
};

// Chatbot main function
export const chatWithBot = async (req, res) => {
  const { message } = req.body;
  const userId = req.user._id;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ message: "Please provide a valid message" });
  }

  try {
    // Fetch user-specific data from the database
    const context = await fetchDatabaseContext(userId);

    // Get response from GPT-4o
    const botResponse = await callGPT(message, context);

    res.status(200).json({ message: botResponse });
  } catch (error) {
    console.error("Chatbot Error:", error);
    res.status(500).json({ message: error.message || "Sorry, something went wrong. Try again later!" });
  }
};