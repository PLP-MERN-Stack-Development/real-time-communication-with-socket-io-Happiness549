const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("Server is running...");
});

const users = {};
const messages = {}; // store messages by room for pagination

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join room
  socket.on("join", ({ username, room }) => {
    socket.username = username;
    socket.room = room;
    socket.join(room);
    users[socket.id] = { username, room };

    // Send system join message
    const joinMsg = { id: Date.now(), sender: "System", text: `${username} joined ${room}`, time: new Date().toLocaleTimeString() };
    io.to(room).emit("chat-message", joinMsg);

    // Send last 50 messages for pagination
    if (!messages[room]) messages[room] = [];
    const lastMessages = messages[room].slice(-50);
    socket.emit("previous-messages", lastMessages);

    // Update online users
    const roomUsers = Object.values(users).filter(u => u.room === room).map(u => u.username);
    io.to(room).emit("user-list", roomUsers);
  });

  // Global / room chat
  socket.on("chat-message", (data) => {
    if (!data.id) data.id = Date.now();
    messages[socket.room] = messages[socket.room] || [];
    messages[socket.room].push(data);
    io.to(socket.room).emit("chat-message", data);
  });

  // Typing indicator
  socket.on("typing", (username) => {
    socket.to(socket.room).emit("typing", username);
  });

  // Private messages
  socket.on("private-message", ({ receiver, text, sender, id }) => {
    const receiverSocket = Object.keys(users).find(id => users[id].username === receiver);
    if (receiverSocket) {
      const msg = { id: id || Date.now(), sender, text, time: new Date().toLocaleTimeString(), private: true };
      io.to(receiverSocket).emit("private-message", msg);
      // Store private messages if needed (optional)
    }
  });

  // File / image messages
  socket.on("file-message", ({ fileData, fileName, sender, id }) => {
    const fileMsg = { id: id || Date.now(), sender, fileData, fileName, time: new Date().toLocaleTimeString(), isFile: true };
    messages[socket.room] = messages[socket.room] || [];
    messages[socket.room].push(fileMsg);
    io.to(socket.room).emit("file-message", fileMsg);
  });

  // Read receipts
  socket.on("message-read", ({ messageId }) => {
    io.to(socket.room).emit("message-read", { messageId, reader: socket.username });
  });

  // Disconnect
  socket.on("disconnect", () => {
    if (socket.username && socket.room) {
      const leaveMsg = { id: Date.now(), sender: "System", text: `${socket.username} left ${socket.room}`, time: new Date().toLocaleTimeString() };
      io.to(socket.room).emit("chat-message", leaveMsg);

      delete users[socket.id];

      // Update online users
      const roomUsers = Object.values(users).filter(u => u.room === socket.room).map(u => u.username);
      io.to(socket.room).emit("user-list", roomUsers);
    }
    console.log("User disconnected:", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
