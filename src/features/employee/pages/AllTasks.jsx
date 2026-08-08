import React, { useContext, useState, useEffect } from "react";
import toast from 'react-hot-toast';
import axios from "../../../shared/utils/axios";
import { TaskContext } from "../context/TaskContext";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RefreshButton from "../../../shared/components/RefreshButton";
import { formatDate } from "../../../shared/utils/dateFormatter";


const AllTasks = () => {

  const { tasks, projects, users, updateTaskStatus, refreshData, loading } = useContext(TaskContext);

  // useToast hook removed
  const [searchParams] = useSearchParams();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState({});

  const filter = searchParams.get("filter");
  const search = searchParams.get("search")?.toLowerCase() || "";
  const projectIdParam = searchParams.get("projectId");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ✅ Filter tasks: Hide completed tasks older than 10 days
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  let filteredTasks = tasks.filter(t => {
    if ((t.status || "").toUpperCase() === "COMPLETED" && t.updatedAt) {
      return new Date(t.updatedAt) >= tenDaysAgo;
    }
    return true;
  });

  // ✅ Filtering
  if (filter === "COMPLETED") {
    filteredTasks = filteredTasks.filter(t => (t.status || "").toUpperCase() === "COMPLETED");
  } else if (filter === "PENDING") {
    filteredTasks = filteredTasks.filter(t => (t.status || "").toUpperCase() === "PENDING");
  } else if (filter === "overdue") {
    filteredTasks = filteredTasks.filter(t => {
      const due = new Date(t.dueDate);
      due.setHours(0, 0, 0, 0);
      return (t.status || "").toUpperCase() !== "COMPLETED" && due < today;
    });
  }

  // ✅ Search
  if (search) {
    filteredTasks = filteredTasks.filter(task =>
      task.title.toLowerCase().includes(search)
    );
  }

  // ✅ Auto-expand logic
  useEffect(() => {
    // Expand if filter/search is active OR if a specific projectId is requested
    if (filter || search || projectIdParam) {
      const projectsToExpand = new Set();
      if (projectIdParam) {
        projectsToExpand.add(projectIdParam);
      } else {
        filteredTasks.forEach(t => projectsToExpand.add(t.projectId));
      }

      const autoExpand = {};
      projectsToExpand.forEach(id => {
        autoExpand[id] = true;
      });
      setExpandedProjects(prev => ({ ...prev, ...autoExpand }));
    }
  }, [filter, search, projectIdParam, filteredTasks.length]);

  const toggleProject = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // ✅ When employee selects status
  const handleStatusChange = (task, newStatus) => {

    if (newStatus === "COMPLETED" && (task.status || "").toUpperCase() !== "COMPLETED") {
      setSelectedTask(task);
      setShowUploadModal(true);  // open file upload modal
      return;
    }

    updateTaskStatus(task.id, newStatus);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    const allowedExtensions = ["pdf", "jpg", "jpeg", "png", "dwg", "obj", "gltf"];
    const fileExt = file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      toast.error("Invalid file type! Only PDF, JPG, JPEG, PNG, DWG, OBJ, GLTF allowed.");
      return;
    }

    setUploadedFile(file);
  };

  // ✅ After file uploaded
  const handleSubmitFile = async () => {

    if (!uploadedFile) {
      toast.error("Please upload a file before marking task as completed.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("files", uploadedFile);

      // Upload the file first
      const uploadRes = await axios.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const fileData = {
        url: uploadRes.data[0].url,
        name: uploadedFile.name
      };

      // Update status with file data
      await updateTaskStatus(selectedTask.id, "COMPLETED", fileData);
      toast.success("Task completed and proof uploaded!");

    } catch (err) {
      console.error("Upload failed", err);
      toast.error("File upload failed. Please try again.");
      return; // process stops here on fail
    }

    // Reset
    setUploadedFile(null);
    setSelectedTask(null);
    setShowUploadModal(false);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50">


      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
        <div className="flex items-center gap-4">
          <h1 className="text-lg sm:text-xl font-bold">Tasks</h1>
          <RefreshButton onRefresh={refreshData} isLoading={loading} label="Refresh" className="sm:scale-90" />
        </div>
        {filter && (

          <span className="text-xs font-semibold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full uppercase tracking-wider">
            Filter: {filter}
          </span>
        )}
      </div>

      <div className="space-y-6">

        {projects.map((project) => {
          const projectTasks = filteredTasks.filter((t) => t.projectId === project.id);

          // Only hide empty projects if searching/filtering (except for explicit projectId link)
          if (projectTasks.length === 0 && (filter || search) && !projectIdParam) return null;

          const totalTasksCount = tasks.filter((t) => t.projectId === project.id && t.employeeId === user.id).length;
          const completedTasksCount = tasks.filter((t) => t.projectId === project.id && t.employeeId === user.id && (t.status || "").toUpperCase() === "COMPLETED").length;
          const progress = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;
          const isExpanded = expandedProjects[project.id];

          return (
            <div key={project.id} className="space-y-3">
              {/* Project Header UI */}
              <div
                onClick={() => toggleProject(project.id)}
                className={`bg-white p-3 sm:p-4 rounded-xl shadow-sm border transition-all duration-300 grid grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 items-center cursor-pointer group ${isExpanded ? 'border-indigo-600 ring-1 ring-indigo-600/10' : 'border-indigo-100 hover:border-indigo-400'
                  }`}
              >
                {/* 1. Project Info */}
                <div className="col-span-2 md:col-span-4 flex items-center gap-4">
                  <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50'}`}>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                  <div className="overflow-hidden">
                    <h2 className="text-base font-bold text-gray-800 group-hover:text-indigo-600 transition-colors truncate">{project.name}</h2>
                    <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                      <span className="font-semibold">{project.firstName} {project.lastName}</span> • {project.location}
                    </p>
                  </div>
                </div>

                {/* 2. Collaboration Team */}
                <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5 justify-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Team</p>
                  <div className="flex -space-x-2">
                    {project.assignedEmployees?.map((empId) => {
                      const emp = users?.find(u => u.id === empId);
                      if (!emp) return null;
                      return (
                        <div
                          key={empId}
                          title={`${emp.name} (${emp.role})`}
                          className="h-7 w-7 rounded-full ring-2 ring-white bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600 hover:z-10 hover:scale-110 transition-transform shadow-sm"
                        >
                          {emp.name.split(" ").map(w => w[0]).join("")}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Status Counter (Moved up for mobile visual balance or keep order? Let's keep logical order but layout visually) */}
                {/* Actually, let's put Status next to Team on mobile. Logic: Team is col-span-1, Status is col-span-1. */}
                <div className="col-span-1 md:col-span-2 flex justify-end md:justify-end items-center">
                  <div className="flex flex-col items-center justify-center px-4 py-1.5 bg-gray-50 border border-indigo-50 rounded-xl min-w-[70px]">
                    <span className="text-sm font-bold text-gray-800 leading-tight">
                      {completedTasksCount} <span className="text-gray-400 text-[10px]">/ {totalTasksCount}</span>
                    </span>
                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-tighter">Tasks</span>
                  </div>
                </div>

                {/* 3. Milestone Progress (Full width on mobile) */}
                <div className="col-span-2 md:col-span-4 flex flex-col gap-1.5 justify-center order-last md:order-none">
                  {/* Added order-last so on mobile it drops to bottom if we want Team/Status to be row 2. 
                         Wait, if I want [Team][Status] on Row 2, then Progress must be Row 3.
                         Grid auto-placement fills rows.
                         Items: Info(2), Team(1), Status(1), Progress(2).
                         Row 1: Info (2 slots) -> Full
                         Row 2: Team (1 slot), Status (1 slot) -> Full
                         Row 3: Progress (2 slots) -> Full
                         
                         So I need to move the code block for Progress to be AFTER Status, OR use 'order' classes.
                         I will use 'order-last md:order-none' on Progress div and 'order-none' on others to swap them visually on mobile?
                         No, simply changing DOM order is safer/easier if I assume mobile-first logic, but grid columns might handle it.
                         Current DOM order in my replacement: Info, Team, Status, Progress.
                     */}
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-gray-400 uppercase font-bold tracking-tight">Milestone Progress</span>
                    <span className="text-indigo-600 font-bold">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/30">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.2)]"
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>

              </div>

              {/* Tasks List for this Project */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-3 pl-4 md:pl-12 py-2 pr-1 border-l-2 border-dashed border-gray-200 ml-6">
                      {projectTasks.length > 0 ? (
                        projectTasks.map((task) => (
                          <motion.div
                            layout
                            key={task.id}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-primary/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group/task"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-1 h-10 rounded-full ${task.priority === 'high' ? 'bg-red-400' :
                                task.priority === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                                }`} />
                              <div>
                                <h3 className="font-semibold text-gray-800 group-hover/task:text-primary transition-colors">
                                  {task.title}
                                </h3>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${task.priority === 'high' ? 'bg-red-50 text-red-600' :
                                    task.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                                      'bg-blue-50 text-blue-600'
                                    }`}>
                                    {task.priority || 'Normal'} Priority
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">Due: {formatDate(task.dueDate)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(task, e.target.value)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold outline-none transition-all cursor-pointer shadow-sm border ${(task.status || "").toUpperCase() === 'COMPLETED' ? 'bg-green-50 border-green-200 text-green-700' :
                                  (task.status || "").toUpperCase() === 'IN PROGRESS' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                    'bg-white border-gray-200 text-gray-600 hover:border-primary/50'
                                  } focus:ring-2 focus:ring-primary/20`}
                              >
                                <option value="PENDING">Mark Pending</option>
                                <option value="IN PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                              </select>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-6 text-center">
                          <p className="text-xs text-gray-400 italic">No tasks found matching your filters for this project.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ================= FILE UPLOAD MODAL ================= */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 px-2">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-xs sm:max-w-sm shadow-lg mx-2">
            <h3 className="text-base sm:text-lg font-bold mb-2">Upload Completion File</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Task: <strong>{selectedTask?.title}</strong>
            </p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.dwg,.obj,.gltf"
              onChange={handleFileChange}
              className="w-full border p-2 rounded mb-4"
            />
            {uploadedFile && (
              <p className="text-xs text-green-600 mb-3">
                ✅ File selected: {uploadedFile.name}
              </p>
            )}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-2">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadedFile(null);
                  setSelectedTask(null);
                }}
                className="px-4 py-2 rounded border text-sm w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFile}
                className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 w-full sm:w-auto"
              >
                Upload & Complete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AllTasks;
