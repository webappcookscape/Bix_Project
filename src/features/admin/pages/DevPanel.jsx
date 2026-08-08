import React, { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import {
    Trash2,
    Edit3,
    Search,
    Users,
    FolderKanban,
    ListChecks,
    AlertTriangle,
    X,
    Check,
    Lock,
    Unlock,
    ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DevPanel = () => {
    const { projects, tasks, employees, deleteProject, deleteTask, deleteEmployee, updateProject, updateTask, updateEmployee } = useApp();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isManager = (user.role || "").toUpperCase() === "MANAGER";

    if (isManager) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                    <AlertTriangle size={40} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
                <p className="text-slate-500 max-w-md">You do not have permission to access the System Control panel. Please contact a Super Admin.</p>
            </div>
        );
    }

    // Determine default tab based on URL
    const location = window.location.pathname;
    const defaultTab = location.includes("employees") ? "employees" : "projects";

    const [activeTab, setActiveTab] = useState(defaultTab);
    const [searchQuery, setSearchQuery] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(null); // { type, id, name }

    // PASSWORD SECURITY STATE
    const [isUnlocked, setIsUnlocked] = useState(sessionStorage.getItem("dev_panel_unlocked") === "true");
    const [passwordInput, setPasswordInput] = useState("");
    const [error, setError] = useState("");

    const handleUnlock = (e) => {
        if (e) e.preventDefault();
        const securePassword = import.meta.env.VITE_DEV_PANEL_PASSWORD || "admin123";

        if (passwordInput === securePassword) {
            setIsUnlocked(true);
            sessionStorage.setItem("dev_panel_unlocked", "true");
            setError("");
        } else {
            setError("Incorrect security password. Please try again.");
            setPasswordInput("");
        }
    };

    const filteredData = () => {
        const q = searchQuery.toLowerCase().trim();
        if (activeTab === "projects") {
            return projects.filter(p => (p.name || "").toLowerCase().includes(q) || (p.projectCode || "").toLowerCase().includes(q));
        } else if (activeTab === "tasks") {
            return tasks.filter(t => (t.title || "").toLowerCase().includes(q) || (t.projectId || "").toLowerCase().includes(q));
        } else {
            return employees.filter(e => (e.name || "").toLowerCase().includes(q) || (e.role || "").toLowerCase().includes(q));
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        const { type, id } = confirmDelete;
        if (type === "project") await deleteProject(id);
        else if (type === "task") await deleteTask(id);
        else if (type === "employee") await deleteEmployee(id);
        setConfirmDelete(null);
    };

    // PASSWORD PROTECTION UI
    if (!isUnlocked) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] p-6 bg-slate-50/50 rounded-[32px] border border-slate-200/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full text-center space-y-8"
                >
                    <div className="relative inline-block">
                        <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto rotate-3 shadow-lg shadow-orange-100/50 transition-transform hover:rotate-0">
                            <Lock size={48} />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border-4 border-slate-50 rounded-2xl flex items-center justify-center text-slate-800 shadow-sm">
                            <ShieldAlert size={20} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Locked</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            This panel contains sensitive system controls. Please enter the master password to proceed.
                        </p>
                    </div>

                    <form onSubmit={handleUnlock} className="space-y-4">
                        <div className="relative group">
                            <input
                                autoFocus
                                type="password"
                                placeholder="Master Password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className={`w-full bg-white border-2 rounded-2xl px-6 py-4 text-center font-bold text-lg tracking-widest transition-all outline-none
                                ${error ? 'border-red-200 ring-4 ring-red-50 text-red-600' : 'border-slate-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'}`}
                            />
                            <AnimatePresence>
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-red-500 text-sm font-bold mt-3"
                                    >
                                        {error}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Unlock size={20} />
                            Unlock Dashboard
                        </button>
                    </form>

                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4">
                        Enterprise Security Verified
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Developer Control Panel</h1>
                    <p className="text-sm text-slate-500">System-wide management of all core entities.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                {[
                    { id: "projects", label: "Projects", icon: FolderKanban },
                    { id: "tasks", label: "Tasks", icon: ListChecks },
                    { id: "employees", label: "Employees", icon: Users },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
                       ${activeTab === tab.id
                                ? "bg-white text-orange-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* DATA GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredData().map((item, index) => (
                        <motion.div
                            layout
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-800 line-clamp-1">{item.name || item.title}</p>
                                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                                        ID: {item.projectCode || item.projectId || item.id}
                                    </p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit (Coming Soon)"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete({
                                            type: activeTab.slice(0, -1),
                                            id: item.id,
                                            name: item.name || item.title
                                        })}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* DETAILS METADATA */}
                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                                {activeTab === "projects" && (
                                    <>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Client</p>
                                            <p className="text-xs font-medium text-slate-700">{item.clientName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Status</p>
                                            <p className="text-xs font-medium text-slate-700">{item.status}</p>
                                        </div>
                                    </>
                                )}
                                {activeTab === "tasks" && (
                                    <>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Project</p>
                                            <p className="text-xs font-medium text-slate-700 truncate">{item.projectId}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Priority</p>
                                            <p className="text-xs font-medium text-slate-700">{item.priority}</p>
                                        </div>
                                    </>
                                )}
                                {activeTab === "employees" && (
                                    <>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Role</p>
                                            <p className="text-xs font-medium text-slate-700">{item.role}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Email</p>
                                            <p className="text-xs font-medium text-slate-700 truncate">{item.email}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* NO RESULTS */}
            {filteredData().length === 0 && (
                <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                        <Search size={32} />
                    </div>
                    <p className="text-slate-400 font-medium">No results found for your search.</p>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            <AnimatePresence>
                {confirmDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmDelete(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center space-y-6"
                        >
                            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Are you sure?</h3>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                    You are about to delete <strong>{confirmDelete.name}</strong>. This action is permanent and cannot be undone.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-2xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 bg-red-600 text-white font-bold py-3 rounded-2xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                >
                                    Delete Now
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DevPanel;
