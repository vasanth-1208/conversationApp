const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "https://conversationapp-1.onrender.com",
    methods: ["GET", "POST", "DELETE"],
  },
});

app.use(
  cors({
    origin: "https://conversationapp-1.onrender.com",
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(express.static("public"));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB error:"));
db.once("open", () => console.log("MongoDB connected"));

// Schema
const messageSchema = new mongoose.Schema({
  sender: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", messageSchema);

// Fetch messages
app.get("/messages", async (req, res) => {
  const messages = await Message.find().sort({ createdAt: 1 });
  res.json(messages);
});

// Delete message
app.delete("/messages/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Message.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Message not found" });
    io.emit("deleteMessage", id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// Socket
io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("sendMessage", async (msg) => {
    try {
      const message = new Message(msg);
      await message.save();
      io.emit("newMessage", message);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
