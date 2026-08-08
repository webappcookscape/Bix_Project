import React from "react";
import { motion } from "framer-motion";
import {
  Zap,
  CheckCircle2,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Clock,
  Layout
} from "lucide-react";
import { formatDate, formatTime } from '../../../shared/utils/dateFormatter';

const formatDateTime = (isoString) => {
  const date = new Date(isoString);
  return {
    date: formatDate(date),
    time: formatTime(date)
  };
};

const getCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'task': return <CheckCircle2 size={16} className="text-emerald-500" />;
    case 'comment': return <MessageSquare size={16} className="text-blue-500" />;
    case 'document': return <FileText size={16} className="text-amber-500" />;
    case 'image': return <ImageIcon size={16} className="text-purple-500" />;
    case 'update': return <Zap size={16} className="text-indigo-500" />;
    default: return <Clock size={16} className="text-slate-400" />;
  }
};

const ActivityFeed = ({ activity = [], dummyActivity = [] }) => {
  const mergedActivity = [...activity, ...dummyActivity].sort((a, b) => new Date(b.time) - new Date(a.time));

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Zap size={20} md:size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Activity Stream</h2>
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Real-time updates</p>
          </div>
        </div>
      </div>

      {mergedActivity.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-12 border border-white/50 text-center shadow-xl shadow-slate-200/50">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
            <Layout size={32} />
          </div>
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Activity Recorded</h3>
          <p className="text-xs text-slate-300 font-bold mt-1">Updates will appear here as the project progresses.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mergedActivity.map((log, idx) => {
            const { date, time } = formatDateTime(log.time);
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative flex gap-6"
              >
                {/* Timeline Line */}
                {idx !== mergedActivity.length - 1 && (
                  <div className="absolute left-4 md:left-6 top-12 md:top-14 bottom-0 w-[1.5px] bg-slate-100 group-last:hidden" />
                )}

                {/* Date Bubble */}
                <div className="flex flex-col items-center shrink-0 w-8 md:w-12 text-center mt-1">
                  <span className="text-[8px] md:text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{date.split(' ')[0]}</span>
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{date.split(' ')[1]}</span>
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-white/70 backdrop-blur-xl p-4 md:p-5 rounded-2xl md:rounded-3xl border border-white shadow-sm hover:shadow-md transition-all group-hover:border-indigo-100 relative mb-4">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                        {getCategoryIcon(log.category)}
                      </div>
                      <span className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-widest">{log.category || 'System'}</span>
                    </div>
                    <span className="text-[8px] md:text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{time}</span>
                  </div>
                  <p className="text-xs md:text-sm font-bold text-slate-700 leading-relaxed">
                    {log.message}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
