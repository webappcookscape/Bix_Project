import React, { useState, useEffect } from "react";
import axios from "../../../shared/utils/axios";
import { Database, Download, RefreshCw, Server, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";

const Settings = () => {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    // Fetch Backups
    const fetchBackups = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/admin/backups");
            setBackups(res.data);
        } catch (err) {
            console.error("Failed to fetch backups", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBackups();
    }, []);

    // Trigger Manual Backup
    const handleCreateBackup = async () => {
        setCreating(true);
        try {
            await axios.post("/admin/backups");
            alert("Backup created successfully!");
            fetchBackups();
        } catch (err) {
            alert("Backup failed: " + (err.response?.data?.error || err.message));
        } finally {
            setCreating(false);
        }
    };

    // Download Backup
    const handleDownload = async (filename) => {
        try {
            const response = await axios.get(`/admin/backups/${filename}`, {
                responseType: 'blob', // Important for files
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename); // or any other extension
            document.body.appendChild(link);
            link.click();
        } catch (err) {
            console.error("Download failed", err);
            alert("Failed to download backup");
        }
    };

    // Delete Backup
    const handleDeleteBackup = async (filename) => {
        if (!window.confirm(`Are you sure you want to permanently delete ${filename}?`)) return;

        try {
            await axios.delete(`/admin/backups/${filename}`);
            // Optimistic Update or Refetch
            setBackups(prev => prev.filter(b => b.filename !== filename));
            alert("Backup deleted successfully");
        } catch (err) {
            console.error("Delete failed", err);
            alert("Failed to delete backup: " + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
                <p className="text-sm text-slate-500">Manage data, backups, and system configurations.</p>
            </div>

            {/* DATA & BACKUPS CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Database size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">Data Backups</h2>
                            <p className="text-xs text-slate-500">Automated daily at 2:00 AM (JSON Format)</p>
                        </div>
                    </div>

                    <button
                        onClick={handleCreateBackup}
                        disabled={creating}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {creating ? <RefreshCw size={18} className="animate-spin" /> : <Server size={18} />}
                        {creating ? "Creating..." : "Trigger Backup Now"}
                    </button>
                </div>

                <div className="p-0 overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Loading backups...</div>
                    ) : backups.length === 0 ? (
                        <div className="p-12 text-center space-y-2">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                <AlertCircle size={24} />
                            </div>
                            <p className="text-slate-500 font-medium">No backups found.</p>
                            <p className="text-xs text-slate-400">Trigger a manual backup to get started.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-3 border-b border-slate-100">Filename</th>
                                    <th className="px-6 py-3 border-b border-slate-100">Created At</th>
                                    <th className="px-6 py-3 border-b border-slate-100">Size</th>
                                    <th className="px-6 py-3 border-b border-slate-100 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {backups.map((bk) => (
                                    <tr key={bk.filename} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-slate-600 font-medium">
                                            {bk.filename}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(bk.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {bk.size}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDownload(bk.filename)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                            >
                                                <Download size={14} /> Download
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBackup(bk.filename)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors ml-2"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
