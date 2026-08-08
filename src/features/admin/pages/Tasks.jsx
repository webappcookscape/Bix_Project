import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import {
  Plus,
  Pencil,
  Mail,
  Eye,
  X,
  MapPin,
  Folder,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
} from "lucide-react";
import RefreshButton from "../../../shared/components/RefreshButton.jsx";
import { formatDate } from "../../../shared/utils/dateFormatter";
import { isTaskOverdue } from "../utils/dateUtils.js";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {  Search as SearchIcon, Filter } from "lucide-react";


// Fix for default Leaflet markers in React/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const STAGES = {
  "Freezing Mail": [
    "Client Details",
    "Floor Plan",
    "Initial Estimate Options",
    "Finalized Variants & Initial Quote",
    "Initial Schematic Proposal",
    "Blurred DWG",
    "Payment Gateway",
    "Booking Docs",
  ],
  "Approval of finalized designs": [
    "PDI Reports",
    "FM taken by AE",
    "2D Drawing",
    "3D Rendered Images",
    "Production Payment",
    "Approval of Finalized Designs",
  ],
  Production: ["Factory Production", "Quality Check Process"],
  Installation: ["Installation Work", "Completion Certificate"],
};

const emptyTask = {
  title: "",
  projectId: "",
  employeeId: "",
  startDate: "",
  dueDate: "",
  status: "PENDING",
  priority: "Medium",
  type: "TASK",
  stage: "", // Added stage
  description: "",
};
const allowedRoles = [
  "EMPLOYEE", // Standard Employee
  "SITE_SUPERVISOR", // For AE (Application Engineer)
  "CLIENT_RELATIONSHIP_EXECUTIVE", // For CRE
  "BUSINESS_HEAD", // For BH
  "LEAD_OPERATION", // For Lead Op
  "FA", // Feasibility Architect allowedRoles(assuming role name)
  "LA", // Loading Architect (assuming role name)
];
const Tasks = () => {
  const {
    tasks,
    projects,
    employees,
    addTask,
    updateTask,
    refreshData,
    loading,
  } = useApp();
  const [searchParams] = useSearchParams();
  const [projectSearch, setProjectSearch] = useState(searchParams.get("q") || "");
  const [taskSearch, setTaskSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyTask);
  

  // Navigation State
  const [selectedProject, setSelectedProject] = useState(null);
  const assignableEmployees = employees.filter((emp) =>
    allowedRoles.includes((emp.role || "").toUpperCase())
  );
  // -------------------------------------------------------------------------
  // Auto-Calculate Dates for "Factory Production"
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (form.title === "Factory Production" && form.projectId) {
      const project = projects.find((p) => p.id === form.projectId);
      if (project) {
        // Start Date: Project Start Date OR Today
        const startDateObj = project.startDate
          ? new Date(project.startDate)
          : new Date();

        // Duration: Use project timeline duration (default 45)
        const duration = project.timelineDuration || 45;

        // Calculate Due Date
        const dueDateObj = new Date(startDateObj);
        dueDateObj.setDate(dueDateObj.getDate() + duration);

        // Format to YYYY-MM-DD for input[type="date"]
        const toInputDate = (d) => d.toISOString().split("T")[0];

        setForm((prev) => ({
          ...prev,
          startDate: toInputDate(startDateObj),
          dueDate: toInputDate(dueDateObj),
        }));
      }
    }
  }, [form.title, form.projectId, projects]);

  // Evidence Modal State
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);
  const [evidenceIndex, setEvidenceIndex] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isManager = (user.role || "").toUpperCase() === "MANAGER";

  const tasksOnly = tasks.filter((t) => t.type?.toUpperCase() === "TASK");

  // Calculate Project Metrics
  const projectMetrics = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = tasksOnly.filter((t) => t.projectId === project.id);

      // Case-insensitive check for reliability
      const completed = projectTasks.filter(
        (t) => (t.status || "").toUpperCase() === "COMPLETED",
      ).length;
      const pending = projectTasks.filter(
        (t) => (t.status || "").toUpperCase() === "PENDING",
      ).length;
      const overdue = projectTasks.filter((t) => isTaskOverdue(t)).length;

      return {
        ...project,
        taskCount: projectTasks.length,
        completedCount: completed,
        pendingCount: pending,
        overdueCount: overdue,
        progress:
          projectTasks.length > 0
            ? Math.round((completed / projectTasks.length) * 100)
            : 0,
      };
    });
  }, [projects, tasksOnly]);

  const filteredTasks = useMemo(() => {
    let scopedTasks = tasksOnly;

    // Filter by Project if selected
    if (selectedProject) {
      scopedTasks = scopedTasks.filter(
        (t) => t.projectId === selectedProject.id,
      );
    }

    // Filter by Search
    if (taskSearch) {
      scopedTasks = scopedTasks.filter((t) => {
        const project = projects.find((p) => p.id === t.projectId); // Corrected from p.projectId to p.id
        const emp = employees.find((e) => e.id === t.employeeId);
        const target = (
          t.title +
          (project?.name || "") +
          (emp?.name || "") +
          (t.id || "") +
          (t.description || "") +
          (t.status || "")
        ).toLowerCase();
        return target.includes(taskSearch.toLowerCase());
      });
    }
    return scopedTasks;
  }, [tasksOnly, selectedProject, taskSearch, projects, employees]);

  const openCreate = () => {
    setForm(emptyTask);
    if (selectedProject) {
      setForm((prev) => ({ ...prev, projectId: selectedProject.id }));
    }
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setForm({
      ...emptyTask,
      ...task,

      startDate: task.startDate ? task.startDate.split("T")[0] : "",

      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",

      priority: task.priority
        ? task.priority.charAt(0).toUpperCase() +
          task.priority.slice(1).toLowerCase()
        : "Medium",
    });
    setEditingId(task.id);
    setModalOpen(true);
  };

  const openEvidence = (task) => {
    setViewingTask(task);
    setEvidenceIndex(0); // Reset gallery specific to this task
    setEvidenceModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.projectId || !form.employeeId) {
      alert("Title, project and employee are required");
      return;
    }
 
    // Sanitize Payload (Whitelist)
    const allowedFields = [
      "title",
      "projectId",
      "employeeId",
      "startDate",
      "dueDate",
      "status",
      "priority",
      "type",
      "stage",
      "description",
    ];

    const payload = {};
    allowedFields.forEach((key) => {
      // Allow description to be an empty string, but not other required fields which are validated above.
      if (form[key] !== undefined && form[key] !== null) {
        payload[key] = form[key];
      }
    });

    if (payload.startDate)
      payload.startDate = new Date(payload.startDate).toISOString();
    if (payload.dueDate)
      payload.dueDate = new Date(payload.dueDate).toISOString();

    payload.priority = (payload.priority || "MEDIUM").toUpperCase();
    if (!payload.stage) payload.stage = null;

    // Status is now handled by the backend. We just ensure it's uppercase if it exists.
    if (payload.status) payload.status = payload.status.toUpperCase();

    if (editingId) updateTask(editingId, payload);
    else addTask(payload);

    const emp = employees.find((e) => e.id === form.employeeId);
    if (emp) {
      alert(`Email sent to ${emp.email} (simulated).`);
    }

    setModalOpen(false);
  };
