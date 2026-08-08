import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext.jsx";
import StatCard from "../components/common/StatCard.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import RefreshButton from "../../../shared/components/RefreshButton.jsx";
import { formatDate } from "../../../shared/utils/dateFormatter";



import {
  FolderKanban,
  CheckCircle2,
  ClockAlert,
  Bug,
  MessageSquare,
  ListChecks,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";

import { isProjectOverdue } from "../utils/dateUtils.js";

const getProjectRowId = (project) => project?.id || project?.projectId || "";
const getProjectDeadline = (project) => project?.deadline || project?.endDate || null;
const getProjectStartDate = (project) => project?.startDate || project?.createdAt || null;
const getProjectCode = (project) => project?.projectCode || project?.projectId || project?.id || "-";
const getProjectClientName = (project) =>
  [project?.clientFirstName, project?.clientLastName].filter(Boolean).join(" ") || "-";


// ====================== Dashboard Component ======================
const Dashboard = () => {
  const navigate = useNavigate();
  const { metrics, projects, refreshData, loading } = useApp();

  const safeMetrics = {
    openProjects: metrics?.openProjects ?? 0,
    closedProjects: metrics?.closedProjects ?? 0,
    openTasks: metrics?.openTasks ?? 0,
    closedTasks: metrics?.closedTasks ?? 0,
    overdueProjects: metrics?.overdueProjects ?? 0,
    openIssues: metrics?.openIssues ?? 0,
    closedIssues: metrics?.closedIssues ?? 0,
    completedTasks: metrics?.completedTasks ?? 0,
    pendingTasks: metrics?.pendingTasks ?? 0,
    overdueTasks: metrics?.overdueTasks ?? 0,
  };
  const latestProjects = (projects || []).slice(0,5);

  const statsClickActions = {
    "Open Projects": () => navigate("/admin/projects"),
    "Closed Projects": () => navigate("/admin/projects"),
    "Overdue Projects": () => navigate("/admin/projects"),
    "Open Tasks": () => navigate("/admin/tasks"),
    "Closed Tasks": () => navigate("/admin/tasks"),
    "Overdue Tasks": () => navigate("/admin/tasks"),
    "Open Issues": () => navigate("/admin/issues"),
    "Closed Issues": () => navigate("/admin/issues"),
  };



  return (
    <motion.div
      className="space-y-10 pb-10 w-full"
      initial={{ opacity: 0.85, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >

      {/* HEADER */}
      <div className="flex flex-wrap justify-between items-start sm:items-center gap-4 w-full">
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 font-medium">
            Overview of Cookscape projects, tasks, and issues.
          </p>
        </div>
        <div className="flex-shrink-0">
          <RefreshButton
            onRefresh={refreshData}
            isLoading={loading}
            label="Sync All"
            className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm"
          />
        </div>
      </div>

      {/* ================= STAT CARDS ================= */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 25 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { staggerChildren: 0.07 },
          },
        }}
      >
        {[
          { label: "Open Projects", value: safeMetrics.openProjects, icon: FolderKanban },
          { label: "Closed Projects", value: safeMetrics.closedProjects, icon: CheckCircle2, accent: "success" },
          { label: "Open Tasks", value: safeMetrics.openTasks, icon: ListChecks },
          { label: "Closed Tasks", value: safeMetrics.closedTasks, icon: ClipboardCheck, accent: "success" },
          { label: "Overdue Projects", value: safeMetrics.overdueProjects, icon: ClockAlert, accent: "danger" },
          { label: "Overdue Tasks", value: safeMetrics.overdueTasks, icon: ClockAlert, accent: "danger" },
          { label: "Open Issues", value: safeMetrics.openIssues, icon: Bug, accent: "warning" },
          { label: "Closed Issues", value: safeMetrics.closedIssues, icon: ShieldCheck, accent: "success" },
        ].map((card, i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1 },
            }}
            whileHover={{
              scale: 1.08,
              transition: { type: "spring", stiffness: 220, damping: 14 },
            }}
            whileTap={{ scale: 0.95 }}
            onClick={statsClickActions[card.label]}
            className="cursor-pointer"
          >
            <StatCard {...card} />
          </motion.div>
        ))}
      </motion.div>

      {/* ================= ASSIGNED PROJECTS ================= */}
      <motion.div
        className="bg-white rounded-xl shadow-md border border-gray-200 p-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="font-semibold text-base mb-5">Assigned Projects</p>

        {/* ================= DESKTOP TABLE ================= */}
        <div className="hidden md:block overflow-x-auto">
          {/* Header */}
          <div
            className="
        grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_60px_60px]
        items-center
        text-xs font-semibold text-slate-700
        bg-slate-100
        border border-slate-200
        rounded-t-xl
        px-4
        h-11
        sticky top-0 z-10
      "
          >
            <div>Project</div>
            <div>Client</div>
            <div>Location</div>
            <div className="text-center">Start</div>
            <div className="text-center">Deadline</div>
            <div className="text-center">Status</div>
            <div className="text-center">Issues</div>
            <div className="text-center">Chat</div>
          </div>

          {/* Rows */}
          <div className="border border-t-0 border-slate-200 rounded-b-xl overflow-hidden">
            {latestProjects.length > 0 ? (
              latestProjects.map((p, index) => {
                const overdue = isProjectOverdue(p);
                const projectId = getProjectRowId(p);
                const deadline = getProjectDeadline(p);
                const startDate = getProjectStartDate(p);

                return (
                  <motion.div
                    key={projectId || p.name || index}
                    onClick={() => navigate("/admin/projects")}
                    className="
                grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_60px_60px]
                items-center
                px-4 py-3
                border-b last:border-0
                text-xs
                hover:bg-slate-100/70
                cursor-pointer
              "
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div>
                      <p className="font-medium text-sm text-slate-800">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{getProjectCode(p)}</p>
                    </div>

                    <p>{getProjectClientName(p)}</p>
                    <p>{p.location || "-"}</p>
                    <p className="text-center">{startDate ? formatDate(startDate) : '-'}</p>
                    <p className="text-center">{deadline ? formatDate(deadline) : '-'}</p>

                    <div className="text-center">
                      <StatusBadge status={overdue ? "Overdue" : "Active"} />
                    </div>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/issues?projectId=${encodeURIComponent(projectId)}`);
                      }}
                      className="flex justify-center"
                    >
                      <Bug
                        size={18}
                        className="text-orange-600 hover:scale-110 transition"
                      />
                    </div>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/project/${projectId}/chat`);
                      }}
                      className="flex justify-center"
                    >
                      <MessageSquare
                        size={18}
                        className="text-blue-500 hover:scale-110 transition"
                      />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <p className="py-6 text-center text-slate-500 text-sm">
                No projects yet.
              </p>
            )}
          </div>
        </div>

        {/* ================= MOBILE CARDS ================= */}
        <div className="md:hidden space-y-4">
          {latestProjects.map((p, index) => {
            const today = new Date();
            const projectId = getProjectRowId(p);
            const deadline = getProjectDeadline(p);
            const startDate = getProjectStartDate(p);
            const due = deadline ? new Date(deadline) : null;
            const overdueDays =
              due && due < today
                ? Math.ceil((today - due) / (1000 * 60 * 60 * 24))
                : 0;

            return (
              <motion.div
                key={projectId || p.name || index}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate("/admin/projects")}
                className="
            bg-white rounded-2xl border border-gray-200 shadow-sm p-5
            cursor-pointer active:scale-[0.98]
            hover:shadow-md transition-all
          "
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-indigo-600 font-semibold text-lg leading-tight">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-400">ID: {getProjectCode(p)}</p>
                  </div>

                  <span
                    className={`px-3 py-[3px] text-xs rounded-full font-medium border
                ${overdueDays > 0
                        ? "bg-red-50 text-red-600 border-red-200"
                        : "bg-green-50 text-green-700 border-green-200"
                      }`}
                  >
                    {overdueDays > 0 ? `${overdueDays} Days` : "On Time"}
                  </span>
                </div>

                <div className="border-b my-3"></div>

                {/* Dates */}
                <div className="grid grid-cols-2 text-sm mb-4">
                  <div>
                    <p className="text-gray-400 text-xs">Start</p>
                    <p className="font-semibold text-gray-700 mt-1">
                      {startDate ? formatDate(startDate) : '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">Deadline</p>
                    <p
                      className={`font-semibold mt-1 ${due < today ? "text-red-600" : "text-gray-700"
                        }`}
                    >
                      {deadline ? formatDate(deadline) : '-'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/issues?projectId=${encodeURIComponent(projectId)}`);
                    }}
                    className="
                w-9 h-9 flex items-center justify-center
                bg-orange-50 text-orange-600 border border-orange-200
                rounded-full hover:bg-orange-100 transition
              "
                  >
                    <Bug size={18} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/project/${projectId}/chat`);
                    }}
                    className="
                w-9 h-9 flex items-center justify-center
                bg-blue-50 text-blue-600 border border-blue-200
                rounded-full hover:bg-blue-100 transition
              "
                  >
                    <MessageSquare size={18} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>




    </motion.div>
  );
};

export default Dashboard;
