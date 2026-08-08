import React, { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if already in standalone mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone ||
            document.referrer.includes('android-app://');

        if (isStandalone) {
            console.log("App is already in standalone mode.");
            return;
        }

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        if (isIosDevice) {
            // Show prompt for iOS users after a short delay
            setTimeout(() => setIsVisible(true), 1000);
        }

        const handleBeforeInstallPrompt = (e) => {
            console.log("beforeinstallprompt fired");
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        console.log(`User response to install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Install App</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Install Task Manager for a better experience with offline access and easy access.
                    </p>

                    {isIOS ? (
                        <div className="bg-gray-50 p-3 rounded-md border border-gray-100 mb-2">
                            <p className="text-sm text-gray-800 font-medium flex items-center gap-2">
                                1. Tap the Share button <Share size={16} />
                            </p>
                            <p className="text-sm text-gray-800 font-medium mt-1">
                                2. Select "Add to Home Screen"
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={handleInstallClick}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                        >
                            <Download size={18} />
                            Install as App
                        </button>
                    )}
                </div>
                <button
                    onClick={handleDismiss}
                    className="ml-4 text-gray-400 hover:text-gray-500 transition-colors"
                    aria-label="Dismiss"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default InstallPrompt;
