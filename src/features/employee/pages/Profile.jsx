import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Shield, LogOut } from 'lucide-react';
import { clearInternalAuth } from '../../../shared/utils/auth';

const Profile = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        clearInternalAuth();
        navigate('/login', { replace: true });
    };

    const getInitials = (name) =>
        (name || "User").split(" ").map(word => word[0]).join("").toUpperCase();

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-black text-slate-800">My Profile</h1>

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center">
                <div className="w-24 h-24 bg-[#FF7A00] text-3xl font-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ring-8 ring-slate-50 text-white">
                    {getInitials(user.name)}
                </div>
                <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                <p className="text-slate-500 font-medium">{user.department || 'Operations'}</p>
                <div className="mt-2 inline-block px-3 py-1 bg-orange-50 text-[#FF7A00] rounded-full text-xs font-black uppercase tracking-wider">
                    {user.role}
                </div>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                <div className="p-6 border-b border-slate-50">
                    <h3 className="font-bold text-slate-800">Contact Information</h3>
                </div>
                <div className="divide-y divide-slate-50">
                    <div className="p-6 flex items-center gap-4">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                            <p className="text-slate-700 font-medium">{user.email}</p>
                        </div>
                    </div>
                    <div className="p-6 flex items-center gap-4">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                            <p className="text-slate-700 font-medium">{user.phone || 'Not Provided'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleLogout}
                className="w-full py-4 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
            >
                <LogOut className="w-5 h-5" />
                Sign Out
            </button>
        </div>
    );
};

export default Profile;
