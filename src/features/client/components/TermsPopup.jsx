import React from "react";
import { ShieldCheck } from "lucide-react";

/**
 * TermsPopup Component
 * Displays a modal requiring users to accept Terms and Conditions.
 * @param {Object} props
 * @param {Function} props.onAccept - Callback when the user accepts the terms.
 */
const TermsPopup = ({ onAccept }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="bg-indigo-600 p-6 flex flex-col items-center text-white">
                    <div className="bg-white/20 p-3 rounded-full mb-4">
                        <ShieldCheck size={40} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">Terms & Conditions</h2>
                    <p className="text-indigo-100 text-sm mt-1">Please review and accept to continue</p>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh] text-gray-700 space-y-4">
                    <section>
                        <h3 className="font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h3>
                        <p className="text-sm leading-relaxed">
                            By accessing and using this Task Manager Application, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the service.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-gray-900 mb-2">2. Data Privacy</h3>
                        <p className="text-sm leading-relaxed">
                            We value your privacy. Your task data is stored securely and is only accessible by authorized users within your organization. We do not sell your personal information to third parties.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-gray-900 mb-2">3. User Responsibilities</h3>
                        <p className="text-sm leading-relaxed">
                            You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-gray-900 mb-2">4. Service Modifications</h3>
                        <p className="text-sm leading-relaxed">
                            We reserve the right to modify or discontinue the service at any time without prior notice. Continuous use of the app constitutes acceptance of any changes to these terms.
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onAccept}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-200"
                    >
                        I Accept the Terms
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsPopup;
