import React, { useState } from 'react';
import { Shield, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ConsentModal = ({ isOpen, onClose, onConfirm, title }) => {
    const [agreed, setAgreed] = useState(false);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="bg-indigo-600 p-6 text-white text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-wide">Completion Consent</h2>
                        <p className="text-indigo-100 text-xs font-medium mt-1">Verify task completion standards</p>
                    </div>

                    <div className="p-8">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                            <h3 className="font-bold text-slate-800 text-sm mb-2">Task: {title}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                By proceeding, you certify that all required usage checks, installation procedures, and quality standards have been rigorously met. This action is irreversible.
                            </p>
                        </div>

                        <label className="flex items-start gap-4 p-4 border-l-4 border-indigo-500 bg-indigo-50/50 rounded-r-xl cursor-pointer hover:bg-indigo-50 transition-colors">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-indigo-600 checked:bg-indigo-600"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                />
                                <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" size={12} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">
                                I hereby certify that this task is totally completed and meets all quality standards.
                            </span>
                        </label>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 text-slate-500 font-bold text-sm bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={!agreed}
                                className={`flex-1 py-3 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all ${agreed
                                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                                    : 'bg-slate-300 cursor-not-allowed'
                                    }`}
                            >
                                Confirm Completion
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConsentModal;
