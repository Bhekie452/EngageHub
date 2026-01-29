import React from 'react';
import { WebsiteNav } from './WebsiteNav';
import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { LandingPricing } from './LandingPricing';
import { LandingSecurityTrust } from './LandingSecurityTrust';
import { LandingFooter } from './LandingFooter';

interface LandingPageProps {
    onGetStarted: () => void;
    onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
    const handleSelectPlan = (planName: string) => {
        onGetStarted();
    };

    return (
        <div className="min-h-screen bg-white">
            <WebsiteNav onSignIn={onSignIn} onGetStarted={onGetStarted} />

            {/* Main content with top padding for fixed nav */}
            <div className="pt-20">
                <LandingHero onGetStarted={onGetStarted} />

                <div id="features">
                    <LandingFeatures />
                </div>

                <div id="pricing">
                    <LandingPricing onSelectPlan={handleSelectPlan} />
                </div>

                <LandingSecurityTrust />

                <div id="contact">
                    <LandingFooter />
                </div>
            </div>
        </div>
    );
};
