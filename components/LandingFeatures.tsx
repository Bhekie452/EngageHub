import React, { useState } from 'react';
import {
    Share2,
    MessageCircle,
    Calendar,
    BarChart3,
    Zap,
    ArrowRight,
    Instagram,
    Facebook,
    Twitter,
    Linkedin,
    Youtube,
    MessageSquare,
    Clock,
    TrendingUp,
    Users,
    Workflow,
    Timer,
    Link2
} from 'lucide-react';

const features = [
    {
        title: 'Social Media Management',
        icon: Share2,
        gradient: 'from-blue-500 via-cyan-500 to-teal-500',
        glowColor: 'blue',
        bulletPoints: [
            { icon: Instagram, text: 'Multi-platform support' },
            { icon: Share2, text: 'Unified dashboard' },
            { icon: Clock, text: 'Scheduled posting' }
        ]
    },
    {
        title: 'Customer Engagement',
        icon: MessageCircle,
        gradient: 'from-purple-500 via-pink-500 to-rose-500',
        glowColor: 'purple',
        bulletPoints: [
            { icon: BarChart3, text: 'Real-time analytics' },
            { icon: MessageSquare, text: 'Comment management' },
            { icon: MessageCircle, text: 'Direct messaging' }
        ]
    },
    {
        title: 'Content Scheduling',
        icon: Calendar,
        gradient: 'from-emerald-500 via-green-500 to-teal-500',
        glowColor: 'green',
        bulletPoints: [
            { icon: Zap, text: 'Advanced scheduling' },
            { icon: Calendar, text: 'Content calendar' },
            { icon: ArrowRight, text: 'Auto-posting' }
        ]
    },
    {
        title: 'Analytics & Insights',
        icon: TrendingUp,
        gradient: 'from-orange-500 via-red-500 to-pink-500',
        glowColor: 'orange',
        bulletPoints: [
            { icon: BarChart3, text: 'Detailed analytics' },
            { icon: TrendingUp, text: 'Performance metrics' },
            { icon: Users, text: 'Growth tracking' }
        ]
    },
    {
        title: 'Automation Tools',
        icon: Workflow,
        gradient: 'from-indigo-500 via-violet-500 to-purple-500',
        glowColor: 'indigo',
        bulletPoints: [
            { icon: Workflow, text: 'Workflow automation' },
            { icon: Zap, text: 'Smart triggers' },
            { icon: Link2, text: 'Time-saving integrations' }
        ]
    }
];

export const LandingFeatures: React.FC = () => {
    const [isPaused, setIsPaused] = useState(false);

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0">
                {/* Gradient orbs */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-100 via-indigo-100 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-purple-100 via-pink-100 to-transparent rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section header */}
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
                        <Zap className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-600">POWERFUL FEATURES</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900">
                        Everything you need to
                        <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            grow on social
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Manage, schedule, engage, and analyze across all platforms — from one dashboard.
                    </p>
                </div>

                {/* Horizontal scrolling feature cards */}
                <div 
                    className="relative overflow-hidden mb-16"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Gradient fade edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

                    {/* Scrolling container */}
                    <div 
                        className="flex gap-6 overflow-x-auto scrollbar-hide"
                        style={{ 
                            animation: isPaused ? 'none' : 'scroll-left 25s linear infinite',
                            scrollBehavior: 'auto'
                        }}
                    >
                        {/* First set of cards */}
                        {features.map((feature, index) => (
                            <FeatureCard key={`first-${index}`} feature={feature} index={index} />
                        ))}
                        {/* Duplicate for seamless loop */}
                        {features.map((feature, index) => (
                            <FeatureCard key={`second-${index}`} feature={feature} index={index} />
                        ))}
                    </div>
                </div>

                {/* Mini dashboard snippet */}
                <div className="relative max-w-4xl mx-auto">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 rounded-2xl blur-lg opacity-20"></div>
                    <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Stats */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Performance</h4>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-bold text-gray-900">12.5K</span>
                                    <span className="text-emerald-600 text-sm flex items-center">
                                        <TrendingUp className="w-4 h-4 mr-1" />
                                        +23%
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm">Total reach this week</p>
                                {/* Mini chart */}
                                <div className="h-16 flex items-end gap-1">
                                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((height, i) => (
                                        <div 
                                            key={i} 
                                            className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t"
                                            style={{ height: `${height}%` }}
                                        ></div>
                                    ))}
                                </div>
                            </div>

                            {/* Calendar preview */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Scheduled</h4>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-200 flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <span className="text-2xl font-bold text-gray-900">24</span>
                                        <span className="text-gray-500 text-sm ml-2">posts</span>
                                    </div>
                                </div>
                                <p className="text-gray-500 text-sm">Scheduled for this week</p>
                                {/* Week dots */}
                                <div className="flex gap-2">
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                        <div key={i} className="flex flex-col items-center gap-1">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${i < 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                {day}
                                            </div>
                                            <div className={`w-1.5 h-1.5 rounded-full ${i < 3 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Messages preview */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Engagement</h4>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 flex items-center justify-center">
                                        <MessageCircle className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <span className="text-2xl font-bold text-gray-900">156</span>
                                        <span className="text-gray-500 text-sm ml-2">messages</span>
                                    </div>
                                </div>
                                <p className="text-gray-500 text-sm">Unified inbox</p>
                                {/* Message bubbles */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
                                            <Instagram className="w-3 h-3 text-pink-500" />
                                        </div>
                                        <div className="flex-1 bg-gray-100 rounded-lg rounded-tl-none px-3 py-2">
                                            <p className="text-xs text-gray-600">New comment on your post!</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Facebook className="w-3 h-3 text-blue-500" />
                                        </div>
                                        <div className="flex-1 bg-gray-100 rounded-lg rounded-tl-none px-3 py-2">
                                            <p className="text-xs text-gray-600">New message received</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom CSS */}
            <style>{`
                @keyframes scroll-left {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </section>
    );
};

// Feature Card Component
const FeatureCard: React.FC<{ feature: typeof features[0]; index: number }> = ({ feature, index }) => {
    const Icon = feature.icon;
    
    return (
        <div 
            className="group relative min-w-[340px] flex-shrink-0 animate-float"
            style={{ animationDelay: `${index * 0.5}s` }}
        >
            {/* Glow background */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur-lg`}></div>
            
            {/* Card */}
            <div className="relative h-full bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-lg p-6 transition-all duration-500 group-hover:border-gray-200 group-hover:translate-y-[-4px] group-hover:shadow-xl">
                {/* Shimmer effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ transform: 'translateX(-100%)', animation: 'shimmer 2s infinite' }}></div>
                
                {/* Floating icon */}
                <div className="relative mb-6">
                    <div className="absolute -inset-2 bg-gradient-to-r from-gray-100 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-black/10`}>
                        <Icon className="w-8 h-8 text-white" />
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-700 transition-all">
                    {feature.title}
                </h3>

                {/* Bullet points */}
                <ul className="space-y-3">
                    {feature.bulletPoints.map((point, pointIndex) => {
                        const PointIcon = point.icon;
                        return (
                            <li key={pointIndex} className="flex items-center gap-3 group/item">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${feature.gradient} opacity-10 group-hover/item:opacity-20 transition-opacity flex items-center justify-center`}>
                                    <PointIcon className="w-4 h-4 text-gray-600" />
                                </div>
                                <span className="text-gray-600 group-hover/item:text-gray-800 transition-colors text-sm">
                                    {point.text}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};
