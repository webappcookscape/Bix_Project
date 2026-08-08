import React, { useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TaskContext } from "../context/TaskContext";
import TaskRow from "../components/TaskRow";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  Users,
  Briefcase,
  Hash
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDate } from "../../../shared/utils/dateFormatter";

const ProjectTasks = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { tasks, projects, updateTaskStatus } = useContext(TaskContext);

  const project = projects.find(p => p.id === projectId);
  const projectTasks = tasks.filter(task => task.projectId === projectId);

  if (!project) {
    return (
      <div className="p-8 text-center bg-white min-h-screen">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Project Not Found</h2>
          <p className="text-slate-500">The project you are looking for doesn't exist or you don't have access.</p>
          <button
            onClick={() => navigate('/employee/projects')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg"
          >
            Go to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* Contextual Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 px-4 sm:px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/employee/projects')}
          className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-indigo-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">{project.name}</h1>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5">
            <Hash size={10} /> {project.projectCode}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
        {/* Detailed Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 shadow-sm overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-10 -mt-10" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            {/* Client Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-indigo-600">
                <User size={20} className="stroke-[3]" />
                <h3 className="font-black text-xs uppercase tracking-widest">Client Details</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
                  <p className="text-slate-800 font-bold text-lg">{project.clientFirstName} {project.clientLastName}</p>
                </div>

                <div className="flex flex-wrap gap-4 sm:gap-8">
                  <div className="flex-1 min-w-[140px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mobile</p>
                    <a href={`tel:${project.clientPhone}`} className="flex items-center gap-2 text-slate-800 font-bold hover:text-indigo-600 transition-colors group">
                      <div className="p-1.5 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100">
                        <Phone size={14} />
                      </div>
                      {project.clientPhone}
                    </a>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                    <a href={`mailto:${project.clientEmail}`} className="flex items-center gap-2 text-slate-800 font-bold hover:text-indigo-600 transition-colors group">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100">
                        <Mail size={14} />
                      </div>
                      {project.clientEmail}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Spouse & Location Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-indigo-600">
                <Users size={20} className="stroke-[3]" />
                <h3 className="font-black text-xs uppercase tracking-widest">Additional Info</h3>
              </div>

              <div className="space-y-4">
                {project.spouseName && (
                  <div className="flex flex-wrap gap-4 sm:gap-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Spouse Name</p>
                      <p className="text-slate-800 font-bold">{project.spouseName}</p>
                    </div>
                    {project.spousePhone && (
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Spouse Mobile</p>
                        <a href={`tel:${project.spousePhone}`} className="flex items-center gap-2 text-slate-800 font-bold hover:text-indigo-600 transition-colors group text-sm">
                          <div className="p-1.5 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100">
                            <Phone size={12} />
                          </div>
                          {project.spousePhone}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <MapPin size={10} /> Location
                    </p>
                    <p className="text-slate-800 font-bold  text-sm">{project.location || 'Chennai'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Calendar size={10} /> Deadline
                    </p>
                    <p className="text-slate-800 font-bold  text-sm">
                      {project.deadline ? formatDate(project.deadline) : 'TBD'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tasks Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800">Project Tasks</h2>
            <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 font-black rounded-lg uppercase tracking-widest">
              {projectTasks.length} total
            </span>
          </div>

          {projectTasks.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                <Briefcase size={24} />
              </div>
              <p className="text-slate-500 font-medium">No tasks assigned to this project yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projectTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <TaskRow
                    task={task}
                    onStatusChange={updateTaskStatus}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectTasks;
