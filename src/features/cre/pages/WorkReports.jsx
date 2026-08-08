import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Phone, MapPin, User, Star, Calendar, Download, Upload, Briefcase, ChevronRight, Check, FileText, Edit2, Clock, Activity } from 'lucide-react';
import { useCRE } from '../context/CREContext';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/axios';
import { exportToExcel, readExcel, downloadTemplate } from '../../../shared/utils/excel';
import { formatDate } from '../../../shared/utils/dateFormatter';

const WorkReports = ({ hideHeader = false }) => {
    const { reports, stats, loading, addReport, updateReport, deleteWorkReport, bhs, cres } = useCRE();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isPrivileged = ['SUPER_ADMIN', 'MANAGER', 'BUSINESS_HEAD', 'LEAD_OPERATION'].includes(user.role);
    const location = useLocation();
    const isDark = false; 
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingReport, setEditingReport] = useState(null);
    const [viewingReport, setViewingReport] = useState(null);
    const [importing, setImporting] = useState(false);
    
    const initialReportState = {
        clientName: '',
        contact: '',
        showroom: 'MTRS',
        source: 'DIRECT LEAD',
        status: 'Y',
        faName: '',
        bhId: '',
        bhName: '',
        site: '',
        star: 5,
        remarks: '',
        creId: '',
        date: new Date().toISOString().split('T')[0]
    };

    const [newReport, setNewReport] = useState(initialReportState);

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
        bhs.forEach(b => names.add(b.name));
        reports.forEach(r => {
            if (r.bh?.name) names.add(r.bh.name);
            if (r.bhName) names.add(r.bhName);
        });
        return Array.from(names).sort();
    }, [bhs, reports]);

    const uniqueCres = useMemo(() => {
        const names = new Set();
        cres.forEach(c => names.add(c.name));
        reports.forEach(r => {
            if (r.cre?.name) names.add(r.cre.name);
        });
        return Array.from(names).sort();
    }, [cres, reports]);

    const currentReports = reports.filter(r => {
        const date = new Date(r.date);
        const matchMonth = !filter.month || date.getMonth() + 1 === parseInt(filter.month);
        const matchYear = !filter.year || date.getFullYear() === parseInt(filter.year);
        
        const matchDate = matchMonth && matchYear;
        
        const matchCre = !filter.cre || 
                        (r.cre?.name.toLowerCase() === filter.cre.toLowerCase());
        
        const matchBh = !filter.bh || 
                       (r.bh?.name.toLowerCase() === filter.bh.toLowerCase() || 
                        r.bhName?.toLowerCase() === filter.bh.toLowerCase());
        
        return matchDate && matchCre && matchBh;
    });

    const conversionRate = currentReports.length > 0 
        ? Math.round((currentReports.filter(r => r.status === 'Y').length / currentReports.length) * 100) 
        : 0;

    const filteredReports = currentReports.filter(r => 
        r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.contact.includes(searchTerm)
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let res;
            if (editingReport) {
                res = await updateReport(editingReport.id, newReport);
            } else {
                res = await addReport(newReport);
            }

            if (res.success) {
                toast.success(editingReport ? "Report updated!" : "Report added successfully!");
                setIsModalOpen(false);
                setEditingReport(null);
                setNewReport(initialReportState);
            } else {
                toast.error(res.error);
            }
        } catch (error) {
            toast.error("Process failed");
        }
    };

    const handleExport = () => {
        const exportData = filteredReports.map(r => ({
            'Date': formatDate(r.date),
            'Client Name': r.clientName,
            'Contact': r.contact,
            'Showroom': r.showroom || 'MTRS',
            'BH Name': r.bh?.name || r.bhName || 'Unassigned',
            'Status': r.status === 'Y' ? 'Completed' : 'Pending',
            'Site': r.site || 'N/A',
            'Rating': r.star,
            'Remarks': r.remarks,
            'CRE': r.cre?.name || 'Manual'
        }));
        exportToExcel(exportData, 'WorkReports_Audit');
        toast.success("Exporting Work Reports...");
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setImporting(true);
            const data = await readExcel(file);
            if (data.length === 0) throw new Error("Excel file is empty");

            const res = await api.post('/walkins/reports/bulk-import', data);
            toast.success(`Successfully imported ${res.data.count} work reports!`);
            window.location.reload(); 
        } catch (error) {
            console.error('[Import] Error:', error);
            toast.error(error.response?.data?.error || "Import failed. Please check the template format.");
        } finally {
            setImporting(false);
            setIsImportModalOpen(false);
        }
    };

    const handleEdit = (report) => {
        setEditingReport(report);
        setNewReport({
            clientName: report.clientName,
            contact: report.contact,
            showroom: report.showroom,
            source: report.source,
            status: report.status,
            faName: report.faName || '',
            bhId: report.bhId || '',
            site: report.site || '',
            star: report.star || 0,
            remarks: report.remarks || '',
            creId: report.creId || '',
            bhName: report.bhName || '',
            date: report.date ? new Date(report.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingReport(null);
        setNewReport(initialReportState);
        setIsModalOpen(true);
    };

    const handleBulkImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                // Basic mapping to Prisma schema
                const processed = data.map(row => ({
                    clientName: row['Client Name'] || row.clientName,
                    contact: String(row.Contact || row.contact || ""),
                    showroom: row.Showroom || row.showroom || 'MTRS',
                    source: row.Source || row.source || 'BULK',
                    site: row.Site || row.site || '',
                    faName: row['FA Name'] || row.faName || '',
                    remarks: row.Remarks || row.remarks || '',
                    status: row.Status || 'Y',
                    star: Number(row.Quality || row.star || 5)
                }));

                const res = await api.post('/walkins/reports/bulk-import', processed);
                if (res.data.success) {
                    toast.success(`Successfully imported ${res.data.count} reports!`);
                    window.location.reload();
                }
            } catch (err) {
                console.error("Bulk Import Error:", err);
                toast.error("Failed to parse or upload file. Ensure format is correct.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const StatusTogggle = ({ status }) => (
        <div className={`p-1 w-10 flex ${status === 'Y' ? 'justify-end bg-orange-500' : 'justify-start bg-slate-800'} rounded-full border border-white/5 transition-all duration-300`}>
            <div className="w-4 h-4 bg-white rounded-full shadow-lg" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            {!hideHeader && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className={`text-3xl font-black tracking-widest flex items-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            WORK <span className="text-orange-500 ml-2">REPORTS</span>
                        </h1>
                        <p className="text-slate-500 text-xs font-bold tracking-[0.2em] mt-1 uppercase">Lead Assignment & Conversion Tracker</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-white border-slate-200 px-4 py-2 rounded-2xl border flex flex-col items-center min-w-[100px] shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</span>
                            <span className="text-xl font-black text-orange-500 tracking-tighter">{stats.pendingReports}</span>
                        </div>
                    </div>
                </div>
            )}


            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Pending Reports', val: stats.pendingReports, color: 'text-orange-500', icon: Clock },
                    { label: 'Total Leads', val: reports.length, color: 'text-slate-900', icon: Briefcase },
                    { label: 'Convert Rate', val: `${conversionRate}%`, color: 'text-emerald-500', icon: Check }
                ].map((s, i) => (
                    <div key={i} className="p-8 rounded-[40px] border border-slate-200 bg-white shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                        <div>
                            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-2">{s.label}</p>
                            <p className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.val}</p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <s.icon className={`w-7 h-7 ${s.color}`} />
                        </div>
                    </div>
                ))}
            </div>

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

            {/* Search & Add */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search lead or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full border rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-slate-900/50 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={handleExport}
                        className={`flex-1 md:flex-none flex items-center justify-center px-4 py-3 border rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-orange-500' : 'bg-white border-slate-200 text-slate-500 hover:text-orange-500 shadow-sm'}`}
                        title="Export to Excel"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                    <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className={`flex-1 md:flex-none flex items-center justify-center px-4 py-3 border rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-emerald-500' : 'bg-white border-slate-200 text-slate-500 hover:text-emerald-500 shadow-sm'}`}
                        title="Import from Excel"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                    </button>
                    <button 
                        onClick={() => {
                            setEditingReport(null);
                            setNewReport(initialReportState);
                            setIsModalOpen(true);
                        }}
                        className="flex-1 md:flex-none flex items-center justify-center px-8 py-3 bg-orange-500 rounded-2xl text-white font-black text-xs uppercase shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center justify-center"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Work Report
                    </button>
                </div>
            </div>

            {/* Main Table */}
            <div className="rounded-[48px] border border-slate-200 overflow-hidden bg-white shadow-sm shadow-slate-200/50">
                <div className="overflow-x-auto min-h-[500px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lead Details</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignment</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Source/Site</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Quality</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredReports.map((r, idx) => (
                                <motion.tr 
                                    key={r.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    onClick={() => setViewingReport(r)}
                                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 group-hover:text-orange-500 transition-colors uppercase tracking-tight">{r.clientName}</span>
                                            <span className="text-[10px] font-black text-slate-400 flex items-center mt-1 tracking-widest uppercase">
                                                <Phone className="w-3.5 h-3.5 mr-2 text-slate-300" /> {r.contact}
                                            </span>
                                            <div className="flex items-center text-[9px] text-slate-500 mt-2 font-black uppercase tracking-[0.2em]">
                                                <Calendar className="w-3.5 h-3.5 mr-2 text-slate-300" /> 
                                                {formatDate(r.date)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-orange-100 bg-orange-50 mr-3">
                                                    <Briefcase className="w-4 h-4 text-orange-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">FA Assigned</span>
                                                    <span className="text-[10px] font-black text-slate-700 uppercase">{r.faName || 'None'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-blue-100 bg-blue-50 mr-3">
                                                    <User className="w-4 h-4 text-blue-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Business Head</span>
                                                    <span className="text-[10px] font-black text-slate-700 uppercase">{r.bh?.name || r.bhName || 'Unassigned'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-orange-100 bg-orange-50 mr-3">
                                                    <Star className="w-4 h-4 text-orange-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest">CRE Name</span>
                                                    <span className="text-[10px] font-black text-orange-600 uppercase italic">{r.cre?.name || 'System'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1.5">
                                            <div className="inline-flex items-center px-4 py-1.5 rounded-2xl border border-slate-200 bg-slate-50">
                                                <MapPin className="w-3.5 h-3.5 mr-2 text-orange-500 flex-shrink-0" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 truncate max-w-[120px]">{r.showroom} / {r.site || 'N/A'}</span>
                                            </div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Source: {r.source}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center gap-0.5">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                                <Star 
                                                    key={star} 
                                                    className={`w-2.5 h-2.5 ${star <= r.star ? 'fill-orange-500 text-orange-500' : 'text-slate-100'}`} 
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex justify-center">
                                            <div className={`p-1.5 w-12 flex ${r.status === 'Y' ? 'justify-end bg-orange-500' : 'justify-start bg-slate-200'} rounded-2xl transition-all duration-500 shadow-inner`}>
                                                <div className="w-4 h-4 bg-white rounded-lg shadow-sm" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right flex justify-end gap-2 text-right">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEdit(r); }}
                                            className="p-3 text-slate-400 hover:text-orange-500 bg-slate-50 hover:bg-orange-50 rounded-2xl transition-all border border-transparent hover:border-orange-100 shadow-sm"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        {isPrivileged && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteWorkReport(r.id); }}
                                                className="p-3 text-red-400 hover:text-white bg-slate-50 hover:bg-red-500 rounded-2xl transition-all border border-transparent shadow-sm"
                                                title="Delete Report"
                                            >
                                                <Plus className="w-5 h-5 rotate-45" />
                                            </button>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for New Report */}
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
                            className={`relative w-full max-w-2xl rounded-[32px] border shadow-2xl p-8 overflow-y-auto max-h-[90vh] ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
                        >
                            <h2 className={`text-2xl font-black uppercase tracking-widest mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>{editingReport ? 'Edit' : 'New'} <span className="text-orange-500">Work Report</span></h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Client Details */}
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Client Name</label>
                                            <input 
                                                required
                                                type="text" 
                                                placeholder="Enter client name"
                                                value={newReport.clientName}
                                                onChange={(e) => setNewReport({...newReport, clientName: e.target.value})}
                                                className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Number</label>
                                            <input 
                                                required
                                                type="tel" 
                                                placeholder="e.g. 9876543210"
                                                value={newReport.contact}
                                                onChange={(e) => setNewReport({...newReport, contact: e.target.value})}
                                                className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date of Report</label>
                                            <input 
                                                required
                                                type="date" 
                                                value={newReport.date}
                                                onChange={(e) => setNewReport({...newReport, date: e.target.value})}
                                                className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Location & Source */}
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Showroom</label>
                                            <select 
                                                value={newReport.showroom}
                                                onChange={(e) => setNewReport({...newReport, showroom: e.target.value})}
                                                className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                            >
                                                <option value="MTRS" className={!isDark ? 'text-slate-900' : ''}>MTRS</option>
                                                <option value="OMR" className={!isDark ? 'text-slate-900' : ''}>OMR</option>
                                                <option value="PORUR" className={!isDark ? 'text-slate-900' : ''}>PORUR</option>
                                                <option value="COIMBATORE" className={!isDark ? 'text-slate-900' : ''}>COIMBATORE</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Site / Location</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Velachery"
                                                value={newReport.site}
                                                onChange={(e) => setNewReport({...newReport, site: e.target.value})}
                                                className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lead Source</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Social Media, Referral"
                                                value={newReport.source}
                                                onChange={(e) => setNewReport({...newReport, source: e.target.value})}
                                                className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Assignment */}
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">FA Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="Assign FA"
                                                value={newReport.faName}
                                                onChange={(e) => setNewReport({...newReport, faName: e.target.value})}
                                                className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                            />
                                        </div>
                                    {/* Business Head Selector */}
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Business Head (BH)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <select 
                                                value={newReport.bhName || (newReport.bhId ? 'EXISTING' : '')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'MANUAL') {
                                                        setNewReport({...newReport, bhId: '', bhName: ''});
                                                    } else if (val === 'EXISTING') {
                                                        setNewReport({...newReport, bhName: ''});
                                                    } else if (val === '') {
                                                        setNewReport({...newReport, bhId: '', bhName: ''});
                                                    } else {
                                                        setNewReport({...newReport, bhId: '', bhName: val});
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
                                            {newReport.bhName === 'MANUAL' && (
                                                <input 
                                                    type="text"
                                                    placeholder="Enter BH Name"
                                                    value={newReport.bhName === 'MANUAL' ? '' : newReport.bhName}
                                                    onChange={(e) => setNewReport({...newReport, bhName: e.target.value})}
                                                    className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-orange-50 border-orange-200 text-slate-900'}`}
                                                />
                                            )}

                                            {/* Show registered users list only if 'EXISTING' is selected or bhId is already set */}
                                            {(newReport.bhId || (newReport.bhName === 'EXISTING')) && (
                                                <select 
                                                    value={newReport.bhId}
                                                    onChange={(e) => setNewReport({...newReport, bhId: e.target.value, bhName: ''})}
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
                                    </div>

                                    {/* Quality & Status */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lead Quality</label>
                                            <div className="flex flex-wrap gap-1">
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setNewReport({...newReport, star})}
                                                        className="p-1 transition-all"
                                                    >
                                                        <Star className={`w-5 h-5 ${star <= newReport.star ? 'fill-orange-500 text-orange-500 scale-110' : isDark ? 'text-slate-700' : 'text-slate-200'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Successful Lead (Y/N)</span>
                                            <button 
                                                type="button"
                                                onClick={() => setNewReport({...newReport, status: newReport.status === 'Y' ? 'N' : 'Y'})}
                                            >
                                                <div className={`p-1 w-10 flex ${newReport.status === 'Y' ? 'justify-end bg-orange-500' : isDark ? 'justify-start bg-slate-800' : 'justify-start bg-slate-200'} rounded-full border border-white/5 transition-all duration-300`}>
                                                    <div className="w-4 h-4 bg-white rounded-full shadow-lg" />
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remarks */}
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Remarks</label>
                                        <textarea 
                                            placeholder="Add meeting notes or next steps..."
                                            value={newReport.remarks}
                                            onChange={(e) => setNewReport({...newReport, remarks: e.target.value})}
                                            className={`w-full border rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 min-h-[100px] ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>

                                    {/* CRE Attribution - Only for Privileged Roles */}
                                    {isPrivileged && (
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-1">Attributed CRE</label>
                                            <select 
                                                value={newReport.creId}
                                                onChange={(e) => setNewReport({...newReport, creId: e.target.value})}
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
                                        className="flex-[2] px-8 py-4 bg-orange-500 rounded-2xl text-white font-black text-xs uppercase shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all font-bold"
                                    >
                                        Save Report
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
                                <Upload className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h2 className={`text-2xl font-black text-center uppercase tracking-widest mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Work <span className="text-emerald-500">Import</span></h2>
                            <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest mb-8">Upload Excel File To Import Multi-Entries</p>
                            
                            <div className="space-y-6">
                                <label className="block">
                                    <div className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Briefcase className="w-10 h-10 text-slate-300 group-hover:text-emerald-500 transition-all mb-4" />
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

                                <div className="p-5 rounded-[24px] bg-blue-50 border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Download Sample Sheet</p>
                                    <button 
                                        onClick={() => downloadTemplate('workreport', { bhs: (bhs || []).map(b => b.name) })}
                                        className="w-full py-3 bg-white border border-blue-200 rounded-xl text-[10px] font-black uppercase text-blue-500 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        WorkReport_Template.xlsx
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
                {viewingReport && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewingReport(null)}
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
                                        Work <span className="text-orange-500 ml-2">Detail</span>
                                    </h2>
                                    <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mt-1">Full Work Report Record</p>
                                </div>
                                <button 
                                    onClick={() => setViewingReport(null)}
                                    className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-orange-500 hover:border-orange-500 transition-all flex items-center justify-center shadow-sm"
                                >
                                    <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>

                            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto detail-scroll custom-scrollbar">
                                {/* Lead Info Grid */}
                                <div className="grid grid-cols-2 gap-8 pb-8 border-b border-slate-100">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Client Name</p>
                                            <div className="flex items-center text-lg font-black text-slate-900 tracking-tight">
                                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 mr-3 border border-orange-100">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                {viewingReport.clientName}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Contact</p>
                                            <div className="flex items-center text-slate-600 font-bold tracking-widest">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mr-3 border border-slate-100">
                                                    <Phone className="w-5 h-5" />
                                                </div>
                                                {viewingReport.contact}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Report Date</p>
                                            <div className="flex items-center text-slate-600 font-bold tracking-widest">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mr-3 border border-slate-100">
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                {formatDate(viewingReport.date)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Showroom / Site</p>
                                            <div className="inline-flex items-center px-4 py-2 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest shadow-md shadow-orange-200">
                                                <MapPin className="w-3.5 h-3.5 mr-2" />
                                                {viewingReport.showroom} / {viewingReport.site || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Lead Source</p>
                                            <div className="flex items-center text-slate-600 font-bold uppercase tracking-widest">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mr-3 border border-slate-100">
                                                    <Briefcase className="w-5 h-5" />
                                                </div>
                                                {viewingReport.source || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Lead Status</p>
                                            <div className={`inline-flex items-center px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${viewingReport.status === 'Y' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
                                                {viewingReport.status === 'Y' ? 'SUCCESSFUL' : 'PENDING'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quality & Assignments */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-slate-100">
                                    <div className="p-5 rounded-[28px] bg-slate-50/50 border border-slate-100 relative group overflow-hidden md:col-span-2">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full translate-x-4 -translate-y-4 transition-transform group-hover:scale-125" />
                                        <p className="relative z-10 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Lead Quality (1-10)</p>
                                        <div className="relative z-10 flex gap-0.5">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                                <Star 
                                                    key={star} 
                                                    className={`w-4 h-4 ${star <= viewingReport.star ? 'fill-orange-500 text-orange-500' : 'text-slate-200'}`} 
                                                />
                                            ))}
                                            <span className="ml-3 text-xs font-black text-slate-900">{viewingReport.star}/10</span>
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-[28px] bg-slate-50/50 border border-slate-100 relative group overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full translate-x-4 -translate-y-4 transition-transform group-hover:scale-125" />
                                        <p className="relative z-10 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">CRE Name</p>
                                        <div className="relative z-10 flex items-center text-xs font-black text-orange-600 uppercase">
                                            {viewingReport.cre?.name || 'SYSTEM'}
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-[28px] bg-slate-50/50 border border-slate-100 relative group overflow-hidden md:col-span-1">
                                        <p className="relative z-10 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">FA Assigned</p>
                                        <div className="relative z-10 flex items-center text-xs font-black text-slate-900 uppercase">
                                            {viewingReport.faName || 'NOT ASSIGNED'}
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-[28px] bg-slate-50/50 border border-slate-100 relative group overflow-hidden md:col-span-2">
                                        <p className="relative z-10 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Business Head</p>
                                        <div className="relative z-10 flex items-center text-xs font-black text-slate-900 uppercase">
                                            {viewingReport.bh?.name || viewingReport.bhName || 'UNASSIGNED'}
                                        </div>
                                    </div>
                                </div>

                                {/* Full Remarks */}
                                <div className="p-6 rounded-[32px] bg-slate-50/80 border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Remarks & Meeting Notes</p>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                                        {viewingReport.remarks || 'No specific remarks or meeting notes recorded for this lead.'}
                                    </p>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                                <button 
                                    onClick={() => setViewingReport(null)}
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

export default WorkReports;
