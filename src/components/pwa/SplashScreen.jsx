import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat } from 'lucide-react';

const SplashScreen = () => {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -200 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-4"
        >
            <div className="flex flex-col items-center">
                {/* Brand Logo Animation */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        duration: 0.8,
                        ease: "backOut",
                        delay: 0.2
                    }}
                    className="w-64 h-auto flex items-center justify-center mb-8"
                >
                    <img src="/splash-logo.png" alt="Cookscape Logo" className="w-full h-auto object-contain" />
                </motion.div>

                {/* Brand Text Animation */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="text-center"
                >
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 tracking-tight">
                        <span className="text-orange-600">Cookscape</span>
                    </h1>
                    <p className="text-gray-400 font-medium text-sm tracking-wide uppercase">
                        Enterprise Solutions
                    </p>
                </motion.div>

                {/* Loading Bar */}
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 150, opacity: 1 }}
                    transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
                    className="h-1 bg-gray-100 rounded-full mt-12 overflow-hidden"
                >
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '0%' }}
                        transition={{
                            repeat: Infinity,
                            duration: 1.5,
                            ease: "linear"
                        }}
                        className="h-full w-full bg-orange-500 rounded-full"
                    />
                </motion.div>
            </div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-10"
            >
                <div className="flex gap-2 justify-center mt-4">
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SplashScreen;
