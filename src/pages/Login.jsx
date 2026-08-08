import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Shield,
    User,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    ArrowRight,
    AlertTriangle,
    Mail,
    Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../shared/utils/axios";
import { GoogleLogin } from '@react-oauth/google';
import { getDefaultAppRoute } from "../shared/utils/auth";

const UnifiedLogin = () => {
    const navigate = useNavigate();
    const [activePortal, setActivePortal] = useState("admin"); // 'admin', 'employee'
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    useEffect(() => {
        const target = getDefaultAppRoute();
        if (target !== "/login") {
            navigate(target, { replace: true });
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError("");
        try {
            const { credential } = credentialResponse;
            const res = await axios.post("/auth/google-login", { token: credential });
            const userRole = res.data.user.role;

            if (activePortal === 'admin' && !['SUPER_ADMIN', 'MANAGER', 'VIEW_ONLY_ADMIN', 'BUSINESS_HEAD', 'LEAD_OPERATION'].includes(userRole)) {
                setError("Access denied. Google account not linked to an Admin role.");
                setLoading(false);
                return;
            }

            if (activePortal === 'employee' && !['EMPLOYEE', 'SITE_SUPERVISOR', 'CLIENT_RELATIONSHIP_EXECUTIVE'].includes(userRole)) {
                setError("Access denied. Google account not linked to an Employee role.");
                setLoading(false);
                return;
            }

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));

            if (userRole === 'SUPER_ADMIN' || userRole === 'MANAGER' || userRole === 'VIEW_ONLY_ADMIN') {
                navigate("/admin/dashboard", { replace: true });
            } else if (userRole === 'EMPLOYEE') {
                navigate("/employee", { replace: true });
            } else if (userRole === 'SITE_SUPERVISOR') {
                navigate("/supervisor/dashboard", { replace: true });
            } else if (userRole === 'CLIENT_RELATIONSHIP_EXECUTIVE' || userRole === 'LEAD_OPERATION') {
                navigate("/cre/reports", { replace: true });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Google Sign-In failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await axios.post("/auth/login", {
                email: formData.email,
                password: formData.password
            });

            const userRole = res.data.user.role;

            if (activePortal === 'admin' && !['SUPER_ADMIN', 'MANAGER', 'VIEW_ONLY_ADMIN', 'BUSINESS_HEAD', 'LEAD_OPERATION'].includes(userRole)) {
                setError("Access denied. Please use the Admin portal.");
                setLoading(false);
                return;
            }

            if (activePortal === 'employee' && !['EMPLOYEE', 'SITE_SUPERVISOR', 'CLIENT_RELATIONSHIP_EXECUTIVE', 'LEAD_OPERATION'].includes(userRole)) {
                setError("Access denied. Please use the Admin portal.");
                setLoading(false);
                return;
            }

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));

            if (userRole === 'SUPER_ADMIN' || userRole === 'MANAGER' || userRole === 'VIEW_ONLY_ADMIN') {
                navigate("/admin/dashboard", { replace: true });
            } else if (userRole === 'EMPLOYEE') {
                navigate("/employee", { replace: true });
            } else if (userRole === 'SITE_SUPERVISOR') {
                navigate("/supervisor/dashboard", { replace: true });
            } else if (userRole === 'CLIENT_RELATIONSHIP_EXECUTIVE' || userRole === 'LEAD_OPERATION') {
                navigate("/cre/reports", { replace: true });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center p-4 relative overflow-hidden font-outfit">
            {/* Mesh Gradients */}
            <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,122,0,0.05),transparent_50%)] pointer-events-none" />

            {/* Grid Pattern */}
            {/* Background pattern removed to fix 403 error */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#4b5563_1px,transparent_1px)] bg-size:20px_20px" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-110 relative z-10"
            >
                {/* Brand Logo */}
                <div className="flex flex-col items-center mb-10">
                    <motion.div 
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-4xl border border-white/10 flex items-center justify-center mb-6 shadow-2xl relative group"
                    >
                        <div className="absolute inset-0 bg-orange-500/20 rounded-4xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <img src="/FINAL_LOGO.png" alt="Bix" className="w-12 h-12 object-contain relative z-10" />
                    </motion.div>
                    <h1 className="text-4xl font-black text-white tracking-[0.2em] mb-2">BIX <span className="text-orange-500">PROJECTS</span></h1>
                    <p className="text-slate-400 text-xs font-bold tracking-[0.4em] uppercase opacity-60">High Performance Unified System</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/3 backdrop-blur-3xl border border-white/10 rounded-[48px] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden">
                    {/* Portal Switcher */}
                    <div className="flex p-1.5 bg-black/40 rounded-[28px] mb-8 border border-white/5">
                        <button
                            onClick={() => { setActivePortal("admin"); setError(""); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${activePortal === "admin" ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Shield size={14} className={activePortal === "admin" ? 'animate-pulse' : ''} />
                            Admin Portal
                        </button>
                        <button
                            onClick={() => { setActivePortal("employee"); setError(""); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${activePortal === "employee" ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <User size={14} className={activePortal === "employee" ? 'animate-pulse' : ''} />
                            Staff Portal
                        </button>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-4 rounded-[20px] text-[11px] font-bold flex items-center gap-3"
                                >
                                    <AlertTriangle size={16} />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Email Account</p>
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-white/5 border border-white/5 rounded-3xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center px-4">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Access Key</p>
                                    <button type="button" onClick={() => navigate('/forgot-password')} className="text-[10px] font-bold text-orange-500/60 hover:text-orange-500 uppercase tracking-widest">Forgot?</button>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-white/5 border border-white/5 rounded-3xl py-4 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4.5 bg-orange-500 hover:bg-orange-600 text-white rounded-3xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                <>
                                    Establish Link
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>

                        <div className="relative flex items-center gap-4 my-8">
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Cloud Access</span>
                            <div className="flex-1 h-px bg-white/5" />
                        </div>

                        <div className="flex justify-center scale-110">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError("Google Access Refused")}
                                shape="pill"
                                theme="filled_black"
                            />
                        </div>
                    </form>
                </div>

                {/* Footer Section */}
                <div className="mt-12 flex flex-col items-center gap-6">
                    <button 
                        onClick={() => navigate("/client/login")}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-colors py-2 px-4 rounded-full border border-white/5 hover:bg-white/5"
                    >
                        <Sparkles size={14} className="text-orange-500" />
                        Switch to Client Portal
                    </button>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest opacity-40">
                        &copy; 2026 BIX PROJECTS &bull; VERS 3.1
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default UnifiedLogin;
