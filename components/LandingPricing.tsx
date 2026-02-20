import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import { PaymentCheckout } from './PaymentCheckout';

interface PricingTier {
    name: string;
    price: number;
    period: string;
    channels: number;
    description: string;
    features: { label: string; unlimited?: boolean }[];
    tier: 'free' | 'professional' | 'business';
}

const pricingTiers: PricingTier[] = [
    {
        name: 'Free',
        price: 0,
        period: '/month',
        channels: 1,
        description: '1 channel · Free forever',
        features: [
            { label: 'Social connections' },
            { label: 'Basic scheduling' },
            { label: 'Simple calendar' },
            { label: 'No AI content' },
            { label: 'Community support' },
        ],
        tier: 'free',
    },
    {
        name: 'Professional',
        price: 1800,
        period: '/month',
        channels: 5,
        description: '5 channels · Billed monthly',
        features: [
            { label: 'All Free features' },
            { label: 'AI content generation' },
            { label: 'Advanced scheduling' },
            { label: 'Unified inbox' },
            { label: 'CRM with 10K contacts' },
            { label: 'Basic analytics' },
            { label: 'Email support' },
        ],
        tier: 'professional',
    },
    {
        name: 'Business',
        price: 4500,
        period: '/month',
        channels: 20,
        description: '20 channels · Billed monthly',
        features: [
            { label: 'All Professional features' },
            { label: 'Unlimited AI posts' },
            { label: 'Advanced CRM' },
            { label: 'Social listening' },
            { label: 'Team collaboration' },
            { label: 'Advanced analytics', unlimited: true },
            { label: 'Priority support' },
            { label: 'API access' },
        ],
        tier: 'business',
    }
];

const allFeatures = [
    'AI Content Generation',
    'Post Scheduling',
    'Unified Inbox',
    'CRM & Lead Pipeline',
    'Social Listening',
    'Analytics',
    'Team Collaboration',
    'API Access',
];

interface LandingPricingProps {
    onSelectPlan: (planName: string) => void;
}

export const LandingPricing: React.FC<LandingPricingProps> = ({ onSelectPlan }) => {
    const [channels, setChannels] = useState(1);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [showCalculator, setShowCalculator] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    const calculatePrice = (basePrice: number) => {
        if (basePrice === 0) return 'E0';
        const price = billingCycle === 'yearly' ? Math.floor(basePrice * 10) : basePrice;
        return `E ${price.toLocaleString()}`;
    };

    return (
        <section className="py-32 bg-white relative">
            <div className="max-w-6xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                        All plans include a 14-day free trial. No credit card required. Cancel anytime.
                    </p>
                </div>

                {/* Controls: Channel Selector + Billing Toggle */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12 pb-8 border-b border-gray-200">
                    {/* Channel Selector */}
                    <div className="flex items-center gap-4 bg-gray-100 rounded-full px-4 py-2">
                        <button
                            onClick={() => setChannels(Math.max(1, channels - 1))}
                            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="text-sm font-bold text-gray-900 min-w-[4rem] text-center">
                            {channels} channel{channels > 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={() => setChannels(channels + 1)}
                            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>

                    {/* Billing Toggle */}
                    <div className="flex items-center gap-3 bg-gray-100 rounded-full p-1">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2 rounded-full font-semibold transition-all ${
                                billingCycle === 'monthly'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600'
                            }`}
                        >
                            Pay Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-6 py-2 rounded-full font-semibold transition-all ${
                                billingCycle === 'yearly'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600'
                            }`}
                        >
                            Pay Yearly
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
                    {pricingTiers.map((tier, index) => (
                        <div
                            key={index}
                            className={`rounded-2xl p-8 border-2 transition-all duration-300 ${
                                tier.tier === 'professional'
                                    ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-200'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            {/* Plan Header */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{tier.name}</h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-4xl font-black text-gray-900">
                                        {calculatePrice(tier.price)}
                                    </span>
                                    {tier.price > 0 && (
                                        <span className="text-gray-500 font-medium">/mo</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">{tier.description}</p>
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={() => setSelectedPlan(tier.tier)}
                                className={`w-full py-3 rounded-lg font-bold transition-all duration-300 mb-8 ${
                                    tier.tier === 'professional'
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                }`}
                            >
                                Get Started
                            </button>

                            {/* Features */}
                            <div className="space-y-3">
                                {tier.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={3} />
                                        <span className="text-sm text-gray-700">{feature.label}</span>
                                        {feature.unlimited && (
                                            <span className="text-xs text-blue-600 font-semibold">∞</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* All Features Included Banner */}
                <div className="max-w-4xl mx-auto bg-gray-50 rounded-2xl p-8 border border-gray-200">
                    <h3 className="text-center text-sm font-bold text-gray-600 uppercase tracking-wider mb-6">
                        All plans include
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {allFeatures.map((feature) => (
                            <div key={feature} className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-blue-600 flex-shrink-0" strokeWidth={3} />
                                <span className="text-sm text-gray-600">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Compare Link */}
                <div className="text-center mt-12">
                    <button
                        onClick={() => setShowCalculator(!showCalculator)}
                        className="text-blue-600 font-semibold hover:text-blue-700 flex items-center justify-center gap-2 mx-auto"
                    >
                        Compare all features →
                    </button>
                </div>

                {/* Footer Notes */}
                <div className="text-center text-sm text-gray-500 mt-12 pt-8 border-t border-gray-200">
                    <p>Need more channels or custom pricing? <a href="#contact" className="text-blue-600 hover:underline">Contact us</a></p>
                </div>
            </div>

            {selectedPlan && (
                <PaymentCheckout
                    planTier={selectedPlan as any}
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