const filteredProjects = useMemo(() => {
  return projectMetrics.filter((p) => {
    if (!projectSearch.trim()) return true;

    const q = projectSearch.toLowerCase();

    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.clientFirstName || "").toLowerCase().includes(q) ||
      (p.clientLastName || "").toLowerCase().includes(q) ||
      (p.projectCode || "").toLowerCase().includes(q) ||
      (p.clientEmail || "").toLowerCase().includes(q) ||
      (p.location || "").toLowerCase().includes(q) ||
      (p.clientPhone || "").includes(projectSearch)
    );
  });
}, [projectMetrics, projectSearch]);
  const getStatus = (t) => {
    if ((t.status || "").toUpperCase() === "COMPLETED") return "COMPLETED";
    if (isTaskOverdue(t)) return "Overdue";
    return t.status;
  };

  // --- RENDER HELPERS ---
  const renderProjectGrid = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Projects Overview
          </h1>
          <p className="text-sm text-slate-500">
            Select a project to view and manage its tasks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isManager && user.role !== "VIEW_ONLY_ADMIN" && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-bold shadow-lg hover:bg-slate-800 transition"
            >
              <Plus size={16} />
              Global Task
            </button>
          )}
          <RefreshButton
            onRefresh={refreshData}
            isLoading={loading}
            className="border-slate-200 shadow-sm"
          />
        </div>
      </div>
 <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, code, client phone, email, or location..."
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium"
          />
        </div>
        {/* Future Filter Buttons can go here */}
        <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 flex items-center gap-2">
          <Filter size={16} /> Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((p) => (
          <div
            key={p.id}
            onClick={() => {
              setSelectedProject(p);
              setTaskSearch("");
            }}
            className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-100 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 transition-colors">
                <Folder className="w-6 h-6 text-indigo-600 group-hover:text-white" />
              </div>
              <div
                className={`px-3 py-1 rounded-lg text-xs font-bold ${p.overdueCount > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}
              >
                {p.overdueCount > 0 ? `${p.overdueCount} Overdue` : "On Track"}
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
                  {p.taskCount}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  Total
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-2 text-center">
                <div className="text-lg font-black text-orange-600">
                  {p.pendingCount}
                </div>
                <div className="text-[10px] uppercase font-bold text-orange-400">
                  Pending
                </div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-2 text-center">
                <div className="text-lg font-black text-emerald-600">
                  {p.completedCount}
                </div>
                <div className="text-[10px] uppercase font-bold text-emerald-400">
                  Done
                </div>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${p.progress}%` }}
              />
            </div>
          </div>
        ))}
        {filteredProjects.length === 0 && (
  <div className="py-20 text-center">
    <Folder className="mx-auto w-10 h-10 text-slate-300 mb-3" />
    <h3 className="text-lg font-semibold text-slate-700">
      No projects found
    </h3>
    <p className="text-slate-500">
      Try another search keyword.
    </p>
  </div>
)}
      </div>
    </div>
  );

  const renderTaskList = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedProject(null)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              {selectedProject.name} <span className="text-slate-300">/</span>{" "}
              Tasks
            </h1>
            <p className="text-sm text-slate-500">{selectedProject.location}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isManager && user.role !== "VIEW_ONLY_ADMIN" && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 text-white px-5 py-2.5 text-sm font-bold hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all active:scale-95"
            >
              <Plus size={18} />
              New Project Task
            </button>
          )}
          <RefreshButton
            onRefresh={refreshData}
            isLoading={loading}
            className="border-slate-200 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-sm focus:border-indigo-500 outline-none transition-all"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-800">
              {filteredTasks.length}
            </span>{" "}
            tasks
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[80px_2fr_1.5fr_1.5fr_1.5fr_1fr_1fr_1fr_120px] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b px-4 py-3 bg-slate-50/50">
              <div>ID</div>
              <div>Task Details</div>
              <div>Assigned To</div>
              <div>Timeline</div>
              <div>Project Stage</div>
              <div>Priority</div>
              <div>Status</div>
              <div>Last Update</div>
              <div className="text-right">Actions</div>
            </div>

            {filteredTasks.map((t) => {
              const emp = employees.find((e) => e.id === t.employeeId);
              const status = getStatus(t);

              return (
                <div
                  key={t.id}
                  className="grid grid-cols-[80px_2fr_1.5fr_1.5fr_1.5fr_1fr_1fr_1fr_120px] items-center border-b last:border-0 px-4 py-4 text-xs hover:bg-slate-50/80 transition-colors"
                >
                  <div className="font-mono text-[14px] text-slate-600 font-medium">
                    #{t.id.slice(0, 6)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 text-sm mb-0.5">
                      {t.title}
                    </p>
                    {t.type === "ISSUE" && (
                      <span className="bg-rose-100 text-rose-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        ISSUE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold border border-indigo-100">
                      {emp?.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">
                        {emp?.name || "Unassigned"}
                      </p>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {emp?.role}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                      <span className="text-slate-500 font-medium">
                        {t.startDate ? formatDate(t.startDate) : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                      <span className="text-slate-500 font-medium font-bold">
                        {t.dueDate ? formatDate(t.dueDate) : "—"}
                      </span>
                    </div>
                  </div>

                  <div>
                    {t.stage ? (
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-tight">
                        {t.stage}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </div>

                  <div>
                    <StatusBadge status={t.priority} />
                  </div>
                  <div>
                    <StatusBadge status={status} />
                  </div>

                  <div className="text-slate-400 font-medium italic">
                    {formatDate(t.updatedAt)}
                  </div>

                  <div className="text-right flex justify-end gap-1.5">
                    {((t.evidence && t.evidence.length > 0) ||
                      t.completionFileUrl) && (
                      <button
                        onClick={() => openEvidence(t)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="View Proof"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    {user.role === "SUPER_ADMIN" &&
                      user.role !== "VIEW_ONLY_ADMIN" && (
                        <button
                          onClick={() => openEdit(t)}
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                    <button
                      onClick={() => {
                        if (!emp) return alert("No employee assigned.");
                        alert(`Notification would be sent to ${emp.email}`);
                      }}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Send Mail"
                    >
                      <Mail size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {filteredTasks.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Folder className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-slate-800 font-bold">No tasks found</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">
              We couldn't find any tasks matching your current filters or in
              this project.
            </p>
            <button
              onClick={openCreate}
              className="mt-6 text-indigo-600 text-sm font-bold hover:text-indigo-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={16} /> Create New Task
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-full pb-10">
      {/* Dynamic Content */}
      {selectedProject ? renderTaskList() : renderProjectGrid()}

      {/* SHARED CREATE/EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setModalOpen(false)}
          />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-zoom-in relative z-10 flex flex-col border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "Edit Task" : "Create New Task"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              <form
                id="task-form"
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Project*
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      value={form.projectId}
                      onChange={(e) =>
                        setForm({ ...form, projectId: e.target.value })
                      }
                      disabled={!!selectedProject}
                    >
                      <option value="">-- Select Project --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Assign To*
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                      value={form.employeeId}
                      onChange={(e) =>
                        setForm({ ...form, employeeId: e.target.value })
                      }
                    >
                      <option value="">-- Select Employee --</option>
                      {assignableEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Entry Type
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value })
                      }
                    >
                      <option value="TASK">Standard Task</option>
                      <option value="ISSUE">Internal Issue</option>
                    </select>
                  </div>
                  {form.type === "TASK" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Project Stage
                      </label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                        value={form.stage || ""}
                        onChange={(e) =>
                          setForm({ ...form, stage: e.target.value, title: "" })
                        }
                      >
                        <option value="">-- Select Stage --</option>
                        {Object.keys(STAGES).map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Task Title*
                    </label>
                    {form.type === "TASK" &&
                    form.stage &&
                    STAGES[form.stage] ? (
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-slate-700"
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                      >
                        <option value="">-- Select Predefined Title --</option>
                        {STAGES[form.stage].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                        placeholder={
                          form.type === "TASK"
                            ? "Enter title or select stage..."
                            : "e.g. Special Fix Required"
                        }
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 transition-all outline-none"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm({ ...form, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Due Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 transition-all outline-none font-bold text-rose-600"
                      value={form.dueDate}
                      onChange={(e) =>
                        setForm({ ...form, dueDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Priority
                    </label>
                    <div className="flex gap-2">
                      {["Low", "Medium", "High"].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setForm({ ...form, priority: p })}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${form.priority === p ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-500 hover:border-indigo-200"}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 transition-all outline-none h-24 resize-none"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Describe the task details..."
                  />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                form="task-form"
                type="submit"
                className="px-8 py-2.5 text-sm font-bold rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-95 transition-all flex items-center gap-2"
              >
                <Mail size={16} />
                {editingId ? "Update & Notify" : "Create & Notify"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVIDENCE VERIFICATION MODAL */}
      {evidenceModalOpen && viewingTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-zoom-in relative">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {viewingTask.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {viewingTask.project?.name} • COMPLETED PROOF
                </p>
              </div>
              <button
                onClick={() => setEvidenceModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-0 bg-slate-900 flex items-center justify-center relative">
              {(() => {
                const hasEvidence =
                  viewingTask.evidence && viewingTask.evidence.length > 0;
                const currentEvidence = hasEvidence
                  ? viewingTask.evidence[evidenceIndex]
                  : null;
                const imageUrl = currentEvidence
                  ? currentEvidence.url
                  : viewingTask.completionFileUrl;

                // Helper to get full URL
                const getFullUrl = (path) =>
                  `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "")}${path}`;
                const fullUrl = getFullUrl(imageUrl);
                const isImage = imageUrl?.match(/\.(jpeg|jpg|png|gif|webp)$/i);

                return (
                  <>
                    {!isImage ? (
                      <div className="text-white text-center p-6">
                        <Folder
                          size={48}
                          className="mx-auto mb-4 text-slate-400"
                        />
                        <p className="text-lg font-bold mb-2">
                          File Attachment
                        </p>
                        <p className="text-sm text-slate-400 mb-6 break-all">
                          {imageUrl}
                        </p>
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-6 py-3 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-500 transition-all flex items-center gap-2 mx-auto w-fit"
                        >
                          <Download size={18} /> Download / View File
                        </a>
                      </div>
                    ) : (
                      <img
                        src={fullUrl}
                        alt="Evidence"
                        className="max-w-full max-h-full object-contain"
                      />
                    )}

                    {/* Navigation Buttons (Only if multiple items) */}
                    {hasEvidence && viewingTask.evidence.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEvidenceIndex((prev) => Math.max(0, prev - 1));
                          }}
                          disabled={evidenceIndex === 0}
                          className="pointer-events-auto bg-black/50 text-white p-3 rounded-full hover:bg-black/80 disabled:opacity-30 transition-all"
                        >
                          <ChevronLeft size={24} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEvidenceIndex((prev) =>
                              Math.min(
                                viewingTask.evidence.length - 1,
                                prev + 1,
                              ),
                            );
                          }}
                          disabled={
                            evidenceIndex === viewingTask.evidence.length - 1
                          }
                          className="pointer-events-auto bg-black/50 text-white p-3 rounded-full hover:bg-black/80 disabled:opacity-30 transition-all"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </div>
                    )}

                    {/* Counter Badge */}
                    {hasEvidence && viewingTask.evidence.length > 1 && (
                      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold border border-white/20">
                        {evidenceIndex + 1} / {viewingTask.evidence.length}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Modal Footer (Map/Details) */}
            <div className="p-6 bg-white border-t flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Task Details
                  </h3>
                  <p className="font-bold text-slate-800 text-lg">
                    {viewingTask.title}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <Folder size={14} />{" "}
                    {viewingTask.project?.name || "Global Task"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 rounded-xl">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Status
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        Completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 rounded-xl">
                      <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Time
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        {formatDate(viewingTask.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Map */}
              <div className="flex-1">
                {viewingTask.evidence &&
                viewingTask.evidence.length > 0 &&
                viewingTask.evidence[evidenceIndex]?.latitude != null ? (
                  <div className="h-40 rounded-2xl overflow-hidden border border-slate-200 relative">
                    <MapContainer
                      key={evidenceIndex}
                      center={[
                        viewingTask.evidence[evidenceIndex].latitude,
                        viewingTask.evidence[evidenceIndex].longitude,
                      ]}
                      zoom={15}
                      style={{ height: "100%", width: "100%" }}
                      dragging={false}
                      zoomControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker
                        position={[
                          viewingTask.evidence[evidenceIndex].latitude,
                          viewingTask.evidence[evidenceIndex].longitude,
                        ]}
                      />
                    </MapContainer>
                  </div>
                ) : (
                  <div className="h-40 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center p-4">
                    <MapPin className="w-8 h-8 text-slate-200 mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      No GPS Data
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-center">
              <button
                onClick={() => setEvidenceModalOpen(false)}
                className="px-10 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
