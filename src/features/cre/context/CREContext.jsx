import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../../shared/utils/axios';
import { formatDate } from '../../../shared/utils/dateFormatter';
import toast from 'react-hot-toast';

const CREContext = createContext(null);

export const CREProvider = ({ children }) => {
    const [walkins, setWalkins] = useState([]);
    const [reports, setReports] = useState([]);
    const [bhs, setBhs] = useState([]);
    const [cres, setCres] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        activeVisitors: 0,
        totalToday: 0,
        pendingReports: 0
    });

    const fetchBhs = async () => {
        try {
            const res = await api.get('/employees/bhs');
            setBhs(res.data);
        } catch (error) {
            console.error('[CREContext] Error fetching BHs:', error);
        }
    };

    const fetchCres = async () => {
        try {
            const res = await api.get('/employees/cres');
            setCres(res.data);
        } catch (error) {
            console.error('[CREContext] Error fetching CREs:', error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data);
        } catch (error) {
            console.error('[CREContext] Error fetching all employees:', error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            await Promise.all([fetchBhs(), fetchCres(), fetchEmployees()]);
            const [walkinsRes, reportsRes] = await Promise.all([
                api.get('/walkins/hub'),
                api.get('/walkins/reports')
            ]);
            setWalkins(walkinsRes.data);
            setReports(reportsRes.data);
        } catch (error) {
            console.error('[CREContext] Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) fetchData();
    }, []);

    // Derived Stats
    useEffect(() => {
        const today = formatDate(new Date());
        const active = walkins.filter(w => w.status === 'ACTIVE').length;
        const totalToday = walkins.filter(w => formatDate(w.createdAt) === today).length;
        const pendingReports = reports.filter(r => !r.status || r.status === 'N').length;

        setStats({ activeVisitors: active, totalToday, pendingReports });
    }, [walkins, reports]);

    // Actions
    const addWalkin = async (data) => {
        try {
            const res = await api.post('/walkins/hub', data);
            setWalkins(prev => [res.data, ...prev]);
            toast.success("Visitor entry created!");
            return { success: true };
        } catch (error) {
            console.error('[CREContext] Add Walkin Error:', error);
            const msg = error.response?.data?.error || error.message;
            toast.error(msg);
            return { success: false, error: msg };
        }
    };

    const updateWalkin = async (id, updates) => {
        try {
            const res = await api.patch(`/walkins/hub/${id}`, updates);
            setWalkins(prev => prev.map(w => w.id === id ? res.data : w));
            toast.success("Visitor updated!");
            return { success: true };
        } catch (error) {
            console.error('[CREContext] Update Walkin Error:', error);
            toast.error(error.message);
            return { success: false, error: error.message };
        }
    };

    const deleteWalkin = async (id) => {
        try {
            if (!window.confirm("Are you sure you want to delete this visitor entry?")) return { success: false };
            await api.delete(`/walkins/hub/${id}`);
            setWalkins(prev => prev.filter(w => w.id !== id));
            toast.success("Entry deleted successfully!");
            return { success: true };
        } catch (error) {
            console.error('[CREContext] Delete Walkin Error:', error);
            const msg = error.response?.status === 403 ? "Access Denied: Super Admin or Manager only" : error.message;
            toast.error(msg);
            return { success: false, error: msg };
        }
    };

    const addReport = async (data) => {
        try {
            const res = await api.post('/walkins/reports', data);
            setReports(prev => [res.data, ...prev]);
            return { success: true };
        } catch (error) {
            console.error('[CREContext] Add Report Error:', error);
            return { success: false, error: error.message };
        }
    };

    const updateReport = async (id, updates) => {
        try {
            const res = await api.patch(`/walkins/reports/${id}`, updates);
            setReports(prev => prev.map(r => r.id === id ? res.data : r));
            toast.success("Report updated!");
            return { success: true };
        } catch (error) {
            console.error('[CREContext] Update Report Error:', error);
            toast.error(error.message);
            return { success: false, error: error.message };
        }
    };

    const deleteWorkReport = async (id) => {
        try {
            if (!window.confirm("Are you sure you want to delete this work report?")) return { success: false };
            await api.delete(`/walkins/reports/${id}`);
            setReports(prev => prev.filter(r => r.id !== id));
            toast.success("Report deleted successfully!");
            return { success: true };
        } catch (error) {
            console.error('[CREContext] Delete Report Error:', error);
            const msg = error.response?.status === 403 ? "Access Denied: Super Admin or Manager only" : error.message;
            toast.error(msg);
            return { success: false, error: msg };
        }
    };

    const value = {
        walkins,
        reports,
        bhs,
        cres,
        employees,
        loading,
        stats,
        refreshData: fetchData,
        addWalkin,
        updateWalkin,
        deleteWalkin,
        addReport,
        updateReport,
        deleteWorkReport
    };

    return <CREContext.Provider value={value}>{children}</CREContext.Provider>;
};

export const useCRE = () => {
    const context = useContext(CREContext);
    if (!context) throw new Error('useCRE must be used within a CREProvider');
    return context;
};
