import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MessageCircle,
  Bell,
  LogOut,
  Mail,
  Menu,
  Search,
  ExternalLink,
} from "lucide-react";

const Navbar = ({ setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchValue, setSearchValue] = useState("");

  const [user, setUser] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const employee = {
    name: user.name || "Employee",
    role: user.role || "Team Member",
  };

  const getInitials = (name) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase();

  // Get current context based on path
  const getContext = () => {
    const path = location.pathname;
    if (path === "/employee/tasks") return { title: "Tasks", placeholder: "Search tasks..." };
    if (path === "/employee/projects") return { title: "Projects", placeholder: "Search projects..." };
    if (path === "/employee/issues") return { title: "Issues", placeholder: "Search issues..." };
    return { title: "Global", placeholder: "Search projects or tasks..." };
  };

  const context = getContext();

  const handleSearch = (value) => {
    setSearchValue(value);
    const path = location.pathname;

    // Determine where to apply search
    let targetPath = path;
    if (path === "/employee" || path === "/employee/chat" || path === "/employee/email") {
      targetPath = "/employee/tasks"; // Default redirect for global search
    }

    if (value) {
      navigate(`${targetPath}?search=${value}`);
    } else {
      navigate(targetPath);
    }
  };

  // Sync search value with URL param on navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchValue(params.get("search") || "");
  }, [location.search]);

  return (
    <nav className="sticky top-0 w-full z-40
            bg-[#0D152A] text-white 
            border-b border-[#1E263A]
            h-[60px] sm:h-[70px] flex items-center
            justify-between px-2 sm:px-4 md:px-6 gap-2 sm:gap-4">

      {/* LEFT */}
      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        <button
          className="md:hidden text-gray-300 p-2 hover:bg-white/10 rounded-lg transition-colors"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>

        <img
          onClick={() => navigate("/employee")}
          src="/FINAL_LOGO.png"
          alt="logo"
          className="h-6 sm:h-10 md:h-12 cursor-pointer object-contain"
        />
      </div>

      {/* CENTER SEARCH - NOW VISIBLE EVERYWHERE */}
      <div className="flex-1 max-w-xl px-1 sm:px-0 min-w-0">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search
              className="text-gray-400 group-focus-within:text-[#FF7A00] transition-colors"
              size={14}
            />
          </div>
          <input
            type="text"
            placeholder={context.placeholder}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 rounded-full text-[10px] sm:text-sm 
                       bg-white border border-gray-200
                       placeholder-gray-400 text-gray-900 
                       focus:ring-2 focus:ring-[#FF7A00]/50 focus:border-[#FF7A00] 
                       outline-none transition-all shadow-sm
                       hover:border-gray-300"
          />
        </div>
      </div>

      {/* RIGHT SECTION - COMPACT ON MOBILE */}
      <div className="flex gap-1.5 sm:gap-5 items-center flex-shrink-0">
        {/* Switch to CRM Button */}
        <a
          href="https://crm.orbixdesigns.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF7A00] hover:bg-[#e06c00] text-white rounded-full text-xs font-bold transition-all shadow-md shadow-[#FF7A00]/20 cursor-pointer"
        >
          <span className="hidden sm:inline">Switch to CRM</span>
          <span className="sm:hidden">CRM</span>
          <ExternalLink size={14} />
        </a>

        <div className="hidden sm:flex items-center gap-4">
          <button
            onClick={() => navigate("/employee/issues")}
            className="relative hover:text-[#FF7A00] transition text-gray-300 p-1">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#0D152A]"></span>
          </button>

          <button onClick={() => navigate("/employee/chat")} className="hover:text-[#FF7A00] p-1">
            <MessageCircle size={20} />
          </button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-10 sm:h-10 bg-[#FF7A00] text-white rounded-full flex items-center justify-center text-[10px] sm:text-sm font-bold shadow-lg shadow-[#FF7A00]/20 shrink-0">
            {getInitials(employee.name)}
          </div>
          <div className="hidden lg:block leading-tight">
            <p className="text-sm font-semibold truncate max-w-[100px]">{employee.name}</p>
            <p className="text-[10px] text-gray-400">{employee.role}</p>
          </div>
        </div>

        {/* Logout - Hidden on mobile */}
        <button onClick={() => navigate("/login")} className="hidden md:block text-gray-400 hover:text-red-400 transition-colors p-1">
          <LogOut size={20} />
        </button>
      </div>

    </nav>
  );
};

export default Navbar;
