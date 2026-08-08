import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { toast } from 'react-hot-toast';

const usePushNotifications = (userId) => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    const urlBase64ToUint8Array = (base64String) => {
        if (!base64String) return new Uint8Array(0);
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            toast.error("Push notifications are not supported by this browser.");
            return;
        }

        setLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;

            // Get public key from backend
            const { data } = await axios.get('/notifications/vapid-key');

            if (!data || !data.publicKey) {
                console.error("VAPID Key missing from server response", data);
                toast.error("Push service unavailable (Missing Key).");
                return;
            }

            const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);

            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });

            // Send to backend
            await axios.post('/notifications/subscribe', {
                subscription,
                userId
            });

            setIsSubscribed(true);
            toast.success("Notifications Enabled!");
        } catch (error) {
            console.error("Push Subscription Error:", error);
            if (Notification.permission === 'denied') {
                toast.error("You denied notifications. Please enable them in browser settings.");
            } else {
                toast.error("Failed to enable notifications.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Optional: Check status on mount
    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    setIsSubscribed(!!sub);
                });
            });
        }
    }, []);

    return { subscribeToPush, isSubscribed, loading };
};

export default usePushNotifications;
