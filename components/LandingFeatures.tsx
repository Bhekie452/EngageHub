import React from 'react';
import { Share2, Users, PenTool, BarChart3, Wifi, MessageCircle, CheckCircle, Sparkles, Brain, ClipboardList, Calendar, Megaphone, TrendingUp, Target, Zap } from 'lucide-react';

export const LandingFeatures: React.FC = () => {
    return (
        <section className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section header */}
                <div className="text-center mb-20 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-bold text-indigo-600">POWERFUL FEATURES</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900">
                        Everything you need to
                        <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            dominate social media
                        </span>
                    </h2>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        Four powerful pillars that automate your entire social media marketing workflow.
                    </p>
                </div>

                {/* 4 Unique Feature Cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    
                    {/* Card 1: Social Media Connect */}
                    <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-200/40 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <Share2 className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900">Social Media Connect</h3>
                                    <p className="text-sm text-blue-600 font-semibold">All platforms, one dashboard</p>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Connect Instagram, TikTok, YouTube, Facebook, X, and LinkedIn. Manage every account, respond to DMs, and publish content from a single unified interface.
                            </p>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {['Instagram', 'TikTok', 'YouTube', 'Facebook', 'X', 'LinkedIn'].map((p) => (
                                    <span key={p} className="px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 border border-gray-200 shadow-sm">
                                        {p}
                                    </span>
                                ))}
                            </div>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Wifi className="w-4 h-4 text-blue-500" /> One-click OAuth connection
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <MessageCircle className="w-4 h-4 text-blue-500" /> Unified inbox for all DMs
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Megaphone className="w-4 h-4 text-blue-500" /> Unified voice across channels
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Card 2: CRM & Task Management */}
                    <div className="group relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-100 hover:shadow-2xl hover:shadow-amber-100/50 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-amber-200/40 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900">CRM & Task Management</h3>
                                    <p className="text-sm text-amber-600 font-semibold">Turn followers into customers</p>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Track leads, manage customer relationships, and organize your team with built-in task management. Never lose a lead or miss a follow-up again.
                            </p>
                            <div className="flex items-center gap-1 mb-6">
                                {['Lead', 'Contact', 'Prospect', 'Customer'].map((stage, i) => (
                                    <React.Fragment key={stage}>
                                        <div className={`px-3 py-2 rounded-lg text-xs font-bold text-white ${
                                            i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-amber-500' : i === 2 ? 'bg-orange-500' : 'bg-orange-600'
                                        }`}>
                                            {stage}
                                        </div>
                                        {i < 3 && <div className="w-4 h-0.5 bg-amber-300"></div>}
                                    </React.Fragment>
                                ))}
                            </div>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <ClipboardList className="w-4 h-4 text-amber-500" /> Kanban task boards
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Target className="w-4 h-4 text-amber-500" /> Lead scoring & pipeline
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 text-amber-500" /> Automated follow-ups
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Card 3: AI Content Creation */}
                    <div className="group relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-100 hover:shadow-2xl hover:shadow-purple-100/50 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                        <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-200/40 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <PenTool className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900">AI Content Creation</h3>
                                    <p className="text-sm text-purple-600 font-semibold">Generate posts in your brand voice</p>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Let AI write, design, and schedule your posts. Generate content that matches your brand voice, create visuals, and auto-reply to comments with AI-powered responses.
                            </p>
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-purple-100 p-4 mb-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                    <span className="text-xs font-bold text-purple-600">AI GENERATED POST</span>
                                </div>
                                <div className="h-2 bg-purple-200/50 rounded-full w-full mb-2"></div>
                                <div className="h-2 bg-purple-200/50 rounded-full w-4/5 mb-2"></div>
                                <div className="h-2 bg-purple-200/50 rounded-full w-3/5"></div>
                            </div>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Brain className="w-4 h-4 text-purple-500" /> AI auto-reply in your brand voice
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <PenTool className="w-4 h-4 text-purple-500" /> AI-generated captions & visuals
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 text-purple-500" /> Smart schedule & auto-post
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Card 4: AI-Powered Insights */}
                    <div className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-emerald-200/40 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <BarChart3 className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900">AI-Powered Insights</h3>
                                    <p className="text-sm text-emerald-600 font-semibold">Data-driven growth decisions</p>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Get actionable insights powered by AI. Track engagement, identify best posting times, analyze audience demographics, and receive personalized growth recommendations.
                            </p>
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-100 p-4 mb-6 shadow-sm">
                                <div className="flex items-end gap-1.5 h-16">
                                    {[35, 50, 40, 65, 55, 80, 60, 90, 70, 100, 85, 95].map((h, i) => (
                                        <div 
                                            key={i} 
                                            className="flex-1 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t opacity-80"
                                            style={{ height: `${h}%` }}
                                        ></div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1 mt-2">
                                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                                    <span className="text-xs font-bold text-emerald-600">+47% engagement this month</span>
                                </div>
                            </div>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Real-time performance dashboards
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Zap className="w-4 h-4 text-emerald-500" /> AI growth recommendations
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Competitor benchmarking
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};
