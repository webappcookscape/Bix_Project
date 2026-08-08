import React, { useState, useEffect } from 'react';
import axios from '../../../shared/utils/axios';
import ChatInterface from '../../../shared/components/ChatInterface';

const Chat = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await axios.get('/projects');
            // Filter projects: 
            // 1. Where user is explicitly assigned as a team member
            // 2. OR where user has at least one task assigned in that project
            const myProjects = response.data.filter(p =>
                p.assignedEmployees?.some(emp => emp.id === user.id) ||
                p.tasks?.some(t => t.employeeId === user.id)
            );
            setProjects(myProjects);
        } catch (error) {
            console.error("Error fetching projects for chat:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] sm:h-[calc(100vh-100px)] p-0">
            <div className="mb-6 hidden sm:block">
                <h1 className="text-2xl font-black text-slate-800">Team Chat</h1>
                <p className="text-slate-500 font-medium text-sm">Communicate with your project teams</p>
            </div>
            <div className="flex-1 overflow-hidden">
                <ChatInterface
                    projects={projects}
                    currentUser={{ name: user.name || "Supervisor", id: user.id }}
                    role="SITE_SUPERVISOR"
                />
            </div>
        </div>
    );
};

export default Chat;
