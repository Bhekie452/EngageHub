import React from 'react';
import { WebsiteNav } from './WebsiteNav';
import { LandingFooter } from './LandingFooter';

interface WebsiteLayoutProps {
    children: React.ReactNode;
    onSignIn: () => void;
    onGetStarted: () => void;
}

export const WebsiteLayout: React.FC<WebsiteLayoutProps> = ({ children, onSignIn, onGetStarted }) => (
    <div className="min-h-screen bg-white flex flex-col">
        <WebsiteNav onSignIn={onSignIn} onGetStarted={onGetStarted} />
        <main className="flex-1 pt-20">{children}</main>
        <LandingFooter />
    </div>
);
