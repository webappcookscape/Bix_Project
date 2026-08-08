import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useApp } from "../../features/admin/context/AppContext";
import { formatDate, formatTime, formatDateTime } from "../utils/dateFormatter";
import { Mail, Send, Plus, Inbox, FileText, Search, User, Paperclip, X, Menu, ChevronLeft, ArrowLeft, Trash2, ArchiveRestore } from 'lucide-react';
import toast from 'react-hot-toast';

const EmailPage = () => {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('inbox');
    const [showCompose, setShowCompose] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [editingDraftId, setEditingDraftId] = useState(null);

    // Compose State
    const [toUser, setToUser] = useState(null); // { id, name, email }
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState([]);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Fetch Emails
    useEffect(() => {
        setSelectedEmail(null);
        fetchEmails();
        if (activeTab === 'inbox') {
            markEmailsRead();
        }
        if (window.innerWidth < 640) setMobileSidebarOpen(false);
    }, [activeTab]);

    const markEmailsRead = async () => {
        try {
            await axios.post('/emails/mark-all-read', { userId: user.id });
        } catch (error) {
            console.error("Error marking emails as read:", error);
        }
    };

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/emails?userId=${user.id}&folder=${activeTab}`);
            setEmails(res.data);
        } catch (error) {
            console.error("Error fetching emails:", error);
            toast.error("Failed to fetch emails");
        } finally {
            setLoading(false);
        }
    };

    // User Search
    useEffect(() => {
        if (!userSearchQuery) {
            setSearchResults([]);
            return;
        }
        const delayDebounceFn = setTimeout(async () => {
            try {
                const res = await axios.get(`/emails/users?query=${userSearchQuery}`);
                setSearchResults(res.data);
            } catch (error) {
                console.error("Error searching users:", error);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [userSearchQuery]);


    const handleSend = async (isDraft = false) => {
        if (!isDraft && (!toUser || !subject || !message)) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            await axios.post('/emails', {
                draftId: editingDraftId,
                senderId: user.id,
                receiverId: toUser?.id,
                subject,
                content: message,
                isDraft,
                attachments: attachments.length > 0 ? attachments : null
            });

            toast.success(isDraft ? "Draft saved" : "Email sent successfully");
            setShowCompose(false);
            resetCompose();
            if (activeTab === 'draft' || activeTab === 'sent') {
                fetchEmails();
            }
        } catch (error) {
            console.error("Error sending email:", error);
            toast.error("Failed to send email");
        }
    };

    const resetCompose = () => {
        setEditingDraftId(null);
        setToUser(null);
        setUserSearchQuery('');
        setSubject('');
        setMessage('');
        setAttachments([]);
    };

    const openDraftForEditing = (email) => {
        setEditingDraftId(email.id);
        setSelectedEmail(null);
        setToUser(email.receiver ? {
            id: email.receiverId,
            name: email.receiver.name,
            email: email.receiver.email,
        } : null);
        setUserSearchQuery('');
        setSubject(email.subject || '');
        setMessage(email.content || '');

        try {
            const parsedAttachments = typeof email.attachments === 'string'
                ? JSON.parse(email.attachments)
                : (email.attachments || []);
            setAttachments(Array.isArray(parsedAttachments) ? parsedAttachments : []);
        } catch (error) {
            setAttachments([]);
        }

        setShowCompose(true);
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach(file => formData.append('attachments', file));

        const loadingToast = toast.loading("Uploading attachments...");

        try {
            const res = await axios.post('/upload', formData, {
                headers: {
                    'Content-Type': undefined
                }
            });

            const uploadedFiles = res.data.map(f => ({
                ...f,
                // Construct full URL relative to server root
                url: `${axios.defaults.baseURL.replace('/api', '')}${f.url}`
            }));

            setAttachments(prev => [...prev, ...uploadedFiles]);
            toast.success("Attachments uploaded", { id: loadingToast });
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Failed to upload attachments", { id: loadingToast });
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleDelete = async (e, email) => {
        e.stopPropagation();
        if (!confirm(activeTab === 'trash'
            ? "Are you sure you want to permanently delete this email? This cannot be undone."
            : "Move this email to trash?")) {
            return;
        }

        try {
            const type = activeTab === 'trash' ? 'hard' : 'soft';
            await axios.delete(`/emails/${email.id}?type=${type}`);

            toast.success(activeTab === 'trash' ? "Permanently deleted" : "Moved to trash");

            // Remove from local state
            setEmails(prev => prev.filter(e => e.id !== email.id));
            if (selectedEmail?.id === email.id) setSelectedEmail(null);

        } catch (error) {
            console.error("Delete failed", error);
            toast.error("Failed to delete email");
        }
    };

    const handleRestore = async (e, email) => {
        e.stopPropagation();
        try {
            await axios.put(`/emails/${email.id}/restore`);
            toast.success("Restored to Inbox");

            // Remove from local state (since we are likely in Trash)
            setEmails(prev => prev.filter(e => e.id !== email.id));
            if (selectedEmail?.id === email.id) setSelectedEmail(null);
        } catch (error) {
            console.error("Restore failed", error);
            toast.error("Failed to restore email");
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 p-0 sm:p-6 relative">
            {/* Header */}
            <div className="flex justify-between items-center p-4 sm:p-0 sm:mb-6 bg-white sm:bg-transparent shadow-sm sm:shadow-none z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                        className="sm:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                    >
                        <Menu size={20} />
                    </button>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Mail className="text-orange-600 hidden sm:block" /> Email Center
                    </h1>
                </div>
                <button
                    onClick={() => setShowCompose(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full sm:rounded-lg flex items-center gap-2 shadow-lg shadow-orange-200 transition-all active:scale-95"
                >
                    <Plus size={18} /> <span className="hidden sm:inline">Compose</span>
                </button>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row gap-6 overflow-hidden relative">
                {/* Sidebar Overlay for Mobile */}
                {mobileSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-[100] sm:hidden"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div className={`
                    fixed sm:static inset-y-0 left-0 w-[280px] sm:w-64 bg-white rounded-r-2xl sm:rounded-xl shadow-2xl sm:shadow-sm border-r sm:border border-gray-100 p-4 h-full
                    transform transition-transform duration-300 z-[110]
                    ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
                `}>
                    <div className="flex justify-between items-center mb-6 sm:hidden">
                        <h2 className="font-bold text-lg px-2">Mailboxes</h2>
                        <button onClick={() => setMobileSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                            <ChevronLeft size={20} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {[
                            { id: 'inbox', label: 'Inbox', icon: Inbox },
                            { id: 'sent', label: 'Sent', icon: Send },
                            { id: 'draft', label: 'Drafts', icon: FileText },
                            { id: 'trash', label: 'Trash', icon: Trash2 },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200
                                ${activeTab === tab.id
                                        ? 'bg-orange-50 text-orange-600 shadow-sm ring-1 ring-orange-100'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                            >
                                <tab.icon size={18} className={activeTab === tab.id ? 'stroke-[2.5px]' : ''} />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-auto hidden sm:block p-4 bg-gray-50 rounded-xl mt-8">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Storage</p>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="w-[15%] h-full bg-orange-500 rounded-full" />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 text-right">1.2 GB of 15 GB used</p>
                    </div>
                </div>

                {/* Email List or Detail View */}
                <div className="flex-1 bg-white rounded-none sm:rounded-xl shadow-none sm:shadow-sm border-0 sm:border border-gray-100 overflow-hidden flex flex-col h-full">

                    {/* Detail View Header */}
                    {selectedEmail ? (
                        <div className="flex items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <button
                                onClick={() => setSelectedEmail(null)}
                                className="mr-4 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="font-bold text-gray-800 text-lg truncate flex-1">{selectedEmail.subject}</h2>
                            <span className="text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-full whitespace-nowrap">
                                {formatDateTime(selectedEmail.createdAt)}
                            </span>

                            {/* Detail View Actions */}
                            <div className="flex items-center gap-2 ml-4">
                                {activeTab === 'trash' && (
                                    <button
                                        onClick={(e) => handleRestore(e, selectedEmail)}
                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                                        title="Restore"
                                    >
                                        <ArchiveRestore size={18} />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => handleDelete(e, selectedEmail)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    title={activeTab === 'trash' ? "Delete Forever" : "Move to Trash"}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center sticky top-0 backdrop-blur-sm z-10">
                            <h2 className="font-bold text-gray-800 capitalize flex items-center gap-2">
                                {activeTab} <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-[10px] font-bold">{emails.length}</span>
                            </h2>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4">
                        {loading ? (
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-spin w-8 h-8 border-4 border-orange-100 border-t-orange-600 rounded-full"></div>
                            </div>
                        ) : selectedEmail ? (
                            // DETAIL VIEW CONTENT
                            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
                                {/* Sender/Receiver Info */}
                                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm ring-4 ring-white
                                            ${activeTab === 'sent' ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'}`}>
                                            {(activeTab === 'sent' ? selectedEmail.receiver?.name : selectedEmail.sender?.name)?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">
                                                {activeTab === 'sent' ? `To: ${selectedEmail.receiver?.name || 'Unknown'}` : `From: ${selectedEmail.sender?.name || 'Unknown'}`}
                                            </p>
                                            <p className="text-xs text-gray-500 font-medium">
                                                {activeTab === 'sent' ? selectedEmail.receiver?.email : selectedEmail.sender?.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap pl-1">
                                    {selectedEmail.content}
                                </div>

                                {/* Attachments */}
                                {selectedEmail.attachments && (
                                    <div className="border-t border-gray-100 pt-6 mt-8">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Paperclip size={14} /> Attachments
                                        </h4>
                                        <div className="flex flex-wrap gap-4">
                                            {(() => {
                                                try {
                                                    const atts = typeof selectedEmail.attachments === 'string'
                                                        ? JSON.parse(selectedEmail.attachments)
                                                        : selectedEmail.attachments;

                                                    return atts.map((file, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={file.url}
                                                            download
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all group min-w-[200px]"
                                                        >
                                                            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <FileText size={20} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-gray-700 truncate">{file.name}</p>
                                                                <p className="text-[10px] text-gray-400">Click to view</p>
                                                            </div>
                                                        </a>
                                                    ));
                                                } catch (e) {
                                                    return <p className="text-sm text-red-500">Error loading attachments</p>;
                                                }
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : emails.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Mail size={24} className="opacity-20" />
                                </div>
                                <p className="font-medium text-sm">No emails in {activeTab}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:block divide-y divide-gray-50">
                                {emails.map(email => (
                                    <div
                                        key={email.id}
                                        onClick={() => activeTab === 'draft' ? openDraftForEditing(email) : setSelectedEmail(email)}
                                        className="p-4 hover:bg-orange-50/30 transition-all cursor-pointer group rounded-xl sm:rounded-none mb-2 sm:mb-0 bg-white sm:bg-transparent border border-gray-100 sm:border-0 shadow-sm sm:shadow-none mx-2 sm:mx-0"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white shadow-sm ring-2 ring-white
                                                    ${activeTab === 'sent' ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'}`}>
                                                    {(activeTab === 'sent' ? email.receiver?.name : email.sender?.name)?.charAt(0) || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">
                                                        {activeTab === 'sent' ? `To: ${email.receiver?.name || 'Unknown'}` : (email.sender?.name || 'Unknown')}
                                                    </p>
                                                    <p className="text-[11px] font-medium text-gray-400">
                                                        {formatDateTime(email.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            {email.attachments && (
                                                <div className="bg-gray-100 p-1.5 rounded-lg">
                                                    <Paperclip size={14} className="text-gray-500" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Hover Actions (Delete/Restore) */}
                                        <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                                            {activeTab === 'trash' && (
                                                <button
                                                    onClick={(e) => handleRestore(e, email)}
                                                    className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors"
                                                    title="Restore"
                                                >
                                                    <ArchiveRestore size={16} />
                                                </button>
                                            )}

                                            <button
                                                onClick={(e) => handleDelete(e, email)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title={activeTab === 'trash' ? "Delete Forever" : "Move to Trash"}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="sm:pl-[52px]">
                                            <p className="text-sm font-bold text-gray-800 mb-1 leading-tight">{email.subject}</p>
                                            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed">{email.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div >

            {/* Compose Modal */}
            {
                showCompose && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center sm:p-4">
                        <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col animate-slide-up sm:animate-zoom-in">
                            {/* Modal Header */}
                            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                                <h3 className="font-bold text-lg text-gray-800">{editingDraftId ? "Edit Draft" : "New Message"}</h3>
                                <button
                                    onClick={() => setShowCompose(false)}
                                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                                {/* To Field with Search */}
                                <div className="relative z-20">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">To</label>
                                    {toUser ? (
                                        <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-2.5 rounded-xl border border-orange-100 animate-fade-in group">
                                            <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center text-[10px] font-bold">
                                                {toUser.name.charAt(0)}
                                            </div>
                                            <span className="text-sm font-semibold">{toUser.name} <span className="opacity-70 font-normal hidden sm:inline">({toUser.email})</span></span>
                                            <button onClick={() => setToUser(null)} className="ml-auto p-1 hover:bg-orange-200 rounded-full transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="relative">
                                                <Search size={18} className="absolute left-3.5 top-3 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search user by name..."
                                                    value={userSearchQuery}
                                                    onChange={e => setUserSearchQuery(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                                                />
                                            </div>
                                            {searchResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-56 overflow-y-auto custom-scrollbar ring-1 ring-black/5">
                                                    {searchResults.map(u => (
                                                        <button
                                                            key={u.id}
                                                            onClick={() => { setToUser(u); setUserSearchQuery(''); setSearchResults([]); }}
                                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors"
                                                        >
                                                            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-100">
                                                                {u.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-800">{u.name}</p>
                                                                <p className="text-xs text-gray-500 font-medium">{u.role}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none font-medium text-gray-800 placeholder:font-normal"
                                        placeholder="Brief subject..."
                                    />
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Message</label>
                                    <textarea
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-none flex-1 min-h-[150px]"
                                        placeholder="Type your message here..."
                                    />
                                </div>

                                {/* Attachments */}
                                <div className="pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors border border-gray-200 border-dashed">
                                        <Paperclip size={18} /> <span>Attach Files</span>
                                        <input type="file" multiple className="hidden" onChange={handleFileChange} />
                                    </label>
                                    {attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {attachments.map((file, idx) => (
                                                <div key={idx} className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 font-medium border border-gray-200">
                                                    {file.name}
                                                    <button onClick={() => removeAttachment(idx)} className="hover:text-red-500 p-0.5 rounded-full hover:bg-gray-200"><X size={12} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between items-center gap-4">
                                <button
                                    onClick={() => handleSend(true)}
                                    className="flex-1 sm:flex-none text-gray-500 hover:text-gray-800 hover:bg-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                                >
                                    Save Draft
                                </button>
                                <button
                                    onClick={() => handleSend(false)}
                                    className="flex-1 sm:flex-none bg-orange-600 text-white px-8 py-2.5 rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-700 active:scale-95 transition-all flex items-center justify-center gap-2 font-bold"
                                >
                                    <Send size={18} /> Send
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default EmailPage;
