import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, CheckCircle2 } from "lucide-react";
import { formatDate } from '../../../shared/utils/dateFormatter';

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/employee/project/${project.id}`)}
      className="group cursor-pointer bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 relative overflow-hidden flex flex-col min-w-0 w-full max-w-full"
      tabIndex={0}
      role="button"
      aria-label={`View project ${project.name}`}
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-indigo-50 rounded-bl-full -mr-6 -mt-6 sm:-mr-10 sm:-mt-10 transition-transform group-hover:scale-110 pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-2 sm:gap-0">
        <h2 className="font-bold text-lg sm:text-xl text-gray-800 group-hover:text-indigo-600 transition-colors mb-1 sm:mb-2 truncate">
          {project.name}
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-1 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <MapPin size={14} className="text-indigo-400" />
            <span className="truncate">{project.location}</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <Calendar size={14} className="text-indigo-400" />
            <span>Ends: {formatDate(project.deadline)}</span>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs gap-1 sm:gap-0">
            <span className="font-medium text-gray-700">Completion</span>
            <span className="text-indigo-600 font-bold">{Math.round(project.progress || 0)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${project.progress || 0}%` }}
            />
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] sm:text-[11px] text-gray-400">
            <CheckCircle2 size={12} />
            <span className="truncate">{project.completedTasks} of {project.totalTasks} tasks completed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
