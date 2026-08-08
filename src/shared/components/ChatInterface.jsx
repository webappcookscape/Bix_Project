import React, { useState, useEffect, useRef } from "react";
import axios from "../utils/axios";
import { Send, Image as ImageIcon, FileText, Check, CheckCheck, Phone, Video, MoreVertical, Search, MessageSquare, ArrowLeft, Download, Paperclip, Smile, X } from 'lucide-react';
import { formatDate, formatTime } from '../utils/dateFormatter';
import toast from "react-hot-toast";

const ChatInterface = ({ projects = [], currentUser, role, initialProjectId }) => {
    const [activeProjectId, setActiveProjectId] = useState(initialProjectId || null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [attachments, setAttachments] = useState([]);

    // Auto-select first project if available or use initialProjectId - ONLY ON DESKTOP
    useEffect(() => {
        const isMobile = window.innerWidth < 640; // sm breakpoint
        if (initialProjectId) {
            setActiveProjectId(initialProjectId);
        } else if (projects.length > 0 && !activeProjectId && !isMobile) {
            setActiveProjectId(projects[0].id);
        }
    }, [projects, initialProjectId]);

    // Handle back button on mobile
    const handleBackToProjects = () => {
        setActiveProjectId(null);
    };

    // Fetch messages with polling
    useEffect(() => {
        if (!activeProjectId) return;

        const fetchMessages = async () => {
            try {
                const res = await axios.get(`/messages/${activeProjectId}`);
                setMessages(res.data);
            } catch (err) {
                console.error("Failed to fetch messages", err);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, [activeProjectId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if ((!newMessage.trim() && attachments.length === 0) || !activeProjectId) return;

        try {
            const payload = {
                content: newMessage || (attachments.length > 0 ? "Sent an attachment" : ""),
                projectId: activeProjectId,
                sender: currentUser.name || "Unknown",
                senderRole: role,
                attachments: attachments.length > 0 ? attachments : null
            };

            // Optimistic update
            const tempMsg = {
                ...payload,
                createdAt: new Date().toISOString(),
                id: `temp-${Date.now()}`,
                attachments: attachments.length > 0 ? JSON.stringify(attachments) : null
            };
            setMessages([...messages, tempMsg]);
            setNewMessage("");
            setAttachments([]);

            await axios.post("/messages", payload);
        } catch (err) {
            console.error("Failed to send message", err);
            toast.error("Failed to send message");
        }
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        const loadingToast = toast.loading("Uploading...");

        try {
            const res = await axios.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const uploadedFiles = res.data.map(f => ({
                ...f,
                url: `${axios.defaults.baseURL.replace('/api', '')}${f.url}`
            }));

            setAttachments(prev => [...prev, ...uploadedFiles]);
            toast.success("Uploaded!", { id: loadingToast });
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Upload failed", { id: loadingToast });
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const filteredProjects = projects.filter(p =>
        (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.projectCode || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeProject = projects.find(p => p.id === activeProjectId);

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = formatDate(message.createdAt);
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {});

    return (
        <div className="flex flex-col sm:flex-row h-full bg-white sm:rounded-2xl overflow-hidden sm:shadow-2xl sm:border border-gray-100 font-sans">

            {/* SIDEBAR */}
            <div className={`w-full sm:w-80 bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ${activeProjectId ? 'hidden sm:flex' : 'flex h-full'}`}>
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800 tracking-tight">Chats</h2>
                        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors cursor-pointer">
                            <MessageSquare size={18} />
                        </div>
                    </div>
                    <div className="relative group">
                        <Search size={16} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full text-sm pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Project List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredProjects.map(project => (
                        <div
                            key={project.id}
                            onClick={() => setActiveProjectId(project.id)}
                            className={`p-4 cursor-pointer transition-all duration-200 border-b border-gray-50 hover:bg-gray-50
                                ${activeProjectId === project.id ? 'bg-indigo-50/60' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 shadow-sm
                                    ${activeProjectId === project.id ? 'bg-indigo-600 text-white' : 'bg-gradient-to-br from-indigo-100 to-purple-50 text-indigo-700'}`}>
                                    {project.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`text-sm font-bold truncate ${activeProjectId === project.id ? 'text-indigo-900' : 'text-gray-800'}`}>
                                            {project.name}
                                        </h3>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {project.updatedAt ? formatTime(project.updatedAt) : ''}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                        {project.projectCode}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredProjects.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <MessageSquare size={32} className="mb-2 opacity-20" />
                            <p className="text-sm">No projects found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN CHAT AREA */}
            <div className={`flex-1 flex flex-col bg-[#F3EFE9] overflow-hidden relative w-full h-full ${!activeProjectId ? 'hidden sm:flex' : 'flex'}`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                {!activeProject ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 hidden sm:flex z-10">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-indigo-100">
                            <MessageSquare size={40} className="text-indigo-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Orbix Projects Chat</h3>
                        <p className="text-gray-500 text-sm max-w-xs leading-relaxed">Select a project from the sidebar to start collaborating with your team.</p>
                        <div className="mt-8 flex items-center gap-2 text-xs text-gray-400">
                            <LockIcon /> End-to-end encrypted
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="h-[70px] px-4 sm:px-6 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-20 shrink-0">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <button onClick={handleBackToProjects} className="sm:hidden text-gray-600 hover:text-indigo-600 p-1 -ml-2">
                                    <ArrowLeft size={22} />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0 ring-2 ring-offset-2 ring-indigo-100">
                                    {activeProject.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-bold text-gray-800 text-sm sm:text-base truncate">{activeProject.name}</h2>
                                    <p className="text-xs text-indigo-600 font-medium truncate flex items-center gap-1">
                                        Active
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400 shrink-0">
                                <button className="hover:text-indigo-600 hover:bg-gray-100 p-2 rounded-full transition-all hidden sm:block"><Phone size={20} /></button>
                                <button className="hover:text-indigo-600 hover:bg-gray-100 p-2 rounded-full transition-all hidden sm:block"><Video size={20} /></button>
                                <button className="hover:text-indigo-600 hover:bg-gray-100 p-2 rounded-full transition-all"><MoreVertical size={20} /></button>
                            </div>
                        </div>

                        {/* Messages Feed */}
                        <div
                            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar scroll-smooth z-10"
                            ref={messagesEndRef}
                        >
                            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                                <div key={date}>
                                    <div className="flex justify-center mb-6">
                                        <span className="text-[11px] font-bold text-gray-500 bg-white/80 shadow-sm border border-gray-100 px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm sticky top-2 z-10">{date}</span>
                                    </div>
                                    <div className="space-y-4">
                                        {dateMessages.map((msg, idx) => {
                                            const isMe = msg.sender === currentUser.name;
                                            const isAdmin = msg.senderRole === "ADMIN";
                                            const msgAttachments = msg.attachments ? JSON.parse(msg.attachments) : [];

                                            return (
                                                <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-4`}>
                                                    <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                        {!isMe && (
                                                            <span className="text-[10px] text-gray-500 mb-1 ml-1 flex items-center gap-1 font-bold">
                                                                {isAdmin && <ShieldIcon />} {msg.sender}
                                                            </span>
                                                        )}

                                                        <div
                                                            className={`px-4 py-3 shadow-sm text-sm relative leading-relaxed break-words
                                                                ${isMe ?
                                                                    'bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-indigo-200' :
                                                                    'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm'}`
                                                            }
                                                        >
                                                            {/* Attachments Display */}
                                                            {msgAttachments.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 mb-2">
                                                                    {msgAttachments.map((att, i) => (
                                                                        <a
                                                                            key={i}
                                                                            href={att.url}
                                                                            download
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className={`p-2 rounded-lg flex items-center gap-2 max-w-full text-left
                                                                            ${isMe ? 'bg-indigo-500/50 hover:bg-indigo-500' : 'bg-gray-100 hover:bg-gray-200'} transition-colors cursor-pointer decoration-0`}
                                                                        >
                                                                            {att.type?.startsWith('image/') ? (
                                                                                <div className="relative group/img">
                                                                                    <ImageIcon size={16} />
                                                                                </div>
                                                                            ) : <FileText size={16} />}
                                                                            <div className="overflow-hidden flex-1 min-w-0">
                                                                                <p className="truncate text-xs font-medium">{att.name}</p>
                                                                                <p className="text-[10px] opacity-70">{att.size}</p>
                                                                            </div>
                                                                            <Download size={14} className="ml-1 opacity-70 shrink-0" />
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {msg.content}
                                                            <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                                <span className="text-[10px] font-medium">
                                                                    {formatTime(msg.createdAt)}
                                                                </span>
                                                                {isMe && <CheckCheck size={12} />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 sm:p-4 bg-white border-t border-gray-200 z-20">
                            {/* Attachment Preview */}
                            {attachments.length > 0 && (
                                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar">
                                    {attachments.map((file, i) => (
                                        <div key={i} className="relative bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center gap-2 min-w-[150px]">
                                            <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                {file.type?.startsWith('image/') ? <ImageIcon size={16} /> : <FileText size={16} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-700 truncate">{file.name}</p>
                                                <p className="text-[10px] text-gray-500">{file.size}</p>
                                            </div>
                                            <button
                                                onClick={() => removeAttachment(i)}
                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-3xl border border-gray-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-inner">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-200 rounded-full transition-colors mb-0.5"
                                >
                                    <Paperclip size={20} />
                                </button>
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                />

                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm px-2 py-3 text-gray-800 placeholder:text-gray-400 font-medium max-h-32 resize-none custom-scrollbar"
                                    rows={1}
                                />

                                <button className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-200 rounded-full transition-colors mb-0.5 hidden sm:block">
                                    <Smile size={20} />
                                </button>

                                <button
                                    onClick={handleSend}
                                    disabled={!newMessage.trim() && attachments.length === 0}
                                    className={`p-3 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md mb-0.5
                                        ${newMessage.trim() || attachments.length > 0 ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700' : 'bg-gray-300 text-gray-400 cursor-not-allowed'}`}
                                >
                                    <Send size={18} fill={newMessage.trim() || attachments.length > 0 ? "currentColor" : "none"} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

        </div>
    );
};

// Simple Icon Components
const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-indigo-500"><path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" /></svg>
);

export default ChatInterface;
