import React, { useState } from 'react';
import { Check, Sparkles, ArrowRight, Calculator } from 'lucide-react';
import { PaymentCheckout } from './PaymentCheckout';

interface PricingTier {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    popular?: boolean;
    gradient: string;
    ctaText: string;
    tier: 'starter' | 'professional' | 'business';
}

const pricingTiers: PricingTier[] = [
    {
        name: 'Starter',
        price: 'R549',
        period: '/month',
        description: 'Perfect for Solopreneurs',
        gradient: 'from-blue-500 to-cyan-500',
        ctaText: 'Start Free Trial',
        tier: 'starter',
        features: [
            'Unlimited Users',
            'Unlimited Social Accounts',
            '50 AI-Enhanced Posts/mo',
            '1,000 CRM Contacts',
            'Unified Inbox Access',
            'Basic Analytics',
            'Email Support',
        ]
    },
    {
        name: 'Professional',
        price: 'R1,499',
        period: '/month',
        description: 'For Scaling Businesses',
        popular: true,
        gradient: 'from-purple-500 to-pink-500',
        ctaText: 'Start Free Trial',
        tier: 'professional',
        features: [
            'Unlimited Users',
            'Unlimited Social Accounts',
            '250 AI-Enhanced Posts/mo',
            '10,000 CRM Contacts',
            'Unified Inbox Access',
            'Priority Support & Reports',
            'Advanced Analytics',
            'AI Content Assistant',
        ]
    },
    {
        name: 'Business',
        price: 'R2,849',
        period: '/month',
        description: 'For Established Enterprises',
        gradient: 'from-orange-500 to-red-500',
        ctaText: 'Start Free Trial',
        tier: 'business',
        features: [
            'Unlimited Users',
            'Unlimited Social Accounts',
            '1,000 AI-Enhanced Posts/mo',
            '100,000 CRM Contacts',
            'Unified Inbox Access',
            'White-label & Dedicated Manager',
            'Custom Analytics & Dashboards',
            'Advanced AI Features',
            'Marketing Automation',
        ]
    }
];

interface LandingPricingProps {
    onSelectPlan: (planName: string) => void;
}

