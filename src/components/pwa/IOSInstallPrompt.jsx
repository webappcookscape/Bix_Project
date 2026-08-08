import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const IOSInstallPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // 1. Check if iOS (iPhone or iPad)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        // 2. Check if running in standalone mode (already installed)
        const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

        // 3. Show only if on iOS and NOT installed
        if (isIOS && !isStandalone) {
            // Check session storage so we don't nag every single refresh if they dismissed it
            const hasDismissed = sessionStorage.getItem('ios-prompt-dismissed');
            if (!hasDismissed) {
                // Delay slightly for better UX
                const timer = setTimeout(() => setIsVisible(true), 2000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        sessionStorage.setItem('ios-prompt-dismissed', 'true');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 z-[1000] p-6 bg-white/80 backdrop-blur-2xl border-t border-white/20 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] rounded-t-[32px] ring-1 ring-black/5"
                    style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200"
                    >
                        <X size={18} />
                    </button>

                    <div className="max-w-md mx-auto relative flex flex-col items-center text-center space-y-4">

                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-1">
                            <PlusSquare size={24} />
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-slate-800">Install App</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">
                                Install this app on your iPhone for the best experience.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 text-sm font-bold text-slate-700 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 w-full justify-center">
                            <span>1. Tap</span>
                            <Share size={20} className="text-blue-500" />
                            <span>Share</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm font-bold text-slate-700 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 w-full justify-center">
                            <span>2. Select</span>
                            <PlusSquare size={20} className="text-slate-500" />
                            <span>Add to Home Screen</span>
                        </div>

                        {/* Pointing Arrow at the bottom center to point towards Safari's toolbar */}
                        <div className="animate-bounce mt-2 text-slate-400">
                            ▼
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default IOSInstallPrompt;
