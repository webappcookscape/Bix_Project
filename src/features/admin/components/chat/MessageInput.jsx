import React, { useState, useRef, useEffect } from "react";
import { SendHorizontal, Smile } from "lucide-react";

const MessageInput = ({ onSend }) => {
  const [text, setText] = useState("");
  const taRef = useRef(null);

  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = `${Math.min(120, taRef.current.scrollHeight)}px`;
  }, [text]);

  const send = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="p-3 bg-white flex items-center gap-2">
      <button className="text-slate-600">
        <Smile size={22} />
      </button>

      <textarea
        ref={taRef}
        rows={1}
        className="flex-1 px-4 py-2 text-sm bg-slate-100 rounded-xl outline-none resize-none max-h-32"
        placeholder="Type a message — Enter to send, Shift+Enter for newline"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />

      <button
        onClick={send}
        className="bg-[#075E54] text-white p-3 rounded-full"
        aria-label="Send message"
      >
        <SendHorizontal size={18} />
      </button>
    </div>
  );
};

export default MessageInput;
