import React, { useState, useEffect } from "react";
import { dispatchSafeEvent } from "../../../shared/utils/eventUtils";
import { NavLink } from "react-router-dom";
import axios from "../../../shared/utils/axios";
import { clearInternalAuth } from "../../../shared/utils/auth";
import {
  LayoutDashboard,
  ListTodo,
  MessageCircle,
  Mail,
  Briefcase,
  Bug,
  LogOut,
  X,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Activity
} from "lucide-react";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(localStorage.getItem('employeeSidebarCollapsed') === 'true');

  const employee = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        if (!employee.id) return;
        const res = await axios.get(`/emails/unread?userId=${employee.id}`);
        setUnreadCount(res.data.count);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };
    fetchUnread();

    // Optional: Poll every 30s
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('employeeSidebarCollapsed', newState);
    dispatchSafeEvent('employee_sidebar_toggle');
  };

  const getInitials = (name) =>
    (name || "User").split(" ").map(word => word[0]).join("").toUpperCase();

  const navItem = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 mx-2 rounded-xl text-sm font-bold transition-all duration-300 group relative
    ${isActive
      ? "bg-[#FF7A00] text-white shadow-lg shadow-[#FF7A00]/20"
      : "text-gray-400 hover:bg-white/5 hover:text-white"
    } ${isCollapsed ? 'justify-center px-0' : ''}`;

  const handleLogout = () => {
    clearInternalAuth();
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-[90] md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen
          glass-sidebar dark-scroll text-white shadow-2xl
          border-r border-white/5
          flex flex-col transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "md:w-20" : "md:w-64"}
          md:translate-x-0 md:relative overflow-visible
          z-[100] md:z-40
        `}
      >
        {/* Collapse Toggle - Desktop */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex absolute -right-3 top-20 bg-[#FF7A00] text-white rounded-full p-1 shadow-lg ring-4 ring-[#0D152A] hover:bg-[#FF8A10] transition-all z-[60]"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <div className={`flex items-center justify-between px-5 py-6 border-b border-white/5 ${isCollapsed ? 'justify-center' : ''}`}>
          {!isCollapsed ? (
            <div>
              <h1 className="text-xl font-black text-white tracking-widest leading-none">BIX PROJECTS</h1>
              <h2 className="text-[10px] font-black tracking-widest uppercase text-[#FF7A00] mt-1.5 opacity-80">
                EMPLOYEE PORTAL
              </h2>
            </div>
          ) : (
            <div className="w-10 h-10 bg-[#FF7A00] rounded-xl flex items-center justify-center font-black text-white">B</div>
          )}

          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className={`flex items-center gap-3 px-5 py-6 border-b border-white/5 bg-white/5 backdrop-blur-md ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-[#FF7A00] to-[#FF9D42] text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-[#FF7A00]/30 transform group-hover:scale-105 transition-transform">
            {getInitials(employee.name)}
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <p className="font-bold text-sm text-white tracking-tight truncate max-w-[140px]">{employee.name || 'Employee'}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{employee.role || 'Role'}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 sm:px-3 py-3 sm:py-4 space-y-1 sm:space-y-2">
          <NavLink to="/employee" className={navItem} onClick={() => setSidebarOpen(false)} end title={isCollapsed ? "My Dashboard" : ""}>
            <LayoutDashboard size={20} className="shrink-0" />
            {!isCollapsed && <span>My Dashboard</span>}
          </NavLink>

          <NavLink to="/employee/tasks" className={navItem} onClick={() => setSidebarOpen(false)} title={isCollapsed ? "Tasks" : ""}>
            <ListTodo size={20} className="shrink-0" />
            {!isCollapsed && <span>Tasks</span>}
          </NavLink>

          <NavLink to="/employee/projects" className={navItem} onClick={() => setSidebarOpen(false)} title={isCollapsed ? "Projects" : ""}>
            <Briefcase size={20} className="shrink-0" />
            {!isCollapsed && <span>Projects</span>}
          </NavLink>

          <NavLink to="/employee/chat" className={navItem} onClick={() => setSidebarOpen(false)} title={isCollapsed ? "Messenger" : ""}>
            <MessageCircle size={20} className="shrink-0" />
            {!isCollapsed && <span>Messenger</span>}
          </NavLink>

          <NavLink to="/employee/email" className={navItem} onClick={() => setSidebarOpen(false)} title={isCollapsed ? "Email" : ""}>
            <Mail size={20} className="shrink-0" />
            {!isCollapsed && <span>Email</span>}
            {unreadCount > 0 && (
              <span className={`absolute ${isCollapsed ? 'top-2 right-2' : 'right-3 top-1/2 -translate-y-1/2'} bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/employee/issues" className={navItem} onClick={() => setSidebarOpen(false)} title={isCollapsed ? "Issues" : ""}>
            <Bug size={20} className="shrink-0" />
            {!isCollapsed && <span>Issues</span>}
          </NavLink>
          <NavLink to="/employee/walkin-hub" className={navItem} onClick={() => setSidebarOpen(false)} title={isCollapsed ? "Walk-in Hub" : ""}>
            <Activity size={20} className="shrink-0" />
            {!isCollapsed && <span>Walk-in Hub</span>}
          </NavLink>
          <NavLink to="/employee/profile" className={navItem} onClick={() => setSidebarOpen(false)} title={isCollapsed ? "Profile" : ""}>
            <UserCircle size={20} className="shrink-0" />
            {!isCollapsed && <span>Profile</span>}
          </NavLink>
        </nav>

        <div className="border-t border-white/5 p-4 mt-auto">
          <NavLink
            to="/login" onClick={handleLogout}
            className={`flex items-center gap-3 text-[13px] font-bold px-4 py-3 rounded-xl 
            text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all active:scale-95 ${isCollapsed ? 'justify-center px-0' : ''}`}
            title={isCollapsed ? "Sign Out" : ""}
            replace
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
