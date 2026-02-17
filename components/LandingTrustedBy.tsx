import React from 'react';

const companies = [
    { name: 'TechFlow', logo: 'TF', color: 'from-blue-500 to-blue-700' },
    { name: 'GreenScale', logo: 'GS', color: 'from-green-500 to-green-700' },
    { name: 'BuildRight', logo: 'BR', color: 'from-orange-500 to-orange-700' },
    { name: 'DataSync', logo: 'DS', color: 'from-purple-500 to-purple-700' },
    { name: 'CloudOps', logo: 'CO', color: 'from-indigo-500 to-indigo-700' },
    { name: 'MarketPro', logo: 'MP', color: 'from-pink-500 to-pink-700' },
];

export const LandingTrustedBy: React.FC = () => {
    return (
        <section className="py-16 bg-slate-50 border-y border-slate-200">
            <div className="max-w-7xl mx-auto px-6">
                <p className="text-center text-sm font-semibold text-slate-500 mb-8 uppercase tracking-widest">
                    Trusted by 10,000+ businesses worldwide
                </p>
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                    {companies.map((company, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-300"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${company.color} flex items-center justify-center shadow-lg`}>
                                <span className="text-white font-bold text-lg">{company.logo}</span>
                            </div>
                            <span className="text-xl font-bold text-slate-700">{company.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};