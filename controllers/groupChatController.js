import GroupChat from "../models/GroupChat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Assignment from "../models/Assignment.js";

const createGroupChat = async (req, res) => {
  const { assignmentTitle, name } = req.body;

  console.log("Create Group Chat Request:", { assignmentTitle, name, userId: req.user?._id });

  try {
    if (!assignmentTitle || !name) {
      return res.status(400).json({ message: "Assignment title and name are required" });
    }

    const assignment = await Assignment.findOne({ title: assignmentTitle });
    if (!assignment) {
      console.log("Assignment not found for title:", assignmentTitle);
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (!req.user || !req.user._id) {
      console.log("User not authenticated:", req.user);
      return res.status(401).json({ message: "User not authenticated" });
    }

    const groupChat = new GroupChat({
      assignment: assignment._id, // Use the found assignment's ID
      name,
      members: [req.user._id],
    });

    await groupChat.save();
    const populatedGroupChat = await GroupChat.findById(groupChat._id).populate("assignment", "title");
    console.log("Group Chat Created:", populatedGroupChat);
    res.status(201).json(populatedGroupChat);
  } catch (err) {
    console.error("Create Group Chat Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// No changes to other functions—they still work with groupChat._id
const joinGroupChat = async (req, res) => {
  const { groupChatId } = req.params;

  try {
    const groupChat = await GroupChat.findById(groupChatId);
    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    if (groupChat.members.includes(req.user._id)) {
      return res.status(400).json({ message: "You are already a member" });
    }

    groupChat.members.push(req.user._id);
    await groupChat.save();
    const populatedGroupChat = await GroupChat.findById(groupChatId).populate("assignment", "title");
    res.status(200).json(populatedGroupChat);
  } catch (err) {
    console.error("Join Group Chat Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getGroupChatMessages = async (req, res) => {
  const { groupChatId } = req.params;

  try {
    const groupChat = await GroupChat.findById(groupChatId);
    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    if (!groupChat.members.includes(req.user._id)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const messages = await Message.find({ groupChat: groupChatId })
      .populate("sender", "name email")
      .sort("sentAt");
    res.status(200).json(messages);
  } catch (err) {
    console.error("Get Messages Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const sendGroupChatMessage = async (req, res) => {
  const { groupChatId } = req.params;
  const { content } = req.body;

  try {
    const groupChat = await GroupChat.findById(groupChatId);
    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }
    if (!groupChat.members.includes(req.user._id)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const message = new Message({
      groupChat: groupChatId,
      sender: req.user._id,
      content,
      sentAt: new Date(),
    });

    await message.save();
    const populatedMessage = await Message.findById(message._id).populate("sender", "name email");

    const io = req.app.get("io");
    if (io) {
      io.to(groupChatId).emit("message", populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("Send Message Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const leaveGroupChat = async (req, res) => {
  const { groupChatId } = req.params;

  try {
    const groupChat = await GroupChat.findById(groupChatId);
    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    const memberIndex = groupChat.members.indexOf(req.user._id);
    if (memberIndex === -1) {
      return res.status(400).json({ message: "You are not a member" });
    }

    groupChat.members.splice(memberIndex, 1);
    await groupChat.save();
    res.status(200).json({ message: "Left group chat successfully" });
  } catch (err) {
    console.error("Leave Group Chat Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getAllGroupChats = async (req, res) => {
  try {
    const groupChats = await GroupChat.find({ members: req.user._id }).populate("assignment", "title");
    res.status(200).json(groupChats);
  } catch (err) {
    console.error("Get All Group Chats Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getAllGroupChatsPublic = async (req, res) => {
  try {
    const groupChats = await GroupChat.find().populate("assignment", "title");
    res.status(200).json(groupChats);
  } catch (err) {
    console.error("Get All Group Chats Public Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export {
  createGroupChat,
  joinGroupChat,
  getGroupChatMessages,
  sendGroupChatMessage,
  leaveGroupChat,
  getAllGroupChats,
  getAllGroupChatsPublic,
};