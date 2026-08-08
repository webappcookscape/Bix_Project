import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import { Plus, Pencil, LayoutGrid, List, Search as SearchIcon, Filter } from "lucide-react";
import RefreshButton from "../../../shared/components/RefreshButton.jsx";
import { formatDate } from "../../../shared/utils/dateFormatter";
import { isProjectOverdue } from "../utils/dateUtils.js";

import ProjectStats from "../components/ProjectStats.jsx";
import ProjectGrid from "../components/ProjectGrid.jsx";
import ProjectDrawer from "../components/ProjectDrawer.jsx";
import BulkProjectImport from "../components/BulkProjectImport.jsx";

const emptyProject = {
  name: "",
  projectCode: "",
  clientFirstName: "",
  clientLastName: "",
  clientEmail: "",
  clientPhone: "",
  spouseName: "",
  spousePhone: "",
  location: "",
  handingOverMonth: "",
  handingOverYear: "",
  budget: "",
  billingName: "",
  billingAddress: "",
  billingPhone: "",
  gstin: "",
  googleMapsLink: "",
  startDate: "",
  deadline: "",
  cpNumber: "",
  clientPassword: "",
  timelineDuration: 45,
  businessHeadId: "",
  propertyType: "",
  scopeOfWork: "",
  leadSource: "",
  salesRep: "",
  faId: "",
  laId: "",
  createdBy: "",
  // Freezing Mail Fields
  freezingAmount: "",
  variant: "",
  woodworkAmount: "",
  addOnsAmount: "",
  quoteLink: "",
  freezingMailNote: "",
  whatsappMessage: "",
  recipients: [],
  attachments: [],
  // Notification Toggles
  sendEmail: true,
  sendWhatsApp: true
};

const buildProjectFormData = (project) => {
  const formData = new FormData();

  Object.keys(project).forEach((key) => {
    if (key === "attachments") {
      (project.attachments || []).forEach((file) => {
        formData.append("attachments", file);
      });
      return;
    }

    if (key === "recipients") {
      formData.append("recipients", JSON.stringify(project.recipients || []));
      return;
    }

    if (project[key] !== undefined && project[key] !== null) {
      formData.append(key, project[key]);
    }
  });

  return formData;
};

const Projects = () => {
  const { projects, addProject, updateProject, refreshData, loading } = useApp();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyProject);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
const [refreshKey, setRefreshKey] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isManager = (user.role || "").toUpperCase() === "MANAGER";

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.clientFirstName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.clientLastName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.projectCode?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.clientPhone || "").includes(search) || // Phone usually exact or partial number match
      (p.clientEmail?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.location?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm(emptyProject);
    setEditingId(null);
    setDrawerOpen(true);
  };

  const openEdit = (p) => {
    // Sanitize and map for form
    const editForm = {
      ...emptyProject,
      ...p,
      startDate: p.startDate ? p.startDate.split('T')[0] : "",
      deadline: p.deadline ? p.deadline.split('T')[0] : "",
      budget: p.budget ? p.budget.toString() : "",
      clientPassword: "", // Reset password field
    };
    setForm(editForm);
    setEditingId(p.id);
    setDrawerOpen(true);
  };

