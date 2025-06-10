import mongoose from "mongoose";

const groupChatSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  name: { type: String, required: true }, // e.g., "Group for Assignment 1"
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("GroupChat", groupChatSchema);