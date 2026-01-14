import React from 'react';
import {
    Sparkles,
    Share2,
    Users,
    BarChart3,
    Megaphone,
    Zap,
    Calendar,
    Inbox
} from 'lucide-react';

const features = [
    {
        icon: Sparkles,
        title: 'AI Content Studio',
        description: 'Generate engaging posts, captions, and content ideas powered by advanced AI in seconds.',
        gradient: 'from-blue-500 to-cyan-500'
    },
    {
        icon: Share2,
        title: 'Social Media Management',
        description: 'Connect and manage all your social platforms from one unified dashboard.',
        gradient: 'from-purple-500 to-pink-500'
    },
    {
        icon: Users,
        title: 'Smart CRM',
        description: 'Track customers, manage deals, and nurture relationships effortlessly.',
        gradient: 'from-orange-500 to-red-500'
    },
    {
        icon: BarChart3,
        title: 'Advanced Analytics',
        description: 'Get actionable insights with beautiful dashboards and real-time reporting.',
        gradient: 'from-green-500 to-emerald-500'
    },
    {
        icon: Megaphone,
        title: 'Campaign Management',
        description: 'Plan, execute, and track marketing campaigns across all channels seamlessly.',
        gradient: 'from-indigo-500 to-purple-500'
    },
    {
        icon: Zap,
        title: 'Automations',
        description: 'Automate repetitive tasks and workflows to save hours every week.',
        gradient: 'from-yellow-500 to-orange-500'
    },
    {
        icon: Calendar,
        title: 'Content Calendar',
        description: 'Schedule and organize your content strategy with an intuitive visual calendar.',
        gradient: 'from-teal-500 to-cyan-500'
    },
    {
        icon: Inbox,
        title: 'Unified Inbox',
        description: 'Respond to messages from all platforms in one central inbox. Never miss a conversation.',
        gradient: 'from-rose-500 to-pink-500'
    }
];

export const LandingFeatures: React.FC = () => {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-30"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section header */}
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
                        <span className="text-sm font-bold text-blue-600">FEATURES</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900">
                        Everything You Need to
                        <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Succeed Online
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        A complete business command center designed for entrepreneurs who want to do more with less.
                    </p>
                </div>

                {/* Features grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                            >
                                {/* Gradient border on hover */}
                                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl`}></div>

                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom CTA */}
                <div className="mt-16 text-center">
                    <p className="text-gray-600 mb-4">Ready to transform your business?</p>
                    <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                        Explore All Features
                    </button>
                </div>
            </div>
        </section>
    );
};
