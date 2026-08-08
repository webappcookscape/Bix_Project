import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { CREProvider } from './context/CREContext';
import CREReports from './pages/CREReports';

const CREApp = () => {
    return (
        <CREProvider>
            <Layout>
                <Routes>
                    <Route path="/" element={<Navigate to="reports" replace />} />
                    <Route path="reports" element={<CREReports />} />
                    {/* Legacy routes redirecting to unified dashboard */}
                    <Route path="walkin-hub" element={<Navigate to="../reports" replace />} />
                    <Route path="work-reports" element={<Navigate to="../reports" replace />} />
                    <Route path="monthly-reports" element={<Navigate to="../reports" replace />} />
                    <Route path="*" element={<Navigate to="reports" replace />} />
                </Routes>
            </Layout>
        </CREProvider>
    );
};


export default CREApp;
