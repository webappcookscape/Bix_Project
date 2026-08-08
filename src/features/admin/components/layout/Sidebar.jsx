import React, { useState, useEffect } from "react";
import { dispatchSafeEvent } from "../../../../shared/utils/eventUtils";
import { NavLink } from "react-router-dom";
import axios from "../../../../shared/utils/axios";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  FileSpreadsheet,
  Link2,
  MessageSquare,
  Bug,
  ShieldCheck,
  Mail,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  Activity,
  FileText,
  History,
  BarChart3
} from "lucide-react";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban },
  { to: "/admin/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/admin/issues", label: "Issues", icon: Bug },
  { to: "/admin/chat", label: "Chat", icon: MessageSquare },
  { to: "/admin/email", label: "Email", icon: Mail },
  { to: "/admin/helpdesk", label: "Helpdesk", icon: LifeBuoy },
  { to: "/admin/cre-reports", label: "CRE Reports", icon: BarChart3 },
  { to: "/admin/dev-panel", label: "System Control", icon: ShieldCheck },
  { to: "/admin/client-access", label: "Client Access", icon: Link2 },
  { to: "/admin/employees", label: "Employees", icon: Users },
  { to: "/admin/settings", label: "Data & Backups", icon: History },
  { to: "/admin/reports", label: "Reports", icon: FileSpreadsheet },
];

const Sidebar = ({ open, onClose }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(localStorage.getItem('adminSidebarCollapsed') === 'true');
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isManager = (user.role || "").toUpperCase() === "MANAGER";

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        if (!user.id) return;
        const res = await axios.get(`/emails/unread?userId=${user.id}`);
        setUnreadCount(res.data.count);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user.id]);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('adminSidebarCollapsed', newState);
    // Dispatch custom event for layout transition
    dispatchSafeEvent('admin_sidebar_toggle');
  };

  const filteredNavItems = navItems.filter(item => {
    if (isManager && item.label === "Employees") return false;
    if (isManager && item.label === "System Control") return false;
    return true;
  });

  return (
    <>
      {/* Overlay - Mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen glass-sidebar dark-scroll text-gray-200
        transform transition-all duration-300 ease-in-out border-r border-white/5
        ${open ? "translate-x-0" : "-translate-x-full"}
        ${isCollapsed ? "md:w-20" : "md:w-64"}
        md:translate-x-0 md:static flex flex-col`}
      >
        {/* Collapse Toggle - Desktop */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex absolute -right-3 top-20 bg-brand-500 text-white rounded-full p-1 shadow-lg ring-4 ring-[#0E1525] hover:bg-brand-600 transition-all z-[60]"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        {/* Branding */}
        <div className={`flex items-center gap-3 px-5 py-5 border-b border-white/10 transition-all ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-500 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20">
            C
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
              <p className="text-xs uppercase text-white font-black tracking-widest">Bix Projects</p>
              <p className="font-bold text-[10px] text-brand-400 mt-0.5">
                {isManager ? "ADMIN MANAGER" : "SUPER ADMIN"}
              </p>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 py-4 overflow-y-auto space-y-1">
          {filteredNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              title={isCollapsed ? label : ""}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mx-3 rounded-xl text-sm
                 transition-all duration-200 group relative
                ${isActive
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
            >
              <Icon size={20} className={`shrink-0 transition-transform group-hover:scale-110 ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && (
                <span className="whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300 font-medium">
                  {label}
                </span>
              )}
              {label === "Email" && unreadCount > 0 && (
                <span className={`absolute ${isCollapsed ? 'top-2 right-2' : 'right-3 top-1/2 -translate-y-1/2'} bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center border-2 border-[#0E1525]`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
