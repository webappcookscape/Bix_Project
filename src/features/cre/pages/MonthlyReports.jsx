import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Calendar, BarChart3, TrendingUp, Save, History, DollarSign, PhoneCall, Users, FileText, CheckCircle, Edit2, ArrowUpRight, ArrowDownRight, RefreshCw, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import api from '../../../shared/utils/axios';
import toast from 'react-hot-toast';
import { exportToExcel, readExcel, downloadTemplate } from '../../../shared/utils/excel';

const MonthlyReports = ({ hideHeader = false }) => {
    const location = useLocation();
    const isDark = false; // Forced light theme for CRE as per request
    const [loading, setLoading] = useState(false);
    const [reports, setReports] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [importing, setImporting] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const initialFormState = {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        calls: 0,
        srv: 0,
        proposals: 0,
        orders: 0,
        value: 0
    };

    const [formData, setFormData] = useState(initialFormState);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await api.get('/monthly-reports');
            setReports(res.data);
        } catch (error) {
            toast.error("Failed to fetch reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    // Calculate Cumulative Totals
    const totals = reports.reduce((acc, r) => ({
        calls: acc.calls + (r.calls || 0),
        srv: acc.srv + (r.srv || 0),
        proposals: acc.proposals + (r.proposals || 0),
        orders: acc.orders + (r.orders || 0),
        value: acc.value + (r.value || 0)
    }), { calls: 0, srv: 0, proposals: 0, orders: 0, value: 0 });

    const closingRatio = totals.srv > 0 ? ((totals.orders / totals.srv) * 100).toFixed(1) : 0;

    // Prepare Chart Data (Sorted Chronologically)
    const chartData = [...reports].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
    }).map(r => ({
        name: `${months[r.month - 1].slice(0, 3)} ${r.year.toString().slice(2)}`,
        Calls: r.calls,
        Visits: r.srv,
        Orders: r.orders,
        Value: r.value
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-md p-4 border border-slate-200 rounded-2xl shadow-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 mb-1">
                            <span className="text-[10px] font-black text-slate-600 uppercase">{entry.name}:</span>
                            <span className="text-xs font-black text-slate-900">{entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/monthly-reports', formData);
            toast.success("Monthly data saved successfully!");
            setIsModalOpen(false);
            setFormData(initialFormState);
            fetchReports();
        } catch (error) {
            toast.error(error.response?.data?.error || "Submission failed");
        }
    };

    const handleEdit = (report) => {
        setFormData({
            month: report.month,
            year: report.year,
            calls: report.calls,
            srv: report.srv,
            proposals: report.proposals,
            orders: report.orders,
            value: report.value
        });
        setIsModalOpen(true);
    };

    const openNewSubmission = () => {
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    const handleSync = async () => {
        try {
            if (!window.confirm("This will automatically calculate your SRV (Visits) and Orders from the Walk-in Hub and Work Reports for this month. Continue?")) return;
            setSyncing(true);
            const res = await api.post('/monthly-reports/sync', { 
                month: new Date().getMonth() + 1, 
                year: new Date().getFullYear() 
            });
            toast.success(res.data.message || "Data synced successfully!");
            fetchReports();
        } catch (error) {
            console.error('[Sync] Error:', error);
            toast.error(error.response?.data?.error || "Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this monthly record? This action cannot be undone.")) return;
        try {
            setLoading(true);
            await api.delete(`/monthly-reports/${id}`);
            toast.success("Report deleted successfully");
            fetchReports();
        } catch (error) {
            toast.error(error.response?.data?.error || "Delete failed");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const exportData = reports.map(r => ({
            'Month': months[r.month - 1],
            'Year': r.year,
            'Calls': r.calls,
            'Visits/SRV': r.srv,
            'Proposals': r.proposals,
            'Orders': r.orders,
            'Revenue (Lakhs)': r.value,
            'CRE': r.cre?.name || 'Manual'
        }));
        exportToExcel(exportData, 'Monthly_Performance_Report');
        toast.success("Exporting Monthly Performance...");
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setImporting(true);
            const data = await readExcel(file);
            if (data.length === 0) throw new Error("Excel file is empty");

            const res = await api.post('/monthly-reports/bulk-import', data);
            toast.success(`Successfully imported ${res.data.count} performance records!`);
            fetchReports();
        } catch (error) {
            console.error('[Import] Error:', error);
            toast.error(error.response?.data?.error || "Import failed. Please check the template format.");
        } finally {
            setImporting(false);
            setIsImportModalOpen(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {!hideHeader && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className={`text-3xl font-black tracking-widest flex items-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            MONTHLY <span className="text-orange-500 ml-2">DATA</span>
                        </h1>
                        <p className="text-slate-500 text-xs font-bold tracking-[0.2em] mt-1 uppercase">CRE Monthly Performance Input</p>
                    </div>
                </div>
            )}

            {/* Quick Actions Bar - Always Visible */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-[32px] bg-slate-50 border border-slate-100 shadow-inner">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Performance Actions</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Manage your monthly submission</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleExport}
                        className="flex items-center px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-orange-500 hover:border-orange-200 transition-all font-black text-[10px] uppercase shadow-sm"
                        title="Export to Excel"
                    >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Export
                    </button>
                    <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-emerald-500 hover:border-emerald-200 transition-all font-black text-[10px] uppercase shadow-sm"
                        title="Import from Excel"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Import
                    </button>
                    <button 
                        onClick={handleSync}
                        disabled={syncing}
                        className={`flex items-center px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-white border border-slate-200 text-slate-600 hover:text-blue-500 hover:border-blue-200 shadow-sm ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing...' : 'Sync Activities'}
                    </button>
                    <button 
                        onClick={openNewSubmission}
                        className="flex items-center px-8 py-3 bg-orange-500 rounded-2xl text-white font-black text-[10px] uppercase shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Submit This Month
                    </button>
                </div>
            </div>

            {/* Performance Analytics Dashboard */}
            {reports.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Trend Chart */}
                    <div className="lg:col-span-2 p-8 rounded-[40px] border border-slate-200 bg-white shadow-sm overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100">
                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Live Analysis</span>
                            </div>
                        </div>
                        
                        <div className="mb-8">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Lead Conversion Funnel</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Monthly progression of Calls vs Visits vs Orders</p>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="Calls" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={20} />
                                    <Bar dataKey="Visits" fill="#f97316" radius={[6, 6, 0, 0]} barSize={20} />
                                    <Bar dataKey="Orders" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Revenue Trend */}
                    <div className="p-8 rounded-[40px] border border-slate-200 bg-white shadow-sm flex flex-col">
                        <div className="mb-8">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Revenue History</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Total Project Value (Lakhs)</p>
                        </div>

                        <div className="flex-1 h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="Value" 
                                        stroke="#f59e0b" 
                                        strokeWidth={4}
                                        fillOpacity={1} 
                                        fill="url(#colorValue)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-50">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Benchmarking</span>
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase">Good</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">Capture Rate (SRV/Calls)</span>
                                    <span className="text-xs font-black text-slate-900">{totals.calls > 0 ? ((totals.srv / totals.calls) * 100).toFixed(1) : 0}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 rounded-full" 
                                        style={{ width: `${totals.calls > 0 ? (totals.srv / totals.calls) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Submissions History */}
            <div className="rounded-[40px] border border-slate-200 overflow-hidden bg-white shadow-sm shadow-slate-200/50">
                <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center mr-4">
                            <History className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Submission History</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Verified Monthly Records</p>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className={isDark ? 'bg-white/5' : 'bg-slate-50'}>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">CRE Name</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Period</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Calls</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">SRV</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Proposals</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Orders</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Value (Lakhs)</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {reports.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 border border-slate-200">
                                                <span className="text-[10px] font-black text-slate-500">{r.cre?.name?.charAt(0) || 'C'}</span>
                                            </div>
                                            <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">{r.cre?.name || 'Unknown CRE'}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="px-4 py-1.5 rounded-2xl border border-slate-200 bg-slate-50 inline-block">
                                            <span className="text-[10px] font-black uppercase text-slate-600">{months[r.month - 1]} {r.year}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-sm font-black text-slate-900">{r.calls}</td>
                                    <td className="px-10 py-6 text-sm font-black text-slate-900">{r.srv}</td>
                                    <td className="px-10 py-6 text-sm font-black text-slate-900">{r.proposals}</td>
                                    <td className="px-10 py-6 text-sm font-black text-slate-900">{r.orders}</td>
                                    <td className="px-10 py-6">
                                        <span className="text-orange-500 font-black text-sm tracking-tight">₹ {r.value.toFixed(2)} L</span>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {(user.id === r.creId) && (
                                                <button 
                                                    onClick={() => handleEdit(r)}
                                                    className="p-3 rounded-2xl bg-white text-slate-400 border border-slate-200 hover:text-orange-500 hover:border-orange-200 transition-all shadow-sm"
                                                    title="Edit Data"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {['SUPER_ADMIN', 'MANAGER', 'BUSINESS_HEAD', 'LEAD_OPERATION'].includes(user.role) && (
                                                <button 
                                                    onClick={() => handleDelete(r.id)}
                                                    className="p-3 rounded-2xl bg-red-50/50 text-red-400 border border-red-100 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                                                    title="Delete Entry"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {reports.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="7" className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 rounded-[32px] bg-slate-50 flex items-center justify-center mb-6 shadow-inner">
                                                <History className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">No monthly data submitted yet</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Submission Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={`relative w-full max-w-lg rounded-[32px] border shadow-2xl p-8 ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
                        >
                            <h2 className={`text-2xl font-black uppercase tracking-widest mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Monthly <span className="text-orange-500">Report</span></h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Month</label>
                                        <select 
                                            value={formData.month}
                                            onChange={(e) => setFormData({...formData, month: e.target.value})}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        >
                                            {months.map((m, i) => (
                                                <option key={i} value={i + 1}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Year</label>
                                        <input 
                                            type="number"
                                            value={formData.year}
                                            onChange={(e) => setFormData({...formData, year: e.target.value})}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Total Calls</label>
                                        <input 
                                            type="number"
                                            value={formData.calls}
                                            onChange={(e) => setFormData({...formData, calls: e.target.value})}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Total SRV</label>
                                        <input 
                                            type="number"
                                            value={formData.srv}
                                            onChange={(e) => setFormData({...formData, srv: e.target.value})}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Proposals</label>
                                        <input 
                                            type="number"
                                            value={formData.proposals}
                                            onChange={(e) => setFormData({...formData, proposals: e.target.value})}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Total Orders</label>
                                        <input 
                                            type="number"
                                            value={formData.orders}
                                            onChange={(e) => setFormData({...formData, orders: e.target.value})}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Total Amount (₹)</label>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                placeholder="e.g. 456000"
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    if (!isNaN(val)) {
                                                        setFormData({...formData, value: (val / 100000).toFixed(2)});
                                                    }
                                                }}
                                                className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-orange-50 border-orange-200 text-slate-900'}`}
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                                <div className="h-4 w-px bg-slate-300 mx-2" />
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">Value: </span>
                                                <span className="text-xs font-black text-orange-500 tracking-tighter">{formData.value} L</span>
                                            </div>
                                        </div>
                                        <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest ml-1">Example: 10,00,000 = 10.00 L</p>
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Total Value (in Lakhs)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                            <input 
                                                type="number"
                                                step="0.01"
                                                value={formData.value}
                                                onChange={(e) => setFormData({...formData, value: e.target.value})}
                                                className={`w-full border rounded-2xl p-4 pl-8 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">L</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)}
                                        className={`flex-1 px-6 py-4 border rounded-2xl font-bold text-xs uppercase transition-all ${isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-[2] px-8 py-4 bg-orange-500 rounded-2xl text-white font-black text-xs uppercase shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all font-bold"
                                    >
                                        Save Record
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Import Modal */}
            <AnimatePresence>
                {isImportModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsImportModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={`relative w-full max-w-md rounded-[32px] border shadow-2xl p-8 ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
                        >
                            <div className="flex items-center justify-center w-16 h-16 rounded-[24px] bg-emerald-50 mb-6 mx-auto">
                                <BarChart3 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h2 className={`text-2xl font-black text-center uppercase tracking-widest mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Performance <span className="text-emerald-500">Import</span></h2>
                            <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest mb-8">Upload Excel File To Import Multi-Month Data</p>
                            
                            <div className="space-y-6">
                                <label className="block">
                                    <div className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <TrendingUp className="w-10 h-10 text-slate-300 group-hover:text-emerald-500 transition-all mb-4" />
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                {importing ? 'Processing File...' : 'Click or Drag Excel File'}
                                            </p>
                                        </div>
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept=".xlsx, .xls"
                                            onChange={handleImport}
                                            disabled={importing}
                                        />
                                    </div>
                                </label>

                                <div className="p-5 rounded-[24px] bg-orange-50 border border-orange-100">
                                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3">Download Sample Sheet</p>
                                    <button 
                                        onClick={() => downloadTemplate('monthly')}
                                        className="w-full py-3 bg-white border border-orange-200 rounded-xl text-[10px] font-black uppercase text-orange-500 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        Performance_Template.xlsx
                                    </button>
                                </div>

                                <button 
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="w-full py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-900 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MonthlyReports;
