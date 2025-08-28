const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");

const app = express();
const PORT = 5000;

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Socket.io
const { Server } = require("socket.io");
const io = new Server(server);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// MongoDB connection
// MongoDB connection
mongoose.connect(
  "mongodb+srv://viper:viper%40120824@cluster0.g6zjhu9.mongodb.net/chat-app?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

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

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
