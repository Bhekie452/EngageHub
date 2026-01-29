import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

const tiers = [
    {
        name: 'Starter',
        price: 'R549',
        period: '/month',
        description: 'Perfect for Solopreneurs',
        gradient: 'from-blue-500 to-cyan-500',
        features: [
            'Unlimited Users',
            'Unlimited Social Accounts',
            '50 AI-Enhanced Posts/mo',
            '1,000 CRM Contacts',
            'Unified Inbox Access',
            'Basic Analytics',
            'Email Support',
        ],
    },
    {
        name: 'Professional',
        price: 'R1,499',
        period: '/month',
        description: 'For Scaling Businesses',
        popular: true,
        gradient: 'from-purple-500 to-pink-500',
        features: [
            'Unlimited Users',
            'Unlimited Social Accounts',
            '250 AI-Enhanced Posts/mo',
            '10,000 CRM Contacts',
            'Unified Inbox Access',
            'Priority Support & Reports',
            'Advanced Analytics',
            'AI Content Assistant',
        ],
    },
    {
        name: 'Business',
        price: 'R2,849',
        period: '/month',
        description: 'For Established Enterprises',
        gradient: 'from-orange-500 to-red-500',
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
        ],
    },
];

export const PricingPage: React.FC = () => (
    <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-20" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
                    <span className="text-sm font-bold text-purple-600">PRICING</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900">
                    Simple, Transparent
                    <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Pricing for Everyone
                    </span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Full access to every tool on every plan. You pay for how much you use, not which features we lock away.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {tiers.map((tier) => (
                    <div
                        key={tier.name}
                        className={`relative rounded-2xl p-8 ${
                            tier.popular ? 'bg-white shadow-2xl ring-2 ring-purple-500 scale-105' : 'bg-white shadow-lg'
                        }`}
                    >
                        {tier.popular && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold rounded-full">
                                Most popular
                            </span>
                        )}
                        <div className={`inline-block px-3 py-1 rounded-lg bg-gradient-to-r ${tier.gradient} text-white text-sm font-bold mb-4`}>
                            {tier.name}
                        </div>
                        <p className="text-3xl font-black text-gray-900">
                            {tier.price}
                            <span className="text-lg font-normal text-gray-500">{tier.period}</span>
                        </p>
                        <p className="text-gray-600 mt-2">{tier.description}</p>
                        <ul className="mt-6 space-y-3">
                            {tier.features.map((f, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700 text-sm">{f}</span>
                                </li>
                            ))}
                        </ul>
                        <a
                            href="/"
                            className="mt-8 block w-full py-3 text-center font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg transition-all"
                        >
                            Start Free Trial
                        </a>
                    </div>
                ))}
            </div>

            <p className="text-center text-gray-500 mt-8 text-sm">
                14-day free trial. No credit card required. Cancel anytime. Prices in ZAR.
            </p>

            <div className="mt-12 text-center">
                <a href="/features" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:underline">
                    Compare features <ArrowRight className="w-4 h-4" />
                </a>
            </div>
        </div>
    </section>
);
