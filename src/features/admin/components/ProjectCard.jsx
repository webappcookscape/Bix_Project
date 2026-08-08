import React from "react";
import { MapPin, Calendar, MoreVertical, Building2, MessageSquare } from "lucide-react";
import { formatDate as centralFormatDate } from '../../../shared/utils/dateFormatter';
import { Link } from "react-router-dom";
import StatusBadge from "../components/common/StatusBadge";
import { isProjectOverdue } from "../utils/dateUtils";

const ProjectCard = ({ project, onEdit }) => {
    const isOverdue = isProjectOverdue(project);

    // Calculate random progress or mock if real data isn't fully linked yet
    // Once backend supports task aggregation, replace this. For now, visual placeholder or payment %
    const progress = project.paymentPercentage || 0;

    const formatDate = (d) => centralFormatDate(d);

    return (
        <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col h-full">
            {/* Top Gradient */}
            <div className={`h-2 w-full absolute top-0 left-0 bg-gradient-to-r ${isOverdue ? 'from-rose-500 to-orange-500' : 'from-indigo-500 to-cyan-500'}`} />

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 font-bold text-sm border border-slate-100">
                            {project.clientFirstName?.[0]}{project.clientLastName?.[0]}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                                {project.name}
                            </h3>
                            <p className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
                                {project.projectCode}
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        <button onClick={() => onEdit(project)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                            <MoreVertical size={16} />
                        </button>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <MapPin size={14} className="text-indigo-400" />
                        <span className="truncate">{project.location || 'Location not set'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <Building2 size={14} className="text-emerald-400" />
                        <span>₹{(parseFloat(project.budget) || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <Calendar size={14} className="text-orange-400" />
                        <span>Deadline: {formatDate(project.deadline)}</span>
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="flex justify-between items-end mb-2">
                        <StatusBadge status={isOverdue ? "Overdue" : "Active"} />
                        <span className="text-xs font-bold text-slate-600">{progress}% Paid</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 rounded-full shadow-sm"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2">
                    <Link
                        to={`/admin/projects/${project.id}/manage`}
                        className="flex-1 py-2 text-center text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                        Open Dashboard
                    </Link>
                    <Link
                        to={`/admin/project/${project.id}/chat`}
                        className="p-2 text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center shadow-sm"
                        title="Project Chat"
                    >
                        <MessageSquare size={16} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
