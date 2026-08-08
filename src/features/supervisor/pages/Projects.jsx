import { useState, useEffect } from 'react';
import axios from '../../../shared/utils/axios';
import { Briefcase, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectCard from '../components/ProjectCard';
import RefreshButton from '../../../shared/components/RefreshButton';
import { Plus, Upload } from 'lucide-react';
import BulkProjectImport from '../../admin/components/BulkProjectImport.jsx';


const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [bulkImportOpen, setBulkImportOpen] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            // Fetch projects filtering by employeeId (which works for site supervisor roles too)
            const response = await axios.get('/projects', { params: { employeeId: user.id } });

            const projectsWithStats = response.data.map(project => {
                const total = project.tasks?.length || 0;
                const completed = project.tasks?.filter(t => t.status === 'COMPLETED').length || 0;
                return {
                    ...project,
                    totalTasks: total,
                    completedTasks: completed,
                    progress: total > 0 ? (completed / total) * 100 : 0
                };
            });

            setProjects(projectsWithStats);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.projectCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                        <Briefcase size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Assigned Projects</h1>
                        <p className="text-slate-500 font-medium text-sm">Overview of projects you are overseeing</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setBulkImportOpen(true)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <Upload size={16} />
                        Bulk Import
                    </button>
                    <RefreshButton onRefresh={fetchProjects} isLoading={loading} label="Refresh" />
                </div>
            </div>


            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between sticky top-0 z-20">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search projects by name or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredProjects.length > 0 ? (
                        filteredProjects.map((project, index) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <ProjectCard project={project} />
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-slate-500 font-bold">No projects found</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {bulkImportOpen && (
                <BulkProjectImport
                    onClose={() => setBulkImportOpen(false)}
                    onSuccess={() => {
                        fetchProjects();
                        setBulkImportOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default Projects;
