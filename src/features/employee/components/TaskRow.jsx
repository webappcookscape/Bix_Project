import React, { useState } from "react";

const TaskRow = ({ task, onStatusChange }) => {
  const [status, setStatus] = useState(task.status);

  const getStatusColor = () => {
    const s = (status || "").toUpperCase();
    if (s === "COMPLETED") return "bg-green-100 text-green-600";
    if (s === "IN PROGRESS") return "bg-blue-100 text-blue-600";
    if (s === "PENDING") return "bg-yellow-100 text-yellow-600";
    return "bg-gray-100 text-gray-600";
  };

  const handleChange = (e) => {
    const newStatus = e.target.value;

    // ✅ Confirmation when marking as completed
    if (newStatus === "COMPLETED" && (status || "").toUpperCase() !== "COMPLETED") {
      const confirmComplete = window.confirm(
        "Are you sure you want to mark this task as COMPLETED?"
      );

      if (!confirmComplete) return;   // stop if user cancels
    }

    setStatus(newStatus);

    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };


  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 w-full">

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-800 truncate">{task.title}</h3>
        <p className="text-xs text-gray-500 truncate">
          Due: {task.dueDate}
        </p>
      </div>

      <div className="flex flex-row sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor()} truncate`}>
          {status}
        </span>
        <select
          value={status.toUpperCase()}
          onChange={handleChange}
          className="border rounded px-2 py-1 text-xs sm:text-sm cursor-pointer bg-white outline-none focus:ring-2 focus:ring-indigo-500 min-w-[100px]"
        >
          <option value="PENDING">Pending</option>
          <option value="IN PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>
    </div>
  );
};

export default TaskRow;
