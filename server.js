const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
require('dotenv').config();


const app = express();

// Create HTTP server for Socket.io
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
// Socket.io
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "https://conversationapp-1.onrender.com", // frontend URL
    methods: ["GET", "POST"]
  }
});


// Middleware
app.use(cors({
  origin: "https://conversationapp-1.onrender.com", // frontend URL
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(bodyParser.json());
app.use(express.static("public"));

// MongoDB connection
// MongoDB connection
mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("MongoDB connected"));


// Message Schema
const messageSchema = new mongoose.Schema({
  sender: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", messageSchema);

// API to fetch all messages
app.get("/messages", async (req, res) => {
  const messages = await Message.find().sort({ createdAt: 1 });
  res.json(messages);
});

// Socket.io for real-time messages
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("sendMessage", async (msg) => {
    const message = new Message(msg);
    await message.save();

    // Broadcast to all clients
    io.emit("newMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
// Delete a single message
// Delete a single message
app.delete("/messages/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Message.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ success: false, error: "Message not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).json({ success: false, error: "Failed to delete message" });
  }
});


// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Delete a message by ID
app.delete("/messages/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedMessage = await Message.findByIdAndDelete(id);
    if (!deletedMessage) return res.status(404).json({ error: "Message not found" });
    io.emit("deleteMessage", id); // notify all clients
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
