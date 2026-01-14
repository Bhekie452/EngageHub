import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { LandingPricing } from './LandingPricing';
import { LandingFooter } from './LandingFooter';

interface LandingPageProps {
    onGetStarted: () => void;
    onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleSelectPlan = (planName: string) => {
        // Navigate to signup with selected plan
        onGetStarted();
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-0 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <img src="/nav-logo.jpg" alt="EngageHub Logo" className="h-16 w-auto" />
                    </div>

                    {/* Spacer */}
                    <div className="hidden md:flex flex-1"></div>

                    {/* CTA buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={onSignIn}
                            className="px-6 py-2 text-gray-700 font-semibold hover:text-blue-600 transition-colors"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={onGetStarted}
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                        >
                            Get Started
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <div className="px-6 py-4 space-y-4">
                            <button
                                onClick={onSignIn}
                                className="block w-full text-left text-gray-700 font-semibold py-2"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={onGetStarted}
                                className="block w-full px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main content with top padding for fixed nav */}
            <div className="pt-20">
                <LandingHero onGetStarted={onGetStarted} />

                <div id="features">
                    <LandingFeatures />
                </div>

                <div id="pricing">
                    <LandingPricing onSelectPlan={handleSelectPlan} />
                </div>

                <div id="contact">
                    <LandingFooter />
                </div>
            </div>
        </div>
    );
};
