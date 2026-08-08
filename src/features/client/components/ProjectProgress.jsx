import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ChevronRight, 
  Calendar, 
  ArrowRight, 
  Zap, 
  Target,
  TrendingUp,
  Award,
  BarChart3
} from 'lucide-react';

const ProjectProgress = ({ tasks = [] }) => {
  const [percentage, setPercentage] = useState(0);
  const [dayProgress, setDayProgress] = useState(0);
  const [paymentPercentage, setPaymentPercentage] = useState(0);

  const completedTasks = tasks.filter(t => t.status && t.status.toUpperCase() === "COMPLETED").length;
  const totalTasks = tasks.length || 1;
  const targetPercentage = Math.round((completedTasks / totalTasks) * 100);

  const project = JSON.parse(localStorage.getItem("clientProject") || "{}");
  
  // Calculate Days Progress
  const startDate = project.startDate ? new Date(project.startDate) : new Date();
  const endDate = project.endDate ? new Date(project.endDate) : new Date();
  const today = new Date();
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;
  const daysPassed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
  const daysPercentage = Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));

  // Payment Progress (Dummy or from project data)
  const targetPaymentVal = project.paymentProgress || 65;

  useEffect(() => {
    // Smooth counter animation
    const timer = setTimeout(() => {
      setPercentage(targetPercentage);
      setDayProgress(daysPercentage);
      setPaymentPercentage(targetPaymentVal);
    }, 100);
    return () => clearTimeout(timer);
  }, [targetPercentage, daysPercentage, targetPaymentVal]);

  // SAFE REPLACEMENT FOR RECHARTS: Custom SVG Circular Progress
  const CircularProgress = ({ value, color, label, icon: Icon, size = 160 }) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          {/* Background Circle */}
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-slate-100"
            />
            {/* Progress Circle with Glow */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={circumference}
              style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
              strokeLinecap="round"
              fill="transparent"
              className={color}
            />
          </svg>
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`p-2 rounded-lg bg-white shadow-sm mb-1`}>
              <Icon size={18} className={color.replace('stroke-', 'text-')} />
            </div>
            <span className="text-2xl font-black text-slate-800">{value}%</span>
          </div>
        </div>
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER CARD */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-indigo-200">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
              Live Project Status
            </span>
            <span className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-400/30 text-emerald-300">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              On Track
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
            Your dream home is <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
              {percentage}% Complete
            </span>
          </h1>
          
          <p className="text-indigo-100/80 text-sm md:text-lg max-w-xl font-medium mb-8">
            Everything is proceeding according to the master plan. We are currently in the 
            <span className="text-white font-bold px-1 uppercase tracking-wider">Production</span> phase.
          </p>
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CIRCULAR CHARTS SECTION */}
        <div className="md:col-span-3 bg-white/70 backdrop-blur-2xl p-8 rounded-[3rem] border border-white shadow-xl shadow-indigo-100/20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Overall Progress</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time metrics</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <BarChart3 size={24} />
            </div>
          </div>

          <div className="flex flex-wrap justify-around gap-12 py-4">
            <CircularProgress 
              value={percentage} 
              color="stroke-indigo-600" 
              label="Work Progress" 
              icon={Target}
            />
            <CircularProgress 
              value={dayProgress} 
              color="stroke-emerald-500" 
              label="Timeline" 
              icon={Clock}
            />
            <CircularProgress 
              value={paymentPercentage} 
              color="stroke-amber-500" 
              label="Payment Status" 
              icon={Zap}
            />
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white shadow-lg overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
              <h4 className="text-xl font-black text-slate-800 tracking-tight">{completedTasks}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white shadow-lg overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining</p>
              <h4 className="text-xl font-black text-slate-800 tracking-tight">{totalTasks - completedTasks}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white shadow-lg overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
              <Award size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
              <h4 className="text-xl font-black text-slate-800 tracking-tight">98.4%</h4>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ProjectProgress;
