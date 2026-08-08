import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Download, Filter, TrendingUp, DollarSign, PhoneCall, Users, FileText, CheckCircle, Table, Edit2, RefreshCw } from 'lucide-react';
import api from '../../../shared/utils/axios';
import toast from 'react-hot-toast';

const CREContributions = ({ hideHeader = false }) => {
    const location = useLocation();
    const isDark = !location.pathname.includes('/admin/');
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [reports, setReports] = useState([]);
    const [summary, setSummary] = useState(null);
    const [filter, setFilter] = useState({
        month: '',
        year: ''
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReport, setEditingReport] = useState(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [formData, setFormData] = useState({
        calls: 0,
        srv: 0,
        proposals: 0,
        orders: 0,
        value: 0
    });

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const fetchData = async () => {
        try {
            setLoading(true);
            let url = '/monthly-reports';
            let params = [];
            if (filter.month) params.push(`month=${filter.month}`);
            if (filter.year) params.push(`year=${filter.year}`);
            
            if (params.length > 0) url += `?${params.join('&')}`;

            let summaryUrl = '/monthly-reports/summary';
            if (params.length > 0) summaryUrl += `?${params.join('&')}`;

            const [reportsRes, summaryRes] = await Promise.all([
                api.get(url),
                api.get(summaryUrl)
            ]);
            setReports(reportsRes.data);
            setSummary(summaryRes.data);
        } catch (error) {
            toast.error("Failed to fetch team data");
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        try {
            if (!filter.month || !filter.year) {
                toast.error("Please select a specific Month and Year to sync data");
                return;
            }
            if (!window.confirm("This will automatically calculate SRV and Orders from Walk-in Hub and Work Reports for this period. Continue?")) return;
            setSyncing(true);
            const res = await api.post('/monthly-reports/sync', { month: filter.month, year: filter.year });
            toast.success(res.data.message || "Data synced successfully!");
            fetchData();
        } catch (error) {
            console.error('[Sync] Error:', error);
            toast.error(error.response?.data?.error || "Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filter.month, filter.year]);

    const handleExport = () => {
        // Placeholder for Excel/CSV export logic
        toast.success("Exporting report...");
    };

    const handleEdit = (report) => {
        setEditingReport(report);
        setFormData({
            calls: report.calls,
            srv: report.srv,
            proposals: report.proposals,
            orders: report.orders,
            value: report.value
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/monthly-reports', {
                ...formData,
                month: filter.month,
                year: filter.year,
                creId: editingReport.creId
            });
            toast.success("Performance updated!");
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to update performance");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {!hideHeader && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className={`text-3xl font-black tracking-widest flex items-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            CRE <span className="text-orange-500 ml-2">CONTRIBUTIONS</span>
                        </h1>
                        <p className="text-slate-500 text-xs font-bold tracking-[0.2em] mt-1 uppercase">Team performance and contributions overview</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleExport}
                            className={`flex items-center px-4 py-2.5 border rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-slate-900 border-white/5 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm'}`}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Excel
                        </button>
                        <button 
                            onClick={handleSync}
                            disabled={syncing}
                            className={`flex items-center px-4 py-2.5 border rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest ${syncing ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-500 hover:bg-orange-500/20' : 'bg-orange-50 border-orange-100 text-orange-600 hover:bg-orange-100 shadow-sm'}`}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Syncing...' : 'Sync Activities'}
                        </button>
                        <div className="flex items-center gap-2">
                            <select 
                                value={filter.month}
                                onChange={(e) => setFilter({...filter, month: e.target.value})}
                                className={`border rounded-2xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-orange-500/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] min-w-[140px] ${isDark ? 'bg-slate-900 border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                            >
                                <option value="">ALL MONTHS</option>
                                {months.map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                            <select 
                                value={filter.year}
                                onChange={(e) => setFilter({...filter, year: e.target.value})}
                                className={`border rounded-2xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-orange-500/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] min-w-[100px] ${isDark ? 'bg-slate-900 border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                            >
                                <option value="">ALL YEARS</option>
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                                <option value="2027">2027</option>
                                <option value="2028">2028</option>
                                <option value="2029">2029</option>
                                <option value="2030">2030</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Scorecard Table - Excel Style */}
            <div className={`rounded-[40px] border overflow-hidden backdrop-blur-2xl ${isDark ? 'bg-slate-900/30 border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
                <div className="px-8 py-6 border-b border-white/5 bg-gradient-to-r from-orange-500/5 to-transparent">
                    <h3 className={`text-sm font-black uppercase tracking-[0.3em] text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        CRE'S REPORTS {filter.month ? `01 - ${new Date(filter.year, filter.month, 0).getDate()} ${months[filter.month - 1].toUpperCase().slice(0, 3)}` : 'ALL TIME'}
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className={isDark ? 'bg-white/5' : 'bg-slate-50'}>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-white/5">S.no</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-white/5 text-left">Name</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-white/5">Calls</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-white/5">SRV</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-white/5">Proposals</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-white/5">Orders</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-white/5">Value (L)</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Act</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                            {reports.map((r, i) => (
                                <tr key={r.id} className="hover:bg-orange-500/[0.02] transition-colors">
                                    <td className="px-6 py-5 text-sm font-bold text-slate-500 border-r border-white/5">{i + 1}</td>
                                    <td className="px-6 py-5 text-sm font-black text-left border-r border-white/5">
                                        <span className={isDark ? 'text-white' : 'text-slate-900'}>{r.cre?.name}</span>
                                    </td>
                                    <td className={`px-6 py-5 text-sm font-bold border-r border-white/5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{r.calls}</td>
                                    <td className={`px-6 py-5 text-sm font-bold border-r border-white/5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{r.srv}</td>
                                    <td className={`px-6 py-5 text-sm font-bold border-r border-white/5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{r.proposals}</td>
                                    <td className={`px-6 py-5 text-sm font-bold border-r border-white/5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{r.orders}</td>
                                    <td className="px-6 py-5 border-r border-white/5">
                                        <span className="text-orange-500 font-black text-sm">{r.value.toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        {(user.id === r.creId) && (
                                            <button 
                                                onClick={() => handleEdit(r)}
                                                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-orange-500 hover:border-orange-200 transition-all shadow-sm"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            
                            {/* Summary Totals Row */}
                            {reports.length > 0 && summary && (
                                <tr className={`${isDark ? 'bg-orange-500/10' : 'bg-orange-50'} border-t-2 border-orange-500/30`}>
                                    <td className="px-6 py-5" colSpan="2">
                                        <span className="text-sm font-black uppercase tracking-widest text-orange-500">Total</span>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-black text-orange-500">{summary.calls}</td>
                                    <td className="px-6 py-5 text-sm font-black text-orange-500">{summary.srv}</td>
                                    <td className="px-6 py-5 text-sm font-black text-orange-500">{summary.proposals}</td>
                                    <td className="px-6 py-5 text-sm font-black text-orange-500">{summary.orders}</td>
                                    <td className="px-6 py-5 text-sm font-black text-orange-500 border-r border-white/5" colSpan="1"></td>
                                    <td className="px-6 py-5 text-sm font-black text-orange-500 border-r border-white/5">{summary.value?.toFixed(2)}</td>
                                    <td className="px-6 py-5"></td>
                                </tr>
                            )}

                            {reports.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="8" className="px-8 py-20 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">No data available for this period</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Visual Insights */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Avg Calls/CRE', val: reports.length > 0 ? (summary.calls / reports.length).toFixed(0) : 0, icon: PhoneCall },
                        { label: 'Total Value', val: `₹ ${summary.value?.toFixed(2)} L`, icon: DollarSign },
                        { label: 'Conversion Rate', val: summary.srv > 0 ? `${((summary.orders / summary.srv) * 100).toFixed(1)}%` : '0%', icon: TrendingUp },
                        { label: 'Total CREs', val: reports.length, icon: Users }
                    ].map((insight, i) => (
                        <div key={i} className={`p-6 rounded-[32px] border ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-orange-500/10">
                                    <insight.icon className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{insight.label}</p>
                                    <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{insight.val}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
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
                            <h2 className={`text-2xl font-black uppercase tracking-widest mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Edit <span className="text-orange-500">Performance</span>
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Editing: {editingReport?.cre?.name}</p>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
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
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Orders</label>
                                        <input 
                                            type="number"
                                            value={formData.orders}
                                            onChange={(e) => setFormData({...formData, orders: e.target.value})}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
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
                                        Update Performance
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CREContributions;
