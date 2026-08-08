import React, { useState } from 'react';
import { Mail, ArrowRight, Lock, Key, CheckCircle, AlertTriangle, Loader2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from '../shared/utils/axios';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password, 3: Success
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Step 1: Request OTP
    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await axios.post('/auth/forgot-password', { email });
            // Always show success to prevent email enumeration (though backend message handles this too)
            setMessage(res.data.message);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await axios.post('/auth/reset-password', { email, otp, newPassword });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP or expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
                <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Key size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
                        <p className="text-slate-500 text-sm mt-2">
                            {step === 1 && "Enter your email to receive an OTP."}
                            {step === 2 && "Enter the 6-digit code sent to your email."}
                            {step === 3 && "Password reset successfully!"}
                        </p>
                    </div>

                    {/* Step 1: Email Form */}
                    {step === 1 && (
                        <form onSubmit={handleRequestOTP} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                                        placeholder="admin@orbix.com"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} /> {error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Send OTP <ArrowRight size={18} /></>}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="w-full text-slate-500 text-sm font-medium hover:text-slate-700 mt-4 flex items-center justify-center gap-1"
                            >
                                <ChevronLeft size={16} /> Back to Login
                            </button>
                        </form>
                    )}

                    {/* Step 2: OTP Form */}
                    {step === 2 && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm mb-4">
                                OTP sent to <strong>{email}</strong>. Check your inbox.
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">6-Digit OTP</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // Numeric only
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none tracking-widest font-mono text-lg"
                                        placeholder="123456"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} /> {error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : "Reset Password"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-slate-500 text-sm font-medium hover:text-slate-700 mt-2"
                            >
                                Resend OTP / Change Email
                            </button>
                        </form>
                    )}

                    {/* Step 3: Success */}
                    {step === 3 && (
                        <div className="text-center py-4">
                            <div className="text-green-500 mb-4 flex justify-center">
                                <CheckCircle size={48} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Password Updated!</h3>
                            <p className="text-slate-500 text-sm mb-6">Your password has been successfully reset. You can now log in with your new credentials.</p>

                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                Go to Login
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
