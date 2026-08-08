import React, { useContext, useState } from "react";
import { TaskContext } from "../context/TaskContext";
import { useSearchParams } from "react-router-dom";
import { Bug, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RefreshButton from "../../../shared/components/RefreshButton";

const normalizeIssueStatus = (status) => (status || "").toUpperCase();
const formatResolutionDate = (dateValue) => {
    if (!dateValue || !dateValue.includes("-")) return dateValue || "";
    const [year, month, day] = dateValue.split("-");
    if (!year || !month || !day) return dateValue;
    return `${day}/${month}/${year}`;
};

const Issues = () => {
    // Pagination state: page per project
    const [projectPages, setProjectPages] = useState({});
    const ISSUES_PER_PAGE = 5;

    const handlePageChange = (projectId, newPage) => {
        setProjectPages(prev => ({ ...prev, [projectId]: newPage }));
    };
    const currentUser = (() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
            return {};
        }
    })();
    const resolverName = currentUser?.name || "Employee";

    // Get current date and time split for inputs
    const now = new Date();
    const [resolutionDate, setResolutionDate] = useState(now.toISOString().split('T')[0]);

    // Default time in 12h components
    const currentHours = now.getHours();
    const [resHour, setResHour] = useState(((currentHours % 12) || 12).toString().padStart(2, '0'));
    const [resMinute, setResMinute] = useState(now.getMinutes().toString().padStart(2, '0'));
    const [resPeriod, setResPeriod] = useState(currentHours >= 12 ? "PM" : "AM");
    const [issueContext, setIssueContext] = useState("");
    const [isConfirmed, setIsConfirmed] = useState(false);

    const format12h = (dateInput) => {
        if (!dateInput) return "";
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return dateInput;

        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12

        const month = (date.getMonth() + 1);
        const day = date.getDate();
        const year = date.getFullYear();

        return `${month}/${day}/${year}, ${hours}:${minutes} ${ampm}`;
    };

    const handleConfirmResolve = () => {
        if (!issueToResolve || !issueContext.trim() || !isConfirmed) return;

        // Construct final display time
        const safeHour = String(Math.min(Math.max(parseInt(resHour, 10) || 12, 1), 12)).padStart(2, "0");
        const safeMinute = String(Math.min(Math.max(parseInt(resMinute, 10) || 0, 0), 59)).padStart(2, "0");
        const formattedTime = `${formatResolutionDate(resolutionDate)}, ${safeHour}:${safeMinute} ${resPeriod}`;

        updateIssueStatus(issueToResolve.id, "Completed", {
            resolverName,
            resolutionTime: formattedTime,
            issueContext
        });

        // Reset modal and states
        setShowConfirmModal(false);
        setIssueToResolve(null);
        setIssueContext("");
        setIsConfirmed(false);
    };
    const { projects, issues, updateIssueStatus, refreshData, loading } = useContext(TaskContext);
    const [searchParams] = useSearchParams();
    const [expandedProjects, setExpandedProjects] = useState(() => {
        try {
            const stored = localStorage.getItem("expandedProjects");
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });
    // Confirmation popup state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [issueToResolve, setIssueToResolve] = useState(null);

    const filter = searchParams.get("filter");
    const search = searchParams.get("search")?.toLowerCase() || "";

    let filteredIssues = issues;

    if ((filter || "").toUpperCase() === "PENDING") {
        filteredIssues = filteredIssues.filter(i => normalizeIssueStatus(i.status) === "PENDING");
    } else if ((filter || "").toUpperCase() === "COMPLETED") {
        filteredIssues = filteredIssues.filter(i => normalizeIssueStatus(i.status) === "COMPLETED");
    }

    if (search) {
        filteredIssues = filteredIssues.filter(i =>
            i.title.toLowerCase().includes(search) ||
            i.description.toLowerCase().includes(search)
        );
    }

    const toggleProject = (projectId) => {
        setExpandedProjects(prev => {
            const updated = { ...prev, [projectId]: !prev[projectId] };
            try {
                localStorage.setItem("expandedProjects", JSON.stringify(updated));
            } catch { }
            return updated;
        });
    };

    const handleStatusToggle = (issue) => {
        const newStatus = normalizeIssueStatus(issue.status) === "PENDING" ? "Completed" : "Pending";
        updateIssueStatus(issue.id, newStatus);
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-50">
            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-2 animate-in fade-in duration-200" role="dialog" aria-modal="true">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg relative animate-in zoom-in-95 duration-200">
                        <div className="border-b border-gray-100 pb-4 mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Issue Resolution Report</h2>
                            <p className="text-sm text-gray-500 mt-1">Please provide the necessary details to close this issue.</p>
                        </div>

                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            {/* Static Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-gray-400">Employee Name</label>
                                    <div className="bg-gray-50 border border-gray-100 p-2 rounded-lg text-sm text-gray-700 font-medium">{resolverName}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1.5">
                                        <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                                        Resolution Date
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Calendar size={14} />
                                        </div>
                                        <input
                                            type="date"
                                            value={resolutionDate}
                                            onChange={(e) => setResolutionDate(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white border border-gray-200 text-gray-700 font-medium hover:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1.5">
                                    <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                                    Resolution Time (AM/PM)
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all">
                                        <input
                                            type="text"
                                            maxLength="2"
                                            value={resHour}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 12)) setResHour(val);
                                            }}
                                            onBlur={() => { if (resHour) setResHour(resHour.padStart(2, '0')); }}
                                            placeholder="12"
                                            className="w-8 text-center bg-transparent border-none outline-none text-sm font-medium text-gray-700 placeholder:text-gray-300"
                                        />
                                        <span className="text-gray-400 font-bold mx-1">:</span>
                                        <input
                                            type="text"
                                            maxLength="2"
                                            value={resMinute}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) setResMinute(val);
                                            }}
                                            onBlur={() => { if (resMinute) setResMinute(resMinute.padStart(2, '0')); }}
                                            placeholder="00"
                                            className="w-8 text-center bg-transparent border-none outline-none text-sm font-medium text-gray-700 placeholder:text-gray-300"
                                        />
                                    </div>
                                    <div className="flex bg-gray-100 p-1 rounded-xl">
                                        {["AM", "PM"].map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setResPeriod(p)}
                                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${resPeriod === p ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Issue Context */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400">Resolution context</label>
                                <textarea
                                    value={issueContext}
                                    onChange={(e) => setIssueContext(e.target.value)}
                                    placeholder="Explain how you resolved this issue..."
                                    className="w-full bg-[#FAFBFF] border border-indigo-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all min-h-[100px]"
                                />
                            </div>

                            {/* Confirmation Checkbox */}
                            <label className="flex items-start gap-3 p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={isConfirmed}
                                    onChange={(e) => setIsConfirmed(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500"
                                />
                                <span className="text-xs text-indigo-900/70 font-medium">
                                    I confirm that the issue has been cleared on-site and all verification steps are completed.
                                </span>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
                            <button
                                className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                                onClick={() => { setShowConfirmModal(false); setIssueToResolve(null); setIssueContext(""); setIsConfirmed(false); }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                                onClick={handleConfirmResolve}
                                disabled={!issueContext.trim() || !isConfirmed || !resHour || !resMinute}
                            >
                                Submit & Resolve
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 md:mb-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Reported Issues</h1>
                    <RefreshButton onRefresh={refreshData} isLoading={loading} label="Sync" />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    {filter && (
                        <span className="text-xs font-semibold px-3 py-1 bg-orange-100 text-orange-700 rounded-full uppercase tracking-wider">
                            Filter: {filter}
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {projects.map(project => {
                    const projectIssues = filteredIssues.filter(i => i.projectId === project.id);
                    if (projectIssues.length === 0 && (filter || search)) return null;

                    const isExpanded = expandedProjects[project.id] ?? true;
                    const currentPage = projectPages[project.id] || 1;
                    const totalPages = Math.ceil(projectIssues.length / ISSUES_PER_PAGE);
                    const paginatedIssues = projectIssues.slice((currentPage - 1) * ISSUES_PER_PAGE, currentPage * ISSUES_PER_PAGE);

                    return (
                        <div key={project.id} className="space-y-4">
                            <div
                                onClick={() => toggleProject(project.id)}
                                className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between cursor-pointer hover:border-orange-300 transition-colors"
                                role="button"
                                tabIndex={0}
                                aria-expanded={isExpanded}
                                aria-controls={`project-issues-${project.id}`}
                                aria-label={isExpanded ? `Collapse ${project.name}` : `Expand ${project.name}`}
                                onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') toggleProject(project.id); }}
                            >
                                <div className="flex items-center gap-3">
                                    {isExpanded ? <ChevronUp className="text-orange-600" /> : <ChevronDown className="text-gray-400" />}
                                    <div>
                                        <h2 className="font-bold text-gray-800">{project.name}</h2>
                                        <p className="text-xs text-gray-500">{projectIssues.length} issues in this project</p>
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        id={`project-issues-${project.id}`}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="space-y-3 pl-2 sm:pl-4 md:pl-6 border-l-2 border-orange-200"
                                    >
                                        {projectIssues.length > 0 ? (
                                            paginatedIssues.map(issue => (
                                                <div
                                                    key={issue.id}
                                                    className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            {issue.priority?.toLowerCase() === "high" && <AlertCircle size={14} className="text-red-500" />}
                                                            <h3 className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                                                                {issue.title}
                                                            </h3>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${issue.priority?.toLowerCase() === 'high' ? 'bg-red-50 text-red-600' :
                                                                issue.priority?.toLowerCase() === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                                                                    'bg-blue-50 text-blue-600'
                                                                }`}>
                                                                {issue.priority?.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-gray-600 break-words max-w-xs sm:max-w-none">{issue.description}</p>
                                                        <p className="text-[10px] text-gray-400 mt-2">
                                                            Reported: {format12h(issue.createdAt)}
                                                        </p>
                                                    </div>

                                                    {normalizeIssueStatus(issue.status) !== 'COMPLETED' ? (
                                                        <button
                                                            onClick={() => { setShowConfirmModal(true); setIssueToResolve(issue); }}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-orange-600 text-white hover:bg-orange-700 w-full sm:w-auto"
                                                        >
                                                            Mark Resolved
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-green-100 text-green-700 hover:bg-green-200 w-full sm:w-auto"
                                                            disabled
                                                        >
                                                            <CheckCircle size={14} /> Resolved
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">No issues found matching current filters.</p>
                                        )}
                                        {/* Pagination controls */}
                                        {totalPages > 1 && (
                                            <div className="flex flex-wrap gap-2 mt-2 items-center justify-center sm:justify-start">
                                                <button
                                                    className="px-2 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 w-20 sm:w-auto"
                                                    onClick={() => handlePageChange(project.projectId, currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    aria-label="Previous page"
                                                >Prev</button>
                                                <span className="text-xs">Page {currentPage} of {totalPages}</span>
                                                <button
                                                    className="px-2 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 w-20 sm:w-auto"
                                                    onClick={() => handlePageChange(project.projectId, currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    aria-label="Next page"
                                                >Next</button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Issues;
