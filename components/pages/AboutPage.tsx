import React, { useMemo, useState } from 'react';
import { Mail, BarChart3, TrendingUp, MessageSquare, Users } from 'lucide-react';

type AboutTab = 'story' | 'team' | 'news' | 'contact';

const tabs: Array<{ id: AboutTab; label: string }> = [
    { id: 'story', label: 'OUR STORY' },
    { id: 'team', label: 'LEADERSHIP TEAM' },
    { id: 'news', label: 'COMPANY NEWS' },
    { id: 'contact', label: 'GET IN TOUCH' },
];

export const AboutPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AboutTab>('story');
    const [contactForm, setContactForm] = useState({
        fullName: '',
        email: '',
        company: '',
        message: '',
    });
    const [contactStatus, setContactStatus] = useState<'idle' | 'sent'>('idle');

    const content = useMemo(() => {
        switch (activeTab) {
            case 'team':
                return {
                    title: 'Leadership team',
                    body: (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { name: 'Product & Strategy', role: 'ERP design, integrations, roadmap' },
                                { name: 'Engineering & Platform', role: 'Security, reliability, data layer' },
                                { name: 'Implementation & Success', role: 'Onboarding, training, rollout' },
                            ].map((p) => (
                                <div key={p.name} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600" />
                                    <h3 className="mt-4 font-bold text-gray-900">{p.name}</h3>
                                    <p className="mt-1 text-sm text-gray-600">{p.role}</p>
                                </div>
                            ))}
                        </div>
                    ),
                };
            case 'news':
                return {
                    title: 'Company news',
                    body: (
                        <div className="space-y-4">
                            {[
                                { date: 'Jan 2026', title: 'EngageHub ERP expands social integrations and unified reporting' },
                                { date: 'Dec 2025', title: 'New workflow automations for approvals, tasks, and scheduling' },
                                { date: 'Nov 2025', title: 'Unified data layer: customers, conversations, and campaigns in one system' },
                            ].map((n) => (
                                <div key={n.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <p className="text-xs font-semibold text-gray-500">{n.date}</p>
                                    <p className="mt-1 font-bold text-gray-900">{n.title}</p>
                                </div>
                            ))}
                        </div>
                    ),
                };
            case 'contact':
                return {
                    title: 'Get in touch',
                    body: (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                                <Mail className="w-6 h-6 text-blue-700 flex-shrink-0" />
                                <span className="font-bold text-gray-900">Email</span>
                                <a
                                    href="mailto:support@engagehub.co.za"
                                    className="text-gray-600 text-sm hover:text-blue-700 break-all"
                                >
                                    support@engagehub.co.za
                                </a>
                            </div>

                            <form
                                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    setContactStatus('sent');
                                    // Lightweight: open user's email client with prefilled message
                                    const subject = encodeURIComponent('EngageHub ERP - Contact request');
                                    const body = encodeURIComponent(
                                        `Name: ${contactForm.fullName}\n` +
                                        `Email: ${contactForm.email}\n` +
                                        `Company: ${contactForm.company}\n\n` +
                                        `${contactForm.message}\n`
                                    );
                                    window.location.href = `mailto:support@engagehub.co.za?subject=${subject}&body=${body}`;
                                }}
                            >
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2">Full name</label>
                                        <input
                                            value={contactForm.fullName}
                                            onChange={(e) => setContactForm((s) => ({ ...s, fullName: e.target.value }))}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2">Work email</label>
                                        <input
                                            type="email"
                                            value={contactForm.email}
                                            onChange={(e) => setContactForm((s) => ({ ...s, email: e.target.value }))}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                            placeholder="name@company.com"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Company (optional)</label>
                                    <input
                                        value={contactForm.company}
                                        onChange={(e) => setContactForm((s) => ({ ...s, company: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                        placeholder="Company name"
                                    />
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Message</label>
                                    <textarea
                                        value={contactForm.message}
                                        onChange={(e) => setContactForm((s) => ({ ...s, message: e.target.value }))}
                                        required
                                        rows={5}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none"
                                        placeholder="Tell us what you want to integrate, your volume, and your timeline."
                                    />
                                </div>

                                <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                                    >
                                        Send message
                                    </button>
                                </div>

                                {contactStatus === 'sent' && (
                                    <p className="mt-4 text-sm font-semibold text-green-700">
                                        Thanks — opening your email app now.
                                    </p>
                                )}
                            </form>
                        </div>
                    ),
                };
            case 'story':
            default:
                return {
                    title: 'One ERP for your entire social operation',
                    body: (
                        <div className="space-y-5 text-[15px] leading-relaxed text-gray-700">
                            <p>
                                EngageHub is an ERP-style system built to run your full social media operation end-to-end. Instead of juggling separate
                                tools for publishing, messaging, contacts, reporting, and approvals, EngageHub centralizes everything into one platform.
                            </p>
                            <p>
                                We integrate your social platforms into a single workflow: plan and schedule content, route conversations to the right
                                team member, capture customer context in the CRM, and measure performance with unified analytics—across all channels.
                            </p>
                            <p>
                                The result is operational clarity: fewer missed messages, faster response times, consistent brand execution, and
                                measurable growth—backed by one source of truth for your social and customer data.
                            </p>
                            <p>
                                EngageHub supports **unlimited social accounts and users**, with plans differentiated by usage volume (posts and contacts),
                                so your system can scale as your business scales.
                            </p>
                        </div>
                    ),
                };
        }
    }, [activeTab]);

    return (
        <section className="py-14 md:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900">About Us</h1>
                </div>

                {/* Tabs */}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    {tabs.map((t) => {
                        const isActive = t.id === activeTab;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setActiveTab(t.id)}
                                className={`min-w-[160px] px-6 py-3 text-sm font-bold tracking-wide rounded-md border transition-colors ${
                                    isActive
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-900 border-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="mt-14 grid lg:grid-cols-12 gap-10 items-start">
                    <div className="lg:col-span-6">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900">{content.title}</h2>
                        <div className="mt-6">{content.body}</div>

                        <div className="mt-10">
                            <a
                                href="/"
                                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                            >
                                Get Started
                            </a>
                        </div>
                    </div>

                    <div className="lg:col-span-6">
                        {/* ERP dashboard preview (pure UI mock) */}
                        <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                            {/* Top glow */}
                            <div className="absolute -top-24 -right-24 h-56 w-56 bg-blue-500/15 blur-3xl" />
                            <div className="absolute -bottom-24 -left-24 h-56 w-56 bg-indigo-500/15 blur-3xl" />

                            {/* App chrome */}
                            <div className="flex">
                                {/* Sidebar */}
                                <div className="hidden sm:block w-24 md:w-28 border-r border-gray-200 bg-gray-50/60 p-4">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600" />
                                    <div className="mt-6 space-y-3">
                                        {[
                                            { Icon: BarChart3, active: true },
                                            { Icon: MessageSquare, active: false },
                                            { Icon: Users, active: false },
                                            { Icon: TrendingUp, active: false },
                                        ].map(({ Icon, active }, idx) => (
                                            <div
                                                key={idx}
                                                className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                                                    active
                                                        ? 'bg-white border-blue-200 text-blue-700 shadow-sm'
                                                        : 'bg-white/60 border-gray-200 text-gray-500'
                                                }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Main */}
                                <div className="flex-1 p-5 md:p-6 relative">
                                    {/* Header row */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500">ERP DASHBOARD</p>
                                            <h3 className="text-lg md:text-xl font-black text-slate-900">Unified Analytics</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-9 w-24 rounded-xl bg-gray-100 border border-gray-200" />
                                            <div className="h-9 w-9 rounded-xl bg-gray-100 border border-gray-200" />
                                        </div>
                                    </div>

                                    {/* KPI cards */}
                                    <div className="mt-5 grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-gray-500">Total Reach</p>
                                                <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                                                    +18%
                                                </span>
                                            </div>
                                            <p className="mt-2 text-2xl font-black text-slate-900">128.4k</p>
                                            <p className="mt-1 text-xs text-gray-500">Last 30 days</p>
                                        </div>
                                        <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-gray-500">Inbox SLA</p>
                                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full">
                                                    12m avg
                                                </span>
                                            </div>
                                            <p className="mt-2 text-2xl font-black text-slate-900">96%</p>
                                            <p className="mt-1 text-xs text-gray-500">Replies within target</p>
                                        </div>
                                    </div>

                                    {/* Chart + activity */}
                                    <div className="mt-3 grid md:grid-cols-5 gap-3">
                                        <div className="md:col-span-3 rounded-2xl border border-gray-200 bg-white p-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-gray-500">Engagement Trend</p>
                                                <p className="text-xs font-bold text-gray-400">All platforms</p>
                                            </div>
                                            <div className="mt-4 flex items-end gap-2 h-28">
                                                {[22, 40, 28, 55, 46, 70, 60, 78, 66, 92].map((h, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-full rounded-lg bg-gradient-to-t ${
                                                            i === 9 ? 'from-indigo-600 to-blue-500' : 'from-gray-200 to-gray-100'
                                                        }`}
                                                        style={{ height: `${h}%` }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                                                <span>Week 1</span>
                                                <span>Week 2</span>
                                                <span>Week 3</span>
                                                <span>Week 4</span>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-4">
                                            <p className="text-xs font-bold text-gray-500">Live Ops</p>
                                            <div className="mt-4 space-y-3">
                                                {[
                                                    { title: 'Approval completed', meta: 'Campaign: Q1 Launch' },
                                                    { title: 'New DM assigned', meta: 'Instagram → Support' },
                                                    { title: 'Order tagged from comment', meta: 'Facebook → CRM' },
                                                ].map((a) => (
                                                    <div key={a.title} className="flex items-start gap-3">
                                                        <div className="h-8 w-8 rounded-xl bg-gray-100 border border-gray-200" />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-900 truncate">{a.title}</p>
                                                            <p className="text-xs text-gray-500 truncate">{a.meta}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3">
                                                <p className="text-xs font-semibold opacity-90">Unified view</p>
                                                <p className="text-sm font-black">Social + CRM + Analytics</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
