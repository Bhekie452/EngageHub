import React from 'react';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

interface PricingTier {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    popular?: boolean;
    gradient: string;
    ctaText: string;
}

const pricingTiers: PricingTier[] = [
    {
        name: 'Starter',
        price: 'R549',
        period: '/month',
        description: 'Perfect for getting started',
        gradient: 'from-blue-500 to-cyan-500',
        ctaText: 'Start Free Trial',
        features: [
            '1 User',
            '3 Social Media Accounts',
            '50 Scheduled Posts/month',
            'Basic Analytics',
            'Email Support',
        ]
    },
    {
        name: 'Professional',
        price: 'R1,499',
        period: '/month',
        description: 'For growing businesses',
        popular: true,
        gradient: 'from-purple-500 to-pink-500',
        ctaText: 'Start Free Trial',
        features: [
            '3 Users',
            '10 Social Media Accounts',
            'Unlimited Scheduled Posts',
            'Advanced Analytics & Reports',
            'AI Content Assistant',
            'CRM with 1,000 Contacts',
            'Priority Support',
        ]
    },
    {
        name: 'Business',
        price: 'R2,849',
        period: '/month',
        description: 'For established enterprises',
        gradient: 'from-orange-500 to-red-500',
        ctaText: 'Contact Sales',
        features: [
            'Unlimited Users',
            'Unlimited Social Accounts',
            'Unlimited Posts',
            'Custom Analytics & Dashboards',
            'Advanced AI Features',
            'CRM with Unlimited Contacts',
            'Marketing Automation',
            'White-label Options',
            'Dedicated Account Manager',
        ]
    }
];

interface LandingPricingProps {
    onSelectPlan: (planName: string) => void;
}

export const LandingPricing: React.FC<LandingPricingProps> = ({ onSelectPlan }) => {
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
                                onClick={() => onSelectPlan(tier.name)}
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

                {/* Bottom note */}
                <div className="mt-16 text-center">
                    <p className="text-gray-600 mb-2">All plans include a 14-day free trial. No credit card required.</p>
                    <p className="text-sm text-gray-500">Cancel anytime. Prices in South African Rand (ZAR).</p>
                </div>
            </div>
        </section>
    );
};
