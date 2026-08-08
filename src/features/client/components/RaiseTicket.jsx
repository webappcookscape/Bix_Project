import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "../../../shared/utils/axios";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Send,
  Filter,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  AlertCircle,
  Calendar,
  ChevronRight
} from "lucide-react";
import { formatDate } from '../../../shared/utils/dateFormatter';
import { motion, AnimatePresence } from "framer-motion";
import TicketDetailModal from "./TicketDetailModal";
import useHaptics from "../../../shared/hooks/useHaptics";
import RefreshButton from "../../../shared/components/RefreshButton";

const RaiseTicket = () => {
  const { trigger } = useHaptics();
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Support");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("Newest First");
  const [selectedTicket, setSelectedTicket] = useState(null);

  const project = JSON.parse(localStorage.getItem("clientProject") || "{}");
  const projectId = project.id;

  const fetchTickets = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await axios.get(`/tickets?projectId=${projectId}`);
      setTickets(res.data);
    } catch (err) {
      console.error("Failed to fetch tickets", err);
      toast.error("Could not load your tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [projectId]);


  const priorityColors = {
    Low: "bg-green-50 text-green-600 border-green-100",
    Medium: "bg-amber-50 text-amber-600 border-amber-100",
    High: "bg-orange-50 text-orange-600 border-orange-100",
    Urgent: "bg-rose-50 text-rose-600 border-rose-100",
  };

  const statusColors = {
    Open: "bg-indigo-50 text-indigo-600 border-indigo-100",
    "In Progress": "bg-purple-50 text-purple-600 border-purple-100",
    Resolved: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      trigger('light');
      setFile(selectedFile);
      toast.success("File attached");
    }
  };

  const removeFile = () => {
    setFile(null);
    trigger('light');
  };

  const handleSubmit = async () => {
    if (issue.trim().length < 20) {
      toast.error("Please provide more detail (min 20 chars)");
      return;
    }

    trigger('medium');
    setIsSubmitting(true);

    try {
      let attachmentData = null;
      if (file) {
        const formData = new FormData();
        formData.append('files', file);
        const uploadRes = await axios.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const uploadedFile = uploadRes.data[0];
        attachmentData = {
          name: uploadedFile.name,
          url: uploadedFile.url,
          type: uploadedFile.type
        };
      }

      const ticketPayload = {
        subject: category + " Request",
        description: issue,
        email: project.clientEmail || "",
        priority,
        category,
        projectId,
        attachment: attachmentData
      };

      const res = await axios.post('/tickets', ticketPayload);
      setTickets((prev) => [res.data, ...prev]);

      setIssue("");
      setPriority("Medium");
      setCategory("Support");
      setFile(null);

      trigger('success');
      toast.success(`Success! Ticket created.`);

    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Failed to submit. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedTickets = [...tickets]
    .filter((t) => filterStatus === "All" || t.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === "Newest First") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "Oldest First") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "Priority") {
        const order = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
        return order[b.priority] - order[a.priority];
      }
      return 0;
    });

  const handleTicketUpdate = (ticketId, updatedComments) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, comments: updatedComments } : t));
  };

  return (
    <div className="max-w-7xl mx-auto p-2 md:p-8 lg:p-10 lg:h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6 md:gap-8">

      {/* FORM PANEL */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:w-1/3 bg-white/60 backdrop-blur-xl rounded-3xl md:rounded-[2.5rem] border border-white/50 shadow-2xl shadow-slate-200/50 flex flex-col overflow-hidden shrink-0"
      >
        <div className="p-3 border-b border-white/50 bg-indigo-600/5 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
            <MessageSquare size={16} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 tracking-tight">Support Desk</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Create Ticket</p>
          </div>
        </div>

        <div className="p-3 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Urgency</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-white/80 border border-slate-100 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              >
                {["Low", "Medium", "High", "Urgent"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Type</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/80 border border-slate-100 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              >
                {["Support", "Bug", "Feature", "Question"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Description</label>
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Describe your issue..."
              className="w-full bg-white/80 border border-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm h-16 resize-none placeholder:text-slate-300"
            />
            <div className="flex justify-between px-1">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Min 20 characters</p>
              <p className={`text-[9px] font-black uppercase tracking-widest ${issue.length >= 20 ? 'text-green-500' : 'text-rose-400'}`}>
                {issue.length} / 20
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Supporting Media</label>
            {!file ? (
              <label className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all group">
                <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-600">Attach File</span>
                <input type="file" onChange={handleFileChange} className="hidden" />
              </label>
            ) : (
              <div className="p-4 bg-indigo-600 rounded-2xl flex items-center justify-between shadow-lg shadow-indigo-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0">
                    {file.type.startsWith('image/') ? <ImageIcon size={16} /> : <FileText size={16} />}
                  </div>
                  <p className="text-xs font-black text-white truncate px-1">{file.name}</p>
                </div>
                <button onClick={removeFile} className="p-1.5 bg-white/20 hover:bg-rose-500 rounded-lg text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-3 md:py-2.5 rounded-xl font-bold text-[11px] md:text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Processing..." : <><Send size={14} md:size={16} /> Dispatch Ticket</>}
          </motion.button>
        </div>
      </motion.div>

      {/* TICKETS FEED */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 bg-white/40 backdrop-blur-xl rounded-3xl md:rounded-[2.5rem] border border-white/50 shadow-2xl shadow-slate-200/50 flex flex-col overflow-hidden"
      >
        <div className="p-4 md:p-6 md:p-8 border-b border-white/50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Active Inquiries</h2>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Track your requests</p>
            </div>
            <RefreshButton onRefresh={fetchTickets} isLoading={loading} className="md:hidden" />
          </div>

          <div className="flex items-center gap-3">
            <RefreshButton onRefresh={fetchTickets} isLoading={loading} className="hidden md:flex" label="Sync" />

            <div className="bg-white/80 p-1 rounded-xl border border-slate-100 flex items-center shadow-sm">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest px-3 py-1.5 outline-none text-slate-600 cursor-pointer"
              >
                {["All", "Open", "In Progress", "Resolved"].map(s => <option key={s} value={s}>{s} Status</option>)}
              </select>
            </div>
            <div className="bg-white/80 p-1 rounded-xl border border-slate-100 flex items-center shadow-sm">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest px-3 py-1.5 outline-none text-slate-600 cursor-pointer"
              >
                {["Newest First", "Oldest First", "Priority"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-4">
          {sortedTickets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4 border border-slate-100">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Workspace Empty</h3>
              <p className="text-xs text-slate-300 font-bold mt-1">No support tickets found matching your filters.</p>
            </div>
          ) : (
            sortedTickets.map((t) => (
              <motion.div
                layout
                key={t.id}
                onClick={() => { trigger('light'); setSelectedTicket(t); }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-white/70 backdrop-blur-md p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-white shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
              >
                <div className={`w-fit md:w-14 h-7 md:h-14 px-2 md:px-0 rounded-lg md:rounded-2xl shrink-0 flex items-center justify-center border font-black text-[8px] md:text-[10px] uppercase tracking-widest md:tracking-tighter ${statusColors[t.status] || 'bg-slate-50 text-slate-400'}`}>
                  {t.status}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-xs md:text-sm font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{t.ticketId}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest border ${priorityColors[t.priority]}`}>
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-[11px] md:text-xs text-slate-500 font-bold line-clamp-1">{t.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{formatDate(t.createdAt)}</span>
                    </div>
                    <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{t.category}</span>
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-end gap-2">
                  {t.comments?.length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <MessageSquare size={10} />
                      {t.comments.length}
                    </div>
                  )}
                  <ChevronRight className="text-slate-300 group-hover:text-indigo-400 transition-colors" size={20} />
                </div>
              </motion.div>
            ))
          )}
        </div>

        <AnimatePresence>
          {selectedTicket && (
            <TicketDetailModal
              ticket={selectedTicket}
              onClose={() => setSelectedTicket(null)}
              onUpdate={handleTicketUpdate}
            />
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #E2E8F0; 
          border-radius: 10px; 
        }
      `}</style>
    </div>
  );
};

export default RaiseTicket;
