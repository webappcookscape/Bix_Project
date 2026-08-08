import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Layout from "./components/layout/Layout.jsx";


import Dashboard from "./pages/Dashboard.jsx";
import Employees from "./pages/Employees.jsx";
import Projects from "./pages/Projects.jsx";
import Tasks from "./pages/Tasks.jsx";
import Issues from "./pages/Issues.jsx";
import Reports from "./pages/Reports.jsx";
import ClientAccess from "./pages/ClientAccess.jsx";

import ClientDashboard from "./pages/ClientDashboard.jsx";
import ProjectManager from "./pages/ProjectManager.jsx";
import Chat from "./pages/Chat.jsx";
import Email from "./pages/Email.jsx"; // New Email Import
import Helpdesk from "./pages/Helpdesk.jsx";
import DevPanel from "./pages/DevPanel.jsx";
import Settings from "./pages/Settings.jsx";
import { AppProvider } from "./context/AppContext.jsx";
import CREReportsAdmin from "./pages/CREReportsAdmin";

// 🔐 Protected Layout Component (Keeps Layout mounted)
const ProtectedLayout = () => {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

// 🛡️ Role Guard Component
const RoleGuard = ({ children, requiredRole }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Allow SUPER_ADMIN and VIEW_ONLY_ADMIN to access everything common
  if (user.role === "SUPER_ADMIN" || user.role === "VIEW_ONLY_ADMIN") {
    return children;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

const App = () => {
  return (
    <AppProvider>
      <Routes>

        {/* Public Routes */}
        <Route path="login" element={<Navigate to="/login" replace />} />

        {/* Home redirect */}
        <Route path="" element={<Navigate to="dashboard" replace />} />

        {/* 🔐 Protected Routes (Wrapped in Persistent Layout) */}
        <Route element={<ProtectedLayout />}>

          <Route path="dashboard" element={<Dashboard />} />

          <Route
            path="employees"
            element={
              <RoleGuard requiredRole="admin">
                <Employees />
              </RoleGuard>
            }
          />

          <Route path="projects/:id/manage" element={<ProjectManager />} />
          <Route path="projects" element={<Projects />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="issues" element={<Issues />} />

          {/* Chat - Note: Layout handles full screen if path starts with /chat */}
          <Route path="chat" element={<Chat />} />
          <Route path="project/:id/chat" element={<Chat />} />

          <Route path="email" element={<Email />} />
          <Route path="helpdesk" element={<Helpdesk />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="client-access" element={<ClientAccess />} />
          <Route path="dev-panel" element={<DevPanel />} />

          {/* 🏢 Walkin & Leads (Consolidated Admin View) */}
          <Route path="cre-reports" element={<CREReportsAdmin />} />
          <Route path="walkin-hub" element={<Navigate to="../cre-reports" replace />} />
          <Route path="work-reports" element={<Navigate to="../cre-reports" replace />} />
          <Route path="monthly-reports" element={<Navigate to="../cre-reports" replace />} />
        </Route>

        {/* Client Facing Routes */}
        <Route path="client/login" element={<Navigate to="/login" replace />} />
        <Route path="client/dashboard" element={<ClientDashboard />} />

      </Routes>
    </AppProvider>
  );
};

export default App;
