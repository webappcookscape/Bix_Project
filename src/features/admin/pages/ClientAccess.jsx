import React, { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import axios from "../../../shared/utils/axios"; // Import Axios
import { Link2, Copy, Search, User, Globe, Hash, X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ClientAccess = () => {
  const { projects } = useApp();
  const [selectedProjectCode, setSelectedProjectCode] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Get selected project details for display
  const selectedProject = projects.find(p => p.projectCode === selectedProjectCode);

  const filteredProjects = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return projects.slice(0, 10); // Show initial 10 if empty
    return projects.filter((p) => {
      return (
        p.name?.toLowerCase().includes(q) ||
        p.projectCode?.toLowerCase().includes(q) ||
        p.clientName?.toLowerCase().includes(q)
      );
    });
  }, [projects, searchQuery]);

  const handleSelect = (p) => {
    setSelectedProjectCode(p.projectCode);
    setSearchQuery(""); // Clear search
    setShowResults(false);
    setGeneratedLink(""); // Reset link on new selection
  };

  const handleGenerate = async () => {
    if (!selectedProjectCode) {
      alert("Select a project first");
      return;
    }

    const project = projects.find((p) => p.projectCode === selectedProjectCode);

    try {
      const res = await axios.get(`/projects/${project.id}/access-link`);
      // The backend returns { token, url }
      // We can use the URL directly provided by backend, OR construct it if we want custom domain control.
      // Backend returns: url: `${process.env.FRONTEND_URL}/client/login?token=${token}`
      // This is safer.
      // Use the short code returned by backend
      const code = res.data.code;
      setGeneratedLink(`${window.location.origin}/client/login?code=${code}`);
    } catch (err) {
      console.error("Error generating link:", err);
      alert("Failed to generate secure link");
    }
  };

  const copyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      alert("Link copied to clipboard");
    } catch {
      alert("Unable to copy. Please copy manually.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 border-l-4 border-orange-500 pl-4 py-1">
          Client Access Portal
        </h1>
        <p className="text-sm text-slate-500 ml-5 mt-1">
          Generate secure, one-click login links for your clients.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: GENERATOR */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-8 space-y-8 relative overflow-visible">

            {/* SEARCH & AUTOCOMPLETE */}
            <div className="space-y-3 relative">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Find Project or Client
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-4 text-brand-500" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, client, or ID..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium
                             focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all outline-none"
                  value={searchQuery}
                  onFocus={() => setShowResults(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                />

                {/* FLOATING RESULTS */}
                <AnimatePresence>
                  {showResults && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      className="absolute top-[110%] left-0 right-0 bg-white border border-slate-200 
                                 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[60] max-h-[350px] overflow-y-auto p-3 space-y-1"
                    >
                      <div className="px-4 py-2 border-b border-slate-50 mb-2 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {searchQuery ? `Search Results (${filteredProjects.length})` : 'Recent Projects'}
                        </span>
                        <button onClick={() => setShowResults(false)} className="text-slate-300 hover:text-slate-500">
                          <X size={14} />
                        </button>
                      </div>

                      {filteredProjects.length > 0 ? (
                        filteredProjects.map((p) => (
                          <button
                            key={p.projectCode}
                            onClick={() => handleSelect(p)}
                            className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-brand-50 
                                       text-left transition-all group active:scale-[0.99]"
                          >
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center 
                                            text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600 transition-all shadow-sm">
                              <Hash size={18} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-bold text-slate-800 group-hover:text-brand-700 transition-colors truncate">
                                {p.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg group-hover:bg-brand-200/50 group-hover:text-brand-700 transition-colors">
                                  {p.projectCode}
                                </span>
                                <p className="text-[11px] text-slate-400 font-medium truncate">
                                  {p.clientName}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-10 text-center space-y-3">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                            <Search size={32} />
                          </div>
                          <p className="text-sm text-slate-400 font-medium italic">No matches for "{searchQuery}"</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Backdrop to close */}
                {showResults && (
                  <div
                    className="fixed inset-0 z-50 bg-black/5 backdrop-blur-[1px]"
                    onClick={() => setShowResults(false)}
                  ></div>
                )}
              </div>
            </div>

            {/* SELECTION PREVIEW */}
            <AnimatePresence>
              {selectedProject && !showResults && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-brand-50/50 border-2 border-brand-100 rounded-[1.5rem] p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-indigo-100 shadow-xl flex items-center justify-center text-brand-600 ring-4 ring-brand-50">
                        <Globe size={28} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-brand-500 uppercase tracking-tighter">Current Selection</p>
                        <p className="font-black text-slate-900 text-lg leading-tight">{selectedProject.name}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedProject.clientName} • ID: {selectedProject.projectCode}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedProjectCode("")}
                      className="bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all p-2.5 rounded-xl shadow-sm"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* GENERATE BTN */}
            <button
              onClick={handleGenerate}
              disabled={!selectedProjectCode}
              className={`w-full flex items-center justify-center gap-3 rounded-2xl px-8 py-5 font-black text-base transition-all shadow-2xl
                         ${selectedProjectCode
                  ? 'bg-brand-500 text-white hover:bg-orange-600 hover:shadow-brand-500/20 active:scale-[0.98]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            >
              <Link2 size={24} />
              Generate Secure Hub Link
            </button>

            {/* OUTPUT */}
            {generatedLink && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 space-y-4 p-6 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl"
              >
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Client Portal URL</p>
                  <span className="text-[10px] bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-lg border border-brand-500/20 font-bold">Secure Link Ready</span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 text-xs border border-slate-700 
                    rounded-xl px-4 py-4 bg-slate-800/50 font-mono
                    text-orange-200 overflow-hidden text-ellipsis select-all"
                  >
                    {generatedLink}
                  </div>

                  <button
                    onClick={copyLink}
                    className="p-4 bg-brand-500 rounded-xl hover:bg-brand-400 transition-all text-white shadow-lg active:scale-90"
                    title="Copy Link"
                  >
                    <Copy size={22} />
                  </button>
                </div>

                <div className="flex items-start gap-3 text-slate-500 px-2 pt-2">
                  <div className="mt-1 bg-slate-800 p-1.5 rounded-lg text-brand-500"><Lock size={14} /></div>
                  <p className="text-[11px] leading-relaxed">
                    This encrypted URL bypasses standard login for this specific client, giving them instant access to their project's progress and milestones.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* RIGHT: INSTRUCTIONS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-black text-xl flex items-center gap-3 text-slate-900 leading-tight">
              <Globe size={24} className="text-brand-500" /> Share Project Hub
            </h3>

            <div className="space-y-6">
              <div className="flex gap-4 group">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center font-black text-brand-600 shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-all">1</div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Search & Select</p>
                  <p className="text-xs text-slate-500 mt-1">Use the smart search to find any active project or client by name.</p>
                </div>
              </div>

              <div className="flex gap-4 group">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center font-black text-brand-600 shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-all">2</div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Generate URL</p>
                  <p className="text-xs text-slate-500 mt-1">Our system creates an encrypted token that authorizes the link holder.</p>
                </div>
              </div>

              <div className="flex gap-4 group">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center font-black text-brand-600 shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-all">3</div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Copy & Send</p>
                  <p className="text-xs text-slate-500 mt-1">Share via WhatsApp or Email. Clients get a mobile-optimized dashboard.</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Links remain valid until you change the client password or delete the project.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientAccess;
