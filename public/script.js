
// ===== Allowed Users =====
const validUsers = {
  user1: "1208",
  user2: "120824",
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
    appendMessage(msg.sender, msg.text, username, msg._id);
  });


  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ===== Append message to chat =====
function appendMessage(sender, text, currentUser, id) {
  const messagesDiv = document.getElementById("messages");
  const bubble = document.createElement("div");
  bubble.className = sender.toLowerCase() === currentUser.toLowerCase() ? "message sent" : "message received";

  // Assign unique data-id to bubble
  bubble.setAttribute("data-id", id);

  // Avatar
  const avatar = document.createElement("img");
  avatar.className = "avatar";
  avatar.src = sender === "user1" ? "avatar1.jpg" : sender === "user2" ? "avatar2.jpg" : "default.jpg";
  bubble.appendChild(avatar);

  // Message content
  const content = document.createElement("div");
  content.className = "content";
  content.textContent = text;
  bubble.appendChild(content);

  // Add delete button if it’s your own message
  if(sender === currentUser) {
    const delBtn = document.createElement("button");
    delBtn.textContent = "❌";
    delBtn.className = "delete-btn";
    delBtn.onclick = async () => {
      try {
        const res = await fetch(`https://conversationapp.onrender.com/messages/${id}`, { method: "DELETE" });
        if(res.ok) {
          bubble.remove(); // Remove from DOM immediately
          socket.emit("messageDeleted", id); // notify other clients
        } else {
          alert("Failed to delete message");
        }
      } catch(err) {
        console.error(err);
        alert("Error deleting message");
      }
    };
    bubble.appendChild(delBtn);
  }

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
