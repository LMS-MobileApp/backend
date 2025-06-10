import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import { chatWithBot } from "../controllers/chatController.js";

const router = express.Router();
router.post("/", auth, chatWithBot);
export default router;