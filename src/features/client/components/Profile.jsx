import React from "react";
import { User, Phone, Mail, MapPin, Calendar, CreditCard, Heart, Briefcase, ShieldCheck } from "lucide-react";
import { formatDate } from '../../../shared/utils/dateFormatter';
import { motion } from "framer-motion";

const Profile = () => {
    const project = JSON.parse(localStorage.getItem("clientProject") || "{}");

    const Section = ({ title, icon: Icon, children, colorClass, delay = 0 }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="bg-white/60 backdrop-blur-xl rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-white/50 hover:shadow-2xl transition-all group"
        >
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${colorClass} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className="md:hidden" />
                    <Icon size={22} className="hidden md:block" />
                </div>
                <div>
                    <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">{title}</h3>
                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Verified Information</p>
                </div>
            </div>
            <div className="space-y-6">
                {children}
            </div>
        </motion.div>
    );

    const DetailItem = ({ label, value, icon: Icon }) => (
        <div className="flex items-start gap-4 group/item">
            {Icon && (
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-indigo-50 group-hover/item:text-indigo-600 transition-colors">
                    <Icon size={16} />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
                <p className="text-sm font-black text-slate-700 truncate">{value || "Not specified"}</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto p-2 md:p-8 lg:p-10 pb-20 space-y-6 md:space-y-10">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-2"
            >
                <h1 className="text-2xl md:text-4xl font-black text-slate-950 tracking-tighter px-2">My Profile</h1>
                <p className="text-xs md:text-sm text-slate-500 font-bold max-w-xl leading-relaxed px-2">Personal and project data as recorded in the Cookscape Master Registry.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Details */}
                <Section title="Lead Contact" icon={User} colorClass="bg-indigo-600 text-white" delay={0.1}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <DetailItem label="First Name" value={project.clientFirstName || project.firstName} />
                        <DetailItem label="Last Name" value={project.clientLastName || project.lastName} />
                    </div>
                    <DetailItem label="Email Identity" value={project.clientEmail} icon={Mail} />
                    <DetailItem label="Direct Line" value={project.clientPhone} icon={Phone} />
                </Section>

                {/* Spouse Details */}
                <Section title="Partner Details" icon={Heart} colorClass="bg-pink-500 text-white" delay={0.2}>
                    <DetailItem label="Partner Name" value={project.spouseName} icon={User} />
                    <DetailItem label="Direct Line" value={project.spousePhone} icon={Phone} />
                </Section>

                {/* Project Details */}
                <Section title="Project Scope" icon={Briefcase} colorClass="bg-emerald-600 text-white" delay={0.3}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <DetailItem label="Project Alias" value={project.name} />
                        <DetailItem label="Registry ID" value={project.cpNumber} />
                    </div>
                    <DetailItem label="Physical Site" value={project.location} icon={MapPin} />
                    <DetailItem label="Allocated Budget" value={project.budget ? `₹${project.budget.toLocaleString()}` : null} icon={CreditCard} />
                </Section>

                {/* Schedule */}
                <Section title="Timeframe" icon={Calendar} colorClass="bg-amber-500 text-white" delay={0.4}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <DetailItem label="Kick-off Date" value={project.startDate ? formatDate(project.startDate) : 'Pending'} />
                        <DetailItem label="Delivery Goal" value={project.deadline ? formatDate(project.deadline) : 'TBD'} />
                    </div>
                    <div className="pt-6 border-t border-slate-100 mt-2">
                        <DetailItem label="Forecasted Handover" value={`${project.handingOverMonth || ""} ${project.handingOverYear || ""}`} icon={ShieldCheck} />
                    </div>
                </Section>

                {/* Billing Details */}
                <Section title="Financial Records" icon={CreditCard} colorClass="bg-slate-800 text-white" delay={0.5}>
                    <DetailItem label="Billing Name" value={project.billingName || `${project.clientFirstName || project.firstName} ${project.clientLastName || project.lastName}`} />
                    <DetailItem label="Registered address" value={project.location} icon={MapPin} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <DetailItem label="Contact Link" value={project.billingPhone || project.clientPhone} icon={Phone} />
                        <DetailItem label="GST Identity" value={project.gstin} icon={ShieldCheck} />
                    </div>
                </Section>
            </div>

            {/* Access Disclaimer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="p-6 md:p-8 bg-slate-900 rounded-3xl md:rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-8 items-center text-center lg:text-left">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-white/20 transition-colors">
                        <ShieldCheck className="text-indigo-400" size={32} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-lg font-black tracking-tight mb-2">Immutable Project Registry</h4>
                        <p className="text-sm text-slate-400 font-bold leading-relaxed max-w-2xl mx-auto lg:mx-0">
                            These records are managed directly by ORBIX Operations. If any information requires correction, please initiate a formal update request through the <span className="text-indigo-400">Feedback & Support</span> portal.
                        </p>
                    </div>
                    <button className="w-full lg:w-auto px-8 py-3.5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all transform active:scale-95 shadow-xl">
                        Request Change
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
