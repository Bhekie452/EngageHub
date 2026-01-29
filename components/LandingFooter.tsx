import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

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
                            Your all-in-one business command center. Manage social media, engage customers, and grow your business on autopilot.
                        </p>
                        {/* Social icons */}
                        <div className="flex gap-3 pt-4">
                            {[
                                { Icon: Facebook, href: '#' },
                                { Icon: Twitter, href: '#' },
                                { Icon: Instagram, href: '#' },
                                { Icon: Linkedin, href: '#' }
                            ].map(({ Icon, href }, index) => (
                                <a
                                    key={index}
                                    href={href}
                                    className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 flex items-center justify-center transition-all duration-300 hover:scale-110"
                                >
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-white font-bold mb-4">Product</h4>
                        <ul className="space-y-3">
                            <li><a href="/features" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Features</a></li>
                            <li><a href="/pricing" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Pricing</a></li>
                            <li><a href="/integrations" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Integrations</a></li>
                            <li><a href="/about" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">About</a></li>
                            <li><a href="#" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">API</a></li>
                            <li><a href="#" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Changelog</a></li>
                            <li><a href="#" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Roadmap</a></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-white font-bold mb-4">Company</h4>
                        <ul className="space-y-3">
                            {['About Us', 'Blog', 'Careers', 'Press Kit', 'Partners', 'Contact'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-bold mb-4">Get in Touch</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2">
                                <Mail className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" />
                                <a href="mailto:support@engagehub.co.za" className="text-sm hover:text-white transition-colors">
                                    support@engagehub.co.za
                                </a>
                            </li>
                            <li className="flex items-start gap-2">
                                <Phone className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" />
                                <a href="tel:+27123456789" className="text-sm hover:text-white transition-colors">
                                    +27 12 345 6789
                                </a>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" />
                                <span className="text-sm">
                                    Cape Town, South Africa
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500">
                        © {currentYear} EngageHub. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                            <a
                                key={item}
                                href="#"
                                className="text-sm text-gray-500 hover:text-white transition-colors"
                            >
                                {item}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};
