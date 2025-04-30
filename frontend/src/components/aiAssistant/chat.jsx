import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { authServices } from "../../auth";

export const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const currentUser = authServices.getAuthUser(); // get the logged-in user

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/chat/chat-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({userId: currentUser?._id }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.history?.messages) {
        setMessages(data.history.messages);
      } else {
        console.error("Failed to fetch chat history:", data.message);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/chat/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?._id , query: userMessage.content }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const aiMessage = {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        console.error("Failed to send message:", data.message);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearChatHistory = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/chat/delete-chat-history`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?._id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessages([]);
      } else {
        console.error("Failed to clear chat history:", data.message);
      }
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-6 border rounded-lg shadow-lg bg-white max-w-5xl h-[80vh] mx-auto flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">AI Assistant</h2>
        <button
          onClick={clearChatHistory}
          disabled={loading || messages.length === 0}
          className={`px-4 py-2 text-white text-sm rounded ${
            loading || messages.length === 0
              ? "bg-gray-400"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          Clear Chat
        </button>
      </div>
  
      <div className="flex-1 overflow-y-auto mb-4 p-4 border rounded bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400">
            No messages yet. Start a conversation!
          </p>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id}
              className={`mb-3 ${message.role === "user" ? "text-right" : "text-left"}`}
            >
              <div
                className={`inline-block px-4 py-3 rounded-lg text-sm max-w-[75%] ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300 text-gray-800"
                }`}
              >
                {message.role === "assistant" ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  <p>{message.content}</p>
                )}
                <div className="text-xs mt-2 opacity-70">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
  
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
          className="flex-1 border rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={`px-5 py-2 text-white text-sm rounded ${
            loading || !input.trim()
              ? "bg-gray-400"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
};  
