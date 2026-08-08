import React, { useState, useEffect, useRef } from "react";
import axios from "../../../shared/utils/axios";
import { X, Send, User, ShieldCheck, Paperclip, Clock, CheckCircle, RefreshCcw, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const isAssignableEmployee = (employee) =>
    (employee?.role || "").toUpperCase() === "EMPLOYEE" &&
    (employee?.status || "").toUpperCase() === "ACTIVE";

const AdminTicketDetailModal = ({ ticket, onClose, onUpdate }) => {
    const [comments, setComments] = useState(ticket.comments || []);
    const [newComment, setNewComment] = useState("");
    const [sending, setSending] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const messagesEndRef = useRef(null);

    // Conversion State
    const [showConvertForm, setShowConvertForm] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [selectedDate, setSelectedDate] = useState("");

    const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    const fetchComments = async () => {
        try {
            const res = await axios.get(`/tickets/${ticket.id}/comments`);
            setComments(res.data);
        } catch (error) {
            console.error("Failed to fetch comments", error);
            toast.error("Failed to load comments");
        }
    };

    useEffect(() => {
        if (ticket.id) {
            fetchComments();
            // Also fetch employees for potential assignment
            axios.get('/employees')
                .then(res => {
                    if (Array.isArray(res.data)) {
                        setEmployees(res.data.filter(isAssignableEmployee));
                    }
                    else console.error("Employees response is not an array", res.data);
                })
                .catch(err => console.error(err));
        }
    }, [ticket.id]);

    useEffect(() => {
        scrollToBottom();
    }, [comments]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async () => {
        if (!newComment.trim()) return;
        setSending(true);
        try {
            const res = await axios.post(`/tickets/${ticket.id}/comments`, {
                content: newComment,
                role: "ADMIN"
            });

            const addedComment = res.data;
            const updatedList = [...comments, addedComment];
            setComments(updatedList);
            setNewComment("");
            onUpdate && onUpdate(ticket.id, { comments: updatedList });

        } catch (error) {
            console.error("Failed to send comment", error);
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const handleConvert = async () => {
        setUpdatingStatus(true);
        try {
            const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
            const res = await axios.post(`/tickets/${ticket.id}/convert`, {
                employeeId: selectedEmployee,
                dueDate: selectedDate,
                senderId: currentUser.id
            });
            toast.success("Converted to Issue successfully!");
            onUpdate && onUpdate(ticket.id, {
                status: res.data?.ticket?.status || "In Progress",
                taskId: res.data?.ticket?.taskId || "JUST_CREATED"
            });
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to convert");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const changeStatus = async (status) => {
        setUpdatingStatus(true);
        try {
            await axios.patch(`/tickets/${ticket.id}/status`, { status });
            toast.success(`Marked as ${status}`);
            onUpdate && onUpdate(ticket.id, { status });
            onClose();
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const formatDate = (isoStr) => {
        return new Date(isoStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            {ticket.ticketId}
                            <span className={`px-2 py-0.5 text-xs rounded-full border ${ticket.status === 'Resolved' ? 'bg-green-100 text-green-700 border-green-200' :
                                'bg-blue-100 text-blue-700 border-blue-200'
                                }`}>
                                {ticket.status}
                            </span>
                        </h3>
                        <p className="text-sm text-gray-500">{ticket.subject} (Project: {ticket.project?.name})</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-0">

                    {/* Ticket Description Block */}
                    <div className="p-6 bg-white border-b">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Issue Description</h4>
                        <div className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                            {ticket.description}
                        </div>

                        {ticket.attachmentUrl && (
                            <div className="mt-4 p-3 bg-gray-50 border rounded-lg flex items-start gap-3 w-full max-w-sm">
                                <div className="p-2 bg-white rounded border border-gray-100 shrink-0">
                                    {(ticket.attachmentType?.startsWith('image') || ticket.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                                        <img
                                            src={`${apiUrl}${ticket.attachmentUrl}`}
                                            alt="Attachment"
                                            className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition"
                                            onClick={() => window.open(`${apiUrl}${ticket.attachmentUrl}`, '_blank')}
                                        />
                                    ) : (
                                        <Paperclip size={24} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-700 text-sm truncate" title={ticket.attachmentName}>
                                        {ticket.attachmentName || "Attachment"}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch(`${apiUrl}${ticket.attachmentUrl}`);
                                                    const blob = await response.blob();
                                                    const url = window.URL.createObjectURL(blob);
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', ticket.attachmentName || `attachment-${Date.now()}`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                    window.URL.revokeObjectURL(url);
                                                } catch (err) {
                                                    console.error("Download failed", err);
                                                    window.open(`${apiUrl}${ticket.attachmentUrl}`, '_blank');
                                                }
                                            }}
                                            className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1"
                                        >
                                            View / Download
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(ticket.createdAt)}</span>
                            <span className="flex items-center gap-1"><ShieldCheck size={12} /> Priority: {ticket.priority}</span>
                            <span className="flex items-center gap-1 font-mono text-gray-500 bg-gray-100 px-1 rounded">{ticket.clientEmail}</span>
                        </div>

                        {/* Admin Actions */}
                        <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                            {ticket.status !== 'Resolved' && (
                                <button
                                    onClick={() => changeStatus('Resolved')}
                                    disabled={updatingStatus}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded hover:bg-green-100 transition"
                                >
                                    <CheckCircle size={14} /> Mark Resolved
                                </button>
                            )}
                            {ticket.status !== 'In Progress' && ticket.status !== 'Resolved' && (
                                <button
                                    onClick={() => changeStatus('In Progress')}
                                    disabled={updatingStatus}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-bold rounded hover:bg-purple-100 transition"
                                >
                                    <RefreshCcw size={14} /> Start Work
                                </button>
                            )}

                            {/* Convert to Issue */}
                            {!ticket.taskId ? (
                                !showConvertForm ? (
                                    <button
                                        onClick={() => setShowConvertForm(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-bold rounded hover:bg-orange-100 transition ml-auto"
                                    >
                                        <AlertCircle size={14} /> Convert to Issue
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 ml-auto bg-white border border-orange-200 p-1 rounded-lg">
                                        <select
                                            value={selectedEmployee}
                                            onChange={(e) => setSelectedEmployee(e.target.value)}
                                            className="text-xs border-none outline-none bg-transparent w-32"
                                        >
                                            <option value="">Assign to...</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="text-xs border-none outline-none bg-transparent w-24"
                                        />
                                        <button
                                            onClick={handleConvert}
                                            disabled={updatingStatus || !selectedEmployee || !selectedDate}
                                            className="px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded hover:bg-orange-700"
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            onClick={() => setShowConvertForm(false)}
                                            className="px-2 py-1 text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div className="ml-auto px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-bold rounded flex items-center gap-2">
                                    <CheckCircle size={14} /> Linked to Issue
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Conversation Thread */}
                    <div className="p-4 bg-gray-50/50 min-h-[300px]">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 text-center">Conversation History</h4>

                        <div className="space-y-4">
                            {comments.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm italic py-4">No messages yet.</p>
                            ) : (
                                comments.map((msg) => {
                                    const isAdmin = msg.role === 'ADMIN';
                                    return (
                                        <div key={msg.id} className={`flex gap-3 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            {!isAdmin && (
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                    <User size={14} className="text-blue-600" />
                                                </div>
                                            )}

                                            <div className={`max-w-[80%] space-y-1 ${isAdmin ? 'items-end flex flex-col' : 'items-start'}`}>
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm ${isAdmin
                                                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                                                    : 'bg-white border text-gray-700 rounded-tl-none shadow-sm'
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[10px] text-gray-400 block px-1">
                                                    {formatDate(msg.createdAt)}
                                                </span>
                                            </div>

                                            {isAdmin && (
                                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                                                    <ShieldCheck size={14} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t flex gap-2 items-center">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type reply to client..."
                        className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!newComment.trim() || sending}
                        className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 flex items-center justify-center text-white transition shadow-sm"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminTicketDetailModal;
