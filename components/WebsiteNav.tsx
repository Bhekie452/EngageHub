import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface WebsiteNavProps {
    onSignIn: () => void;
    onGetStarted: () => void;
}

const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/features', label: 'Features' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/integrations', label: 'Integrations' },
    { to: '/about', label: 'About' },
];

export const WebsiteNav: React.FC<WebsiteNavProps> = ({ onSignIn, onGetStarted }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

    const isActive = (to: string) => {
        if (to === '/') return pathname === '/';
        return pathname.startsWith(to);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-0 flex items-center justify-between h-20">
                <a href="/" className="flex items-center gap-2 shrink-0">
                    <img src="/nav-logo.jpg" alt="EngageHub Logo" className="h-14 w-auto" />
                </a>

                {/* Desktop nav links */}
                <div className="hidden md:flex flex-1 justify-center gap-8">
                    {navLinks.map(({ to, label }) => (
                        <a
                            key={to}
                            href={to}
                            className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                isActive(to)
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                        >
                            {label}
                        </a>
                    ))}
                </div>

                {/* CTA buttons */}
                <div className="hidden md:flex items-center gap-3 shrink-0">
                    <button
                        onClick={onSignIn}
                        className="px-5 py-2.5 text-gray-700 font-semibold hover:text-blue-600 transition-colors"
                    >
                        Sign In
                    </button>
                    <button
                        onClick={onGetStarted}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                        Get Started
                    </button>
                </div>

                {/* Mobile menu button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 bg-white">
                    <div className="px-6 py-4 space-y-1">
                        {navLinks.map(({ to, label }) => (
                            <a
                                key={to}
                                href={to}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block px-4 py-3 rounded-lg font-semibold ${
                                    isActive(to) ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {label}
                            </a>
                        ))}
                        <div className="pt-4 mt-4 border-t border-gray-200 flex flex-col gap-2">
                            <button
                                onClick={() => { onSignIn(); setMobileMenuOpen(false); }}
                                className="w-full text-left px-4 py-3 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => { onGetStarted(); setMobileMenuOpen(false); }}
                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};
