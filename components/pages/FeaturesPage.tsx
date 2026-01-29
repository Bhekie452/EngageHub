import React from 'react';
import {
    Sparkles,
    Share2,
    Users,
    BarChart3,
    Megaphone,
    Zap,
    Calendar,
    Inbox,
    ArrowRight,
} from 'lucide-react';

const features = [
    {
        icon: Sparkles,
        title: 'AI Content Studio',
        description: 'Our AI analyzes your unique "Brand Voice" to generate high-authority posts and visuals that sound exactly like you—delivered in seconds.',
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        icon: Users,
        title: 'Smart CRM & Sales Assistant',
        description: 'Predicts "win probability" and tells you exactly who to message first. Never let high-value prospects slip through the cracks.',
        gradient: 'from-orange-500 to-red-500',
    },
    {
        icon: Inbox,
        title: 'Unified Inbox',
        description: 'WhatsApp, Instagram, LinkedIn, and Email in one view. Decrease response times and answer 24/7 when you\'re offline.',
        gradient: 'from-rose-500 to-pink-500',
    },
    {
        icon: Zap,
        title: 'Marketing Automations',
        description: 'Hyper-personalized campaigns that trigger social, email, and CRM from behaviour. 90% of agency results for 5% of the cost.',
        gradient: 'from-yellow-500 to-orange-500',
    },
    {
        icon: Share2,
        title: 'Social Media Management',
        description: 'Connect all your platforms from one dashboard. No account limits—scale as you grow.',
        gradient: 'from-purple-500 to-pink-500',
    },
    {
        icon: BarChart3,
        title: 'Advanced Analytics',
        description: 'Actionable insights, dashboards, and real-time reporting. Track what matters to your business growth.',
        gradient: 'from-green-500 to-emerald-500',
    },
    {
        icon: Calendar,
        title: 'Content Calendar',
        description: 'Schedule and organize your content strategy with an intuitive visual calendar. Plan weeks ahead with confidence.',
        gradient: 'from-teal-500 to-cyan-500',
    },
    {
        icon: Megaphone,
        title: 'Campaign Management',
        description: 'Plan, execute, and track campaigns across all channels. Measure ROI and optimize in real-time.',
        gradient: 'from-indigo-500 to-purple-500',
    },
];

export const FeaturesPage: React.FC = () => (
    <section className="py-16 md:py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-30" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
                    <span className="text-sm font-bold text-blue-600">FEATURES</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900">
                    Everything You Need to
                    <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Succeed Online
                    </span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    A complete business command center designed for entrepreneurs who want to do more with less.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                        <div
                            key={index}
                            className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                        >
                            <div
                                className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl`}
                            />
                            <div
                                className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform duration-300`}
                            >
                                <Icon className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                        </div>
                    );
                })}
            </div>

            <div className="mt-16 text-center">
                <a
                    href="/"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                    Explore pricing <ArrowRight className="w-5 h-5" />
                </a>
            </div>
        </div>
    </section>
);
