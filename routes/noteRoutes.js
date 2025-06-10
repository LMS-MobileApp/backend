import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import { createNote, getUserNotes, getNote, updateNote, deleteNote } from "../controllers/noteController.js";

const router = express.Router();

router.post("/", auth, createNote);         // Create a note
router.get("/", auth, getUserNotes);        // Get all user notes
router.get("/:noteId", auth, getNote);      // Get a specific note
router.put("/:noteId", auth, updateNote);   // Update a note
router.delete("/:noteId", auth, deleteNote); // Delete a note

export default router;