import React, { useState, useEffect } from 'react';
import { dispatchSafeEvent } from '../../../shared/utils/eventUtils';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from '../../../shared/utils/axios';
import {
    LayoutDashboard,
    ClipboardList,
    Briefcase,
    MapPin,
    LogOut,
    Settings,
    UserCircle,
    ChevronLeft,
    Shield,
    MessageSquare,
    Mail,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clearInternalAuth } from '../../../shared/utils/auth';

const Sidebar = ({ isOpen, setIsOpen, isMobile }) => {
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(localStorage.getItem('supervisorSidebarCollapsed') === 'true');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                if (!user.id) return;
                const res = await axios.get(`/emails/unread?userId=${user.id}`);
                setUnreadCount(res.data.count);
            } catch (error) {
                console.error("Error fetching unread count:", error);
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 30000); // 30s Poll
        return () => clearInterval(interval);
    }, [user.id]);

    const handleLogout = () => {
        clearInternalAuth();
        navigate('/login', { replace: true });
    };

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('supervisorSidebarCollapsed', newState);
        dispatchSafeEvent('supervisor_sidebar_toggle');
    };

    const links = [
        { label: 'Dashboard', path: '/supervisor/dashboard', icon: LayoutDashboard },
        { label: 'Projects', path: '/supervisor/projects', icon: Briefcase },
        { label: 'My Tasks', path: '/supervisor/tasks', icon: ClipboardList },
        { label: 'Team Chat', path: '/supervisor/chat', icon: MessageSquare },
        { label: 'Email', path: '/supervisor/email', icon: Mail },
        { label: 'Map View', path: '/supervisor/map', icon: MapPin }, // Placeholder for future
        { label: 'Profile', path: '/supervisor/profile', icon: UserCircle },
    ];



    return (
        <>
            {/* Backdrop for mobile */}
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black z-40 md:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            <aside
                className={`
                    fixed top-0 left-0 h-screen bg-slate-900 text-white z-[100] shadow-2xl flex flex-col border-r border-slate-800 
                    transition-all duration-300 ease-in-out
                    ${isOpen || !isMobile ? "translate-x-0" : "-translate-x-full"}
                    ${!isMobile ? (isCollapsed ? "md:w-20 md:static md:relative overflow-visible md:z-40" : "md:w-64 md:static md:relative overflow-visible md:z-40") : "w-72"}
                `}
            >
                {/* Collapse Toggle - Desktop */}
                {!isMobile && (
                    <button
                        onClick={toggleCollapse}
                        className="absolute -right-3 top-20 bg-indigo-600 text-white rounded-full p-1 shadow-lg ring-4 ring-slate-900 hover:bg-indigo-700 transition-all z-[100] flex items-center justify-center cursor-pointer active:scale-95"
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                )}
                {/* Header */}
                <div className={`h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950/50 ${isCollapsed ? 'justify-center px-0' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        {!isCollapsed && (
                            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                                <h1 className="font-bold text-lg tracking-tight">Orbix Projects</h1>
                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Site Operations</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                    {!isCollapsed && <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4 mb-4">Menu</div>}
                    {links.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            onClick={() => isMobile && setIsOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden
                                ${isActive
                                    ? 'bg-indigo-600/10 text-indigo-400 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                                }
                                ${isCollapsed ? 'justify-center px-0' : ''}
                            `}
                            title={isCollapsed ? link.label : ""}
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full"
                                        />
                                    )}
                                    <link.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-500' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                    {!isCollapsed && (
                                        <span className="font-medium text-sm animate-in fade-in slide-in-from-left-2 duration-300">
                                            {link.label}
                                        </span>
                                    )}

                                    {link.label === "Email" && unreadCount > 0 && (
                                        <span className={`absolute ${isCollapsed ? 'top-2 right-2' : 'right-3 top-1/2 -translate-y-1/2'} bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center shadow-sm`}>
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className={`p-4 border-t border-slate-800 bg-slate-950/30 ${isCollapsed ? 'flex justify-center' : ''}`}>
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : ''}`}
                        title={isCollapsed ? "Sign Out" : ""}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span className="font-medium text-sm">Sign Out</span>}
                    </button>


                </div>
            </aside>
        </>
    );
};

export default Sidebar;
