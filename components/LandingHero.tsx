import React, { useState, useEffect } from 'react';
import { ArrowRight, Play, CheckCircle, Zap, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

const dashboardScreens = [
    {
        title: 'Analytics Dashboard',
        description: 'Real-time engagement metrics',
        gradient: 'from-blue-500 to-indigo-600'
    },
    {
        title: 'Content Calendar',
        description: 'Schedule posts across all platforms',
        gradient: 'from-purple-500 to-pink-600'
    },
    {
        title: 'Unified Inbox',
        description: 'All your messages in one place',
        gradient: 'from-emerald-500 to-teal-600'
    }
];

interface LandingHeroProps {
    onGetStarted: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onGetStarted }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % dashboardScreens.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-emerald-500/20 via-teal-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-600/5 to-indigo-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
                {/* Left content */}
                <div className="text-center md:text-left space-y-8">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-700 shadow-lg">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-semibold text-slate-200">AI-Powered Growth Engine</span>
                    </div>

                    {/* Main heading */}
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight">
                        All Your Social Media.
                        <span className="block mt-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-teal-400 bg-clip-text text-transparent">
                            One Powerful Platform.
                        </span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-xl md:text-2xl text-slate-400 leading-relaxed max-w-2xl">
                        Schedule, analyze, and engage across all your social accounts from a single dashboard. Join 10,000+ businesses growing their audience.
                    </p>

                    {/* CTA buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <button
                            onClick={onGetStarted}
                            className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            Start Free Trial
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button className="group px-8 py-4 bg-slate-800/80 backdrop-blur-sm text-slate-200 font-semibold rounded-xl border border-slate-700 hover:border-slate-600 hover:bg-slate-700/80 transition-all duration-300 flex items-center justify-center gap-2">
                            <Play className="w-5 h-5" />
                            Watch Demo
                        </button>
                    </div>

                    {/* Trust signal */}
                    <div className="pt-4">
                        <p className="text-sm text-slate-400 font-medium">
                            <span className="font-bold text-white">Trusted by 10,000+ businesses.</span> Saving teams 20+ hours weekly.
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                            14-day free trial. No credit card required. Cancel anytime.
                        </p>
                    </div>
                </div>

                {/* Right content - Dashboard carousel */}
                <div className="relative">
                    <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl bg-slate-800">
                        {/* Carousel slides */}
                        <div className="aspect-video relative">
                            {dashboardScreens.map((screen, index) => (
                                <div
                                    key={index}
                                    className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${screen.gradient} transition-opacity duration-500 ${
                                        index === currentSlide ? 'opacity-100' : 'opacity-0'
                                    }`}
                                >
                                    <div className="text-center text-white p-8">
                                        <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-2xl flex items-center justify-center">
                                            <BarChart3 className="w-12 h-12" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">{screen.title}</h3>
                                        <p className="text-white/80">{screen.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Carousel controls */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {dashboardScreens.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                        index === currentSlide ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                    
                    {/* Floating elements */}
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-500 rounded-2xl shadow-lg flex items-center justify-center animate-bounce" style={{ animationDuration: '2s' }}>
                        <Zap className="w-10 h-10 text-white" />
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center p-1">
                    <div className="w-1.5 h-3 bg-slate-500 rounded-full"></div>
                </div>
            </div>
        </section>
    );
};
