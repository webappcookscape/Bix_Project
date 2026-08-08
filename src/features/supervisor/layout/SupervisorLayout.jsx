import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import useMediaQuery from '../../../shared/hooks/useMediaQuery';

const SupervisorLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    // Close sidebar when switching to desktop mode to reset state if needed, 
    // though Sidebar logic handles !isMobile (isDesktop) to always show.
    // Use media query logic or simple state for mobile checking if strictly needed,
    // but here we just pass the state down. The Sidebar component handles CSS-based visibility 
    // (fixed left-0 md:visible etc) but we also need to control the 'open' state for mobile drawer.
    // Let's refine the Sidebar component to handle 'isMobile' logic via CSS or prop if needed.
    // For now, we control the mobile drawer via sidebarOpen state.

    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                isMobile={!isDesktop}
            />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <Navbar
                    setSidebarOpen={setSidebarOpen}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />

                <main className="flex-1 transition-all duration-300 py-8 px-4 sm:px-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <Outlet context={{ searchTerm, setSearchTerm }} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SupervisorLayout;
