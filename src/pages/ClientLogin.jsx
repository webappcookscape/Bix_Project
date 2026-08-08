import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Lock, Hash, ArrowRight, Loader2, AlertTriangle, 
    Sparkles, Award, Wrench, Factory, FileCheck, PenTool, Snowflake, Users 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../shared/utils/axios";
import useHaptics from "../shared/hooks/useHaptics";
import toast from "react-hot-toast";

const ClientLogin = () => {
    const navigate = useNavigate();
    const { trigger } = useHaptics();
    const formRef = useRef(null);
    const [activeTab, setActiveTab] = useState("signin");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        projectId: "",
        password: "",
        name: "",
        email: "",
        phone: ""
    });

    const cards = [
        { title: "1.Service", desc: "Experience our world-class interior service ecosystem.", icon: Sparkles, color: "from-blue-400 to-indigo-600", shadow: "shadow-blue-200" },
        { title: "2.Completion Certificate", desc: "Official recognition of your project's successful delivery.", icon: Award, color: "from-amber-400 to-orange-600", shadow: "shadow-orange-200" },
        { title: "3.Installation", desc: "Precision fit-out by our expert technical artisans.", icon: Wrench, color: "from-emerald-400 to-teal-600", shadow: "shadow-emerald-200" },
        { title: "4.Production", desc: "State-of-the-art manufacturing of your custom designs.", icon: Factory, color: "from-purple-400 to-fuchsia-600", shadow: "shadow-fuchsia-200" },
        { title: "5.Final set of docs", desc: "All your project technical drawings and manuals.", icon: FileCheck, color: "from-rose-400 to-pink-600", shadow: "shadow-pink-200" },
        { title: "6.Revised Designs", desc: "Iterative design refinements tailored to your vision.", icon: PenTool, color: "from-cyan-400 to-blue-600", shadow: "shadow-cyan-200" },
        { title: "7.Freezing Stage", desc: "Securing your final selections for production launch.", icon: Snowflake, color: "from-indigo-400 to-purple-800", shadow: "shadow-indigo-300" },
        { title: "8.Client Followups", desc: "Dedicated support ensuring your complete satisfaction.", icon: Users, color: "from-lime-400 to-green-600", shadow: "shadow-green-200" }
    ];

    const containerVars = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.3 }
        }
    };

    const cardVars = {
        hidden: { y: 50, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100, damping: 12 }
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const token = params.get("token");

        // 1. Handle New Short Magic Code
        if (code) {
            setLoading(true);
            axios.get(`/projects/magic-link/${code}`)
                .then(res => {
                    if (res.data.project && res.data.project.projectCode) {
                        setFormData(prev => ({ ...prev, projectId: res.data.project.projectCode }));
                    }
                })
                .catch(err => {
                    console.error("Magic Link Error", err);
                    setError("This access link is invalid or expired.");
                })
                .finally(() => setLoading(false));

        } else if (token) {
            // 2. Handle Legacy Long Token (Backwards Compatibility)
            try {
                let decoded;
                if (token.includes('.')) {
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    decoded = JSON.parse(jsonPayload);
                } else {
                    decoded = JSON.parse(atob(token));
                }

                if (decoded.projectCode || decoded.projectId) {
                    setFormData(prev => ({ ...prev, projectId: decoded.projectCode || decoded.projectId }));
                }
            } catch (e) {
                console.error("Invalid token parsing:", e);
            }
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        trigger('medium');
        setLoading(true);
        setError("");

        try {
            const res = await axios.post("/client/login", {
                projectId: formData.projectId,
                password: formData.password
            });
            localStorage.setItem("clientToken", res.data.token);
            localStorage.setItem("clientProject", JSON.stringify(res.data.project));
            // Trigger heavy haptic on successful login to dashboard
            trigger('heavy');
            navigate("/client", { replace: true });
        } catch (err) {
            console.error("Login Error:", err);
            trigger('error');
            setError(err.response?.data?.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        trigger('medium');
        setLoading(true);
        setError("");

        try {
            // Replace with actual lead/signup endpoint if available
            // await axios.post("/client/signup", { name, email, phone });
            
            // For now, simulate success
            await new Promise(resolve => setTimeout(resolve, 1000));
            trigger('success');
            toast.success("Thank you for your interest! Our team will contact you shortly.", {
                duration: 5000,
                position: 'top-center',
            });
            setFormData({ ...formData, name: "", email: "", phone: "" });
            setActiveTab("signin");
        } catch (err) {
            console.error("Signup Error:", err);
            trigger('error');
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = () => {
        trigger('light');
        setActiveTab("signin");
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] bg-slate-50 overflow-y-auto"
        >
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        x: [0, 50, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, -120, 0],
                        x: [0, -80, 0],
                        y: [0, 60, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-20 -right-20 w-[30rem] h-[30rem] bg-orange-200/20 rounded-full blur-3xl"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none bg-[radial-gradient(#4b5563_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            </div>

            <div className="min-h-[100dvh] w-full flex flex-col items-center py-12 md:py-20 px-4 md:px-8 relative z-10">
                <div className="max-w-6xl w-full flex flex-col items-center my-auto">
                    
                    {/* Header Section */}
                    <motion.div
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className="text-center mb-8 md:mb-12 mt-4 w-full"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="flex items-center justify-center mb-4 md:mb-6"
                        >
                            <img src="/FINAL_LOGO.png" alt="Cookscape" className="h-10 sm:h-12 md:h-16 drop-shadow-2xl" />
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-3 md:mb-4">
                            Welcome to <span className="text-indigo-600">Cookscape</span>
                        </h1>
                        <p className="text-base md:text-lg font-bold text-slate-500 max-w-2xl mx-auto leading-relaxed px-4">
                            Your journey to a beautiful home begins here. Access your secure client portal below.
                        </p>
                    </motion.div>

                    {/* 8 Cards Grid */}
                    <motion.div
                        variants={containerVars}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full mb-12 md:mb-16"
                    >
                        {cards.map((card, idx) => (
                            <motion.div
                                key={card.title}
                                variants={cardVars}
                                whileHover={{
                                    y: -8,
                                    transition: { type: "spring", stiffness: 400, damping: 10 }
                                }}
                                whileTap={{ scale: 0.98 }}
                                className={`bg-white rounded-3xl md:rounded-[2rem] p-5 md:p-6 shadow-xl ${card.shadow} border border-white/50 relative overflow-hidden group cursor-pointer`}
                                onClick={handleCardClick}
                            >
                                <div className={`absolute -right-4 -bottom-4 w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity blur-2xl rounded-full`} />
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-4 md:mb-6 shadow-lg transform group-hover:rotate-6 transition-transform`}>
                                    <card.icon size={24} strokeWidth={2.5} className="md:w-[28px] md:h-[28px]" />
                                </div>
                                <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight mb-1.5 md:mb-2 group-hover:text-indigo-600 transition-colors">
                                    {card.title}
                                </h3>
                                <p className="text-xs md:text-sm font-bold text-slate-400 leading-relaxed">
                                    {card.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Centralized Auth Form Section */}
                    <motion.div
                        ref={formRef}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.6 }}
                        className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 border border-white/50 p-6 md:p-8 relative overflow-hidden group"
                    >
                        {/* Decorative Top Bar */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                        {/* Tabs */}
                        <div className="flex items-center justify-between mb-8 bg-slate-50 p-1.5 rounded-2xl relative">
                            <AnimatePresence>
                                <motion.div
                                    className="absolute inset-y-1.5 bg-white rounded-xl shadow-sm border border-slate-200"
                                    layoutId="auth-tab-bg"
                                    initial={false}
                                    style={{
                                        width: 'calc(50% - 6px)',
                                        left: activeTab === 'signin' ? '6px' : 'calc(50%)'
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            </AnimatePresence>
                            
                            <button
                                onClick={() => { setActiveTab('signin'); trigger('light'); setError(""); }}
                                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest relative z-10 transition-colors ${activeTab === 'signin' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => { setActiveTab('signup'); trigger('light'); setError(""); }}
                                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest relative z-10 transition-colors ${activeTab === 'signup' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Form area depending on tab */}
                        {activeTab === 'signin' ? (
                            <motion.form 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleLogin} 
                                className="space-y-4 md:space-y-5"
                            >
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2"
                                    >
                                        <AlertTriangle size={16} />
                                        {error}
                                    </motion.div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] md:text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">Project ID</label>
                                    <div className="relative group/input">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors">
                                            <Hash size={18} />
                                        </span>
                                        <input
                                            type="text"
                                            name="projectId"
                                            value={formData.projectId}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 md:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm outline-none placeholder:text-slate-400 font-bold text-slate-800"
                                            placeholder="e.g. PRJ-001"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] md:text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">Password</label>
                                    <div className="relative group/input">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors">
                                            <Lock size={18} />
                                        </span>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 md:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm outline-none placeholder:text-slate-400 font-bold text-slate-800"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 mt-2 rounded-2xl font-black text-white text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:shadow-none"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            Enter Dashboard
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleSignUp} 
                                className="space-y-4 md:space-y-5"
                            >
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2"
                                    >
                                        <AlertTriangle size={16} />
                                        {error}
                                    </motion.div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] md:text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3.5 md:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm outline-none placeholder:text-slate-400 font-bold text-slate-800"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] md:text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3.5 md:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm outline-none placeholder:text-slate-400 font-bold text-slate-800"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] md:text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">Contact Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3.5 md:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm outline-none placeholder:text-slate-400 font-bold text-slate-800"
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 mt-2 rounded-2xl font-black text-white text-sm uppercase tracking-widest shadow-xl shadow-pink-200 bg-gradient-to-r from-purple-500 to-pink-500 hover:to-pink-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:shadow-none"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            Request Consultation
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        )}
                    </motion.div>

                    <p className="mt-12 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                        Cookscape Internal Portal v2.0
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default ClientLogin;
