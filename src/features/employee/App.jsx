import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import AllTasks from "./pages/AllTasks";
import ProjectTasks from "./pages/ProjectTasks";
import Projects from "./pages/Projects";
import Chat from "./pages/Chat";

// Notifications removed
import Email from "./pages/Email";
import Issues from "./pages/Issues";
import Profile from "./pages/Profile";

import { TaskProvider } from "./context/TaskContext";
import { CREProvider } from "../cre/context/CREContext";
import WalkinHub from "../cre/pages/WalkinHub";


// ToastProvider removed

function App() {
  return (
    <TaskProvider>
      <Routes>
        {/* Public */}
        <Route path="login" element={<Navigate to="/login" replace />} />

        {/* Protected Layout */}
        <Route path="" element={<Layout />}>
          <Route index element={<Dashboard />} />

          {/* All Tasks */}
          <Route path="tasks" element={<AllTasks />} />

          {/* Specific Project Tasks */}
          <Route path="projects" element={<Projects />} />
          <Route path="project/:projectId" element={<ProjectTasks />} />

          <Route path="chat" element={<Chat />} />
          {/* Notifications Removed */}
          <Route path="email" element={<Email />} />
          <Route path="issues" element={<Issues />} />
          <Route path="walkin-hub" element={<CREProvider><WalkinHub /></CREProvider>} />
          <Route path="profile" element={<Profile />} />

        </Route>
      </Routes>
    </TaskProvider>
  );
}

export default App;
