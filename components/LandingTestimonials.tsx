import React, { useState } from 'react';
import { ArrowRight, Zap, MessageSquare, BarChart3, Users, Clock, CheckCircle2 } from 'lucide-react';

interface UseCase {
    title: string;
    persona: string;
    role: string;
    scenario: string;
    workflow: string[];
    outcome: string;
    quote: string;
    features: string[];
    icon: React.ReactNode;
    color: string;
    bgColor: string;
}

const useCases: UseCase[] = [
    {
        title: 'AI Content Generation',
        persona: 'Marcus Chen',
        role: 'Social Media Manager',
        scenario: 'Running social for a sustainable fashion brand with 3 channels and 15 posts/week',
        workflow: [
            'Monday morning: Open Content Studio in EngageHub',
            'Enter "Sustainable Fashion + Brand Voice" guidelines',
            'Click "Generate Week of Posts" → AI creates 15 unique captions in brand voice',
            'Review, edit any captions, add custom hashtags',
            'Schedule all posts to calendar for week',
        ],
        outcome: 'From 3 hours of writing to 20 minutes of flow',
        quote: 'The AI generates captions that sound exactly like our brand. I used to spend 3 hours on Monday writing posts — now I spend 20 minutes reviewing what the AI created.',
        features: ['AI Content Generation', 'Brand Voice', 'Bulk Scheduling'],
        icon: <Zap className="w-6 h-6" />,
        color: 'purple',
        bgColor: 'from-purple-50 to-pink-50',
    },
    {
        title: 'Unified Inbox Management',
        persona: 'Priya Kapoor',
        role: 'Community Manager',
        scenario: 'Managing DMs and replies across Instagram, TikTok, and YouTube for a growing tech startup',
        workflow: [
            'Morning: Open Unified Inbox → all DMs from 3 platforms in one feed',
            'See unresponded messages flagged at top',
            'Reply to customer DMs, TikTok comments, YouTube chats',
            'Assign AI auto-reply template for common questions',
            'Switch to Analytics tab to see response time improvements'
        ],
        outcome: 'Response time dropped from 4 hours to 15 minutes',
        quote: 'Before EngageHub, checking Instagram DMs, then switching to TikTok, then YouTube was chaos. Now everything is in one place. We went from 4-hour response times to 15 minutes.',
        features: ['Unified Inbox', 'AI Auto-Reply', 'Multi-Platform'],
        icon: <MessageSquare className="w-6 h-6" />,
        color: 'blue',
        bgColor: 'from-blue-50 to-cyan-50',
    },
    {
        title: 'Smart Scheduling',
        persona: 'Jessica Rodriguez',
        role: 'Growth Lead',
        scenario: 'Scheduling content for peak engagement on 8 different social accounts (2 per platform)',
        workflow: [
            'Open Calendar view in EngageHub',
            'Create a post → AI recommends best posting times per platform',
            'Content on Instagram business → Monday 2PM (audience active)',
            'Schedule fallback posts for secondary account at 6PM',
            'Set auto-repeat for high-performers on Thursdays & Sundays',
            'View 7-day forecast of all scheduled posts across channels'
        ],
        outcome: 'Posting at peak times increased engagement by 40%',
        quote: 'We were posting randomly throughout the day. Now EngageHub tells us exactly when our audience is most active. We let it auto-schedule at optimal times and engagement jumped 40%.',
        features: ['Smart Scheduling', 'Peak Hours', 'Auto-Repeat'],
        icon: <Clock className="w-6 h-6" />,
        color: 'orange',
        bgColor: 'from-orange-50 to-amber-50',
    },
    {
        title: 'CRM & Lead Conversion',
        persona: 'David Thompson',
        role: 'Sales Manager',
        scenario: 'Converting Instagram followers into qualified B2B leads for a software SaaS company',
        workflow: [
            'Open Social Listening → track brand mentions & DMs',
            'See engagement from high-intent followers (viewing product page, commenting on posts)',
            'Auto-add engaged followers to CRM with "Hot Lead" tag',
            'View lead pipeline: Awareness → Interest → Demo → Closed',
            'Set up automated follow-up email sequence for leads using integrations',
        ],
        outcome: '3 demo calls booked last week from Instagram engagement',
        quote: 'We were treating all followers the same. Now EngageHub shows us who\'s actually interested in our product. Last week alone, 3 demo calls came directly from Instagram followers we identified in the CRM.',
        features: ['Social Listening', 'CRM Pipeline', 'Lead Scoring'],
        icon: <Users className="w-6 h-6" />,
        color: 'emerald',
        bgColor: 'from-emerald-50 to-teal-50',
    }
];

