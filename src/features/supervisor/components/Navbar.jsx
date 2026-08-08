import React from 'react';
import { Menu, Bell, Search, MapPin, ExternalLink } from 'lucide-react';

const Navbar = ({ setSidebarOpen, searchTerm, setSearchTerm }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <header className="sticky top-0 w-full h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 px-4 sm:px-8 flex items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div className="hidden md:flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 leading-none">Welcome back, {user.name?.split(' ')[0] || 'AE'}</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Here's your site activity overview</p>
                </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
                {/* Switch to CRM Button */}
                <a
                    href="https://crm.orbixdesigns.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                    <span className="hidden sm:inline">Switch to CRM</span>
                    <span className="sm:hidden">CRM</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {/* Search Bar (Visual only for now) */}
                <div className="hidden sm:flex items-center bg-slate-100 rounded-full px-4 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 ml-2 w-48"
                    />
                </div>

                {/* Location Indicator */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wide">Live Access</span>
                </div>

                {/* Notifications */}
                <button className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
                </button>

                {/* Profile Pic */}
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-slate-100">
                        {user.name?.charAt(0) || 'S'}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
