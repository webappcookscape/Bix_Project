import React from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";

const getAccentStyle = (accent) => {
  switch (accent) {
    case "success":
      return "bg-emerald-600 text-white";
    case "danger":
      return "bg-red-600 text-white";
    case "warning":
      return "bg-yellow-500 text-white";
    default:
      return "bg-indigo-600 text-white";
  }
};

const StatCard = ({ label, value, icon: Icon, accent = "default" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{
        scale: 1.08,
        rotate: 1,
        boxShadow: "0px 10px 25px rgba(255,122,0,0.4)",
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 160, damping: 12 }}
      className={`relative rounded-2xl p-5 shadow-lg cursor-pointer overflow-hidden ${getAccentStyle(
        accent
      )}`}
    >
      {/* 🔥 Shine Animation Overlay */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-white/25"
        animate={{ x: ["-120%", "120%"] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ rotate: "18deg", opacity: 0.3 }}
      />

      {/* Content */}
      <div className="relative z-10 flex justify-between items-center gap-2">

        {/* Stat Text */}
        <div>
          <p className="text-xs font-medium tracking-wide opacity-95">
            {label}
          </p>
          <p className="text-3xl font-bold mt-1">
            <CountUp end={value || 0} duration={1.4} />
          </p>
        </div>

        {/* Icon */}
        {Icon && (
          <motion.div
            whileHover={{ rotate: -10, scale: 1.15 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center text-white"
          >
            <Icon size={28} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
