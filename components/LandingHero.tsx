import React from 'react';
import { ArrowRight, Play, Sparkles } from 'lucide-react';

interface LandingHeroProps {
    onGetStarted: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onGetStarted }) => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
                {/* Left content */}
                <div className="text-center md:text-left space-y-8">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200 shadow-lg">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-700">AI-Powered Business Command Center</span>
                    </div>

                    {/* Main heading */}
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-tight">
                        Grow Your Business
                        <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            On Autopilot
                        </span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                        Manage social media, engage customers, and drive sales—all from one powerful platform designed for solo entrepreneurs.
                    </p>

                    {/* CTA buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <button
                            onClick={onGetStarted}
                            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            Start Free Trial
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button className="group px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-blue-600 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2">
                            <Play className="w-5 h-5 text-blue-600" />
                            Watch Demo
                        </button>
                    </div>

                    {/* Social proof */}
                    <div className="flex items-center gap-6 justify-center md:justify-start pt-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white"></div>
                            ))}
                        </div>
                        <div className="text-left">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-sm text-gray-600 font-medium">Trusted by 500+ entrepreneurs</p>
                        </div>
                    </div>
                </div>

                {/* Right content - Hero image */}
                <div className="relative">
                    <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                        <img
                            src="/hero_illustration_1768373618970.png"
                            alt="EngageHub Dashboard Preview"
                            className="w-full h-auto"
                        />
                    </div>

                    {/* Floating cards for visual interest */}
                    <div className="absolute -top-6 -left-6 w-32 h-32 bg-white rounded-2xl shadow-xl p-4 hidden lg:block animate-bounce" style={{ animationDuration: '3s' }}>
                        <div className="text-3xl font-black text-blue-600">+250%</div>
                        <div className="text-xs text-gray-600 font-semibold">Engagement</div>
                    </div>

                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white rounded-2xl shadow-xl p-4 hidden lg:block animate-bounce" style={{ animationDuration: '3s', animationDelay: '1s' }}>
                        <div className="text-3xl font-black text-purple-600">5hrs</div>
                        <div className="text-xs text-gray-600 font-semibold">Saved Daily</div>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center p-1">
                    <div className="w-1.5 h-3 bg-gray-400 rounded-full"></div>
                </div>
            </div>
        </section>
    );
};
