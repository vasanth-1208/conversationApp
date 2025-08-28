
// ===== Allowed Users =====
const validUsers = {
  user1: "123",
  user2: "789",
};

// ===== Login =====
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (validUsers[username] && validUsers[username] === password) {
    localStorage.setItem("chatUser", username);
    window.location.href = "chat.html";
  } else {
    alert("❌ Invalid username or password!");
  }
}


// ===== Socket.io connection =====
const socket = io("https://conversationapp.onrender.com");

// ===== Load Chat History =====
async function loadMessages() {
  const messagesDiv = document.getElementById("messages");
  const username = localStorage.getItem("chatUser");
  if (!username) return;

  const res = await fetch("https://conversationapp.onrender.com/messages");
  const messages = await res.json();

  messagesDiv.innerHTML = "";
  messages.forEach((msg) => {
    appendMessage(msg.sender, msg.text, username);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ===== Append message to chat =====
function appendMessage(sender, text, currentUser) {
  const messagesDiv = document.getElementById("messages");
  const bubble = document.createElement("div");
  
  // Normalize both to lowercase for comparison
  bubble.className = sender.toLowerCase() === currentUser.toLowerCase() ? "message sent" : "message received";

  // Avatar
  const avatar = document.createElement("img");
  avatar.className = "avatar";
  if(sender === "user1") {
    avatar.src = "avatar1.jpg"; // path to your image
  } else if(sender === "user2") {
    avatar.src = "avatar2.jpg"; // path to second image
  } else {
    avatar.src = "default.jpg"; // fallback image
  }
  bubble.appendChild(avatar);


  const content = document.createElement("div");
  content.className = "content";
  content.textContent = text;
  bubble.appendChild(content);

  messagesDiv.appendChild(bubble);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


// ===== Send Message =====
function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  const username = localStorage.getItem("chatUser");
  if (!text || !username) return;

  const msg = { sender: username, text };
  socket.emit("sendMessage", msg); // send to server
  input.value = "";
}

// ===== Receive new messages =====
socket.on("newMessage", (msg) => {
  const username = localStorage.getItem("chatUser");
  appendMessage(msg.sender, msg.text, username);
});

// ===== Protect Chat Page =====
window.addEventListener("DOMContentLoaded", () => {
  const chatHeader = document.getElementById("chatHeader");
  const username = localStorage.getItem("chatUser");

  if (chatHeader && !username) {
    window.location.href = "index.html";
    return;
  }

  if (chatHeader && username) {
  // Determine the opposite user
  const otherUser = username === "user1" ? "user2" : "user1";
  
  // Set header name and avatar
  document.getElementById("headerName").textContent = otherUser;
  const avatarImg = document.getElementById("headerAvatar");
  avatarImg.src = otherUser === "user1" ? "avatar1.jpg" : "avatar2.jpg";

  loadMessages();

  document.getElementById("sendBtn").addEventListener("click", sendMessage);
  document.getElementById("messageInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

});
