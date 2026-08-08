import React, { useState, useEffect, useRef } from "react";
import axios from "../../../shared/utils/axios";
import { X, Send, User, ShieldCheck, Paperclip, Clock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const TicketDetailModal = ({ ticket, onClose, onUpdate }) => {
    const [comments, setComments] = useState(ticket.comments || []);
    const [newComment, setNewComment] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

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
                role: "CLIENT"
            });

            const addedComment = res.data;
            const updatedList = [...comments, addedComment];
            setComments(updatedList);
            setNewComment("");

            // Update parent list to reflect new comment count if we had that, 
            // but purely for local consistency, we notify parent
            onUpdate && onUpdate(ticket.id, updatedList);

        } catch (error) {
            console.error("Failed to send comment", error);
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const formatDate = (isoStr) => {
        return new Date(isoStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
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
                        <p className="text-sm text-gray-500">{ticket.subject}</p>
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
                            <div className="mt-4 p-3 bg-gray-50 border rounded-lg flex items-center gap-3 w-fit">
                                <Paperclip size={16} className="text-indigo-600" />
                                <div className="text-xs">
                                    <p className="font-medium text-gray-700">{ticket.attachmentName || "Attachment"}</p>
                                    <a
                                        href={`${apiUrl}${ticket.attachmentUrl}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-indigo-600 hover:underline"
                                    >
                                        Download
                                    </a>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(ticket.createdAt)}</span>
                            <span className="flex items-center gap-1"><ShieldCheck size={12} /> Priority: {ticket.priority}</span>
                        </div>
                    </div>

                    {/* Conversation Thread */}
                    <div className="p-4 bg-gray-50/50 min-h-[300px]">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 text-center">Conversation History</h4>

                        <div className="space-y-4">
                            {comments.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm italic py-4">No messages yet. Start a conversation.</p>
                            ) : (
                                comments.map((msg) => {
                                    const isAdmin = msg.role === 'ADMIN';
                                    return (
                                        <div key={msg.id} className={`flex gap-3 ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                                            {isAdmin && (
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                                    <ShieldCheck size={14} className="text-indigo-600" />
                                                </div>
                                            )}

                                            <div className={`max-w-[80%] space-y-1 ${isAdmin ? 'items-start' : 'items-end flex flex-col'}`}>
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm ${isAdmin
                                                    ? 'bg-white border text-gray-700 rounded-tl-none shadow-sm'
                                                    : 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[10px] text-gray-400 block px-1">
                                                    {formatDate(msg.createdAt)}
                                                </span>
                                            </div>

                                            {!isAdmin && (
                                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                                                    <User size={14} className="text-white" />
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
                {ticket.status !== 'Closed' && (
                    <div className="p-4 bg-white border-t flex gap-2 items-center">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type your reply..."
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
                )}
            </div>
        </div>
    );
};

export default TicketDetailModal;
