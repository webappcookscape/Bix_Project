import React from "react";
import ChatInterface from "../../../shared/components/ChatInterface";
import { useApp } from "../context/AppContext";

import { useParams } from "react-router-dom";

const Chat = () => {
  const { id } = useParams();
  const { projects } = useApp();
  // Admin user object (simulated or from auth context if available)
  const currentUser = { name: "Admin", id: "admin" };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] sm:h-[calc(100vh-64px)] p-0 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-0 sm:mb-6 text-gray-800 px-4 pt-4 sm:p-0 hidden sm:block">Support & Chat</h1>
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          projects={projects}
          currentUser={currentUser}
          role="ADMIN"
          initialProjectId={id}
        />
      </div>
    </div>
  );
};

export default Chat;
