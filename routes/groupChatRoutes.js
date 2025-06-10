import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import {
  createGroupChat,
  joinGroupChat,
  getGroupChatMessages,
  sendGroupChatMessage,
  leaveGroupChat,
  getAllGroupChats,
  getAllGroupChatsPublic,
} from "../controllers/groupChatController.js";

const router = express.Router();

router.post("/", auth, createGroupChat);
router.post("/:groupChatId/join", auth, joinGroupChat);
router.get("/:groupChatId/messages", auth, getGroupChatMessages);
router.post("/:groupChatId/messages", auth, sendGroupChatMessage);
router.post("/:groupChatId/leave", auth, leaveGroupChat);
router.get("/", auth, getAllGroupChats);
router.get("/all", auth, getAllGroupChatsPublic);

export default router;