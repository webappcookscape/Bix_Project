import React, { useState, useEffect, useRef } from "react";
import { Menu, Bell, UserCircle2, LogOut, Search, X, FileText, Download, ChevronDown, ExternalLink } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import { downloadCsv } from "../../utils/exportToCsv";
import logo from "../../assets/logo.png";
import { clearInternalAuth } from "../../../../shared/utils/auth";

const Topbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { projects, employees, tasks } = useApp();
  const user = JSON.parse(localStorage.getItem("user"));

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const searchRef = useRef(null);
  const exportRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setShowExport(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter Logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQ = query.toLowerCase();

    // Limit results to 3 per category to avoid clutter
    const matchedProjects = projects
      .filter(p => (p.name || "").toLowerCase().includes(lowerQ) || (p.projectCode || "").toLowerCase().includes(lowerQ)) // Updated to projectCode
      .slice(0, 3)
      .map(p => ({ type: "Project", label: p.name, sub: p.projectCode, id: p.id, path: "/admin/projects" }));

    const matchedEmployees = employees
      .filter(e => (e.name || "").toLowerCase().includes(lowerQ))
      .slice(0, 3)
      .map(e => ({ type: "Employee", label: e.name, sub: e.role, id: e.id, path: "/admin/employees" }));

    const matchedTasks = tasks
      .filter(t => (t.title || "").toLowerCase().includes(lowerQ))
      .slice(0, 3)
      .map(t => ({ type: "Task", label: t.title, sub: t.status, id: t.id, path: "/admin/tasks" }));

    setResults([...matchedProjects, ...matchedEmployees, ...matchedTasks]);
  }, [query, projects, employees, tasks]);

  const handleLogout = () => {
    clearInternalAuth();
    navigate("/login", { replace: true });
  };

  const handleSelect = (item) => {
    // Navigate to page with search query to pre-filter
    navigate(`${item.path}?q=${encodeURIComponent(item.label)}`);
    setQuery("");
    setShowResults(false);
  };

  const clearSearch = () => {
    setQuery("");
    setShowResults(false);
  };

  // --- Export Logic ---
  const handleQuickExport = (type) => {
    const timestamp = new Date().toISOString().split('T')[0];

    if (type === 'projects') {
      // Full Project Details
      const map = {
        projectCode: "Project ID",
        name: "Project Name",
        clientFirstName: "Client First Name",
        clientLastName: "Client Last Name",
        clientEmail: "Client Email",
        clientPhone: "Client Phone",
        spouseName: "Spouse Name",
        spousePhone: "Spouse Phone",
        location: "Location",
        budget: "Budget",
        status: "Status",
        paymentPercentage: "Completion (%)",
        timelineDuration: "Timeline (Days)",
        startDate: "Start Date",
        deadline: "Deadline",
        handingOverMonth: "Handover Month",
        handingOverYear: "Handover Year",
        billingName: "Billing Name",
        billingAddress: "Billing Address",
        billingPhone: "Billing Phone",
        gstin: "GSTIN",
        cpNumber: "CP Number"
      };
      downloadCsv(`Projects_Export_${timestamp}.csv`, projects, map);
    } else if (type === 'tasks') {
      const map = {
        id: "Task ID",
        title: "Task Title",
        description: "Description",
        status: "Status",
        priority: "Priority",
        stage: "Stage",
        type: "Type",
        startDate: "Start Date",
        dueDate: "Due Date",
        completedAt: "Completed Date",
        projectId: "Project ID",
        employeeId: "Assigned To (ID)"
      };
      downloadCsv(`Tasks_Export_${timestamp}.csv`, tasks, map);
    } else if (type === 'employees') {
      const map = {
        id: "Employee ID",
        name: "Name",
        email: "Email",
        phone: "Phone",
        role: "Role",
        department: "Department",
        status: "Status",
        joinedAt: "Joined Date"
      };
      downloadCsv(`Employees_Export_${timestamp}.csv`, employees, map);
    }
    setShowExport(false);
  };

  return (
    <header className="h-16 flex items-center justify-between px-6
      border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">

      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-1 rounded-lg border border-slate-200"
          onClick={onToggleSidebar}
        >
          <Menu size={20} />
        </button>

        <img
          src={logo}
          alt="Orbix Projects Logo"
          className="h-12 w-auto object-contain hidden md:block" // Hide text logo on small screens if needed
        />
      </div>

      {/* CENTER - GLOBAL SEARCH */}
      <div className="hidden md:block flex-1 max-w-lg mx-6 relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search projects, tasks, employees..."
            className="w-full pl-10 pr-10 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 rounded-xl transition text-sm outline-none"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Typeahead Results */}
        {showResults && query && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-2">
            <p className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-50 uppercase tracking-wider">
              Best Matches
            </p>
            {results.map((item, i) => (
              <div
                key={i}
                onClick={() => handleSelect(item)}
                className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.type} • {item.sub}</p>
                </div>
                <span className="text-xs text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  Go to {item.type} →
                </span>
              </div>
            ))}
          </div>
        )}

        {/* No Results State */}
        {showResults && query && results.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-4 text-center">
            <p className="text-sm text-slate-500">No results found for "{query}"</p>
          </div>
        )}
      </div>

      {/* Right Side Buttons */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Switch to CRM Button */}
        <a
          href="https://crm.orbixdesigns.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
        >
          <span className="hidden sm:inline">Switch to CRM</span>
          <span className="sm:hidden">CRM</span>
          <ExternalLink size={14} />
        </a>

        {/* GLOBAL REPORTS/EXPORT DROPDOWN */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setShowExport(!showExport)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all
                    ${showExport ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <FileText size={18} />
            <span className="text-sm font-medium hidden sm:inline">Reports</span>
            <ChevronDown size={14} className={`transition-transform ${showExport ? 'rotate-180' : ''}`} />
          </button>

          {showExport && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Export (CSV)</p>
              </div>
              <button onClick={() => handleQuickExport('projects')} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2">
                <Download size={14} /> All Projects
              </button>
              <button onClick={() => handleQuickExport('tasks')} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2">
                <Download size={14} /> All Tasks
              </button>
              <button onClick={() => handleQuickExport('employees')} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2">
                <Download size={14} /> All Employees
              </button>
              <div className="border-t border-slate-100 my-1"></div>
              <Link
                to="/admin/reports"
                onClick={() => setShowExport(false)}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-brand-600 hover:bg-brand-50 flex items-center justify-between"
              >
                Advanced Reports <span>→</span>
              </Link>
            </div>
          )}
        </div>

        <button className="relative p-2 rounded-full hover:bg-slate-100 transition hidden sm:block">
          <Bell size={20} className="text-slate-600" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-brand-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <UserCircle2 size={28} className="text-slate-700" />
          <span className="text-sm font-medium hidden lg:block">{user?.name || "Super Admin"}</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm px-3 py-2 border border-slate-200 rounded-lg text-slate-500
           hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
