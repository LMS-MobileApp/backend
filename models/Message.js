import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  groupChat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GroupChat",
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Message", messageSchema);


