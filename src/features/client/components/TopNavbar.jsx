import React, { useState, useEffect, useRef } from "react";
import { User, Bell, Menu, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useHaptics from "../../../shared/hooks/useHaptics";

const TopNavbar = ({ setSelected, menuOpen, setMenuOpen, handleLogout }) => {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { trigger } = useHaptics();

  const dropdownRef = useRef();

  const project = JSON.parse(localStorage.getItem("clientProject") || "{}");
  const clientName = (project.firstName ? `${project.firstName} ${project.lastName}` : project.clientName) || project.projectName || "Client Portal";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formattedTime = currentTime.toLocaleString();

  const onLogoutClick = () => {
    handleLogout();
  };

  const handleToggleMenu = () => {
    trigger('light');
    setMenuOpen(!menuOpen);
  };

  const handleToggleProfile = () => {
    trigger('light');
    setShowProfile(!showProfile);
  };

  return (
    <div className="sticky top-0 z-[999] h-16 sm:h-20 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg flex items-center justify-between px-4 md:px-6 shrink-0">

      {/* LEFT SIDE - LOGO & CLIENT NAME */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 min-w-0">
        <motion.img
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          src="/FINAL_LOGO.png"
          alt="Cookscape Logo"
          className="h-8 sm:h-12 md:h-14 object-contain flex-shrink-0 cursor-pointer"
          onClick={() => setSelected("overview")}
        />
        <div className="hidden sm:block h-8 w-[1px] bg-slate-200 flex-shrink-0"></div>
        <div className="hidden sm:flex items-center">
          <h2 className="text-sm sm:text-lg font-black tracking-tight text-slate-800 truncate px-2 max-w-[150px] sm:max-w-none">
            {clientName}
          </h2>
        </div>
      </div>

      {/* RIGHT SIDE ICONS */}
      <div className="relative flex items-center gap-3 sm:gap-6 flex-shrink-0">

        {/* Mobile Menu Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="md:hidden p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
          onClick={handleToggleMenu}
        >
          <Menu size={24} className="text-slate-800" />
        </motion.button>

        {/* Notification Bell */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            trigger('light');
            setSelected("activity");
          }}
          className="p-2 text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors relative"
        >
          <Bell size={24} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
        </motion.div>

        {/* User Icon */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleProfile}
          className="p-2 bg-indigo-50 text-indigo-600 rounded-xl cursor-pointer hover:bg-indigo-100 transition-colors"
        >
          <User size={24} />
        </motion.div>

        {/* PROFILE DROPDOWN */}
        <AnimatePresence>
          {showProfile && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: 10, x: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10, x: 10 }}
              className="absolute right-0 top-16 w-72 bg-white/90 backdrop-blur-2xl shadow-2xl rounded-3xl border border-white/50 p-6 z-[110]"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                    {clientName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-800 text-lg truncate leading-tight">
                      {clientName}
                    </h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      Client Portal
                    </p>
                  </div>
                </div>

                <div className="h-[1px] bg-slate-100"></div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Login</p>
                  <p className="text-xs font-bold text-slate-600">
                    {formattedTime}
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onLogoutClick}
                  className="w-full flex items-center justify-center gap-3 py-3.5 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-colors font-black text-xs uppercase tracking-widest"
                >
                  <LogOut size={16} />
                  Logout Account
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TopNavbar;
