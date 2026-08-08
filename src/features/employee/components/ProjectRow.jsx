import React from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, CheckCircle, Clock } from "lucide-react";

const ProjectRow = ({ project }) => {
  const navigate = useNavigate();

  const completedCount = project.tasks.filter(t => t.status === "COMPLETED").length;
  const pendingCount = project.tasks.filter(t => t.status === "PENDING").length;

  return (
    <div
      onClick={() => navigate(`/employee/project/${project._id || project.id}`)}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 transition border-b cursor-pointer w-full"
      tabIndex={0}
      role="button"
      aria-label={`View project ${project.name}`}
    >
      {/* LEFT */}
      <div className="space-y-1 min-w-0 flex-1">
        <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate">
          {project.name}
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1 truncate">
            <MapPin size={14} />
            {project.location}
          </span>

          <span className="flex items-center gap-1">
            <CalendarDays size={14} />
            {project.tasks.length} Tasks
          </span>
        </div>
      </div>

      {/* CENTER */}
      <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1 sm:mt-0">
        <span className="flex items-center gap-1 text-green-600 font-medium">
          <CheckCircle size={14} />
          {completedCount} Done
        </span>

        <span className="flex items-center gap-1 text-yellow-600 font-medium">
          <Clock size={14} />
          {pendingCount} Pending
        </span>
      </div>

      {/* RIGHT */}
      <span className="text-indigo-600 text-xs sm:text-sm font-semibold hover:underline mt-1 sm:mt-0">
        View →
      </span>
    </div>
  );
};

export default ProjectRow;
