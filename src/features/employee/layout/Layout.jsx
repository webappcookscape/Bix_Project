import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import usePushNotifications from "../../../shared/hooks/usePushNotifications";
import useHaptics from "../../../shared/hooks/useHaptics";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { subscribeToPush, isSubscribed, loading } = usePushNotifications(user?.id);
  const { trigger } = useHaptics();

  const handleSidebarToggle = () => {
    trigger('light');
    setSidebarOpen(!sidebarOpen);
  };

  const handleNotificationActivate = async () => {
    trigger('light');
    await subscribeToPush();
    if (!isSubscribed) trigger('success'); // Trigger success haptic after subscription
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">

      {/* SIDEBAR */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar setSidebarOpen={handleSidebarToggle} />

        <main
          className="flex-1 h-full overflow-y-auto bg-gray-100 p-2 sm:p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          {!isSubscribed && (
            <div
              onClick={!loading ? handleNotificationActivate : undefined}
              className="mb-6 bg-indigo-600 rounded-2xl p-5 shadow-lg shadow-indigo-100 flex items-center justify-between cursor-pointer hover:bg-indigo-700 transition-all group overflow-hidden relative"
            >
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

              <div className="flex items-center relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm">
                  <span className="text-2xl text-white">🔔</span>
                </div>
                <div>
                  <p className="font-bold text-white text-lg">Enable Notifications</p>
                  <p className="text-sm text-indigo-100">Get instant updates on your tasks.</p>
                </div>
              </div>
              <button className="bg-white text-indigo-600 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm whitespace-nowrap ml-4 active:scale-95 transition-transform relative z-10">
                {loading ? 'Processing...' : 'Activate Now'}
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default Layout;
