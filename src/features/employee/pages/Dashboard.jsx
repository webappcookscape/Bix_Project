import React, { useContext } from "react";
import { TaskContext } from "../context/TaskContext";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  AlertTriangle,
  Bug,
  CheckCheck,
} from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import CountUp from "react-countup";
import RefreshButton from "../../../shared/components/RefreshButton";
import { formatDate } from "../../../shared/utils/dateFormatter";


const Dashboard = () => {
  const { tasks, projects, issues, refreshData, loading } = useContext(TaskContext);

  const navigate = useNavigate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => (t.status || "").toUpperCase() === "COMPLETED").length;
  const inProgressTasks = tasks.filter(t => ["IN PROGRESS", "ONGOING", "ACTIVE"].includes((t.status || "").toUpperCase())).length;
  const pendingTasks = tasks.filter(t => (t.status || "").toUpperCase() === "PENDING").length;

  const overdueTasks = tasks.filter(task => {
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return (task.status || "").toUpperCase() !== "COMPLETED" && due < today;
  }).length;

  const openIssues = issues.filter(i => ["PENDING", "IN PROGRESS", "ACTIVE"].includes((i.status || "").toUpperCase())).length;

  const stats = [
    { label: "Active Tasks", count: totalTasks - completedTasks, total: totalTasks, icon: <ClipboardList size={22} />, color: "from-blue-600 to-indigo-700", route: "/employee/tasks" },
    { label: "Completed", count: completedTasks, total: totalTasks, icon: <CheckCircle size={22} />, color: "from-emerald-500 to-teal-600", route: "/employee/tasks?filter=COMPLETED" },
    { label: "Overdue", count: overdueTasks, total: totalTasks, icon: <AlertTriangle size={22} />, color: "from-rose-500 to-red-700", route: "/employee/tasks?filter=overdue" },
    { label: "Open Issues", count: openIssues, total: issues.length, icon: <Bug size={22} />, color: "from-orange-500 to-amber-600", route: "/employee/issues?filter=PENDING" }
  ];

  const getProjectStats = pid => {
    const projectTasks = tasks.filter(t => t.projectId === pid);
    const projectIssues = issues.filter(i => i.projectId === pid);
    const overdue = projectTasks.filter(task => {
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      return task.status !== "Completed" && due < today;
    }).length;

    const completed = projectTasks.filter(t => (t.status || "").toUpperCase() === "COMPLETED").length;
    const progress = projectTasks.length > 0 ? (completed / projectTasks.length) * 100 : 0;

    return {
      total: projectTasks.length,
      completed,
      pending: projectTasks.length - completed,
      overdue,
      issues: projectIssues.filter(i => (i.status || "").toUpperCase() !== "COMPLETED").length,
      progress
    };
  };

  return (
    <motion.div
      className="p-4 sm:p-8 bg-[#F8FAFC]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">My Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <RefreshButton onRefresh={refreshData} isLoading={loading} label="Sync" />
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">

            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{formatDate(new Date())}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
        {stats.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            onClick={() => navigate(item.route)}
            className="group cursor-pointer"
          >
            <div className={`relative overflow-hidden bg-gradient-to-br ${item.color} p-6 rounded-3xl shadow-lg shadow-slate-200 transition-all duration-300`}>
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                {React.cloneElement(item.icon, { size: 100 })}
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{item.label}</span>
                </div>
                <div className="flex items-end gap-2 text-white">
                  <h2 className="text-4xl font-black">
                    <CountUp end={item.count} duration={1} />
                  </h2>
                  <span className="text-sm font-bold opacity-60 mb-1.5 px-2 py-0.5 bg-black/10 rounded-full">/ {item.total}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Projects Table */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              Projects
              <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-600 rounded-full">{projects.length}</span>
            </h3>
            <button onClick={() => navigate('/employee/projects')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">View All</button>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-1/3">Project Details</th>
                    <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Tasks</th>
                    <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Issues</th>
                    <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Progress</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((project, idx) => {
                    const projectKey = project.id || project.projectId || `${project.name}-${idx}`;
                    const pStats = getProjectStats(project.id || project.projectId);
                    return (
                      <motion.tr
                        key={projectKey}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 * idx }}
                        onClick={() => navigate(`/employee/tasks`)}
                        className="group hover:bg-slate-50/50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-110 transition-transform">
                              {project.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{project.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{project.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-sm font-black text-slate-700">{pStats.total}</span>
                            <span className="text-[9px] font-bold text-orange-500 uppercase">{pStats.overdue} Overdue</span>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-center">
                          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-bold text-xs ${pStats.issues > 0 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
                            {pStats.issues}
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <div className="w-24 mx-auto">
                            <div className="flex justify-between items-center text-[9px] font-black text-slate-500 mb-1">
                              <span>{Math.round(pStats.progress)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pStats.progress}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right font-bold text-sm text-slate-600">
                          {formatDate(project.endDate || project.deadline)}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Timeline */}
        <div className="space-y-8">
          <h3 className="text-xl font-black text-slate-800 tracking-tight px-1 uppercase tracking-widest text-xs opacity-50">Quick Summary</h3>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
            <div className="relative z-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500 text-white rounded-xl"><CheckCheck size={18} /></div>
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Task Success Rate</p>
                      <p className="text-xs text-slate-400 font-bold">Overall completion avg</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-indigo-600">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500 text-white rounded-xl"><AlertTriangle size={18} /></div>
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Issue Ratio</p>
                      <p className="text-xs text-slate-400 font-bold">Issues vs total tasks</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-rose-600">{totalTasks > 0 ? (issues.length / totalTasks).toFixed(1) : 0}</span>
                </div>

                <button
                  onClick={() => navigate('/employee/tasks')}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-colors"
                >
                  Review Weekly Agenda
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
