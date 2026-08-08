import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from '../../../shared/utils/axios';
import {
    ClipboardList,
    MapPin,
    Clock,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import RefreshButton from '../../../shared/components/RefreshButton';
import { formatDate } from "../../../shared/utils/dateFormatter";


const Dashboard = () => {
    // Safely consume context or default to empty
    const { searchTerm } = useOutletContext() || { searchTerm: '' };
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({ completed: 0, overdue: 0 });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await axios.get('/tasks');

            // Filter: All tasks for CURRENT USER
            const userTasks = response.data.filter(t => t.employeeId === user.id);

            // Calculate Stats
            const completed = userTasks.filter(t => t.status === 'COMPLETED').length;
            const active = userTasks.filter(t => t.status !== 'COMPLETED');
            const overdue = active.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;

            setStats({ completed, overdue });
            setTasks(active);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter tasks based on global search term
    const filteredTasks = tasks.filter(task => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            task.title?.toLowerCase().includes(term) ||
            task.project?.name?.toLowerCase().includes(term) ||
            task.stage?.toLowerCase().includes(term)
        );
    });

    const containerVars = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVars = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">Active</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black mb-1">{tasks.length}</h3>
                        <p className="text-indigo-100 text-sm font-medium">Pending Tasks</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-emerald-50 rounded-2xl">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 mb-1">{stats.completed}</h3>
                        <p className="text-slate-400 text-sm font-bold">Completed this week</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-orange-50 rounded-2xl">
                            <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 mb-1">{stats.overdue}</h3>
                        <p className="text-slate-400 text-sm font-bold">Overdue Tasks</p>
                    </div>
                </div>
            </div>

            {/* Task List Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Priority Tasks</h2>
                    <p className="text-slate-400 text-sm font-medium mt-1">Focus on these items today</p>
                </div>
                <div className="flex items-center gap-3">
                    <RefreshButton onRefresh={fetchTasks} isLoading={loading} label="Sync" />
                    <button className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-bold px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>

            </div>

            {/* Task List */}
            {filteredTasks.length === 0 ? (
                <div className="text-center p-16 bg-white rounded-[2rem] border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-slate-800 font-bold mb-1">No matching tasks found</h3>
                    <p className="text-slate-400 text-sm">Try adjusting your search terms.</p>
                </div>
            ) : (
                <motion.div
                    variants={containerVars}
                    initial="hidden"
                    animate="show"
                    className="grid gap-4"
                >
                    {filteredTasks.map(task => (
                        <motion.div
                            key={task.id}
                            variants={itemVars}
                            onClick={() => navigate(`../tasks/${task.id}`)}
                            className="group bg-white p-6 rounded-[1.5rem] border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-100/50 transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-5 h-5 text-indigo-500 -rotate-45" />
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                {/* Date Box */}
                                <div className="hidden md:flex flex-col items-center justify-center w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
                                    <span className="text-xs font-bold text-slate-400 uppercase">{task.dueDate ? new Date(task.dueDate).toLocaleString('default', { month: 'short' }) : 'Due'}</span>
                                    <span className="text-xl font-black text-slate-800">{task.dueDate ? new Date(task.dueDate).getDate() : '?'}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider">
                                            {task.stage || 'General'}
                                        </span>
                                        {task.priority === 'HIGH' && (
                                            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-wider">
                                                High Priority
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1 truncate">{task.title}</h3>

                                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                                        {task.project && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span className="truncate max-w-[200px]">{task.project.name}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 md:hidden">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{task.dueDate ? formatDate(task.dueDate) : 'No Date'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:hidden pt-4 border-t border-slate-50 mt-2">
                                    <span className="text-xs font-bold text-indigo-600">View Details</span>
                                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default Dashboard;
