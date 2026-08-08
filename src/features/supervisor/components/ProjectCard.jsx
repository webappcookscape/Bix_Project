import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, CheckCircle2 } from "lucide-react";
import { formatDate } from '../../../shared/utils/dateFormatter';

const ProjectCard = ({ project }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/supervisor/project/${project.id}`)}
            className="group cursor-pointer bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 relative overflow-hidden flex flex-col min-w-0 w-full max-w-full"
            tabIndex={0}
            role="button"
            aria-label={`View project ${project.name}`}
        >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-indigo-50 rounded-bl-full -mr-6 -mt-6 sm:-mr-10 sm:-mt-10 transition-transform group-hover:scale-110 pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-2 sm:gap-0">
                <h2 className="font-bold text-lg sm:text-xl text-slate-800 group-hover:text-indigo-600 transition-colors mb-1 sm:mb-2 truncate">
                    {project.name}
                </h2>

                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-1 mb-2 sm:mb-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
                        <MapPin size={14} className="text-indigo-400" />
                        <span className="truncate">
                            {project.location || 'Chennai'}
                            {(project.block || project.unitNumber) && (
                                <span className="ml-1 text-slate-400">
                                    ({[project.block, project.unitNumber].filter(Boolean).join(' - ')})
                                </span>
                            )}
                        </span>
                    </div>
                    {project.floor && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
                            <span className="text-indigo-400 font-bold">FL:</span>
                            <span>{project.floor}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
                        <Calendar size={14} className="text-indigo-400" />
                        <span>Ends: {project.deadline ? formatDate(project.deadline) : 'TBD'}</span>
                    </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs gap-1 sm:gap-0">
                        <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Completion</span>
                        <span className="text-indigo-600 font-black tracking-wider">{Math.round(project.progress || 0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${project.progress || 0}%` }}
                        />
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <CheckCircle2 size={12} className="text-indigo-400" />
                        <span className="truncate">{project.completedTasks === undefined ? '?' : project.completedTasks} of {project.totalTasks === undefined ? '?' : project.totalTasks} tasks done</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
