import React, { useState, useEffect } from "react";
import axios from "../../../shared/utils/axios";
import { FileText, Download, Loader2, File } from "lucide-react";
import { formatDate } from '../../../shared/utils/dateFormatter';
import { motion } from "framer-motion";
import useHaptics from "../../../shared/hooks/useHaptics";

const Documents = () => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const { trigger } = useHaptics();

    const project = JSON.parse(localStorage.getItem("clientProject") || "{}");
    const projectId = project.id;
    const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || (import.meta.env.PROD ? '' : 'http://localhost:5000');

    useEffect(() => {
        if (projectId) {
            const fetchDocs = async () => {
                try {
                    const res = await axios.get(`/project-data/${projectId}/documents`);
                    setDocs(res.data);
                } catch (err) {
                    console.error("Error fetching docs", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchDocs();
        }
    }, [projectId]);

    const handleDownload = (docUrl) => {
        trigger('medium');
        try {
            const link = document.createElement("a");
            link.href = docUrl;
            link.target = "_blank";
            link.rel = "noopener";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            trigger('success');
        } catch (e) {
            console.error("Download failed", e);
        }
    };

    if (!projectId) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-20">
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-8">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                    <FileText size={20} md:size={24} />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Project Documents</h2>
                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Contracts & Specifications</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/50">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                    <p className="text-sm font-bold text-slate-400">Loading documents...</p>
                </div>
            ) : docs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/50 text-center px-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                        <FileText size={32} />
                    </div>
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">No Documents</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">Important files shared by the team will appear here.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {docs.map((doc, idx) => {
                        const fullUrl = `${apiUrl}${doc.url}`;

                        return (
                            <div
                                key={doc.id}
                                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm md:hover:shadow-md transition-all group"
                            >
                                <div className="shrink-0 w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-600 font-bold">
                                    <File size={18} md:size={20} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 text-sm truncate pr-2">
                                        {doc.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">PDF</span>
                                        <span className="text-[10px] font-medium text-slate-400">
                                            {formatDate(doc.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                <a
                                    href={fullUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="shrink-0 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 md:hover:bg-indigo-600 md:hover:text-white active:bg-indigo-100 transition-all touch-manipulation pointer-events-auto cursor-pointer z-10 relative"
                                    aria-label="Download Document"
                                >
                                    <Download size={18} md:size={20} className="pointer-events-none" />
                                </a>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Documents;
