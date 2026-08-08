import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../shared/utils/axios';
import {
    ArrowLeft,
    MapPin,
    Calendar,
    User,
    Phone,
    Mail,
    Users,
    Briefcase,
    Hash,
    ChevronDown
} from "lucide-react";
import { motion } from "framer-motion";
import RefreshButton from "../../../shared/components/RefreshButton";
import { formatDate } from "../../../shared/utils/dateFormatter";


const ProjectTasks = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjectData();
    }, [projectId]);

    const fetchProjectData = async () => {
        try {
            setLoading(true);
            const [projRes, tasksRes] = await Promise.all([
                axios.get(`/projects/${projectId}`),
                axios.get(`/tasks`, { params: { projectId } })
            ]);
            setProject(projRes.data);
            setTasks(tasksRes.data);
        } catch (error) {
            console.error("Error fetching project data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'IN_PROGRESS': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'PENDING': return 'bg-slate-50 text-slate-600 border-slate-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100">
                <div className="max-w-md mx-auto space-y-4">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Project Not Found</h2>
                    <p className="text-slate-500 font-medium">The project you are looking for doesn't exist or you don't have access.</p>
                    <button
                        onClick={() => navigate('/supervisor/projects')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100"
                    >
                        Go back to Projects
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Contextual Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/supervisor/projects')}
                    className="p-2.5 bg-white border border-slate-200 hover:border-indigo-200 rounded-xl transition-all text-slate-400 hover:text-indigo-600 shadow-sm"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{project.name}</h1>
                    <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest flex items-center gap-1.5 opacity-70">
                        <Hash size={10} /> {project.projectCode}
                    </p>
                </div>
                <div className="ml-auto">
                    <RefreshButton onRefresh={fetchProjectData} isLoading={loading} label="Refresh Data" />
                </div>
            </div>


            {/* Detailed Info Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 shadow-sm overflow-hidden relative"
            >
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                    {/* Client Info */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 text-indigo-600">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <User size={18} className="stroke-[3]" />
                            </div>
                            <h3 className="font-black text-xs uppercase tracking-[0.2em]">Client Details</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Full Name</p>
                                <p className="text-slate-800 font-black text-xl">{project.clientFirstName} {project.clientLastName}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mobile</p>
                                    <a href={`tel:${project.clientPhone}`} className="flex items-center gap-3 text-slate-800 font-bold hover:text-indigo-600 transition-colors group">
                                        <div className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
                                            <Phone size={14} />
                                        </div>
                                        {project.clientPhone}
                                    </a>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email</p>
                                    <a href={`mailto:${project.clientEmail}`} className="flex items-center gap-3 text-slate-800 font-bold hover:text-indigo-600 transition-colors group truncate max-w-full">
                                        <div className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                                            <Mail size={14} />
                                        </div>
                                        <span className="truncate">{project.clientEmail}</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Spouse & Location Info */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 text-indigo-600">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Users size={18} className="stroke-[3]" />
                            </div>
                            <h3 className="font-black text-xs uppercase tracking-[0.2em]">Additional Info</h3>
                        </div>

                        <div className="space-y-6">
                            {project.spouseName && (
                                <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100 flex flex-wrap gap-8">
                                    <div className="flex-1 min-w-[120px]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Spouse Name</p>
                                        <p className="text-slate-800 font-bold">{project.spouseName}</p>
                                    </div>
                                    {project.spousePhone && (
                                        <div className="flex-1 min-w-[140px]">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Spouse Mobile</p>
                                            <a href={`tel:${project.spousePhone}`} className="flex items-center gap-3 text-slate-800 font-bold hover:text-indigo-600 transition-colors group text-sm">
                                                <div className="w-7 h-7 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
                                                    <Phone size={12} />
                                                </div>
                                                {project.spousePhone}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-8 px-2">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                        <MapPin size={10} /> Location
                                    </p>
                                    <p className="text-slate-800 font-bold text-sm">{project.location || 'Chennai'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                        <Calendar size={10} /> Deadline
                                    </p>
                                    <p className="text-slate-800 font-bold text-sm">
                                        {project.deadline ? formatDate(project.deadline) : 'TBD'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Tasks Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-800">Project Tasks</h2>
                    <span className="text-[10px] px-3 py-1 bg-white border border-slate-100 text-slate-400 font-black rounded-lg uppercase tracking-widest shadow-sm">
                        {tasks.length} total tasks
                    </span>
                </div>

                {tasks.length === 0 ? (
                    <div className="bg-white p-16 rounded-[2.5rem] border border-dashed border-slate-200 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto">
                            <Briefcase size={32} />
                        </div>
                        <div>
                            <p className="text-slate-600 font-bold text-lg">No tasks assigned</p>
                            <p className="text-slate-400 text-sm font-medium">There are currently no tasks for this project.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {tasks.map((task, i) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => navigate(`/supervisor/tasks/${task.id}`)}
                                className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-100/30 transition-all cursor-pointer group"
                            >
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(task.status)}`}>
                                                {task.status}
                                            </span>
                                            <span className="text-slate-300 font-black">•</span>
                                            <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                                                {task.stage || 'General'}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                            {task.title}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-8 text-sm text-slate-500 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-slate-300" />
                                            <span className="text-xs font-bold text-slate-500">
                                                {task.dueDate ? formatDate(task.dueDate) : '--'}
                                            </span>
                                        </div>
                                        <div className="hidden md:block">
                                            <ChevronDown className="w-5 h-5 -rotate-90 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectTasks;
