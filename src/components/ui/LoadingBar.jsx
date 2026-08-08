import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingBar = () => {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleStart = () => setIsLoading(true);
        const handleEnd = () => setIsLoading(false);

        window.addEventListener('loading-start', handleStart);
        window.addEventListener('loading-end', handleEnd);

        return () => {
            window.removeEventListener('loading-start', handleStart);
            window.removeEventListener('loading-end', handleEnd);
        };
    }, []);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[10000] h-1 bg-orange-100 overflow-hidden"
                >
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{
                            repeat: Infinity,
                            duration: 1,
                            ease: "linear"
                        }}
                        className="h-full w-1/3 bg-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.5)]"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LoadingBar;
