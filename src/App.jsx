import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import AdminApp from '@admin/App';
import EmployeeApp from '@employee/App';
import SupervisorApp from '@supervisor/App';
import ClientApp from '@client/App';
import CREApp from './features/cre/App';

import Login from './pages/Login';
import ClientLogin from './pages/ClientLogin';
import ForgotPassword from './pages/ForgotPassword';
import { Toaster } from 'react-hot-toast';
import ReloadPrompt from './components/pwa/ReloadPrompt';
import {
    ADMIN_ROLES,
    CRE_ROLES,
    EMPLOYEE_ROLES,
    SUPERVISOR_ROLES,
    clearInternalAuth,
    getClientToken,
    getDefaultAppRoute,
    getDefaultInternalRoute,
    getInternalToken,
    getStoredUser,
    hasAllowedRole,
} from './shared/utils/auth';

// Smart Redirect Component
const RootRedirect = () => {
    return <Navigate to={getDefaultAppRoute()} replace />;
};

const PublicOnlyRoute = ({ children }) => {
    const target = getDefaultAppRoute();
    return target === "/login" ? children : <Navigate to={target} replace />;
};

const RequireInternalAuth = ({ allowedRoles, children }) => {
    const token = getInternalToken();
    const user = getStoredUser();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (!hasAllowedRole(allowedRoles, user)) {
        return <Navigate to={getDefaultInternalRoute(user)} replace />;
    }

    return children;
};

const RequireClientAuth = ({ children }) => {
    if (!getClientToken()) {
        return <Navigate to="/client/login" replace />;
    }

    return children;
};

const AuthEventBridge = () => {
    const navigate = useNavigate();
    const location = useLocation();

    React.useEffect(() => {
        const handleAuthError = () => {
            const isClientArea = location.pathname.startsWith("/client");
            if (!isClientArea) {
                clearInternalAuth();
            }
            navigate(isClientArea ? "/client/login" : "/login", { replace: true });
        };

        window.addEventListener("auth-error", handleAuthError);
        return () => window.removeEventListener("auth-error", handleAuthError);
    }, [location.pathname, navigate]);

    return null;
};

function App() {
    return (
        <>
            <ReloadPrompt />
            <Toaster position="top-center" />
            <BrowserRouter>
                <AuthEventBridge />
                <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/client/login" element={<PublicOnlyRoute><ClientLogin /></PublicOnlyRoute>} />

                    {/* Feature Routes */}
                    <Route
                        path="/admin/*"
                        element={
                            <RequireInternalAuth allowedRoles={ADMIN_ROLES}>
                                <AdminApp />
                            </RequireInternalAuth>
                        }
                    />
                    <Route
                        path="/employee/*"
                        element={
                            <RequireInternalAuth allowedRoles={EMPLOYEE_ROLES}>
                                <EmployeeApp />
                            </RequireInternalAuth>
                        }
                    />
                    <Route
                        path="/supervisor/*"
                        element={
                            <RequireInternalAuth allowedRoles={SUPERVISOR_ROLES}>
                                <SupervisorApp />
                            </RequireInternalAuth>
                        }
                    />
                    <Route
                        path="/client/*"
                        element={
                            <RequireClientAuth>
                                <ClientApp />
                            </RequireClientAuth>
                        }
                    />
                    <Route
                        path="/cre/*"
                        element={
                            <RequireInternalAuth allowedRoles={CRE_ROLES}>
                                <CREApp />
                            </RequireInternalAuth>
                        }
                    />


                    {/* Fallback */}
                    <Route path="*" element={<RootRedirect />} />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