export const LandingPricing: React.FC<LandingPricingProps> = ({ onSelectPlan }) => {
    const [showCalculator, setShowCalculator] = useState(false);
    const [monthlyPosts, setMonthlyPosts] = useState(100);
    const [crmContacts, setCrmContacts] = useState(1000);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    // Calculate recommended plan based on usage
    const calculateRecommendedPlan = () => {
        if (monthlyPosts <= 50 && crmContacts <= 1000) {
            return 'Starter';
        } else if (monthlyPosts <= 250 && crmContacts <= 10000) {
            return 'Professional';
        } else {
            return 'Business';
        }
    };

    const recommendedPlan = calculateRecommendedPlan();

    return (
        <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-20"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section header */}
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
                        <span className="text-sm font-bold text-purple-600">PRICING</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900">
                        Simple, Transparent
                        <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Pricing for Everyone
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Choose the perfect plan for your business. All plans include a 14-day free trial.
                    </p>
                </div>

                {/* Pricing cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {pricingTiers.map((tier, index) => (
                        <div
                            key={index}
                            className={`relative bg-white rounded-3xl p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${tier.popular
                                    ? 'border-purple-500 shadow-xl scale-105'
                                    : 'border-gray-200 hover:border-purple-300'
                                }`}
                        >
                            {/* Popular badge */}
                            {tier.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <div className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold rounded-full shadow-lg">
                                        <Sparkles className="w-4 h-4" />
                                        Most Popular
                                    </div>
                                </div>
                            )}

                            {/* Plan header */}
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-black text-gray-900 mb-2">{tier.name}</h3>
                                <p className="text-gray-600 text-sm mb-4">{tier.description}</p>

                                {/* Price */}
                                <div className="flex items-end justify-center gap-1 mb-2">
                                    <span className={`text-5xl font-black bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent`}>
                                        {tier.price}
                                    </span>
                                    <span className="text-gray-500 text-lg font-medium mb-2">{tier.period}</span>
                                </div>
                            </div>

                            {/* CTA button */}
                            <button
                                onClick={() => {
                                    if (tier.ctaText === 'Contact Sales') {
                                        // For Business plan, could open contact form or email
                                        window.location.href = 'mailto:sales@engagehub.com?subject=Business Plan Inquiry';
                                    } else {
                                        setSelectedPlan(tier.tier);
                                    }
                                }}
                                className={`w-full py-4 rounded-xl font-bold text-white mb-6 transition-all duration-300 flex items-center justify-center gap-2 group ${tier.popular
                                        ? `bg-gradient-to-r ${tier.gradient} shadow-lg hover:shadow-xl hover:scale-105`
                                        : 'bg-gray-800 hover:bg-gray-900 hover:scale-105'
                                    }`}
                            >
                                {tier.ctaText}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>

                            {/* Features list */}
                            <div className="space-y-3">
                                {tier.features.map((feature, featureIndex) => (
                                    <div key={featureIndex} className="flex items-start gap-3">
                                        <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r ${tier.gradient} flex items-center justify-center mt-0.5`}>
                                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                        </div>
                                        <span className="text-gray-700 text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Interactive Usage Calculator */}
                <div className="mt-16 max-w-3xl mx-auto">
                    <button
                        onClick={() => setShowCalculator(!showCalculator)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-500 transition-all duration-300 group"
                    >
                        <Calculator className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-gray-900">Estimate Your Cost</span>
                        <span className="text-sm text-gray-500">(Based on usage)</span>
                    </button>

                    {showCalculator && (
                        <div className="mt-6 bg-white rounded-2xl p-8 border-2 border-purple-200 shadow-xl">
                            <h3 className="text-2xl font-black text-gray-900 mb-6 text-center">
                                Usage Calculator
                            </h3>

                            <div className="space-y-6">
                                {/* Monthly Posts Slider */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-bold text-gray-700">
                                            Monthly AI-Enhanced Posts
                                        </label>
                                        <span className="text-lg font-black text-purple-600">
                                            {monthlyPosts}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="2000"
                                        step="10"
                                        value={monthlyPosts}
                                        onChange={(e) => setMonthlyPosts(Number(e.target.value))}
                                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>10</span>
                                        <span>2000+</span>
                                    </div>
                                </div>

                                {/* CRM Contacts Slider */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-bold text-gray-700">
                                            CRM Contacts
                                        </label>
                                        <span className="text-lg font-black text-purple-600">
                                            {crmContacts.toLocaleString()}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="100"
                                        max="200000"
                                        step="100"
                                        value={crmContacts}
                                        onChange={(e) => setCrmContacts(Number(e.target.value))}
                                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>100</span>
                                        <span>200,000+</span>
                                    </div>
                                </div>

                                {/* Recommended Plan */}
                                <div className="pt-6 border-t border-gray-200">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 mb-2">Recommended Plan:</p>
                                        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-lg ${
                                            recommendedPlan === 'Starter' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                                            recommendedPlan === 'Professional' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                                            'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                                        }`}>
                                            <Sparkles className="w-5 h-5" />
                                            {recommendedPlan}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-3">
                                            Based on your usage, the {recommendedPlan} plan is the best fit for your needs.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom note */}
                <div className="mt-16 text-center space-y-2">
                    <p className="text-gray-600 mb-2">All plans include a 14-day free trial. No credit card required.</p>
                    <p className="text-sm text-gray-500">Need more volume? Custom usage credits available. Cancel anytime.</p>
                    <p className="text-xs text-gray-400">Prices in South African Rand (ZAR).</p>
                </div>
            </div>

            {/* Payment Checkout Modal */}
            {selectedPlan && (
                <PaymentCheckout
                    planTier={selectedPlan}
                    onClose={() => setSelectedPlan(null)}
                    onSuccess={() => {
                        setSelectedPlan(null);
                        onSelectPlan(selectedPlan);
                    }}
                />
            )}
        </section>
    );
};
