import React, { useState } from "react";
import { useApp } from "../../context/AppContext";

const getInitial = (name) => name?.charAt(0).toUpperCase() || "?";

const ChatSidebar = ({ activeChat, setActiveChat }) => {
  const { projects } = useApp();
  const [search, setSearch] = useState("");

  const filteredChats = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.projectId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-72 bg-white border-r flex flex-col">

      {/* Search Bar */}
      <div className="p-3 border-b">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects"
          className="w-full px-3 py-2 text-sm rounded-full bg-slate-100 focus:outline-none"
        />
      </div>

      {/* Chat List */}
      <div className="overflow-y-auto h-full">
        {filteredChats.length === 0 ? (
          <p className="text-sm text-slate-500 text-center mt-4">No projects found</p>
        ) : (
          filteredChats.map((p) => (
            <div
              key={p.projectId}
              onClick={() => setActiveChat(p)}
              className={`flex items-center gap-3 p-3 cursor-pointer border-b hover:bg-slate-100 ${activeChat?.projectId === p.projectId ? "bg-slate-200" : ""}`}
            >
              {/* Initial Avatar */}
              <div className="h-10 w-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-semibold text-sm">
                {getInitial(p.name)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-[13px] truncate">{p.name}</p>
                <p className="text-xs text-slate-500 truncate">{p.clientName || p.projectId}</p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-slate-500 whitespace-nowrap">Active</span>
                <span className="text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full">0</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default ChatSidebar;
