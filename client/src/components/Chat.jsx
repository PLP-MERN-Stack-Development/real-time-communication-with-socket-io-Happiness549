import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

function Chat({ username }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");

  useEffect(() => {
    socket.emit("join", username);

    socket.on("chat-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("typing", (user) => {
      setTypingUser(user);
      setTimeout(() => setTypingUser(""), 2000); // clear after 2 sec
    });

    return () => {
      socket.off("chat-message");
      socket.off("typing");
    };
  }, [username]);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const msgData = {
        text: message,
        sender: username,
        time: new Date().toLocaleTimeString(),
      };
      socket.emit("chat-message", msgData);
      setMessage("");
    }
  };

  const handleTyping = () => {
    socket.emit("typing", username);
  };

  return (
    <div style={{ maxWidth: 500, margin: "30px auto", textAlign: "center" }}>
      <h2>Global Chat Room</h2>

      <div
        style={{
          border: "1px solid #ccc",
          height: "300px",
          overflowY: "auto",
          padding: "10px",
          marginBottom: "10px",
          borderRadius: "8px",
        }}
      >
        {messages.map((msg, index) => (
          <div key={index} style={{ textAlign: "left", margin: "5px 0" }}>
            <strong>{msg.sender}</strong>: {msg.text}{" "}
            <small style={{ color: "#888" }}>{msg.time}</small>
          </div>
        ))}
        {typingUser && <p style={{ color: "gray" }}>{typingUser} is typing...</p>}
      </div>

      <form onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleTyping}
          style={{
            width: "75%",
            padding: "8px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          style={{
            marginLeft: "5px",
            padding: "8px 15px",
            border: "none",
            borderRadius: "5px",
            backgroundColor: "#007bff",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
