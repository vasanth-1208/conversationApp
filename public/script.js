// ===== Allowed Users =====
const validUsers = {
  user1: "1208",
  user2: "120824",
};

let deleteMode = false;
const selectedMessages = new Set();

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
  bubble.setAttribute("data-id", id);

  // Checkbox (visible only in delete mode)
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "message-checkbox";
  checkbox.style.display = deleteMode ? "inline-block" : "none";
  checkbox.onchange = (e) => {
    if(e.target.checked) selectedMessages.add(id);
    else selectedMessages.delete(id);
  };
  bubble.appendChild(checkbox);

  // Avatar
  const avatar = document.createElement("img");
  avatar.className = "avatar";
  avatar.src = sender === "user1" ? "avatar1.jpg" : sender === "user2" ? "avatar2.jpg" : "default.jpg";
  bubble.appendChild(avatar);

  // Content
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
  appendMessage(msg.sender, msg.text, username, msg._id);
});

// ===== Delete Messages =====
// ===== Delete Messages =====
async function deleteSelectedMessages() {
  for (let id of selectedMessages) {
    try {
      const res = await fetch(`https://conversationapp.onrender.com/messages/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        console.error(`Failed to delete message ${id}`);
        alert("⚠️ Failed to delete some messages.");
      } else {
        const msgEl = document.querySelector(`[data-id='${id}']`);
        if (msgEl) msgEl.remove();
      }
    } catch (err) {
      console.error("Error deleting:", err);
      alert("⚠️ Failed to delete some messages.");
    }
  }

  selectedMessages.clear();
  deleteMode = false;
  document.querySelectorAll(".message-checkbox").forEach(cb => cb.style.display = "none");
  const btn = document.getElementById("deleteSelectedBtn");
  if (btn) btn.remove();
}


// ===== Enable Delete Mode =====
function enableDeleteMode() {
  deleteMode = true;
  document.querySelectorAll(".message-checkbox").forEach(cb => cb.style.display = "inline-block");

  // Add a delete button on top
  let delBtn = document.getElementById("deleteSelectedBtn");
  if (!delBtn) {
    delBtn = document.createElement("button");
    delBtn.id = "deleteSelectedBtn";
    delBtn.textContent = "Delete Selected";
    delBtn.onclick = deleteSelectedMessages;
    document.getElementById("chatHeader").appendChild(delBtn);
  }
}

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

    // Three-dot menu click
    const menuBtn = document.getElementById("menuBtn");
    const menuDropdown = document.getElementById("menuDropdown");
    menuBtn.onclick = () => {
      menuDropdown.style.display = menuDropdown.style.display === "none" ? "block" : "none";
    };

    document.getElementById("enableDeleteMode").onclick = () => {
      menuDropdown.style.display = "none";
      enableDeleteMode();
    };
  }
});