export const LandingTestimonials: React.FC = () => {
    const [selectedUC, setSelectedUC] = useState<number>(0);
    const current = useCases[selectedUC];

    const getColorClasses = (color: string) => {
        const colorMap: { [key: string]: string } = {
            purple: 'text-purple-600 bg-purple-100/50 border-purple-200',
            blue: 'text-blue-600 bg-blue-100/50 border-blue-200',
            orange: 'text-orange-600 bg-orange-100/50 border-orange-200',
            emerald: 'text-emerald-600 bg-emerald-100/50 border-emerald-200',
        };
        return colorMap[color] || colorMap.blue;
    };

    const getBorderClasses = (color: string) => {
        const borderMap: { [key: string]: string } = {
            purple: 'border-purple-300 bg-purple-50',
            blue: 'border-blue-300 bg-blue-50',
            orange: 'border-orange-300 bg-orange-50',
            emerald: 'border-emerald-300 bg-emerald-50',
        };
        return borderMap[color] || borderMap.blue;
    };

    const getButtonClasses = (color: string) => {
        const buttonMap: { [key: string]: string } = {
            purple: 'bg-purple-600 hover:bg-purple-700',
            blue: 'bg-blue-600 hover:bg-blue-700',
            orange: 'bg-orange-600 hover:bg-orange-700',
            emerald: 'bg-emerald-600 hover:bg-emerald-700',
        };
        return buttonMap[color] || buttonMap.blue;
    };

    const getStepNumberClasses = (color: string) => {
        const stepMap: { [key: string]: string } = {
            purple: 'bg-purple-500',
            blue: 'bg-blue-500',
            orange: 'bg-orange-500',
            emerald: 'bg-emerald-500',
        };
        return stepMap[color] || stepMap.blue;
    };

    const getFeatureTagClasses = (color: string) => {
        const tagMap: { [key: string]: string } = {
            purple: 'bg-purple-50 text-purple-700 border-purple-200',
            blue: 'bg-blue-50 text-blue-700 border-blue-200',
            orange: 'bg-orange-50 text-orange-700 border-orange-200',
            emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
        return tagMap[color] || tagMap.blue;
    };

    const getCheckIconClasses = (color: string) => {
        const iconMap: { [key: string]: string } = {
            purple: 'text-purple-500',
            blue: 'text-blue-500',
            orange: 'text-orange-500',
            emerald: 'text-emerald-500',
        };
        return iconMap[color] || iconMap.blue;
    };

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-6">
                        <BarChart3 className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-bold text-gray-600">REAL-WORLD USE CASES</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                        How teams use EngageHub
                        <span className="block text-gray-500">to automate their workflow</span>
                    </h2>
                    <p className="text-lg text-gray-500 max-w-3xl mx-auto">
                        See how content creators, managers, and growth teams solve real challenges — from content creation to lead generation — with EngageHub features working together.
                    </p>
                </div>

                {/* Two Column Layout: Tabs + Detail */}
                <div className="grid lg:grid-cols-3 gap-12 items-start">
                    {/* Left: Use Case Navigation */}
                    <div className="lg:col-span-1 space-y-4">
                        {useCases.map((uc, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedUC(idx)}
                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 group ${
                                    selectedUC === idx
                                        ? `${getBorderClasses(uc.color)}`
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${getColorClasses(uc.color)}`}>
                                        {uc.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-gray-700">{uc.title}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">{uc.persona}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Right: Use Case Detail + Mockup */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                            {/* Dashboard mockup placeholder */}
                            <div className={`w-full h-80 bg-gradient-to-br ${current.bgColor} relative overflow-hidden flex items-center justify-center`}>
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute top-10 left-10 w-20 h-20 bg-gray-300 rounded-lg"></div>
                                    <div className="absolute top-20 right-20 w-32 h-24 bg-gray-300 rounded-lg"></div>
                                    <div className="absolute bottom-16 left-1/3 w-28 h-28 bg-gray-300 rounded-lg"></div>
                                </div>
                                <div className="relative text-center">
                                    <div className={`inline-flex items-center justify-center mb-4 p-3 rounded-xl ${getColorClasses(current.color)}`}>
                                        {current.icon}
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium">{current.title} in Action</p>
                                    <p className="text-gray-400 text-xs mt-1">(Dashboard screenshot here)</p>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-8">
                                {/* Persona */}
                                <div>
                                    <p className="text-xs uppercase font-bold text-gray-400 mb-2">Persona</p>
                                    <h3 className="text-2xl font-black text-gray-900">{current.persona}</h3>
                                    <p className="text-gray-500 font-medium mt-1">{current.role}</p>
                                    <p className="text-sm text-gray-500 mt-2">{current.scenario}</p>
                                </div>

                        {/* Workflow Steps */}
                                <div>
                                    <p className="text-xs uppercase font-bold text-gray-400 mb-4">How They Use EngageHub</p>
                                    <div className="space-y-3">
                                        {current.workflow.map((step, idx) => (
                                            <div key={idx} className="flex gap-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white ${getStepNumberClasses(current.color)}`}>
                                                        {idx + 1}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Outcome & Quote */}
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                    <div className="flex items-start gap-3 mb-3">
                                        <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getCheckIconClasses(current.color)}`} />
                                        <p className="font-bold text-gray-900">{current.outcome}</p>
                                    </div>
                                    <p className="text-gray-600 italic text-sm">"{current.quote}"</p>
                                </div>

                                {/* Feature Tags */}
                                <div>
                                    <p className="text-xs uppercase font-bold text-gray-400 mb-3">Features Used</p>
                                    <div className="flex flex-wrap gap-2">
                                        {current.features.map((feature) => (
                                            <span key={feature} className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getFeatureTagClasses(current.color)}`}>
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* CTA */}
                                <button className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 group ${getButtonClasses(current.color)}`}>
                                    Try this workflow →
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
