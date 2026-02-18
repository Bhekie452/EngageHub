import React, { useState, useEffect } from 'react';
import { ArrowRight, Play, CheckCircle, Zap, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

// Social media icons as SVG components
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.16c0 2.52-1.12 4.84-2.9 6.39-1.78 1.54-4.12 2.14-6.35 1.74-2.23-.4-4.21-1.79-5.24-3.96-.96-2.01-1.05-4.46-.26-6.52 1.03-2.68 3.17-4.85 5.82-5.86 2.38-.91 5.1-.61 7.14.89 1.24.91 2.07 2.3 2.32 3.83v4.23c-.02-.63-.26-1.23-.66-1.68-.51-.58-1.28-.89-2.12-.77-.55.08-1.07.33-1.48.71-.52.49-.73 1.2-.57 1.85.2.83.99 1.39 1.82 1.23.65-.12 1.17-.62 1.41-1.22.28-.68.23-1.47.13-2.2a4.33 4.33 0 0 0-3.93-4.28c-2.12-.19-4.14.87-5.12 2.58-.82 1.43-1.08 3.14-.7 4.75.43 1.82 1.68 3.36 3.5 4.16 1.77.78 3.85.71 5.55-.23 1.56-.86 2.67-2.33 3.05-4.01V12.5c-.28-.45-.54-.92-.68-1.41-.1-.35-.15-.71-.15-1.08V.02z"/>
  </svg>
);

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

// Platform data with colors
const platforms = [
  { name: 'Instagram', icon: InstagramIcon, color: 'from-pink-500 via-purple-500 to-blue-500', bgColor: 'bg-pink-500', textColor: 'text-white' },
  { name: 'TikTok', icon: TikTokIcon, color: 'from-cyan-400 via-pink-400 to-black', bgColor: 'bg-cyan-400', textColor: 'text-white' },
  { name: 'YouTube', icon: YouTubeIcon, color: 'from-red-500 to-red-600', bgColor: 'bg-red-500', textColor: 'text-white' },
  { name: 'Facebook', icon: FacebookIcon, color: 'from-blue-500 to-blue-700', bgColor: 'bg-blue-500', textColor: 'text-white' },
  { name: 'X', icon: XIcon, color: 'from-gray-700 to-black', bgColor: 'bg-gray-800', textColor: 'text-white' },
  { name: 'LinkedIn', icon: LinkedInIcon, color: 'from-blue-600 to-blue-800', bgColor: 'bg-blue-600', textColor: 'text-white' },
];

interface LandingHeroProps {
    onGetStarted: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onGetStarted }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % 3);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0e1a]">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
                
                {/* Animated gradient orbs */}
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-600/20 via-indigo-500/15 to-transparent rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-purple-600/20 via-pink-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-700/10 via-indigo-600/10 to-purple-700/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                
                {/* Additional glow accents */}
                <div className="absolute top-1/4 right-1/3 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-pink-500/15 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
                {/* Left content - KEPT EXACTLY SAME */}
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

                    <p className="text-xs text-slate-500 mt-2">
                        14-day free trial. No credit card required. Cancel anytime.
                    </p>
                </div>

                {/* RIGHT SIDE - COMPLETELY REDESIGNED with 3D Orbital Social Media Visual */}
                <div className="relative">
                    {/* Main orbital container */}
                    <div className="relative w-full aspect-square max-w-lg mx-auto">
                        {/* Central core glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full blur-2xl opacity-60 animate-pulse"></div>
                        
                        {/* Central hub - glassmorphism sphere */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-blue-500/30 via-indigo-500/30 to-purple-500/30 rounded-full backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center z-20">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-white">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                    <line x1="2" y1="20" x2="22" y2="20"></line>
                                </svg>
                            </div>
                        </div>

                        {/* Orbital rings */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-blue-500/20 rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] border border-purple-500/15 rounded-full animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }}></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-cyan-500/10 rounded-full animate-spin" style={{ animationDuration: '30s' }}></div>

                        {/* Platform icons in orbital positions */}
                        {/* Instagram - Top position */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 animate-float" style={{ animationDelay: '0s' }}>
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
                                <div className="relative w-16 h-16 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
                                    <InstagramIcon className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* TikTok - Top right */}
                        <div className="absolute top-[15%] right-[10%] animate-float" style={{ animationDelay: '0.5s' }}>
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-pink-400 to-black rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
                                <div className="relative w-14 h-14 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
                                    <TikTokIcon className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* YouTube - Right */}
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-2 animate-float" style={{ animationDelay: '1s' }}>
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
                                <div className="relative w-16 h-16 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
                                    <YouTubeIcon className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Facebook - Bottom right */}
                        <div className="absolute bottom-[15%] right-[10%] animate-float" style={{ animationDelay: '1.5s' }}>
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
                                <div className="relative w-14 h-14 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
                                    <FacebookIcon className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* X - Bottom */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 animate-float" style={{ animationDelay: '2s' }}>
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-gradient-to-r from-gray-700 to-black rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
                                <div className="relative w-14 h-14 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
                                    <XIcon className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* LinkedIn - Bottom left */}
                        <div className="absolute bottom-[15%] left-[10%] animate-float" style={{ animationDelay: '2.5s' }}>
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
                                <div className="relative w-14 h-14 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
                                    <LinkedInIcon className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Left - duplicate Instagram for symmetry */}
                        <div className="absolute top-[15%] left-[10%] animate-float" style={{ animationDelay: '3s' }}>
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
                                <div className="relative w-12 h-12 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-cyan-400">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional floating particles/effects */}
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/60 rounded-full animate-ping"></div>
                    <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-purple-400/40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-cyan-400/50 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-pink-400/40 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center p-1">
                    <div className="w-1.5 h-3 bg-slate-500 rounded-full"></div>
                </div>
            </div>

            {/* Custom CSS for floating animation */}
            <style>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px) translateX(0px);
                    }
                    25% {
                        transform: translateY(-10px) translateX(5px);
                    }
                    50% {
                        transform: translateY(-5px) translateX(-5px);
                    }
                    75% {
                        transform: translateY(-15px) translateX(3px);
                    }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>
        </section>
    );
};
