import React, { useContext } from "react";
import { TaskContext } from "../context/TaskContext";
import { useSearchParams } from "react-router-dom";
import ProjectCard from "../components/ProjectCard";
import { Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Projects = () => {
  const { projects, tasks } = useContext(TaskContext);
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search")?.toLowerCase() || "";

  const getProjectStats = (pid) => {
    const projectTasks = tasks.filter((t) => t.projectId === pid);
    const completed = projectTasks.filter((t) => t.status === "Completed").length;
    return {
      total: projectTasks.length,
      completed,
      progress: projectTasks.length > 0 ? (completed / projectTasks.length) * 100 : 0,
    };
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(search) ||
    `${project.firstName} ${project.lastName}`.toLowerCase().includes(search)
  );

  return (
    <div className="p-4 sm:p-8 bg-gray-50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-200">
            <Briefcase size={24} />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-800 tracking-tight">Assigned Projects</h1>
        </div>
        {search && (
          <div className="text-xs font-semibold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full uppercase tracking-wider animate-pulse">
            Searching: {search}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project, index) => {
              const stats = getProjectStats(project.id);
              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProjectCard
                    project={{
                      ...project,
                      totalTasks: stats.total,
                      completedTasks: stats.completed,
                      progress: stats.progress
                    }}
                  />
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 text-gray-400">
                <Briefcase size={32} />
              </div>
              <p className="text-gray-500 font-medium">No projects found matching "{search}"</p>
              <button
                onClick={() => window.history.back()}
                className="mt-4 text-indigo-600 text-sm font-semibold hover:underline"
              >
                Clear search or go back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Projects;
