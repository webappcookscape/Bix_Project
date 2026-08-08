import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, ExternalLink } from 'lucide-react';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 transition-colors duration-500">
            {/* Sidebar */}
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="relative flex flex-col flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 scroll-smooth">
                {/* Mobile Topbar */}
                <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 bg-white/80 backdrop-blur-md border-b border-slate-200 lg:hidden shadow-sm shadow-slate-200/50">
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <span className="ml-4 text-xs font-bold tracking-widest text-orange-500 uppercase">COOKSCAPE</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <a
                            href="https://crm.orbixdesigns.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/10 cursor-pointer"
                        >
                            <span>CRM</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <div className="flex items-center bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mr-2">{user.name?.split(' ')[0] || 'User'}</span>
                            <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center text-[10px] font-black">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">
                    <div className="max-w-[1920px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
