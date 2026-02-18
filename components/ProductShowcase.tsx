import React from 'react';
import { MessageSquare, Calendar, BarChart3, Users, Zap } from 'lucide-react';

const ProductShowcase: React.FC = () => {
  const products = [
    {
      title: 'Social Media Management',
      description: 'Manage all your social media accounts in one place',
      icon: MessageSquare,
      features: ['Multi-platform support', 'Unified dashboard', 'Scheduled posting'],
      image: '📱 Social Dashboard'
    },
    {
      title: 'Customer Engagement',
      description: 'Engage with your audience across all platforms',
      icon: Users,
      features: ['Real-time analytics', 'Comment management', 'Direct messaging'],
      image: '💬 Customer Engagement'
    },
    {
      title: 'Content Scheduling',
      description: 'Plan and schedule content across multiple platforms',
      icon: Calendar,
      features: ['Advanced scheduling', 'Content calendar', 'Auto-posting'],
      image: '📅 Smart Scheduling'
    },
    {
      title: 'Analytics & Insights',
      description: 'Track performance and optimize your strategy',
      icon: BarChart3,
      features: ['Detailed analytics', 'Performance metrics', 'Growth tracking'],
      image: '📊 Analytics Dashboard'
    },
    {
      title: 'Automation Tools',
      description: 'Automate repetitive tasks and save time',
      icon: Zap,
      features: ['Workflow automation', 'Smart triggers', 'Time-saving integrations'],
      image: '⚡ Automation Hub'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Powerful Features for Your Business
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Everything you need to manage your social media presence and grow your business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-slate-200"
            >
              {/* Product Icon */}
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 mx-auto">
                <product.icon className="w-8 h-8 text-white" />
              </div>

              {/* Product Title */}
              <h3 className="text-xl font-bold text-slate-900 mb-3 text-center">
                {product.title}
              </h3>

              {/* Product Description */}
              <p className="text-slate-600 text-center mb-6">
                {product.description}
              </p>

              {/* Features */}
              <div className="space-y-2 mb-6">
                {product.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Product Image/Preview */}
              <div className="bg-slate-100 rounded-xl p-4 text-center">
                <div className="text-4xl mb-2">{product.image}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Product Preview
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
