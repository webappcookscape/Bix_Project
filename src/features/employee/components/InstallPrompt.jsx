import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        // Optionally handle outcome (accepted/dismissed) here

        // We've used the prompt, and can't use it again, discard it
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleClose = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-2 left-2 right-2 sm:left-4 sm:right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 animate-in slide-in-from-bottom duration-500 max-w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 truncate">
                        <Download className="w-5 h-5 text-indigo-600" />
                        Install App
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                        Install Orbix Projects Employee for a better experience with offline access and faster performance.
                    </p>
                </div>
                <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="mt-4 flex gap-3">
                <button
                    onClick={handleInstallClick}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                    Install Now
                </button>
                <button
                    onClick={handleClose}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                    Maybe Later
                </button>
            </div>
        </div>
    );
};

export default InstallPrompt;
