import React, { useState } from 'react';
import { WebsiteNav } from './WebsiteNav';
import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { LandingTestimonials } from './LandingTestimonials';
import { LandingPricing } from './LandingPricing';
import { LandingSecurityTrust } from './LandingSecurityTrust';
import { LandingFooter } from './LandingFooter';
import { AISalesChatbot } from './AISalesChatbot';

interface LandingPageProps {
    onGetStarted: () => void;
    onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
    const [chatbotOpen, setChatbotOpen] = useState(false);

    const handleSelectPlan = (planName: string) => {
        onGetStarted();
    };

    return (
        <div className="min-h-screen bg-white">
            <WebsiteNav onSignIn={onSignIn} onGetStarted={onGetStarted} />

            {/* Main content with top padding for fixed nav */}
            <div className="pt-20">
                <LandingHero onGetStarted={onGetStarted} onOpenChatbot={() => setChatbotOpen(true)} />
                <div id="features">
                    <LandingFeatures />
                </div>

                <LandingTestimonials />

                <div id="pricing">
                    <LandingPricing onSelectPlan={handleSelectPlan} />
                </div>

                <LandingSecurityTrust />

                <div id="contact">
                    <LandingFooter />
                </div>
            </div>

            {/* AI Sales Chatbot */}
            <AISalesChatbot isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
        </div>
    );
};
