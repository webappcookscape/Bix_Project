import { useCallback } from 'react';

/**
 * Hook for triggered haptic feedback on mobile devices.
 * Uses navigator.vibrate for Android.
 * For iOS, we rely on Framer Motion's scale-down effects for visual haptics
 * since the Web Vibrations API is not supported on iOS Safari.
 */
const useHaptics = () => {
    const trigger = useCallback((type = 'light') => {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            switch (type) {
                case 'light':
                    navigator.vibrate(10);
                    break;
                case 'medium':
                    navigator.vibrate(20);
                    break;
                case 'heavy':
                    navigator.vibrate(35);
                    break;
                case 'success':
                    navigator.vibrate([10, 30, 10]);
                    break;
                case 'error':
                    navigator.vibrate([20, 50, 20]);
                    break;
                default:
                    navigator.vibrate(10);
            }
        }
    }, []);

    return { trigger };
};

export default useHaptics;
