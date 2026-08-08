import { Routes, Route, Navigate } from 'react-router-dom';
import SupervisorLayout from './layout/SupervisorLayout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Profile from './pages/Profile';
import MapView from './pages/MapView';
import Chat from './pages/Chat';
import Email from './pages/Email';
import Projects from './pages/Projects';
import ProjectTasks from './pages/ProjectTasks';

const SupervisorApp = () => {
    return (
        <Routes>
            <Route path="/" element={<SupervisorLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="tasks/:taskId" element={<TaskDetail />} />
                <Route path="map" element={<MapView />} />
                <Route path="chat" element={<Chat />} />
                <Route path="email" element={<Email />} />
                <Route path="projects" element={<Projects />} />
                <Route path="project/:projectId" element={<ProjectTasks />} />
                <Route path="profile" element={<Profile />} />
            </Route>
        </Routes>
    );
};

export default SupervisorApp;
