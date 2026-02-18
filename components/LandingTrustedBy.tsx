import React from 'react';

const companies = [
    { name: 'TechFlow', logo: 'TF', color: 'from-blue-500 to-blue-700' },
    { name: 'GreenScale', logo: 'GS', color: 'from-green-500 to-green-700' },
    { name: 'BuildRight', logo: 'BR', color: 'from-orange-500 to-orange-700' },
    { name: 'DataSync', logo: 'DS', color: 'from-purple-500 to-purple-700' },
    { name: 'CloudOps', logo: 'CO', color: 'from-indigo-500 to-indigo-700' },
    { name: 'MarketPro', logo: 'MP', color: 'from-pink-500 to-pink-700' },
    { name: 'StreamLine', logo: 'SL', color: 'from-cyan-500 to-cyan-700' },
    { name: 'NexusAI', logo: 'NA', color: 'from-red-500 to-red-700' },
];

export const LandingTrustedBy: React.FC = () => {
    // Duplicate companies for infinite scroll effect
    const duplicatedCompanies = [...companies, ...companies, ...companies];

    return (
        <section className="py-16 bg-white border-y border-slate-200 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 mb-8">
            </div>
            
            {/* Infinite scrolling marquee */}
            <div className="relative w-full">
                {/* Gradient fade on left */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
                
                {/* Gradient fade on right */}
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10"></div>
                
                {/* Scrolling logos */}
                <div className="flex items-center animate-marquee">
                    {duplicatedCompanies.map((company, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0 mx-8 items-center gap-3 opacity-80 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                        >
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${company.color} flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300`}>
                                <span className="text-white font-bold text-xl">{company.logo}</span>
                            </div>
                            <span className="text-lg font-semibold text-slate-700 mt-2 block text-center">{company.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-33.33%);
                    }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            `}</style>
        </section>
    );
};
