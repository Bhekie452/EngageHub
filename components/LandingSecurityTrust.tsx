import React from 'react';
import { Shield, Lock, Eye, CreditCard } from 'lucide-react';

export const LandingSecurityTrust: React.FC = () => {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-20"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section header */}
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
                        <span className="text-sm font-bold text-blue-600">SECURITY & TRUST</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900">
                        Your Data is Protected
                        <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Your Billing is Transparent
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        We take security seriously. With transparent billing, you're always in control.
                    </p>
                </div>

                {/* Security & Trust Grid */}
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Data Security */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                                <Shield className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900">Data Security</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            With <span className="font-bold text-gray-900">149 million logins leaked globally in 2025</span>, security is our priority. EngageHub uses bank-grade encryption and secure OAuth connections to protect your brand and customer data.
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-sm text-gray-600">
                            <Lock className="w-4 h-4" />
                            <span>End-to-end encryption</span>
                        </div>
                    </div>

                    {/* Transparent Billing */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                                <CreditCard className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900">Transparent Billing</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            No hidden fees. Our usage-based model means you only pay for what you consume, with real-time dashboards to track your credits. No bill shock—ever.
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-sm text-gray-600">
                            <Eye className="w-4 h-4" />
                            <span>Real-time usage tracking</span>
                        </div>
                    </div>
                </div>

                {/* Local Support Note */}
                <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-full border border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">
                            🇿🇦 Priced in <span className="font-bold text-gray-900">ZAR</span> with local support
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                        Many global tools deliver slower experiences and higher costs in Africa. We're built for South African businesses.
                    </p>
                </div>
            </div>
        </section>
    );
};
