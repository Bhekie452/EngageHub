import React from 'react';
import { Quote } from 'lucide-react';

const testimonials = [
    {
        name: 'Sarah Johnson',
        role: 'Marketing Director',
        company: 'TechFlow Inc.',
        avatar: 'SJ',
        content: 'EngageHub transformed how we manage social media. We went from spending 20 hours a week to just 2 hours. The AI suggestions are incredibly accurate!',
        gradient: 'from-blue-500 to-indigo-500'
    },
    {
        name: 'Michael Chen',
        role: 'Founder & CEO',
        company: 'GreenScale',
        avatar: 'MC',
        content: 'The unified inbox is a game-changer. We respond to leads 3x faster now and have seen a 40% increase in conversions. Best investment we made.',
        gradient: 'from-green-500 to-teal-500'
    },
    {
        name: 'Emily Williams',
        role: 'Social Media Manager',
        company: 'BuildRight',
        avatar: 'EW',
        content: 'Finally, a tool that actually delivers on its promises. Our engagement is up 200% and the analytics help us understand what actually works.',
        gradient: 'from-orange-500 to-red-500'
    }
];

export const LandingTestimonials: React.FC = () => {
    return (
        <section className="py-24 bg-slate-900 relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full mb-6">
                        <span className="text-sm font-bold text-blue-400">TESTIMONIALS</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                        Loved by teams everywhere
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        See what our customers have to say about transforming their social media presence.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:-translate-y-2"
                        >
                            <Quote className="w-10 h-10 text-blue-500/30 mb-4" />
                            <p className="text-slate-300 leading-relaxed mb-6">
                                "{testimonial.content}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center`}>
                                    <span className="text-white font-bold">{testimonial.avatar}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-white">{testimonial.name}</p>
                                    <p className="text-sm text-slate-400">{testimonial.role}, {testimonial.company}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
