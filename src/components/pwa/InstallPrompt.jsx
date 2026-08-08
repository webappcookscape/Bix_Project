import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : false);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleClose = () => {
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: "100%", x: isDesktop ? "-50%" : "0%" }}
                    animate={{ opacity: 1, y: 0, x: isDesktop ? "-50%" : "0%" }}
                    exit={{ opacity: 0, y: "100%", x: isDesktop ? "-50%" : "0%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 md:bottom-8 md:left-1/2 md:right-auto md:w-full md:max-w-md z-[1000] p-6 pb-12 md:pb-6 bg-white rounded-t-[32px] md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl border border-slate-100"
                >
                    <div className="p-5 sm:p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Smartphone size={24} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Install Orbix Projects</h3>
                                    <p className="text-sm font-medium text-slate-500">Get the best experience on your home screen.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleInstallClick}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200"
                            >
                                <Download className="inline-block mr-2" size={18} />
                                Install Now
                            </button>
                            <button
                                onClick={handleClose}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InstallPrompt;
