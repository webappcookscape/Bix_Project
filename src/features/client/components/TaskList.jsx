import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  Download,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "../../../shared/utils/dateFormatter";
import useHaptics from "../../../shared/hooks/useHaptics";

const TaskList = ({ tasks = [] }) => {
  const { trigger } = useHaptics();
  const [expandedStages, setExpandedStages] = useState({
    "Freezing Mail": true,
    "Approval of finalized designs": false,
    "Production": false,
    "Installation": false,
  });

  const toggleStage = (stage) => {
    trigger('light');
    setExpandedStages((prev) => ({
      ...prev,
      [stage]: !prev[stage],
    }));
  };

  const stages = [
    "Freezing Mail",
    "Approval of finalized designs",
    "Production",
    "Installation",
  ];

  const unclassifiedTasks = tasks.filter(t => !stages.includes(t.stage) && t.status?.toUpperCase() !== "COMPLETED");

  return (
    <div className="bg-white/40 backdrop-blur-xl p-4 md:p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-white/50">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <Layers size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Project Stages</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Detailed Workflow Breakdown</p>
        </div>
      </div>

      <div className="space-y-4">
        {stages.map((stageName, index) => {
          const stageTasks = tasks.filter((t) => t.stage === stageName);
          if (stageTasks.length === 0) return null;

          const isExpanded = expandedStages[stageName];
          const completedCount = stageTasks.filter(t => t.status?.toUpperCase() === "COMPLETED").length;
          const progress = (completedCount / stageTasks.length) * 100;

          return (
            <div key={stageName} className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/50 overflow-hidden transition-all shadow-sm hover:shadow-md">
              {/* STAGE HEADER */}
              <button
                onClick={() => toggleStage(stageName)}
                className={`w-full flex items-center justify-between p-5 text-left transition-colors
                  ${isExpanded ? "bg-indigo-600/5" : "bg-transparent hover:bg-slate-50/50"}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                  <div>
                    <h3 className={`font-black text-sm tracking-tight ${isExpanded ? "text-indigo-700" : "text-slate-700"}`}>
                      Phase {index + 1} ➝ {stageName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-indigo-500 rounded-full"
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {completedCount}/{stageTasks.length} Done
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block">
                  <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${progress === 100 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    {progress === 100 ? 'Completed' : 'In Progress'}
                  </div>
                </div>
              </button>

              {/* SUB-TASKS LIST */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-white/40"
                  >
                    <div className="p-4 space-y-2">
                      {stageTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white/60 rounded-2xl border border-white/50 hover:shadow-lg hover:shadow-indigo-50/50 transition-all gap-4 group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${task.status?.toUpperCase() === "COMPLETED" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                              {task.status?.toUpperCase() === "COMPLETED" ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800 leading-tight">{task.title}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${task.status?.toUpperCase() === 'COMPLETED' ? 'text-green-500' : 'text-amber-500'}`}>
                                  {task.status}
                                </span>
                                {task.dueDate && (
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    <Calendar size={10} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{formatDate(task.dueDate)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* DOWNLOADS */}
                          {task.documents && task.documents.length > 0 && (
                            <div className="flex gap-2 flex-wrap sm:justify-end">
                              {task.documents.map(doc => {
                                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                                const baseUrl = apiUrl.replace('/api', '');
                                const downloadUrl = `${baseUrl}${doc.url}`;

                                return (
                                  <motion.a
                                    key={doc.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    href={downloadUrl}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trigger('light')}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                                  >
                                    <Download size={12} />
                                    {doc.name.length > 20 ? doc.name.substring(0, 17) + "..." : doc.name}
                                  </motion.a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Unclassified Tasks */}
        {unclassifiedTasks.length > 0 && (
          <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 mx-auto shadow-sm">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Additional Support Tasks</h3>
            <p className="text-xs text-slate-400 font-bold max-w-xs mx-auto">These are uncategorized tasks currently awaiting phase assignment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
