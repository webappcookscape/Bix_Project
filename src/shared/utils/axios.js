import axios from "axios";
import { dispatchSafeEvent } from "./eventUtils";
import { clearClientAuth, clearInternalAuth } from "./auth";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:5000/api"),
    headers: {},
});

// Request Counter
let activeRequests = 0;

// Request Interceptor: Attach Token & Start Loading
api.interceptors.request.use(
    (config) => {
        if (activeRequests === 0) {
            dispatchSafeEvent('loading-start');
        }
        activeRequests++;
        
        // ... previous token logic ...
        const isClientRoute = window.location.pathname.startsWith('/client');
        let token;
        if (isClientRoute) {
            token = localStorage.getItem("clientToken");
        } else {
            token = localStorage.getItem("token");
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        activeRequests--;
        if (activeRequests === 0) {
            dispatchSafeEvent('loading-end');
        }
        return Promise.reject(error);
    }
);

// Response Interceptor: Error Handling & Stop Loading
api.interceptors.response.use(
    (response) => {
        activeRequests--;
        if (activeRequests === 0) {
            dispatchSafeEvent('loading-end');
        }
        return response;
    },
    (error) => {
        activeRequests--;
        if (activeRequests === 0) {
            dispatchSafeEvent('loading-end');
        }

        if (error.response && error.response.status === 401) {
            dispatchSafeEvent('auth-error', { message: 'Unauthorized' });
            const isClientRoute = window.location.pathname.startsWith('/client');
            if (isClientRoute) {
                clearClientAuth();
            } else {
                clearInternalAuth();
            }
        }
        return Promise.reject(error);
    }
);

export default api;
