import React from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Shared Refresh Button Component
 * @param {Function} onRefresh - Function to call when clicked
 * @param {Boolean} isLoading - Whether a refresh is in progress
 * @param {String} className - Additional CSS classes
 * @param {String} label - Optional label text
 */
const RefreshButton = ({ onRefresh, isLoading, className = "", label = "" }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
                e.stopPropagation();
                if (!isLoading) onRefresh();
            }}
            disabled={isLoading}
            className={`
                flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 
                bg-white text-slate-600 shadow-sm hover:shadow-md hover:border-indigo-200 
                hover:text-indigo-600 transition-all duration-200 disabled:opacity-50 
                disabled:cursor-not-allowed group ${className}
            `}
            title="Refresh Data"
        >
            <RefreshCw
                size={16}
                className={
                    isLoading
                        ? "animate-spin text-indigo-600"
                        : "group-hover:rotate-180 transition-transform duration-500"
                }
            />
            {label && <span className="text-xs font-black uppercase tracking-widest">{label}</span>}
        </motion.button>
    );
};

export default RefreshButton;
