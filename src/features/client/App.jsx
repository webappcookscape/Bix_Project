import React, { useState, useEffect } from "react";
import axios from "../../shared/utils/axios";
import { useNavigate } from "react-router-dom";
import useHaptics from "../../shared/hooks/useHaptics";
import TopNavbar from "./components/TopNavbar";
import Sidebar from "./components/Sidebar";

// Content Components
import ProjectProgress from "./components/ProjectProgress";
import TaskList from "./components/TaskList";
import ActivityFeed from "./components/ActivityFeed";
import Gallery from "./components/Gallery";
import Documents from "./components/Documents";
import Timeline from "./components/Timeline";
import RaiseTicket from "./components/RaiseTicket";
import Profile from "./components/Profile";
import RefreshButton from "../../shared/components/RefreshButton";

const App = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [selected, setSelected] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { trigger } = useHaptics();

  const clientToken = localStorage.getItem("clientToken");
  const project = JSON.parse(localStorage.getItem("clientProject") || "{}");

  useEffect(() => {
    if (!clientToken) {
      navigate("/client/login", { replace: true });
    }
  }, [clientToken, navigate]);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        const [taskRes, activityRes, projectRes] = await Promise.all([
          axios.get("/tasks", { params: { projectId: project.id } }),
          axios.get(`/activities/${project.id}`),
          axios.get(`/projects/${project.id}`)
        ]);

        setTasks(taskRes.data);
        if (projectRes.data) {
          localStorage.setItem("clientProject", JSON.stringify(projectRes.data));
        }

        const formattedActivity = activityRes.data.map(log => ({
          id: log.id,
          message: log.message,
          time: log.createdAt,
          category: log.category
        }));
        setActivity(formattedActivity);
      } catch (err) {
        console.error("Error fetching client data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (project.id && clientToken) {
      fetchProjectData();
    }
  }, [project.id, clientToken]);

  const toggleStatus = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    trigger('medium');
    const isCompleted = task.status && task.status.toUpperCase() === "COMPLETED";
    const newStatus = isCompleted ? "PENDING" : "COMPLETED";
    try {
      await axios.put(`/tasks/${id}`, { status: newStatus });
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const handleLogout = () => {
    trigger('heavy');
    localStorage.removeItem("clientToken");
    localStorage.removeItem("clientProject");
    localStorage.removeItem("welcomeShown");
    navigate("/client/login");
  };

  if (!clientToken) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F9] font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <TopNavbar
        setSelected={setSelected}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        handleLogout={handleLogout}
      />
      
      <div className="bg-white/40 backdrop-blur-md px-4 py-2 border-b border-white/20 flex items-center justify-between md:hidden">
        <RefreshButton
          onRefresh={() => window.location.reload()}
          isLoading={loading}
          label="Sync"
          className="border-none bg-transparent shadow-none p-0 h-auto text-indigo-600"
        />
        <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase">
          Portal Status: Online
        </span>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        <div className="hidden md:block w-72 border-r border-slate-200 bg-white/50 backdrop-blur-xl h-[calc(100vh-5rem)] sticky top-20 z-20">
          <Sidebar selected={selected} setSelected={setSelected} onLogout={handleLogout} />
        </div>

        <div className="flex-1 bg-slate-50/30 min-w-0 pointer-events-auto overflow-y-auto custom-scrollbar">
          <div className="p-3 md:p-6 lg:p-8 pb-32 md:pb-12">
            {selected === "overview" && <ProjectProgress tasks={tasks} />}
            {selected === "profile" && <Profile />}
            {selected === "tasks" && <TaskList tasks={tasks} toggleStatus={toggleStatus} />}
            {selected === "activity" && <ActivityFeed activity={activity} dummyActivity={[]} />}
            {selected === "gallery" && <Gallery />}
            {selected === "documents" && <Documents />}
            {selected === "timeline" && <Timeline tasks={tasks} />}
            {selected === "feedback" && <RaiseTicket />}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[2000] md:hidden cursor-pointer" />
      )}

      {menuOpen && (
        <div className="fixed inset-y-0 left-0 w-72 bg-white z-[2001] md:hidden shadow-2xl rounded-r-3xl overflow-hidden border-r border-white/50">
          <Sidebar
            selected={selected}
            setSelected={(val) => {
              setSelected(val);
              setMenuOpen(false);
            }}
            onLogout={handleLogout}
          />
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
};

export default App;
