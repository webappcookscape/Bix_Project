import React from "react";

const StatusBadge = ({ status }) => {
  let color = "bg-slate-100 text-slate-700";

  const s = status ? status.toUpperCase() : "";

  if (s === "COMPLETED") color = "bg-emerald-100 text-emerald-700";
  else if (s === "IN PROGRESS") color = "bg-amber-100 text-amber-700";
  else if (s === "PENDING") color = "bg-slate-100 text-slate-700";
  else if (s === "OVERDUE") color = "bg-red-100 text-red-700";
  else if (s === "ACTIVE") color = "bg-blue-100 text-blue-700";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
