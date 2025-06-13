// import { config } from "./config.js";
// import express from "express";
// import mongoose from "mongoose";
// import swaggerUi from "swagger-ui-express";
// import yaml from "yamljs";
// import { Server } from "socket.io";
// import http from "http";
// import User from "./models/User.js";
// import Message from "./models/Message.js";
// import GroupChat from "./models/GroupChat.js";
// import authRoutes from "./routes/authRoutes.js";
// import assignmentRoutes from "./routes/assignmentRoutes.js";
// import groupChatRoutes from "./routes/groupChatRoutes.js";
// import noteRoutes from "./routes/noteRoutes.js";
// import chatRoutes from "./routes/chatRoutes.js";
// import cors from "cors";

// const app = express();
// const PORT = config.PORT;

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
// });

// app.use(cors({ origin: "*" }));
// app.use(express.json());

// io.on("connection", (socket) => {
//   console.log("User connected:", socket.id);

//   socket.on("joinGroupChat", async ({ groupChatId, userId }) => {
//     try {
//       const groupChat = await GroupChat.findById(groupChatId);
//       if (!groupChat) {
//         socket.emit("error", "Group chat not found");
//         return;
//       }
//       if (!groupChat.members.includes(userId)) {
//         socket.emit("error", "You are not a member of this group");
//         return;
//       }
//       socket.join(groupChatId);
//       console.log(`${userId} joined group chat: ${groupChatId}`);
//       socket.to(groupChatId).emit("message", {
//         user: "System",
//         text: `${userId} has joined the chat`,
//         timestamp: new Date(),
//       });
//     } catch (err) {
//       console.error("Join Group Chat Error:", err);
//       socket.emit("error", "Failed to join group chat");
//     }
//   });

//   socket.on("sendMessage", async ({ groupChatId, userId, content }) => {
//     try {
//       const groupChat = await GroupChat.findById(groupChatId);
//       if (!groupChat) {
//         socket.emit("error", "Group chat not found");
//         return;
//       }
//       if (!groupChat.members.includes(userId)) {
//         socket.emit("error", "You are not a member of this group");
//         return;
//       }

//       const message = new Message({
//         groupChat: groupChatId,
//         sender: userId,
//         content,
//       });
//       await message.save();

//       io.to(groupChatId).emit("message", {
//         user: userId,
//         text: content,
//         timestamp: message.sentAt,
//       });
//       console.log(`Message in ${groupChatId} from ${userId}: ${content}`);
//     } catch (err) {
//       console.error("Send Message Error:", err);
//       socket.emit("error", "Failed to send message");
//     }
//   });

//   socket.on("leaveGroupChat", ({ groupChatId, userId }) => {
//     socket.leave(groupChatId);
//     console.log(`${userId} left group chat: ${groupChatId}`);
//     socket.to(groupChatId).emit("message", {
//       user: "System",
//       text: `${userId} has left the chat`,
//       timestamp: new Date(),
//     });
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });

// const seedAdmin = async () => {
//   try {
//     const adminExists = await User.findOne({ email: "admin@example.com" });
//     if (!adminExists) {
//       const admin = new User({
//         name: "Default Admin",
//         email: "admin@example.com",
//         password: "admin123",
//         role: "admin",
//       });
//       await admin.save();
//       console.log("Default admin created");
//     }
//   } catch (err) {
//     console.error("Error seeding admin:", err);
//   }
// };

// mongoose
//   .connect(config.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => {
//     console.log("MongoDB connected");
//     seedAdmin();
//   })
//   .catch((err) => console.error("MongoDB connection error:", err));

// const swaggerDoc = yaml.load("./swagger.yaml");
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// app.use("/api/auth", authRoutes);
// app.use("/api/assignments", assignmentRoutes);
// app.use("/api/group-chats", groupChatRoutes);
// app.use("/api/notes", noteRoutes);
// app.use("/api/chat", chatRoutes);

// app.get("/", (req, res) => {
//   res.send("LMS Backend is running!");
// });

// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


import { config } from "./config.js";
import express from "express";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import yaml from "yamljs";
import { Server } from "socket.io";
import http from "http";
import User from "./models/User.js";
import Message from "./models/Message.js";
import GroupChat from "./models/GroupChat.js";
import authRoutes from "./routes/authRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import groupChatRoutes from "./routes/groupChatRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import cors from "cors";

const app = express();
const PORT = config.PORT;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors({ origin: "*" }));
app.use(express.json());

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinGroupChat", async ({ groupChatId, userId }) => {
    try {
      const groupChat = await GroupChat.findById(groupChatId);
      if (!groupChat) {
        socket.emit("error", "Group chat not found");
        return;
      }
      if (!groupChat.members.includes(userId)) {
        socket.emit("error", "You are not a member of this group");
        return;
      }
      socket.join(groupChatId);
      console.log(`${userId} joined group chat: ${groupChatId}`);
      socket.to(groupChatId).emit("message", {
        user: "System",
        text: `${userId} has joined the chat`,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error("Join Group Chat Error:", err);
      socket.emit("error", "Failed to join group chat");
    }
  });

  socket.on("sendMessage", async ({ groupChatId, userId, content }) => {
    try {
      const groupChat = await GroupChat.findById(groupChatId);
      if (!groupChat) {
        socket.emit("error", "Group chat not found");
        return;
      }
      if (!groupChat.members.includes(userId)) {
        socket.emit("error", "You are not a member of this group");
        return;
      }

      const message = new Message({
        groupChat: groupChatId,
        sender: userId,
        content,
      });
      await message.save();

      io.to(groupChatId).emit("message", {
        user: userId,
        text: content,
        timestamp: message.sentAt,
      });
      console.log(`Message in ${groupChatId} from ${userId}: ${content}`);
    } catch (err) {
      console.error("Send Message Error:", err);
      socket.emit("error", "Failed to send message");
    }
  });

  socket.on("leaveGroupChat", ({ groupChatId, userId }) => {
    socket.leave(groupChatId);
    console.log(`${userId} left group chat: ${groupChatId}`);
    socket.to(groupChatId).emit("message", {
      user: "System",
      text: `${userId} has left the chat`,
      timestamp: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: "admin.com" });
    if (!adminExists) {
      const admin = new User({
        name: "Default Admin",
        email: "admin.com",
        password: "admin123",
        role: "admin",
      });
      await admin.save();
      console.log("Default admin created");
    }
  } catch (err) {
    console.error("Error seeding admin:", err);
  }
};

mongoose
  .connect(config.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    seedAdmin();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

const swaggerDoc = yaml.load("./swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.use("/api/auth", authRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/group-chats", groupChatRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("LMS Backend is running!");
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

