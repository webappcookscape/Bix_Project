import React, { useContext } from "react";
import ChatInterface from "../../../shared/components/ChatInterface";
import { TaskContext } from "../context/TaskContext";

const Chat = () => {
  const { projects } = useContext(TaskContext);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Only show projects assigned to this employee (Directly or via Tasks)
  const myProjects = projects.filter(p =>
    p.assignedEmployees?.some(emp => emp.id === user.id) ||
    p.tasks?.some(t => t.employeeId === user.id)
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] sm:h-[calc(100vh-64px)] p-0 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-0 sm:mb-6 text-gray-800 px-4 pt-4 sm:p-0 hidden sm:block">My Project Chats</h1>
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          projects={myProjects}
          currentUser={{ name: user.name || "Employee", id: user.id }}
          role="EMPLOYEE"
        />
      </div>
    </div>
  );
};

export default Chat;
