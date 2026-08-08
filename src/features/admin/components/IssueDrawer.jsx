import React, { useEffect, useState } from "react";
import { X, Save, Trash2, Calendar, User, Briefcase, AlertCircle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const IssueDrawer = ({ isOpen, onClose, initialData, isEditing, onSubmit, projects, employees, onDelete }) => {
    const [formData, setFormData] = useState(initialData);
    const isHelpdeskLinkedIssue = Boolean(formData?.ticket?.id);

    useEffect(() => {
        setFormData(initialData);
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full sm:w-[500px] bg-white shadow-2xl z-[100] overflow-y-auto"
                    >
                        <form onSubmit={handleSubmit} className="flex flex-col h-full">
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">
                                        {isEditing ? "Edit Issue" : "New Issue"}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {isEditing ? "Update issue details and status." : "Create a new issue ticket."}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 p-6 space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Issue Title <span className="text-red-500">*</span></label>
                                    <input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none font-medium text-slate-700"
                                        placeholder="e.g., Plumbing leakage in kitchen"
                                        required
                                    />
                                </div>

                                {/* Project & Employee */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <Briefcase size={12} /> Project <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="projectId"
                                            value={formData.projectId}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-medium text-slate-700"
                                            required
                                        >
                                            <option value="">Select Project</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <User size={12} /> Assignee <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="employeeId"
                                            value={formData.employeeId}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-medium text-slate-700"
                                            required
                                        >
                                            <option value="">Select Employee</option>
                                            {employees.map(e => (
                                                <option key={e.id} value={e.id}>{e.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <Calendar size={12} /> Start Date
                                        </label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-medium text-slate-700"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <Calendar size={12} /> Due Date
                                        </label>
                                        <input
                                            type="date"
                                            name="dueDate"
                                            value={formData.dueDate}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-medium text-slate-700"
                                        />
                                    </div>
                                </div>

                                {/* Priority & Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <AlertCircle size={12} /> Priority
                                        </label>
                                        <select
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-medium text-slate-700"
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <CheckCircle size={12} /> Status
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-medium text-slate-700"
                                        >
                                                  <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none font-medium text-slate-700 text-sm resize-none"
                                        placeholder="Detailed description of the issue..."
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between sticky bottom-0">
                                {isEditing && (
                                    <div>
                                        <button
                                            type="button"
                                            disabled={isHelpdeskLinkedIssue}
                                            onClick={() => {
                                                if (isHelpdeskLinkedIssue) return;
                                                if (window.confirm("Are you sure you want to delete this issue?")) {
                                                    onDelete && onDelete(formData.id);
                                                }
                                            }}
                                            className={`px-4 py-2.5 rounded-xl border font-bold text-sm flex items-center gap-2 transition-colors ${
                                                isHelpdeskLinkedIssue
                                                    ? "border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed"
                                                    : "border-red-200 text-red-600 hover:bg-red-50"
                                            }`}
                                            title={isHelpdeskLinkedIssue ? "Helpdesk-linked issues cannot be deleted" : "Delete issue"}
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                        {isHelpdeskLinkedIssue && (
                                            <p className="mt-2 text-xs font-medium text-slate-500">
                                                Delete is disabled for issues created from Helpdesk tickets.
                                            </p>
                                        )}
                                    </div>
                                )}
                                <div className="flex gap-3 ml-auto">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                                    >
                                        <Save size={18} />
                                        {isEditing ? "Update Issue" : "Create Issue"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default IssueDrawer;
