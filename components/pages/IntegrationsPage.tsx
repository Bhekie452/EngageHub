import React from 'react';
import {
    Facebook,
    Instagram,
    Linkedin,
    Youtube,
    Twitter,
    MessageCircle,
    Mail,
    BarChart3,
    ArrowRight,
} from 'lucide-react';

const integrations = [
    { name: 'Facebook', Icon: Facebook, color: 'text-blue-600', desc: 'Pages, ads, and messenger' },
    { name: 'Instagram', Icon: Instagram, color: 'text-pink-600', desc: 'Posts, stories, and DMs' },
    { name: 'LinkedIn', Icon: Linkedin, color: 'text-blue-700', desc: 'Posts and InMail' },
    { name: 'YouTube', Icon: Youtube, color: 'text-red-600', desc: 'Uploads and community' },
    { name: 'X (Twitter)', Icon: Twitter, color: 'text-gray-900', desc: 'Tweets and DMs' },
    { name: 'WhatsApp', Icon: MessageCircle, color: 'text-green-600', desc: 'Business messaging' },
    { name: 'Email', Icon: Mail, color: 'text-gray-600', desc: 'Inbox and campaigns' },
];

export const IntegrationsPage: React.FC = () => (
    <section className="py-16 md:py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-20" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full">
                    <span className="text-sm font-bold text-indigo-600">INTEGRATIONS</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900">
                    Works with the Tools
                    <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        You Already Use
                    </span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    One command center for social, email, and CRM. Connect your accounts and manage everything from one place.
                </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {integrations.map(({ name, Icon, color, desc }) => (
                    <div
                        key={name}
                        className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all duration-300"
                    >
                        <div className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center ${color}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{name}</h3>
                            <p className="text-sm text-gray-500">{desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-16 p-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 text-center">
                <BarChart3 className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">API & custom integrations</h3>
                <p className="text-gray-600 max-w-xl mx-auto mb-6">
                    Need to plug in your own tools? Our API and webhooks let you sync data and automate workflows your way.
                </p>
                <a href="/about" className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:underline">
                    Get in touch for API access <ArrowRight className="w-4 h-4" />
                </a>
            </div>

            <div className="mt-12 text-center">
                <a
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                >
                    Start Free Trial
                </a>
            </div>
        </div>
    </section>
);
