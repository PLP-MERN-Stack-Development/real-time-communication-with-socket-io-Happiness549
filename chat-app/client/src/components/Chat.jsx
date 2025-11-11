import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const socket = io("http://localhost:5000");

function Chat({ username, room }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [users, setUsers] = useState([]);
  const [receiver, setReceiver] = useState("All");
  const [file, setFile] = useState(null);
  const [readReceipts, setReadReceipts] = useState({});
  const messagesEndRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    socket.emit("join", { username, room });

    socket.on("chat-message", data => setMessages(prev => [...prev, data]));
    socket.on("private-message", data => setMessages(prev => [...prev, { ...data, private: true }]));
    socket.on("file-message", data => setMessages(prev => [...prev, { ...data, isFile: true }]));
    socket.on("user-list", list => setUsers(list));
    socket.on("typing", user => { setTypingUser(user); setTimeout(() => setTypingUser(""), 2000); });
    socket.on("message-read", ({ messageId, reader }) => {
      setReadReceipts(prev => {
        const current = prev[messageId] || [];
        if (!current.includes(reader)) return { ...prev, [messageId]: [...current, reader] };
        return prev;
      });
    });
    socket.on("previous-messages", msgs => setMessages(msgs));

    return () => socket.off();
  }, []);

  // Mark messages as read
  useEffect(() => {
    messages.forEach(msg => {
      if (!readReceipts[msg.id] && msg.sender !== username) {
        socket.emit("message-read", { messageId: msg.id });
        setReadReceipts(prev => ({ ...prev, [msg.id]: [username] }));
      }
    });
  }, [messages]);

  const handleFileChange = e => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => setFile({ data: reader.result, name: selectedFile.name });
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSend = e => {
    e.preventDefault();

    if (file) {
      const fileMsg = { id: uuidv4(), sender: username, fileData: file.data, fileName: file.name, time: new Date().toLocaleTimeString(), isFile: true };
      socket.emit("file-message", fileMsg);
      setMessages(prev => [...prev, fileMsg]);
      setFile(null);
      return;
    }

    if (message.trim()) {
      const msgData = { id: uuidv4(), text: message, sender: username, time: new Date().toLocaleTimeString() };
      if (receiver === "All") socket.emit("chat-message", msgData);
      else socket.emit("private-message", { ...msgData, receiver });
      setMessages(prev => [...prev, { ...msgData, private: receiver !== "All" }]);
      setMessage("");
    }
  };

  const handleTyping = () => socket.emit("typing", username);

  return (
    <div style={{ maxWidth: 600, margin: "30px auto", textAlign: "center" }}>
      <h2>💬 Room: #{room}</h2>

      <div style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px", borderRadius: "8px", textAlign: "left" }}>
        <strong>Online Users:</strong>
        <select onChange={e => setReceiver(e.target.value)} value={receiver} style={{ marginLeft: "10px", padding: "5px", borderRadius: "5px", border: "1px solid #ccc" }}>
          <option value="All">All (Global Chat)</option>
          {users.filter(u => u !== username).map((u, i) => <option key={i} value={u}>{u}</option>)}
        </select>
      </div>

      <div style={{ border: "1px solid #ccc", height: "300px", overflowY: "auto", padding: "10px", marginBottom: "10px", borderRadius: "8px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.sender === username ? "right" : "left", margin: "5px 0", backgroundColor: msg.private ? "#e0f7fa" : "transparent", padding: "3px", borderRadius: "5px" }}>
            <strong>{msg.sender}{msg.private && " (private)"}</strong>:{" "}
            {msg.isFile ? (
              <div>
                <a href={msg.fileData} download={msg.fileName}>{msg.fileName}</a>
                {msg.fileName.match(/\.(jpeg|jpg|png|gif)$/i) && <img src={msg.fileData} alt={msg.fileName} style={{ maxWidth: "150px", marginTop: "5px", borderRadius: "5px" }} />}
              </div>
            ) : msg.text}
            <br />
            <small style={{ color: "#888" }}>{msg.time}</small>
            <br />
            {readReceipts[msg.id] && <small style={{ color: "green" }}>✔ Read by {readReceipts[msg.id].join(", ")}</small>}
          </div>
        ))}
        {typingUser && <p style={{ color: "gray" }}>{typingUser} is typing...</p>}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend}>
        <input type="file" onChange={handleFileChange} style={{ marginRight: "5px" }} />
        <input type="text" placeholder="Type a message..." value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleTyping} style={{ width: "55%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }} />
        <button type="submit" 
        style={{ marginLeft: "5px", padding: "8px 15px", border: "none", borderRadius: "5px", backgroundColor: "#007bff", color: "#fff", cursor: "pointer" }}>
            Send</button>
      </form>
    </div>
  );
}

export default Chat;
