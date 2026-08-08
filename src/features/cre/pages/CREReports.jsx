import React, { useState } from 'react';
import { LayoutDashboard, FileText, History, TrendingUp } from 'lucide-react';
import WalkinHub from './WalkinHub';
import WorkReports from './WorkReports';
import MonthlyReports from './MonthlyReports';

const CREReports = () => {
    const [activeTab, setActiveTab] = useState('walkin');
    const isDark = false;

    const tabs = [
        { id: 'walkin', name: 'Walk-in Hub', icon: LayoutDashboard },
        { id: 'work', name: 'Work Reports', icon: FileText },
        { id: 'monthly', name: 'Monthly Data', icon: History }
    ];

    return (
        <div className="space-y-6">
            {/* Premium Tab Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-widest flex items-center">
                        CRE <span className="text-orange-500 ml-2">REPORTS</span>
                    </h1>
                    <p className="text-slate-500 text-xs font-bold tracking-[0.2em] mt-1 uppercase">Unified Performance & Activity Dashboard</p>
                </div>

                <div className="flex p-1.5 bg-slate-100/80 backdrop-blur-md rounded-[24px] border border-slate-200/50 shadow-inner">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                                activeTab === tab.id 
                                    ? 'bg-white text-orange-500 shadow-sm ring-1 ring-slate-200/50' 
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <tab.icon className={`w-3.5 h-3.5 mr-2 ${activeTab === tab.id ? 'text-orange-500' : 'text-slate-400'}`} />
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-4">
                {activeTab === 'walkin' && <WalkinHub hideHeader={true} />}
                {activeTab === 'work' && <WorkReports hideHeader={true} />}
                {activeTab === 'monthly' && <MonthlyReports hideHeader={true} />}
            </div>
        </div>
    );
};

export default CREReports;
