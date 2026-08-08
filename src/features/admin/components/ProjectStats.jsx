import React from "react";
import { Briefcase, Clock, AlertCircle } from "lucide-react";

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={20} className="text-white" />
            </div>
        </div>
        {subtext && <p className="text-xs text-slate-400 mt-3 font-medium">{subtext}</p>}
    </div>
);

const ProjectStats = ({ projects }) => {
    const total = projects.length;

    const upcomingDeadlines = projects.filter((p) => {
        if (!p.deadline) return false;
        const days = (new Date(p.deadline) - new Date()) / (1000 * 60 * 60 * 24);
        return days > 0 && days <= 30;
    }).length;

    const overdue = projects.filter((p) => {
        // Simple check logic matching existing utils
        if (!p.startDate) return false;
        const days = (new Date() - new Date(p.startDate)) / (1000 * 60 * 60 * 24);
        return days > (p.timelineDuration || 45) && p.status !== "COMPLETED";
    }).length;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard
                title="Total Projects"
                value={total}
                icon={Briefcase}
                color="bg-indigo-500"
                subtext="All active & completed sites"
            />
            <StatCard
                title="Upcoming Handovers"
                value={upcomingDeadlines}
                icon={Clock}
                color="bg-orange-500"
                subtext="Deadlines within 30 days"
            />
            <StatCard
                title="Overdue Projects"
                value={overdue}
                icon={AlertCircle}
                color="bg-rose-500"
                subtext="Exceeded timeline duration"
            />
        </div>
    );
};

export default ProjectStats;
