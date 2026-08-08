import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, LogOut, History, ExternalLink } from 'lucide-react';

const Sidebar = ({ open, onClose }) => {
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const links = [
        { name: 'CRE Reports', path: '/cre/reports', icon: LayoutDashboard },
    ];

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform ${open ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-sm`}>
            <div className="flex flex-col h-full uppercase tracking-tighter">
                <div className="flex items-center px-6 h-20 border-b border-slate-50 justify-between">
                    <h1 className="text-xl font-black tracking-[0.2em] text-orange-500">COOKSCAPE</h1>
                </div>

                {/* Profile Section */}
                <div className="px-6 py-8 border-b border-slate-50 bg-slate-50/50">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-orange-500/20">
                            {user.name?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-[10px] font-black text-slate-900 truncate leading-tight uppercase tracking-widest">{user.name || 'User'}</p>
                            <p className="text-[8px] font-black text-orange-500 mt-1 uppercase tracking-[0.2em]">CRE Professional</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2">
                    {links.map((link) => (
                        <NavLink
                            key={link.name}
                            to={link.path}
                            onClick={onClose}
                            className={({ isActive }) => `flex items-center px-4 py-3 text-xs font-black rounded-2xl transition-all duration-300 uppercase tracking-widest ${isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100'}`}
                        >
                            <link.icon className="w-4 h-4 mr-3" />
                            {link.name}
                        </NavLink>
                    ))}

                    <a
                        href="https://crm.orbixdesigns.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-3 text-xs font-black rounded-2xl transition-all duration-300 uppercase tracking-widest text-orange-500 hover:bg-orange-50 hover:text-orange-600 border border-orange-200/50 hover:border-orange-200 bg-orange-50/20"
                    >
                        <ExternalLink className="w-4 h-4 mr-3" />
                        Switch to CRM
                    </a>
                </nav>

                <div className="p-4 border-t border-slate-50">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-xs font-black text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 uppercase tracking-widest"
                    >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
