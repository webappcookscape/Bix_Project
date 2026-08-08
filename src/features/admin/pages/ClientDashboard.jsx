import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../shared/utils/axios";
import StatusBadge from "../components/common/StatusBadge";
import { LogOut, Calendar, MapPin, CheckCircle2, CircleDashed, Clock, ChevronRight, FolderKey } from "lucide-react";

const ClientDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("clientToken");
        if (!token) {
            navigate("/admin/client/login");
            return;
        }

        const fetchData = async () => {
            try {
                const res = await axios.get("/client/progress", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data);
            } catch (err) {
                console.error(err);
                localStorage.removeItem("clientToken");
                navigate("/admin/client/login");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("clientToken");
        localStorage.removeItem("clientProject");
        navigate("/admin/client/login");
    };

    if (loading || !data) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-orange-200 rounded-full"></div>
                <p className="text-slate-400 font-medium">Loading project status...</p>
            </div>
        </div>
    );

    const { project, tasks } = data;
    const completedTasks = tasks.filter(t => t.status === "Completed").length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-orange-100">
                            C
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-slate-800 leading-none">Orbix Projects</h1>
                            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Client Portal</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
                {/* Intro */}
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-slate-900">Hello, {project.clientName} 👋</h2>
                    <p className="text-slate-500 text-sm">Here's the latest progress on your project: <span className="text-brand-600 font-semibold">{project.name}</span></p>
                </div>

                {/* Progress Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">Overall Progress</h3>
                            <span className="text-3xl font-black text-brand-500">{progress}%</span>
                        </div>
                        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-500 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-slate-50 rounded-2xl">
                                <p className="text-xs text-slate-400 mb-1">Total Tasks</p>
                                <p className="text-xl font-bold text-slate-800">{tasks.length}</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-2xl">
                                <p className="text-xs text-green-600/60 mb-1">Completed</p>
                                <p className="text-xl font-bold text-green-600">{completedTasks}</p>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-2xl">
                                <p className="text-xs text-orange-600/60 mb-1">In Progress</p>
                                <p className="text-xl font-bold text-orange-600">{tasks.length - completedTasks}</p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-2xl">
                                <p className="text-xs text-blue-600/60 mb-1">Status</p>
                                <p className="text-sm font-bold text-blue-600 mt-1">{project.status}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                        <h3 className="font-bold text-slate-800">Project Details</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Calendar size={18} /></div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Timeline</p>
                                    <p className="text-sm font-semibold text-slate-700">{project.startDate} — {project.deadline || 'Ongoing'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><MapPin size={18} /></div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Location</p>
                                    <p className="text-sm font-semibold text-slate-700">{project.location || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><FolderKey size={18} /></div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Project ID</p>
                                    <p className="text-sm font-bold text-brand-600">{project.projectId}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Recent Milestones</h3>
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        {tasks.length > 0 ? (
                            tasks.map((task, i) => (
                                <div key={task.id} className="flex items-center justify-between p-5 border-b last:border-0 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${task.status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {task.status === 'Completed' ? <CheckCircle2 size={20} /> : <CircleDashed size={20} className="animate-spin-slow" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{task.title}</p>
                                            <p className="text-[11px] text-slate-400 font-semibold">{task.type} • Due {task.dueDate}</p>
                                        </div>
                                    </div>
                                    <StatusBadge status={task.status} />
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center space-y-2">
                                <p className="text-slate-400 italic">No milestones recorded yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
