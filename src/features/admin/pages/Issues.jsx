import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import {
  Plus,
  Pencil,
  Mail,
  Filter,
  Search as SearchIcon,
  X,
  Folder,
  MapPin,
  ArrowLeft,
  Eye,
  AlertTriangle,
  Upload,
} from "lucide-react";
import RefreshButton from "../../../shared/components/RefreshButton.jsx";
import { formatDate } from "../../../shared/utils/dateFormatter";
import { isTaskOverdue } from "../utils/dateUtils.js";

import IssueStats from "../components/IssueStats.jsx";
import IssueDrawer from "../components/IssueDrawer.jsx";

const allowedRoles = [
  "EMPLOYEE",
  "SITE_SUPERVISOR",
  "CLIENT_RELATIONSHIP_EXECUTIVE",
  "BUSINESS_HEAD",
  "LEAD_OPERATION",
  "FA",
  "LA",
];

const emptyIssue = {
  title: "",
  projectId: "",
  employeeId: "",
  startDate: "",
  dueDate: "",
  status: "PENDING",
  priority: "MEDIUM",
  type: "ISSUE",
  description: "",
};

const Issues = () => {
  const {
    tasks,
    projects,
    employees,
    addTask,
    updateTask,
    deleteTask,
    refreshData,
    loading,
  } = useApp();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [activeFilter, setActiveFilter] = useState("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyIssue);

  // Navigation State
  const [selectedProject, setSelectedProject] = useState(null);
  const selectedProjectId = searchParams.get("projectId");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isManager = (user.role || "").toUpperCase() === "MANAGER";
  const assignableEmployees = employees.filter((emp) =>
    allowedRoles.includes((emp.role || "").toUpperCase()),
  );

  // Filter only Issues
  const issuesOnly = tasks.filter(
    (t) => (t.type || "").toUpperCase() === "ISSUE",
  );

  // Calculate Project Metrics (Issue Specific)
  const projectMetrics = useMemo(() => {
    return projects.map((project) => {
      const projectIssues = issuesOnly.filter(
        (t) => t.projectId === project.id,
      );
      const total = projectIssues.length;
      const open = projectIssues.filter(
        (t) =>
          (t.status || "").toUpperCase() !== "COMPLETED" &&
          (t.status || "").toUpperCase() !== "RESOLVED",
      ).length;
      const highPriority = projectIssues.filter(
        (t) => (t.priority || "").toUpperCase() === "HIGH",
      ).length;
      const resolved = projectIssues.filter(
        (t) =>
          (t.status || "").toUpperCase() === "RESOLVED" ||
          (t.status || "").toUpperCase() === "COMPLETED",
      ).length;

      // Calculate "health" or progress - for issues, lower open count is better, but let's show resolution rate
      const progress = total > 0 ? Math.round((resolved / total) * 100) : 100;

      return {
        ...project,
        issueCount: total,
        openCount: open,
        highPriorityCount: highPriority,
        resolvedCount: resolved,
        progress,
      };
    });
  }, [projects, issuesOnly]);

  const filtered = useMemo(() => {
    let scopedIssues = issuesOnly;

    // Filter by Project if selected
    if (selectedProject) {
      scopedIssues = scopedIssues.filter(
        (t) => t.projectId === selectedProject.id,
      );
    }

    // Filter by Search & Status
    return scopedIssues.filter((t) => {
      // 1. Search Query
      const project = projects.find((p) => p.id === t.projectId);
      const emp = employees.find((e) => e.id === t.employeeId);
      console.log(t.status)
      const target = (
        t.title +
        (project?.name || "") +
        (emp?.name || "") +
        (t.id || "") +
        (t.description || "") +
        (t.status || "")
      ).toLowerCase();
      const matchesSearch = target.includes(search.toLowerCase());

      // 2. Status Filter
      let matchesFilter = true;
      if (activeFilter === "Open")
        matchesFilter =
          (t.status || "").toUpperCase() !== "COMPLETED" &&
          (t.status || "").toUpperCase() !== "RESOLVED";
      if (activeFilter === "Closed")
        matchesFilter =
          (t.status || "").toUpperCase() === "COMPLETED" ||
          (t.status || "").toUpperCase() === "RESOLVED";

      return matchesSearch && matchesFilter;
    });
  }, [issuesOnly, selectedProject, search, activeFilter, projects, employees]);

  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProject(null);
      return;
    }

    const matchedProject = projects.find(
      (project) =>
        project.id === selectedProjectId ||
        project.projectId === selectedProjectId,
    );
    setSelectedProject(matchedProject || null);
  }, [projects, selectedProjectId]);

  const openCreate = () => {
    setForm(emptyIssue);
    // Auto-select project if we are inside a project view
    if (selectedProject) {
      setForm((prev) => ({ ...prev, projectId: selectedProject.id }));
    }
    setEditingId(null);
    setDrawerOpen(true);
  };

  const openEdit = (task) => {
    setForm({
      ...emptyIssue,
      ...task,
      projectId: task.projectId || "",
      employeeId: task.employeeId || "",
      startDate:
        task.startDate || task.createdAt
          ? new Date(task.startDate || task.createdAt)
              .toISOString()
              .split("T")[0]
          : "",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      priority: (task.priority || "MEDIUM").toUpperCase(),
      status: (task.status || "PENDING").toUpperCase().replace(/\s+/g, "_"),
      type: "ISSUE",
    });
    setEditingId(task.id);
    setDrawerOpen(true);
  };

  const handleSubmit = (formData) => {
    if (!formData.title || !formData.projectId || !formData.employeeId) {
      alert("Title, project and employee are required");
      return;
    }

    const allowedFields = [
      "title",
      "projectId",
      "employeeId",
      "startDate",
      "dueDate",
      "status",
      "priority",
      "type",
      "description",
    ];

    const payload = {};
    allowedFields.forEach((key) => {
      if (formData[key] !== undefined && formData[key] !== null) {
        payload[key] = formData[key];
      }
    });

    if (payload.startDate)
      payload.startDate = new Date(payload.startDate).toISOString();
    if (payload.dueDate)
      payload.dueDate = new Date(payload.dueDate).toISOString();
    payload.priority = (payload.priority || "MEDIUM").toUpperCase();
    payload.status = (payload.status || "PENDING").toUpperCase();
    payload.type = "ISSUE";

    if (editingId) updateTask(editingId, payload);
    else addTask(payload);

    const emp = employees.find((e) => e.id === formData.employeeId);
    if (emp) {
      // toast.success(`Email sent to ${ emp.email } `);
    }

    setDrawerOpen(false);
  };

  const handleDelete = (id) => {
    deleteTask(id);
    setDrawerOpen(false);
  };

  const getStatus = (t) => {
    if ((t.status || "").toUpperCase() === "COMPLETED") return "COMPLETED";
    if ((t.status || "").toUpperCase() === "RESOLVED") return "RESOLVED";
    if (isTaskOverdue(t)) return "Overdue";
    return t.status;
  };

  // --- RENDER PROJECT GRID ---
  if (!selectedProject) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Global Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Issues Overview
            </h1>
            <p className="text-slate-500 font-medium">
              Monitor project health and resolving bottlenecks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isManager && (
              <button
                onClick={openCreate}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <Plus size={18} />
                Global Issue
              </button>
            )}
            <RefreshButton
              onRefresh={refreshData}
              isLoading={loading}
              className="border-slate-200 shadow-sm"
            />
          </div>
        </div>

        {/* Global Stats - Kept for high-level overview */}
        <IssueStats issues={issuesOnly} />

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectMetrics.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-100 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-rose-50 rounded-xl group-hover:bg-rose-500 transition-colors">
                  <AlertTriangle className="w-6 h-6 text-rose-500 group-hover:text-white" />
                </div>
                <div
                  className={`px - 2 py - 1 rounded - lg text - xs font - bold ${p.openCount > 0 ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"} `}
                >
                  {p.openCount > 0 ? `${p.openCount} Open` : "All Clear"}
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">
                {p.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-6 flex items-center gap-1">
                <MapPin size={12} /> {p.location || "No Location"}
              </p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-slate-800">
                    {p.issueCount}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Total
                  </div>
                </div>
                <div className="bg-rose-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-rose-600">
                    {p.highPriorityCount}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-rose-400">
                    High
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-emerald-600">
                    {p.resolvedCount}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-emerald-400">
                    Fixed
                  </div>
                </div>
              </div>

              {/* Progress Bar (Resolution Rate) */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h - full rounded - full transition - all duration - 500 ${p.progress === 100 ? "bg-emerald-500" : "bg-orange-500"} `}
                  style={{ width: `${p.progress}% ` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Global Drawer */}
        <IssueDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          initialData={form}
          isEditing={!!editingId}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          projects={projects}
          employees={assignableEmployees}
        />
      </div>
    );
  }

  // --- RENDER ISSUE LIST (Drill-down) ---
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedProject(null)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              {selectedProject.name} <span className="text-slate-300">/</span>{" "}
              Issues
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              {selectedProject.location || "Project Site"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-200 transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={18} />
            New Issue
          </button>
          <RefreshButton
            onRefresh={refreshData}
            isLoading={loading}
            className="border-slate-200 shadow-sm"
          />
        </div>
      </div>

      {/* Controls / Search */}
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search project issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium"
          />
        </div>

        {/* Filter Pills */}
        <div className="inline-flex bg-slate-100 p-1 rounded-xl">
          {["All", "Open", "Closed"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`w-24 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeFilter === f
                  ? "bg-white text-slate-800 shadow"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <p className="text-slate-500 font-bold">No issues found.</p>
            <button
              onClick={openCreate}
              className="text-indigo-600 text-sm font-bold mt-2 hover:underline"
            >
              Log the first issue
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[80px_2fr_1.5fr_1.5fr_1fr_1fr_100px] text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                <div>ID</div>
                <div>Issue</div>
                <div>Assigned To</div>
                <div>Timeline</div>
                <div>Priority</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
              </div>

              {filtered.map((t) => {
                const emp = employees.find((e) => e.id === t.employeeId);
                const status = getStatus(t);

                return (
                  <div
                    key={t.id}
                    className="grid grid-cols-[80px_2fr_1.5fr_1.5fr_1fr_1fr_100px] items-center px-6 py-4 hover:bg-slate-50/50 transition-colors group border-b border-slate-50 last:border-0"
                  >
                    <div className="font-mono text-xs text-orange-600 font-bold">
                      #{t.id.slice(-4)}
                    </div>

                    <div className="pr-4">
                      <p className="font-bold text-slate-800 truncate text-sm">
                        {t.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">
                        {t.description || "No description provided."}
                      </p>
                    </div>

                    <div>
                      {emp ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700 truncate">
                              {emp.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {emp.role}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">
                          Unassigned
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-300"></div>
                        <span className="text-xs text-slate-500 font-medium">
                          {t.startDate ? formatDate(t.startDate) : "—"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-300"></div>
                        <span className="text-xs text-slate-500 font-semibold">
                          {t.dueDate ? formatDate(t.dueDate) : "—"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <StatusBadge status={t.priority} />
                    </div>

                    <div>
                      <StatusBadge status={status} />
                    </div>

                    <div className="text-right flex justify-end gap-2">
                      <button
                        onClick={() => {
                          if (!emp) return alert("No employee assigned.");
                          alert(
                            `Email sent to ${emp.email} for ${t.title}(simulated).`,
                          );
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        title="Send Email"
                      >
                        <Mail size={16} />
                      </button>
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Drawer (Shared) */}
      <IssueDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialData={form}
        isEditing={!!editingId}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        projects={projects}
        employees={assignableEmployees}
      />
    </div>
  );
};

export default Issues;
