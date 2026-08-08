import React, { createContext, useState, useEffect } from "react";
import axios from "../../../shared/utils/axios";

// ✅ ONLY NAMED EXPORTS
export const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      // If no user logic found, we might want to return or fetch nothing.
      // But assuming protected route, user should exist.
      const params = {};
      if (user?.id) {
        params.employeeId = user.id;
      }

      const [taskRes, projRes, empRes] = await Promise.all([
        axios.get("/tasks", { params }),
        axios.get("/projects", { params }), // Project controller now supports this
        axios.get("/employees") // We probably still want all employees for dropdowns etc.
      ]);

      const allTasks = taskRes.data;
      setTasks(allTasks.filter(t => t.type?.toUpperCase() === "TASK"));
      setIssues(allTasks.filter(t => t.type?.toUpperCase() === "ISSUE"));
      setProjects(projRes.data);
      setUsers(empRes.data);
    } catch (err) {
      console.error("Error fetching employee context data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateTaskStatus = async (taskId, newStatus, fileData = null) => {
    try {
      const payload = { status: newStatus };
      if (fileData) {
        payload.completionFileUrl = fileData.url;
        payload.completionFileName = fileData.name;
      }
      await axios.put(`/tasks/${taskId}`, payload);
      const upperStatus = newStatus.toUpperCase();
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...payload, status: upperStatus } : t));
    } catch (err) {
      console.error("Error updating task status:", err);
    }
  };

  const updateIssueStatus = async (issueId, newStatus, metadata = {}) => {
    try {
      const updates = {
        status: newStatus
      };

      if (newStatus === "Completed") {
        // Append resolution details to description as the schema doesn't support a separate field
        const resolutionText = `\n\n[RESOLVED]\nBy: ${metadata.resolverName}\nAt: ${metadata.resolutionTime}\nContext: ${metadata.issueContext}`;

        // We can't easily append without reading first, but since we have 'issues' state, we can find the issue
        const issue = issues.find(i => i.id === issueId);
        if (issue) {
          updates.description = (issue.description || "") + resolutionText;
        }
      }

      await axios.put(`/tasks/${issueId}`, updates);
      const upperStatus = newStatus.toUpperCase();
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, ...updates, status: upperStatus } : i));
    } catch (err) {
      console.error("Error updating issue status:", err);
      alert(err.response?.data?.error || "Failed to update issue status. Please try again.");
    }
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      projects,
      users,
      issues,
      loading,
      updateTaskStatus,
      updateIssueStatus,
      refreshData: fetchData
    }}>
      {children}
    </TaskContext.Provider>
  );
};