const handleSubmit = async (formData) => {
    // Basic validation
    if (!formData.name || !formData.clientFirstName || !formData.clientLastName || !formData.startDate || !formData.clientPhone || !formData.clientEmail) {
      alert("Please fill in all required fields marked with *");
      return;
    }

    const secureForm = { ...formData };

    // Type conversions and cleanup for Prisma types (Float/Date cannot be "")
    if (secureForm.budget) {
      secureForm.budget = parseFloat(secureForm.budget);
    } else {
      delete secureForm.budget;
    }

    if (secureForm.timelineDuration) {
      secureForm.timelineDuration = parseInt(secureForm.timelineDuration, 10);
    } else {
      delete secureForm.timelineDuration;
    }

    // Dates - specific cleanup for empty strings
    if (secureForm.startDate) {
      secureForm.startDate = new Date(secureForm.startDate).toISOString();
    } else {
      delete secureForm.startDate;
    }

    if (secureForm.deadline) {
      secureForm.deadline = new Date(secureForm.deadline).toISOString();
    } else {
      delete secureForm.deadline;
    }

    // Handle optional unique fields
    if (!secureForm.cpNumber) delete secureForm.cpNumber;
    if (!secureForm.gstin) delete secureForm.gstin;
    if (!secureForm.spouseName) delete secureForm.spouseName;
    if (!secureForm.spousePhone) delete secureForm.spousePhone;
    if (!secureForm.businessHeadId) delete secureForm.businessHeadId;
    if (!secureForm.faId) delete secureForm.faId;
    if (!secureForm.laId) delete secureForm.laId;

    // Cleanup other optional strings to be safe
    if (!secureForm.billingName) delete secureForm.billingName;
    if (!secureForm.billingAddress) delete secureForm.billingAddress;
    if (!secureForm.billingPhone) delete secureForm.billingPhone;
    if (!secureForm.location) delete secureForm.location; // Though strictly required in validation
    if (!secureForm.projectCode) delete secureForm.projectCode; // Backend generates it
    if (!secureForm.propertyType) delete secureForm.propertyType;
    if (!secureForm.scopeOfWork) delete secureForm.scopeOfWork;
    if (!secureForm.leadSource) delete secureForm.leadSource;
    if (!secureForm.salesRep) delete secureForm.salesRep;
    if (!secureForm.whatsappMessage) delete secureForm.whatsappMessage;

    // Remove empty password on update
    if (editingId && !secureForm.clientPassword) {
      delete secureForm.clientPassword;
    }

    // Creating vs Updating
    if (editingId) {
      const hasAttachments = secureForm.attachments?.length > 0;
      const hasRecipients = secureForm.recipients?.length > 0;

      if (hasAttachments || hasRecipients) {
        updateProject(editingId, buildProjectFormData(secureForm));
      } else {
        updateProject(editingId, secureForm);
      }
    } else {
      if (!secureForm.clientPassword) {
        alert("Client Password is required for new projects.");
        return;
      }

      // Check if it's a "Freezing Mail" creation (has attachments or recipients)
      const hasAttachments = secureForm.attachments?.length > 0;
      const hasRecipients = secureForm.recipients?.length > 0;

      if (hasAttachments || hasRecipients) {
        // Use FormData for file support
        addProject(buildProjectFormData(secureForm));
      } else {
        addProject(secureForm);
      }
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Projects</h1>
          <p className="text-slate-500 font-medium">Manage all your active sites and pipelines</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggles */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {user.role !== 'VIEW_ONLY_ADMIN' && (
              <button
                onClick={() => setBulkImportOpen(true)}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <Plus size={18} />
                Bulk Import
              </button>
            )}
            
            {/* Show New Project button for Super Admin, Manager, and now View Only Admin */}
            {(user.role === 'SUPER_ADMIN' || user.role === 'MANAGER' || user.role === 'VIEW_ONLY_ADMIN') && (
              <button
                onClick={openCreate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus size={18} />
                New Project
              </button>
            )}
          </div>

          <RefreshButton
            onRefresh={refreshData}
            isLoading={loading}
            className="border-slate-200 shadow-sm"
          />
        </div>
      </div>

      {/* Stats Section */}
      <ProjectStats projects={projects} />

      {/* Controls / Search */}
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, code, client phone, email, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium"
          />
        </div>
        {/* Future Filter Buttons can go here */}
        <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 flex items-center gap-2">
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* Content Area */}
      {viewMode === "grid" ? (
        <ProjectGrid projects={filtered} onEdit={openEdit} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-4 px-6 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Project</th>
                <th className="py-4 px-6 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Client</th>
                <th className="py-4 px-6 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Timeline</th>
                <th className="py-4 px-6 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Location & Budget</th>
                <th className="py-4 px-6 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Status</th>
                <th className="py-4 px-6 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <p className="text-xs font-mono text-indigo-500">{p.projectCode}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                        {p.clientFirstName?.[0]}{p.clientLastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{p.clientFirstName} {p.clientLastName}</p>
                        <p className="text-xs text-slate-400">{p.clientPhone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    <div className="flex flex-col text-xs">
                      <span>Start: {p.startDate ? formatDate(p.startDate) : '-'}</span>
                      <span>End: {p.deadline ? formatDate(p.deadline) : '-'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-medium text-slate-700">{p.location}</p>
                    <p className="text-xs text-emerald-600 font-bold">₹{(parseFloat(p.budget) || 0).toLocaleString()}</p>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={isProjectOverdue(p) ? "Overdue" : "Active"} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        to={`/admin/projects/${p.id}/manage`}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100"
                      >
                        View
                      </Link>
                      {user.role === 'SUPER_ADMIN' && user.role !== 'VIEW_ONLY_ADMIN' && (
                        <button
                          onClick={() => openEdit(p)}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer Form */}
      <ProjectDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialData={form}
        isEditing={!!editingId}
        onSubmit={handleSubmit}
      />

      {bulkImportOpen && (
        <BulkProjectImport
          onClose={() => setBulkImportOpen(false)}
          onSuccess={() => {
            refreshData();
            setBulkImportOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Projects;
