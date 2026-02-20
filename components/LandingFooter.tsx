import React from 'react';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

// Social media SVG icons for footer
const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
);

const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
);

const LinkedInIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
);

const XIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.16c0 2.52-1.12 4.84-2.9 6.39-1.78 1.54-4.12 2.14-6.35 1.74-2.23-.4-4.21-1.79-5.24-3.96-.96-2.01-1.05-4.46-.26-6.52 1.03-2.68 3.17-4.85 5.82-5.86 2.38-.91 5.1-.61 7.14.89 1.24.91 2.07 2.3 2.32 3.83v4.23c-.02-.63-.26-1.23-.66-1.68-.51-.58-1.28-.89-2.12-.77-.55.08-1.07.33-1.48.71-.52.49-.73 1.2-.57 1.85.2.83.99 1.39 1.82 1.23.65-.12 1.17-.62 1.41-1.22.28-.68.23-1.47.13-2.2a4.33 4.33 0 0 0-3.93-4.28c-2.12-.19-4.14.87-5.12 2.58-.82 1.43-1.08 3.14-.7 4.75.43 1.82 1.68 3.36 3.5 4.16 1.77.78 3.85.71 5.55-.23 1.56-.86 2.67-2.33 3.05-4.01V12.5c-.28-.45-.54-.92-.68-1.41-.1-.35-.15-.71-.15-1.08V.02z"/>
    </svg>
);

export const LandingFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    {/* Company info */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black text-white mb-4">EngageHub</h3>
                        <p className="text-sm leading-relaxed">
                            Your all-in-one social media marketing automation platform. Connect, create, engage, and grow your brand on autopilot with AI-powered tools.
                        </p>
                        {/* Social icons */}
                        <div className="flex gap-3 pt-4">
                            {[
                                { Icon: FacebookIcon, href: 'https://facebook.com/engagehub', label: 'Facebook' },
                                { Icon: InstagramIcon, href: 'https://instagram.com/engagehub', label: 'Instagram' },
                                { Icon: XIcon, href: 'https://x.com/engagehub', label: 'X' },
                                { Icon: LinkedInIcon, href: 'https://linkedin.com/company/engagehub', label: 'LinkedIn' },
                                { Icon: TikTokIcon, href: 'https://tiktok.com/@engagehub', label: 'TikTok' },
                            ].map(({ Icon, href, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 flex items-center justify-center transition-all duration-300 hover:scale-110"
                                >
                                    <Icon />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-white font-bold mb-4">Product</h4>
                        <ul className="space-y-3">
                            <li><a href="#features" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Features</a></li>
                            <li><a href="#pricing" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Pricing</a></li>
                            <li><a href="#features" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Social Media Connect</a></li>
                            <li><a href="#features" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">AI Content Creation</a></li>
                            <li><a href="#features" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">CRM & Tasks</a></li>
                            <li><a href="#features" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Analytics & Insights</a></li>
                        </ul>
                    </div>

                    {/* Legal & Support */}
                    <div>
                        <h4 className="text-white font-bold mb-4">Support & Legal</h4>
                        <ul className="space-y-3">
                            <li><a href="/support" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Help Center</a></li>
                            <li><a href="mailto:info@engagehub.co" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Contact Support</a></li>
                            <li><a href="/privacy" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Privacy Policy</a></li>
                            <li><a href="/terms" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Terms of Service</a></li>
                            <li><a href="/about" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">About Us</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-bold mb-4">Get in Touch</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <Mail className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" />
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">General & Billing</p>
                                    <a href="mailto:info@engagehub.co" className="text-sm hover:text-white transition-colors font-medium">
                                        info@engagehub.co
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" />
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Location</p>
                                    <span className="text-sm">South Africa</span>
                                </div>
                            </li>
                        </ul>
                        <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                            <p className="text-xs text-gray-400 mb-1">Priced in ZAR with local support</p>
                            <p className="text-sm font-semibold text-white">Built for South African businesses</p>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500">
                        &copy; {currentYear} EngageHub. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <a href="/privacy" className="text-sm text-gray-500 hover:text-white transition-colors">Privacy Policy</a>
                        <a href="/terms" className="text-sm text-gray-500 hover:text-white transition-colors">Terms of Service</a>
                        <a href="mailto:info@engagehub.co" className="text-sm text-gray-500 hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
