import React, { useState, useEffect } from "react";
import axios from "../../../shared/utils/axios";
import { LifeBuoy, CheckCircle, Search, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import AdminTicketDetailModal from "./AdminTicketDetailModal";
import RefreshButton from "../../../shared/components/RefreshButton.jsx";

const priorityRank = {
    Low: 1,
    Medium: 2,
    High: 3,
    Urgent: 4,
};

const Helpdesk = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterPriority, setFilterPriority] = useState("All");
    const [filterConversion, setFilterConversion] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("latest");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTicket, setSelectedTicket] = useState(null);

    const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/tickets");
            setTickets(res.data);
        } catch (error) {
            console.error("Failed to fetch tickets", error);
            toast.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const resetFilters = () => {
        setFilterStatus("All");
        setFilterPriority("All");
        setFilterConversion("All");
        setSearchTerm("");
        setSortBy("latest");
        setPageSize(10);
        setCurrentPage(1);
    };

    const handleRefresh = () => {
        resetFilters();
        fetchTickets();
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await axios.patch(`/tickets/${id}/status`, { status: newStatus });

            // Optimistic update
            setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
            toast.success(`Ticket marked as ${newStatus}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleTicketUpdate = (ticketId, updates) => {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t));
    };

    const statusColors = {
        Open: "bg-blue-100 text-blue-700",
        "In Progress": "bg-purple-100 text-purple-700",
        Resolved: "bg-green-100 text-green-700",
        Closed: "bg-gray-100 text-gray-700",
    };

    const priorityColors = {
        Low: "text-green-600 bg-green-50",
        Medium: "text-yellow-600 bg-yellow-50",
        High: "text-orange-600 bg-orange-50",
        Urgent: "text-red-600 bg-red-50",
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesStatus = filterStatus === "All" || ticket.status === filterStatus;
        const matchesPriority = filterPriority === "All" || ticket.priority === filterPriority;
        const matchesConversion =
            filterConversion === "All" ||
            (filterConversion === "Converted" && !!ticket.taskId) ||
            (filterConversion === "Pending Conversion" && !ticket.taskId);
        const searchValue = searchTerm.toLowerCase();
        const matchesSearch =
            (ticket.subject || "").toLowerCase().includes(searchValue) ||
            (ticket.ticketId || "").toLowerCase().includes(searchValue) ||
            (ticket.project?.name || "").toLowerCase().includes(searchValue) ||
            (ticket.project?.projectCode || "").toLowerCase().includes(searchValue) ||
            (ticket.description || "").toLowerCase().includes(searchValue);
        return matchesStatus && matchesPriority && matchesConversion && matchesSearch;
    });

    const sortedTickets = [...filteredTickets].sort((a, b) => {
        switch (sortBy) {
            case "oldest":
                return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            case "priority-high":
                return (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
            case "priority-low":
                return (priorityRank[a.priority] || 0) - (priorityRank[b.priority] || 0);
            case "subject-az":
                return (a.subject || "").localeCompare(b.subject || "");
            case "subject-za":
                return (b.subject || "").localeCompare(a.subject || "");
            case "status":
                return (a.status || "").localeCompare(b.status || "");
            case "project":
                return (a.project?.name || "").localeCompare(b.project?.name || "");
            case "latest":
            default:
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, filterPriority, filterConversion, searchTerm, sortBy, pageSize]);

    const totalPages = Math.max(1, Math.ceil(sortedTickets.length / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paginatedTickets = sortedTickets.slice(
        (safeCurrentPage - 1) * pageSize,
        safeCurrentPage * pageSize,
    );
    const rangeStart = sortedTickets.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
    const rangeEnd = Math.min(safeCurrentPage * pageSize, sortedTickets.length);

    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'Open').length,
        resolved: tickets.filter(t => t.status === 'Resolved').length,
        urgent: tickets.filter(t => t.priority === 'Urgent' && t.status !== 'Resolved').length
    };

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <LifeBuoy className="text-indigo-600" /> Helpdesk
                </h1>
                <p className="text-sm text-slate-500">Manage client support requests and issues.</p>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 font-bold uppercase">Total Tickets</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-blue-500 font-bold uppercase">Open</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">{stats.open}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-green-500 font-bold uppercase">Resolved</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">{stats.resolved}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-red-500 font-bold uppercase">Urgent Issues</p>
                    <p className="text-2xl font-bold text-red-700 mt-1">{stats.urgent}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                    <option value="All">All Status</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                </select>
                <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                    <option value="All">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                </select>
                <select
                    value={filterConversion}
                    onChange={(e) => setFilterConversion(e.target.value)}
                    className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                    <option value="All">All Tickets</option>
                    <option value="Converted">Converted to Issue</option>
                    <option value="Pending Conversion">Not Converted</option>
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                    <option value="latest">Sort: Latest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                    <option value="priority-high">Sort: Priority High to Low</option>
                    <option value="priority-low">Sort: Priority Low to High</option>
                    <option value="subject-az">Sort: Subject A-Z</option>
                    <option value="subject-za">Sort: Subject Z-A</option>
                    <option value="status">Sort: Status</option>
                    <option value="project">Sort: Project</option>
                </select>
            </div>

            {/* Ticket List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">Loading tickets...</div>
                ) : sortedTickets.length === 0 ? (
                    <div className="p-12 text-center space-y-2">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                            <LifeBuoy size={24} />
                        </div>
                        <p className="text-slate-500 font-medium">No tickets found.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-b bg-slate-50/80">
                            <p className="text-sm text-slate-500">
                                Showing <span className="font-semibold text-slate-700">{rangeStart}-{rangeEnd}</span> of{" "}
                                <span className="font-semibold text-slate-700">{sortedTickets.length}</span> tickets
                            </p>
                            <div className="flex items-center gap-3">
                                <RefreshButton onRefresh={handleRefresh} isLoading={loading} label="Refresh" />
                                <label className="text-sm text-slate-500">Rows per page</label>
                                <select
                                    value={pageSize}
                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-hidden">
                            <table className="w-full text-sm text-left table-fixed">
                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 border-b w-24">ID</th>
                                        <th className="px-6 py-4 border-b w-auto">Subject</th>
                                        <th className="px-6 py-4 border-b w-48">Project</th>
                                        <th className="px-6 py-4 border-b w-32">Priority</th>
                                        <th className="px-6 py-4 border-b w-32">Status</th>
                                        <th className="px-6 py-4 border-b text-right w-36">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedTickets.map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 font-mono font-medium text-slate-600 truncate">
                                                {ticket.ticketId}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-800 flex items-center gap-2 truncate">
                                                    <span className="truncate" title={ticket.subject}>{ticket.subject}</span>
                                                    {ticket.taskId && <CheckCircle size={14} className="text-green-500 shrink-0" title="Converted to Issue" />}
                                                </div>
                                                <div className="text-slate-500 text-xs mt-0.5 truncate">{ticket.description}</div>
                                                {ticket.attachmentUrl && (
                                                    <a href={`${apiUrl}${ticket.attachmentUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 mt-1 hover:underline">
                                                        <Download size={12} /> Attachment
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-700 truncate" title={ticket.project?.name}>{ticket.project?.name}</div>
                                                <div className="text-xs text-slate-400 truncate">{ticket.project?.projectCode}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${priorityColors[ticket.priority] || priorityColors.Medium}`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[ticket.status] || statusColors.Open}`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedTicket(ticket)}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>

                                                    {ticket.status !== 'Resolved' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(ticket.id, 'Resolved')}
                                                            className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 font-bold transition"
                                                        >
                                                            Resolve
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {paginatedTickets.map((ticket) => (
                                <div key={ticket.id} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-bold text-slate-500">{ticket.ticketId}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[ticket.status] || statusColors.Open}`}>
                                                    {ticket.status}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 mt-1 text-sm">{ticket.subject}</h3>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${priorityColors[ticket.priority] || priorityColors.Medium}`}>
                                            {ticket.priority}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Project</p>
                                            <p className="text-xs font-bold text-slate-700">{ticket.project?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description</p>
                                            <p className="text-xs text-slate-600 line-clamp-2">{ticket.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <button
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-2 transition"
                                        >
                                            <Eye size={14} /> View Details
                                        </button>
                                        {ticket.status !== 'Resolved' && (
                                            <button
                                                onClick={() => handleStatusUpdate(ticket.id, 'Resolved')}
                                                className="px-3 py-2 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg flex items-center gap-2 transition"
                                            >
                                                <CheckCircle size={14} /> Mark Resolved
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t bg-white">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={safeCurrentPage === 1}
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 border rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} /> Prev
                            </button>
                            <div className="text-sm text-slate-500">
                                Page <span className="font-semibold text-slate-700">{safeCurrentPage}</span> of{" "}
                                <span className="font-semibold text-slate-700">{totalPages}</span>
                            </div>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={safeCurrentPage === totalPages}
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 border rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Modal */}
            {selectedTicket && (
                <AdminTicketDetailModal
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    onUpdate={handleTicketUpdate}
                />
            )}
        </div>
    );
};

export default Helpdesk;
