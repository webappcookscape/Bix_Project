import React from "react";
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react";

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

const IssueStats = ({ issues }) => {
    const total = issues.length;

    const open = issues.filter(
        (i) => i.status !== "Completed" && i.status !== "Resolved"
    ).length;

    const highPriority = issues.filter(
        (i) => (i.priority || "").toLowerCase() === "high" && i.status !== "Completed"
    ).length;

    const overdue = issues.filter(
        (i) => {
            if (!i.dueDate || i.status === "Completed") return false;
            return new Date(i.dueDate) < new Date();
        }
    ).length;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
                title="Total Issues"
                value={total}
                icon={AlertCircle}
                color="bg-indigo-500"
                subtext="All reported issues"
            />
            <StatCard
                title="Open Issues"
                value={open}
                icon={Clock}
                color="bg-orange-500"
                subtext="Pending resolution"
            />
            <StatCard
                title="High Priority"
                value={highPriority}
                icon={AlertTriangle}
                color="bg-rose-500"
                subtext="Needs immediate attention"
            />
            <StatCard
                title="Overdue"
                value={overdue}
                icon={AlertCircle}
                color="bg-red-600"
                subtext="Past due date"
            />
        </div>
    );
};

export default IssueStats;
