import React, { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { downloadCsv } from "../utils/exportToCsv.js";

const Reports = () => {
  const { projects, tasks, employees } = useApp();
  const [type, setType] = useState("tasks");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const buildRange = () => {
    if (!startDate || !endDate) return { from: null, to: null };
    return { from: new Date(startDate), to: new Date(endDate) };
  };

  const exportData = () => {
    const { from, to } = buildRange();

    const taskMap = {
      id: "Task ID",
      title: "Title",
      projectId: "Project ID",
      employeeId: "Employee ID",
      status: "Status",
      priority: "Priority",
      type: "Type",
      startDate: "Start Date",
      dueDate: "Due Date",
      description: "Description"
    };

    const projectMap = {
      projectId: "Project ID",
      name: "Project Name",
      clientName: "Client Name",
      clientEmail: "Client Email",
      clientPhone: "Client Phone",
      startDate: "Start Date",
      deadline: "Deadline",
      cpNumber: "CP Number",
      location: "Location",
      status: "Status"
    };

    const employeeMap = {
      id: "Employee ID",
      name: "Name",
      email: "Email",
      phone: "Phone",
      department: "Department",
      role: "Role",
      status: "Status",
      joinedAt: "Joined Date"
    };

    if (type === "projects") {
      let rows = projects;
      if (from && to) {
        rows = rows.filter((p) => {
          const d = new Date(p.startDate);
          return d >= from && d <= to;
        });
      }
      downloadCsv("projects_report.csv", rows, projectMap);
    } else if (type === "tasks") {
      let rows = tasks;
      if (from && to) {
        rows = rows.filter((t) => {
          const d = new Date(t.startDate || t.dueDate);
          return d >= from && d <= to;
        });
      }
      downloadCsv("tasks_report.csv", rows, taskMap);
    } else if (type === "employees") {
      downloadCsv("employees_report.csv", employees, employeeMap);
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold">Reports & Export</h1>
        <p className="text-sm text-slate-500">
          Download reports in spreadsheet format for analytics.
        </p>
      </div>

      {/* CARD BOX */}
      <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-5">

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">

          {/* Data Type */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Data Type</p>
            <select
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 focus:border-orange-500 focus:ring-orange-500"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="projects">Projects</option>
              <option value="tasks">Tasks</option>
              <option value="employees">Employees (ignores period)</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Start Date</p>
            <input
              type="date"
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 focus:border-orange-500 focus:ring-orange-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div>
            <p className="text-xs text-slate-500 mb-1">End Date</p>
            <input
              type="date"
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 focus:border-orange-500 focus:ring-orange-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Employees export ignores date range.
            </p>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={exportData}
          className="inline-flex items-center justify-center w-full sm:w-auto gap-2 rounded-xl bg-orange-600 text-white px-5 py-2 text-sm shadow hover:bg-orange-500 transition"
        >
          Export CSV File 📥
        </button>
      </div>
    </div>
  );
};

export default Reports;
