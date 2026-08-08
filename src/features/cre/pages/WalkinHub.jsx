import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Phone, MapPin, User, LogOut, Clock, Calendar, CheckCircle, Activity, Briefcase, Edit2, Star, TrendingUp, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { useCRE } from '../context/CREContext';
import ShowroomMonitor from '../components/ShowroomMonitor';
import toast from 'react-hot-toast';
import { exportToExcel, readExcel, downloadTemplate } from '../../../shared/utils/excel';
import api from '../../../shared/utils/axios';
import { formatDate } from '../../../shared/utils/dateFormatter';

const deriveWalkinStatus = ({ inTime, outTime, status }) => {
    if (outTime) return 'COMPLETED';
    if (inTime) return 'ACTIVE';
    if (status === 'IN PROGRESS') return 'IN PROGRESS';
    return status === 'ACTIVE' ? 'COMPLETED' : (status || 'COMPLETED');
};

const getWalkinStatusClasses = (status) => {
    if (status === 'ACTIVE') {
        return 'bg-orange-500 text-white shadow-orange-200';
    }
    if (status === 'IN PROGRESS') {
        return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
    return 'bg-slate-100 text-slate-400 border border-slate-200/50';
};

const WalkinHub = ({ hideHeader = false }) => {
    const { walkins, stats, loading, bhs, cres, employees, addWalkin, updateWalkin, deleteWalkin } = useCRE();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isPrivileged = ['SUPER_ADMIN', 'MANAGER', 'BUSINESS_HEAD', 'LEAD_OPERATION'].includes(user.role);
    const location = useLocation();
    const isDark = false; 
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingWalkin, setEditingWalkin] = useState(null);
    const [viewingWalkin, setViewingWalkin] = useState(null);
    const [importing, setImporting] = useState(false);
    
    const initialEntryState = {
        clientName: '',
        contactNumber: '',
        showroom: 'MTRS',
        architectName: '',
        architectId: '',
        bhId: '',
        bhName: '',
        project: '',
        tentativeTime: '',
        inTime: '',
        outTime: '',
        remarks: '',
        dateOfVisit: new Date().toISOString().split('T')[0],
        status: 'IN PROGRESS',
        creId: ''
    };

    const [newEntry, setNewEntry] = useState(initialEntryState);

    const [filter, setFilter] = useState({
        month: '',
        year: '',
        cre: '',
        bh: ''
    });

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const uniqueBhs = useMemo(() => {
        const names = new Set(['Leo Jenison', 'Sanghatamizh', 'Rajkumar', 'Pugazh', 'Shanmugham']);
        if (bhs) bhs.forEach(b => names.add(b.name));
        walkins.forEach(w => {
            if (w.bh?.name) names.add(w.bh.name);
            if (w.bhName) names.add(w.bhName);
        });
        return Array.from(names).sort();
    }, [bhs, walkins]);

    const uniqueCres = useMemo(() => {
        const names = new Set();
        if (cres) cres.forEach(c => names.add(c.name));
        walkins.forEach(w => {
            if (w.cre?.name) names.add(w.cre.name);
        });
        return Array.from(names).sort();
    }, [cres, walkins]);

    const currentWalkins = walkins.filter(w => {
        const date = new Date(w.dateOfVisit || w.createdAt);
        const matchMonth = !filter.month || date.getMonth() + 1 === parseInt(filter.month);
        const matchYear = !filter.year || date.getFullYear() === parseInt(filter.year);
        
        const matchDate = matchMonth && matchYear;
        
        const matchCre = !filter.cre || 
                        w.cre?.name.toLowerCase() === filter.cre.toLowerCase();
        
        const matchBh = !filter.bh || 
                       (w.bh?.name.toLowerCase() === filter.bh.toLowerCase() || 
                        w.bhName?.toLowerCase() === filter.bh.toLowerCase());
        
        // Role based access: Privileged roles see all, others only see entries where they are the CRE, BH, or Architect
        const matchRole = isPrivileged || (w.creId === user.id || w.architectId === user.id || w.bhId === user.id);
        
        return matchDate && matchCre && matchBh && matchRole;
    });

    const adminStats = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const last7Days = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const last15Days = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000));

        return {
            month: walkins.filter(w => new Date(w.dateOfVisit || w.createdAt) >= startOfMonth).length,
            week: walkins.filter(w => new Date(w.dateOfVisit || w.createdAt) >= last7Days).length,
            fifteenDays: walkins.filter(w => new Date(w.dateOfVisit || w.createdAt) >= last15Days).length,
            year: walkins.filter(w => new Date(w.dateOfVisit || w.createdAt) >= startOfYear).length
        };
    }, [walkins]);

    const filteredWalkins = currentWalkins.filter(w => 
        w.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.contactNumber.includes(searchTerm)
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...newEntry,
            status: deriveWalkinStatus(newEntry)
        };
        try {
            let res;
            if (editingWalkin) {
                res = await updateWalkin(editingWalkin.id, payload);
            } else {
                res = await addWalkin(payload);
            }

            if (res.success) {
                toast.success(editingWalkin ? "Entry updated!" : "Visitor recorded!");
                setIsModalOpen(false);
                setEditingWalkin(null);
                setNewEntry(initialEntryState);
            } else {
                toast.error(res.error);
            }
        } catch (error) {
            toast.error("Process failed");
        }
    };

    const handleExport = () => {
        const exportData = filteredWalkins.map(w => ({
            'Client Name': w.clientName,
            'Contact': w.contactNumber,
            'Project': w.project,
            'Showroom': w.showroom,
            'BH Name': w.bh?.name || w.bhName || 'Unassigned',
            'Date of Visit': formatDate(w.dateOfVisit),
            'In Time': w.inTime,
            'Out Time': w.outTime,
            'Remarks': w.remarks,
            'CRE': w.cre?.name || 'Manual'
        }));
        exportToExcel(exportData, 'WalkinHub_Report');
        toast.success("Exporting Walk-in Report...");
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setImporting(true);
            const data = await readExcel(file);
            if (data.length === 0) throw new Error("Excel file is empty");

            // Mapping Excel keys to API keys if necessary, or assuming they match headers
            const res = await api.post('/walkins/hub/bulk-import', data);
            toast.success(`Successfully imported ${res.data.count} entries!`);
            window.location.reload(); 
        } catch (error) {
            console.error('[Import] Error:', error);
            toast.error(error.response?.data?.error || "Import failed. Please check the template format.");
        } finally {
            setImporting(false);
            setIsImportModalOpen(false);
        }
    };

    const handleEdit = (walkin) => {
        setEditingWalkin(walkin);
        setNewEntry({
            clientName: walkin.clientName,
            contactNumber: walkin.contactNumber,
            showroom: walkin.showroom,
            architectName: walkin.architectName || '',
            architectId: walkin.architectId || '',
            project: walkin.project || '',
            tentativeTime: walkin.tentativeTime || '',
            inTime: walkin.inTime || '',
            outTime: walkin.outTime || '',
            remarks: walkin.remarks || '',
            dateOfVisit: walkin.dateOfVisit ? new Date(walkin.dateOfVisit).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: deriveWalkinStatus(walkin),
            creId: walkin.creId || '',
            bhName: walkin.bhName || '',
            bhId: walkin.bhId || ''
        });
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingWalkin(null);
        setNewEntry(initialEntryState);
        setIsModalOpen(true);
    };

    const handleStatusToggle = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE';
        await updateWalkin(id, { status: nextStatus });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section with Stats */}
            {!hideHeader && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className={`text-3xl font-black tracking-widest flex items-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            WALKIN <span className="text-orange-500 ml-2">HUB</span>
                        </h1>
                        <p className="text-slate-500 text-xs font-bold tracking-[0.2em] mt-1 uppercase">Showroom Live Traffic Monitor</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-white border-slate-200 px-4 py-2 rounded-2xl border flex flex-col items-center min-w-[100px] shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                            <span className="text-xl font-black text-orange-500 tracking-tighter">{stats.activeVisitors}</span>
                        </div>
                        <div className="bg-white border-slate-200 px-4 py-2 rounded-2xl border flex flex-col items-center min-w-[100px] shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today</span>
                            <span className="text-xl font-black text-slate-900 tracking-tighter">{stats.totalToday}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Stats Row */}
            {isPrivileged && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top duration-700">
                    {[
                        { label: 'Total Walkin Month', val: adminStats.month, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50/50' },
                        { label: 'Last Week Walkin', val: adminStats.week, icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50/50' },
                        { label: 'Last 15 Days Walkin', val: adminStats.fifteenDays, icon: Star, color: 'text-purple-500', bg: 'bg-purple-50/50' },
                        { label: 'Total Walkin Year', val: adminStats.year, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50/50' }
                    ].map((s, i) => (
                        <div key={i} className={`p-6 rounded-[32px] border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all group overflow-hidden relative`}>
                            <div className={`absolute top-0 right-0 w-24 h-24 ${s.bg} rounded-bl-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform`} />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-2xl ${s.bg}`}>
                                        <s.icon className={`w-5 h-5 ${s.color}`} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{s.label.split(' ')[0]}</span>
                                </div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{s.val}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Showroom Monitor Cards */}
            <ShowroomMonitor walkins={walkins} />

            {/* Advanced Filters Bar */}
            <div className="flex flex-wrap gap-4 items-center bg-white border border-slate-200 p-6 rounded-[32px] shadow-sm">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-orange-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Filters</span>
                </div>
                <div className="flex items-center gap-2">
                    <select 
                        value={filter.month}
                        onChange={(e) => setFilter({...filter, month: e.target.value})}
                        className={`border rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-orange-500/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] min-w-[130px] ${isDark ? 'bg-slate-900 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-900 shadow-sm'}`}
                    >
                        <option value="">ALL MONTHS</option>
                        {months.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <select 
                        value={filter.year}
                        onChange={(e) => setFilter({...filter, year: e.target.value})}
                        className={`border rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-orange-500/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] min-w-[100px] ${isDark ? 'bg-slate-900 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-900 shadow-sm'}`}
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
                <select 
                    value={filter.cre}
                    onChange={(e) => setFilter({...filter, cre: e.target.value})}
                    className={`border rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-orange-500/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] min-w-[180px] ${isDark ? 'bg-slate-900 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-900 shadow-sm'}`}
                >
                    <option value="">ALL CRE NAMES</option>
                    {uniqueCres.map((name, i) => (
                        <option key={i} value={name}>{name}</option>
                    ))}
                </select>
                <select 
                    value={filter.bh}
                    onChange={(e) => setFilter({...filter, bh: e.target.value})}
                    className={`border rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-orange-500/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] min-w-[180px] ${isDark ? 'bg-slate-900 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-900 shadow-sm'}`}
                >
                    <option value="">ALL BH NAMES</option>
                    {uniqueBhs.map((name, i) => (
                        <option key={i} value={name}>{name}</option>
                    ))}
                </select>
                <button 
                    onClick={() => setFilter({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), cre: '', bh: '' })}
                    className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 ml-auto"
                >
                    Reset Filters
                </button>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search Client or Contact..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full border rounded-2xl py-3 pl-12 pr-4 text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition-all backdrop-blur-md ${isDark ? 'bg-slate-900/50 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={handleExport}
                        className={`flex-1 md:flex-none flex items-center justify-center px-4 py-3 border rounded-2xl transition-all ${isDark ? 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-orange-500' : 'bg-white border-slate-200 text-slate-500 hover:text-orange-500 shadow-sm'}`}
                        title="Export to Excel"
                    >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        <span className="text-xs font-extrabold uppercase">Export</span>
                    </button>
                    <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className={`flex-1 md:flex-none flex items-center justify-center px-4 py-3 border rounded-2xl transition-all ${isDark ? 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-emerald-500' : 'bg-white border-slate-200 text-slate-500 hover:text-emerald-500 shadow-sm'}`}
                        title="Import from Excel"
                    >
                        <Activity className="w-4 h-4 mr-2" />
                        <span className="text-xs font-extrabold uppercase">Import</span>
                    </button>
                    <button 
                        onClick={openAddModal}
                        className="flex-1 md:flex-none flex items-center justify-center px-6 py-3 bg-orange-500 rounded-2xl text-white font-black text-xs uppercase shadow-lg shadow-orange-500/20 hover:bg-orange-600 active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Visitor
                    </button>
                </div>
            </div>

            {/* Entries Table */}
            <div className="rounded-[40px] border border-slate-200 overflow-hidden bg-white shadow-sm shadow-slate-200/50">
                <div className="overflow-x-auto min-h-[500px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Visitor Info</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Showroom</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Details</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <AnimatePresence>
                                {filteredWalkins.map((w, idx) => (
                                    <motion.tr 
                                        key={w.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => setViewingWalkin(w)}
                                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                    >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center">
                                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-orange-500 font-black border border-orange-100 bg-orange-50 shadow-sm group-hover:scale-110 transition-transform">
                                                        {w.clientName.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <p className="text-sm font-black text-slate-900 tracking-tight">{w.clientName}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <div className="flex items-center text-[10px] text-slate-400 font-black tracking-widest uppercase">
                                                                <Phone className="w-3 h-3 mr-1 text-slate-300" />
                                                                {w.contactNumber}
                                                            </div>
                                                            
                                                            {/* WhatsApp Review Status Indicator */}
                                                            {w.status === 'COMPLETED' && (
                                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 group/wa relative">
                                                                    {w.whatsappStatus === 'SENT' ? (
                                                                        <>
                                                                            <MessageSquare className="w-2.5 h-2.5 text-emerald-500" />
                                                                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Review Sent</span>
                                                                        </>
                                                                    ) : w.whatsappStatus === 'FAILED' ? (
                                                                        <>
                                                                            <AlertCircle className="w-2.5 h-2.5 text-red-500" />
                                                                            <span className="text-[8px] font-black text-red-600 uppercase tracking-tighter">Review Failed</span>
                                                                            {/* Tooltip for Error */}
                                                                            <div className="absolute bottom-full mb-2 left-0 w-48 p-2 bg-slate-900 text-white text-[9px] rounded-lg opacity-0 group-hover/wa:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl">
                                                                                <p className="font-bold text-red-400 mb-1">REASON:</p>
                                                                                {w.whatsappError || "Unknown Meta API Error"}
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Loader2 className="w-2.5 h-2.5 text-slate-400 animate-spin" />
                                                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Review Pending</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="inline-flex items-center px-4 py-1.5 rounded-2xl border bg-slate-50 border-slate-200/50">
                                                    <MapPin className="w-3 h-3 mr-2 text-orange-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{w.showroom}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center text-[10px] font-black text-slate-400">
                                                        <User className="w-3 h-3 mr-2 text-slate-300" />
                                                        <span className="uppercase tracking-widest">BH:</span>
                                                        <span className="ml-2 text-slate-600">{w.bh?.name || w.bhName || 'Unassigned'}</span>
                                                    </div>
                                                    <div className="flex items-center text-[10px] font-black text-slate-400">
                                                        <Star className="w-3 h-3 mr-2 text-orange-300" />
                                                        <span className="uppercase tracking-widest text-orange-500/80">CRE:</span>
                                                        <span className="ml-2 font-black text-orange-600 uppercase">{w.cre?.name || 'System'}</span>
                                                    </div>
                                                    <div className="flex items-center text-[10px] font-black text-slate-400">
                                                        <Briefcase className="w-3 h-3 mr-2 text-slate-300" />
                                                        <span className="uppercase tracking-widest">Arch:</span>
                                                        <span className="ml-2 text-slate-600">{w.architect?.name || w.architectName || 'None'}</span>
                                                    </div>
                                                    {w.remarks && (
                                                        <div className="flex items-center text-[10px] font-black text-slate-400">
                                                            <div className="w-3 h-3 mr-2 bg-orange-500/20 rounded-full" />
                                                            <span className="uppercase tracking-widest">Remarks:</span>
                                                            <span className="ml-2 text-slate-500 italic truncate max-w-[150px]">{w.remarks}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100">
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black uppercase text-slate-300">In</span>
                                                            <span className="text-[10px] font-black text-slate-600">{w.inTime || '--:--'}</span>
                                                        </div>
                                                        <div className="flex flex-col border-l border-slate-100 pl-3">
                                                            <span className="text-[8px] font-black uppercase text-slate-300">Out</span>
                                                            <span className="text-[10px] font-black text-slate-600">{w.outTime || '--:--'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className={`inline-flex items-center px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${getWalkinStatusClasses(w.status)}`}>
                                                    {w.status === 'ACTIVE' && <Activity className="w-3 h-3 mr-2 animate-pulse" />}
                                                    {w.status}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(w); }}
                                                        className="p-3 rounded-2xl bg-white text-slate-400 border border-slate-200 hover:text-orange-500 hover:border-orange-500 transition-all shadow-sm"
                                                        title="Edit Entry"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleStatusToggle(w.id, w.status); }}
                                                        className={`p-3 rounded-2xl border transition-all ${w.status === 'ACTIVE' ? 'bg-slate-900 text-white border-slate-800 hover:bg-black shadow-lg shadow-slate-200' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-900 hover:border-slate-900 shadow-sm'}`}
                                                        title={w.status === 'ACTIVE' ? "Mark as Out" : "Mark as Active"}
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); deleteWalkin(w.id); }}
                                                        className="p-3 rounded-2xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Plus className="w-4 h-4 rotate-45" />
                                                    </button>
                                                </div>
                                            </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredWalkins.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-32 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 rounded-[32px] bg-slate-50 flex items-center justify-center mb-6 shadow-inner">
                                                <Clock className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">No activity recorded yet</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for New Entry */}
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
                            className={`relative w-full max-w-lg rounded-[32px] border shadow-2xl p-8 overflow-y-auto max-h-[90vh] ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
                        >
                            <h2 className={`text-2xl font-black uppercase tracking-widest mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>{editingWalkin ? 'Edit' : 'New'} <span className="text-orange-500">Visitor</span></h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Client Name</label>
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="John Doe"
                                            value={newEntry.clientName}
                                            onChange={(e) => setNewEntry({...newEntry, clientName: e.target.value})}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Number</label>
                                        <input 
                                            required
                                            type="tel" 
                                            placeholder="99620 XXXXX"
                                            value={newEntry.contactNumber}
                                            onChange={(e) => setNewEntry({...newEntry, contactNumber: e.target.value})}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Showroom</label>
                                        <select 
                                            value={newEntry.showroom}
                                            onChange={(e) => setNewEntry({...newEntry, showroom: e.target.value})}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        >
                                            <option value="MTRS" className={!isDark ? 'text-slate-900' : ''}>MTRS</option>
                                            <option value="OMR" className={!isDark ? 'text-slate-900' : ''}>OMR</option>
                                            <option value="PORUR" className={!isDark ? 'text-slate-900' : ''}>PORUR</option>
                                            <option value="COIMBATORE" className={!isDark ? 'text-slate-900' : ''}>COIMBATORE</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tentative Time</label>
                                        <input 
                                            type="time" 
                                            value={newEntry.tentativeTime}
                                            onChange={(e) => setNewEntry({...newEntry, tentativeTime: e.target.value})}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Architect / Employee</label>
                                        <select 
                                            value={newEntry.architectId}
                                            onChange={(e) => {
                                                const sel = employees.find(emp => emp.id === e.target.value);
                                                setNewEntry({...newEntry, architectId: e.target.value, architectName: sel?.name || ''});
                                            }}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        >
                                            <option value="">None / External</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role.split('_').join(' ')})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Project Location</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Velachery"
                                            value={newEntry.project}
                                            onChange={(e) => setNewEntry({...newEntry, project: e.target.value})}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date of Visit</label>
                                        <input 
                                            type="date" 
                                            value={newEntry.dateOfVisit}
                                            onChange={(e) => setNewEntry({...newEntry, dateOfVisit: e.target.value})}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">In Time</label>
                                        <input 
                                            type="time" 
                                            value={newEntry.inTime}
                                            onChange={(e) => {
                                                const inTime = e.target.value;
                                                setNewEntry(prev => ({
                                                    ...prev,
                                                    inTime,
                                                    status: deriveWalkinStatus({ ...prev, inTime })
                                                }));
                                            }}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Out Time</label>
                                        <input 
                                            type="time" 
                                            value={newEntry.outTime}
                                            onChange={(e) => {
                                                const outTime = e.target.value;
                                                setNewEntry(prev => ({
                                                    ...prev,
                                                    outTime,
                                                    status: deriveWalkinStatus({ ...prev, outTime })
                                                }));
                                            }}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                                        <select 
                                            value={newEntry.status}
                                            onChange={(e) => setNewEntry({...newEntry, status: e.target.value})}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        >
                                            <option value="IN PROGRESS">IN PROGRESS</option>
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="COMPLETED">COMPLETED</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Remarks</label>
                                        <textarea 
                                            rows="2"
                                            placeholder="Special requirements or observations..."
                                            value={newEntry.remarks}
                                            onChange={(e) => setNewEntry({...newEntry, remarks: e.target.value})}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>

                                    {/* Business Head Selector */}
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Business Head (BH)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <select 
                                                value={newEntry.bhName || (newEntry.bhId ? 'EXISTING' : '')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'MANUAL') {
                                                        setNewEntry({...newEntry, bhId: '', bhName: ''});
                                                    } else if (val === 'EXISTING') {
                                                        setNewEntry({...newEntry, bhName: ''});
                                                    } else if (val === '') {
                                                        setNewEntry({...newEntry, bhId: '', bhName: ''});
                                                    } else {
                                                        setNewEntry({...newEntry, bhId: '', bhName: val});
                                                    }
                                                }}
                                                className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                            >
                                                <option value="">Unassigned</option>
                                                <option value="Leo Jenison">Leo Jenison</option>
                                                <option value="Sanghatamizh">Sanghatamizh</option>
                                                <option value="Rajkumar">Rajkumar</option>
                                                <option value="Pugazh">Pugazh</option>
                                                <option value="Shanmugham">Shanmugham</option>
                                                <option value="EXISTING">Registered BH User</option>
                                                <option value="MANUAL">Manual Input...</option>
                                            </select>

                                            {/* Show manual input only if explicitly requested */}
                                            {newEntry.bhName === 'MANUAL' && (
                                                <input 
                                                    type="text"
                                                    placeholder="Enter BH Name"
                                                    value={newEntry.bhName === 'MANUAL' ? '' : newEntry.bhName}
                                                    onChange={(e) => setNewEntry({...newEntry, bhName: e.target.value})}
                                                    className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-orange-50 border-orange-200 text-slate-900'}`}
                                                />
                                            )}

                                            {/* Show registered users list only if 'EXISTING' is selected or bhId is already set */}
                                            {(newEntry.bhId || (newEntry.bhName === 'EXISTING')) && (
                                                <select 
                                                    value={newEntry.bhId}
                                                    onChange={(e) => setNewEntry({...newEntry, bhId: e.target.value, bhName: ''})}
                                                    className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                                >
                                                    <option value="">Select Registered User...</option>
                                                    {(bhs || []).map(bh => (
                                                        <option key={bh.id} value={bh.id}>{bh.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    {/* CRE Attribution - Only for Privileged Roles */}
                                    {isPrivileged && (
                                        <div className="space-y-1.5 col-span-2">
                                            <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-1">Attributed CRE</label>
                                            <select 
                                                value={newEntry.creId}
                                                onChange={(e) => setNewEntry({...newEntry, creId: e.target.value})}
                                                className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%23f97316%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-orange-50/50 border-orange-100 text-slate-900'}`}
                                            >
                                                <option value="">Select CRE (Default: You)</option>
                                                {cres.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
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
                                        className="flex-2 px-8 py-4 bg-orange-500 rounded-2xl text-white font-black text-xs uppercase shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex-[2]"
                                    >
                                        Record Visit
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
                                <TrendingUp className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h2 className={`text-2xl font-black text-center uppercase tracking-widest mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Bulk <span className="text-emerald-500">Import</span></h2>
                            <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest mb-8">Upload Excel File To Import Multi-Entries</p>
                            
                            <div className="space-y-6">
                                <label className="block">
                                    <div className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Activity className="w-10 h-10 text-slate-300 group-hover:text-emerald-500 transition-all mb-4" />
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
                                        onClick={() => downloadTemplate('walkin', { bhs: (bhs || []).map(b => b.name) })}
                                        className="w-full py-3 bg-white border border-orange-200 rounded-xl text-[10px] font-black uppercase text-orange-500 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        Sample_Template.xlsx
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
            {/* Modal for viewing details (Read-Only) */}
            <AnimatePresence>
                {viewingWalkin && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewingWalkin(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-200"
                        >
                            {/* Modal Header */}
                            <div className="bg-slate-50 border-b border-slate-100 p-8 flex justify-between items-center bg-gradient-to-br from-slate-50 to-white">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase tracking-widest flex items-center">
                                        Visitor <span className="text-orange-500 ml-2">Detail</span>
                                    </h2>
                                    <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mt-1">Full Entry Data Record</p>
                                </div>
                                <button 
                                    onClick={() => setViewingWalkin(null)}
                                    className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-orange-500 hover:border-orange-500 transition-all flex items-center justify-center shadow-sm"
                                >
                                    <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>

                            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto detail-scroll custom-scrollbar">
                                {/* Basic Info Grid */}
                                <div className="grid grid-cols-2 gap-8 pb-8 border-b border-slate-100">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Client Name</p>
                                            <div className="flex items-center text-lg font-black text-slate-900 tracking-tight">
                                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 mr-3 border border-orange-100">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                {viewingWalkin.clientName}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Contact</p>
                                            <div className="flex items-center text-slate-600 font-bold tracking-widest">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mr-3 border border-slate-100">
                                                    <Phone className="w-5 h-5" />
                                                </div>
                                                {viewingWalkin.contactNumber}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date of Visit</p>
                                            <div className="flex items-center text-slate-600 font-bold tracking-widest">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mr-3 border border-slate-100">
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                {formatDate(viewingWalkin.dateOfVisit)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Showroom</p>
                                            <div className="inline-flex items-center px-4 py-2 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest shadow-md shadow-orange-200">
                                                <MapPin className="w-3.5 h-3.5 mr-2" />
                                                {viewingWalkin.showroom}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Project Location</p>
                                            <div className="flex items-center text-slate-600 font-bold uppercase tracking-widest">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mr-3 border border-slate-100">
                                                    <Briefcase className="w-5 h-5" />
                                                </div>
                                                {viewingWalkin.project || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</p>
                                            <div className={`inline-flex items-center px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${viewingWalkin.status === 'ACTIVE' ? 'bg-orange-50 text-orange-600 border border-orange-200' : viewingWalkin.status === 'IN PROGRESS' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                                                {viewingWalkin.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Assignments Section */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-slate-100">
                                    <div className="p-5 rounded-[28px] bg-slate-50/50 border border-slate-100 relative group overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full translate-x-4 -translate-y-4 transition-transform group-hover:scale-125" />
                                        <p className="relative z-10 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">CRE Assigned</p>
                                        <div className="relative z-10 flex items-center">
                                            <Star className="w-4 h-4 text-orange-500 mr-2" />
                                            <span className="text-xs font-black text-slate-900 uppercase">{viewingWalkin.cre?.name || 'MANUAL SYSTEM'}</span>
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-[28px] bg-slate-50/50 border border-slate-100 relative group overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full translate-x-4 -translate-y-4 transition-transform group-hover:scale-125" />
                                        <p className="relative z-10 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Business Head</p>
                                        <div className="relative z-10 flex items-center">
                                            <User className="w-4 h-4 text-blue-500 mr-2" />
                                            <span className="text-xs font-black text-slate-900 uppercase">{viewingWalkin.bh?.name || viewingWalkin.bhName || 'UNASSIGNED'}</span>
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-[28px] bg-slate-50/50 border border-slate-100 relative group overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full translate-x-4 -translate-y-4 transition-transform group-hover:scale-125" />
                                        <p className="relative z-10 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Architect / Employee</p>
                                        <div className="relative z-10 flex items-center">
                                            <Briefcase className="w-4 h-4 text-purple-500 mr-2" />
                                            <span className="text-xs font-black text-slate-900 uppercase">{viewingWalkin.architect?.name || viewingWalkin.architectName || 'NONE'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Timings & Review */}
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center">
                                            <Clock className="w-3 h-3 mr-2" /> Showroom Timings
                                        </h3>
                                        <div className="flex gap-4">
                                            <div className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">In Time</p>
                                                <p className="text-sm font-black text-slate-700">{viewingWalkin.inTime || '--:--'}</p>
                                            </div>
                                            <div className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Out Time</p>
                                                <p className="text-sm font-black text-slate-700">{viewingWalkin.outTime || '--:--'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center">
                                            <MessageSquare className="w-3 h-3 mr-2" /> WhatsApp Review
                                        </h3>
                                        <div className={`p-4 rounded-2xl border flex items-center justify-between ${viewingWalkin.whatsappStatus === 'SENT' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : viewingWalkin.whatsappStatus === 'FAILED' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{viewingWalkin.whatsappStatus || 'PENDING'}</span>
                                            {viewingWalkin.whatsappStatus === 'SENT' ? <CheckCircle className="w-4 h-4" /> : viewingWalkin.whatsappStatus === 'FAILED' ? <AlertCircle className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                                        </div>
                                        {viewingWalkin.whatsappError && (
                                            <p className="text-[9px] font-bold text-red-400 uppercase italic tracking-wider px-2">* {viewingWalkin.whatsappError}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Full Remarks */}
                                <div className="p-6 rounded-[32px] bg-slate-50/80 border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Remarks & Observations</p>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                                        {viewingWalkin.remarks || 'No specific remarks recorded for this visitor.'}
                                    </p>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                                <button 
                                    onClick={() => setViewingWalkin(null)}
                                    className="px-10 py-4 bg-slate-900 text-white rounded-[20px] text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
                                >
                                    Close Record
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WalkinHub;
