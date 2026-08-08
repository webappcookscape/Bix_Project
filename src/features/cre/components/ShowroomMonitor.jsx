import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Users, MapPin } from 'lucide-react';

const ShowroomMonitor = ({ walkins = [] }) => {
    const isDark = false; // Forced light theme for CRE as per request
    const showrooms = ['MTRS', 'OMR', 'PORUR', 'COIMBATORE'];

    const getActiveCount = (room) => {
        return walkins.filter(w => w.showroom === room && w.status === 'ACTIVE').length;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {showrooms.map((room) => {
                const count = getActiveCount(room);
                const isActive = count > 0;

                return (
                    <motion.div
                        key={room}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className={`relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 ${isActive ? (isDark ? 'bg-slate-900/40 border-orange-500/30 shadow-lg shadow-orange-500/10' : 'bg-orange-50 border-orange-500/30 shadow-sm') : (isDark ? 'bg-slate-900/20 border-white/5' : 'bg-white border-slate-200 opacity-90')}`}
                    >
                        {/* Background Pulse for active rooms */}
                        {isActive && (
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.1, 0.2, 0.1]
                                }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-orange-500 rounded-full blur-[100px]"
                            />
                        )}

                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`flex items-center rounded-xl p-2 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                    <MapPin className={`w-5 h-5 mr-2 ${isActive ? 'text-orange-500' : 'text-slate-500'}`} />
                                    <span className={`text-sm font-bold tracking-wider uppercase ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{room}</span>
                                </div>
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0 }}
                                        >
                                            <Activity className="w-5 h-5 text-orange-500 animate-pulse" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex items-end justify-between">
                                <div>
                                    <p className={`text-3xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {count.toString().padStart(2, '0')}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">ACTIVE VISITORS</p>
                                </div>
                                <div className={`p-2 rounded-full ${isActive ? 'bg-orange-500/10' : isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                    <Users className={`w-5 h-5 ${isActive ? 'text-orange-500' : 'text-slate-600'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Rhythmic Pulse Progress Bar */}
                        {isActive && (
                            <motion.div
                                className="absolute bottom-0 left-0 h-1 bg-orange-500"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                            />
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
};

export default ShowroomMonitor;
