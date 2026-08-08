import React, { useState, useRef, useEffect } from "react";
import { formatDate, formatTime } from "../../../../shared/utils/dateFormatter";
import { CheckCheck, Check, ArrowLeft } from "lucide-react";
import MessageInput from "./MessageInput";
import axios from "../../../../shared/utils/axios.js";

const ChatBody = ({ chat, setActiveChat }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    if (!chat?.projectId) return;
    try {
      setLoading(true);
      const res = await axios.get(`/chat/${chat.projectId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Optional: Set up polling for real-time feel
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [chat?.projectId]);

  const bottomRef = useRef();
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (msgText) => {
    try {
      const res = await axios.post("/chat", {
        text: msgText,
        projectId: chat.projectId
      });
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const formatDate = (d) => {
    const today = new Date();
    const date = new Date(d);
    const diff = Math.floor((today - new Date(date.setHours(0, 0, 0, 0))) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return formatDate(date);
  };

  // Render messages with date separators and nicer bubbles
  const renderedMessages = [];
  let lastDate = null;
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // First Letter Avatar for header
  const initial = chat?.name?.charAt(0).toUpperCase();

  messages.forEach((m) => {
    const msgDate = new Date(m.timestamp).toDateString();
    if (msgDate !== lastDate) {
      renderedMessages.push(
        <div key={`sep-${m.id}`} className="w-full flex justify-center py-2">
          <div className="px-3 py-1 text-xs text-slate-500 bg-slate-200 rounded-full">{formatDate(m.timestamp)}</div>
        </div>
      );
      lastDate = msgDate;
    }

    const isMe = m.sender === currentUser.name;

    renderedMessages.push(
      <div key={m.id} className={`w-full flex items-end gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
        {/* Avatar for other users */}
        {!isMe && (
          <div className="hidden md:flex h-8 w-8 rounded-full bg-slate-200 text-slate-600 items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm">
            {m.sender?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}

        <div className={`${isMe ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'} max-w-[80%] md:max-w-[65%] px-4 py-3 rounded-2xl shadow-sm border border-transparent ${!isMe && 'border-slate-200'} text-sm`}>
          {!isMe && <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{m.sender}</div>}
          <div className="whitespace-pre-line leading-relaxed">{m.text}</div>
          <div className={`flex items-center gap-1 text-[10px] mt-1.5 ${isMe ? 'justify-end text-orange-100' : 'justify-start text-slate-400'}`}>
            <span>{formatTime(m.timestamp)}</span>
            {isMe && (
              m.read ? <CheckCheck size={12} className="opacity-70" /> : <Check size={12} className="opacity-70" />
            )}
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="flex flex-col h-full bg-slate-50/50">

      {/* Header */}
      <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="md:hidden cursor-pointer p-2 -ml-2 hover:bg-slate-100 rounded-full transition" onClick={() => setActiveChat(null)}>
            <ArrowLeft size={20} className="text-slate-600" />
          </div>

          {/* Initial Avatar Circle */}
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-orange-200">
            {initial}
          </div>

          <div>
            <p className="font-bold text-slate-800">{chat?.name}</p>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${loading ? "bg-slate-300 animate-pulse" : "bg-green-500"}`}></span>
              <p className="text-xs text-slate-500 font-medium">
                {loading ? "Syncing..." : "Online"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          <p className="text-xs font-mono font-medium text-slate-500">{chat?.projectId}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
        {renderedMessages.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <CheckCheck size={32} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">{renderedMessages}</div>
        )}

        <div ref={bottomRef}></div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-slate-200 p-4">
        <MessageInput onSend={handleSend} />
      </div>
    </div>
  );
};

export default ChatBody;
