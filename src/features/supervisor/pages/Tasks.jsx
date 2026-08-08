import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from '../../../shared/utils/axios';
import {
    Search,
    Filter,
    ChevronDown,
    MoreHorizontal,
    CheckCircle2,
    Clock,
    AlertCircle,
    Calendar,
    MapPin
} from 'lucide-react';
import RefreshButton from '../../../shared/components/RefreshButton';
import { formatDate } from "../../../shared/utils/dateFormatter";


const Tasks = () => {
    const navigate = useNavigate();
    // Use global search term from layout
    const { searchTerm, setSearchTerm } = useOutletContext() || { searchTerm: '', setSearchTerm: () => { } };

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, active, completed, overdue

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await axios.get('/tasks');

            // STRICT FILTERING: Only show tasks assigned to this employee/supervisor
            const assignedTasks = response.data.filter(t => t.employeeId === user.id);
            setTasks(assignedTasks);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'IN PROGRESS': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'PENDING': return 'bg-slate-50 text-slate-600 border-slate-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.project?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all'
            ? true
            : filter === 'completed'
                ? task.status === 'COMPLETED'
                : task.status !== 'COMPLETED'; // 'active'

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">My Tasks</h1>
                    <p className="text-slate-500 font-medium text-sm">Manage and update your assigned tasks</p>
                </div>
                <div className="flex items-center gap-2">
                    <RefreshButton onRefresh={fetchTasks} isLoading={loading} label="Sync" />
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200">
                        + New Issue
                    </button>
                    {/* Placeholder for future export actions */}
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tasks by name or project..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'active', 'completed'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === f
                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Task List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-bold">No tasks found matching your criteria</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTasks.map(task => (
                        <div
                            key={task.id}
                            onClick={() => navigate(`${task.id}`)}
                            className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all cursor-pointer group"
                        >
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getStatusColor(task.status)}`}>
                                            {task.status}
                                        </span>
                                        <span className="text-slate-400 text-xs font-bold">•</span>
                                        <span className="text-slate-500 text-xs font-bold uppercase">{task.stage}</span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                        {task.title}
                                    </h3>
                                    {task.project && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-medium">
                                            <MapPin className="w-3 H-3" />
                                            {task.project.name}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span>{task.dueDate ? formatDate(task.dueDate) : '--'}</span>
                                    </div>
                                    <div className="md:border-l md:border-slate-100 md:pl-6">
                                        <ChevronDown className="w-4 h-4 -rotate-90 text-slate-300 group-hover:text-indigo-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Tasks;
