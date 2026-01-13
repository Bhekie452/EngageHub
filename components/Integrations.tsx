
import React, { useState } from 'react';
import { 
  Plug, 
  Share2, 
  Mail, 
  MessageSquare, 
  Calculator, 
  Calendar, 
  CreditCard, 
  Webhook, 
  Key, 
  Plus, 
  MoreVertical, 
  CheckCircle2, 
  ExternalLink, 
  AlertCircle,
  RefreshCw,
  Copy,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

type IntegrationTab = 'social' | 'email' | 'whatsapp' | 'accounting' | 'calendar' | 'payments' | 'webhooks' | 'api';

const Integrations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IntegrationTab>('social');

  const tabs: { id: IntegrationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'social', label: 'Social platforms', icon: <Share2 size={16} /> },
    { id: 'email', label: 'Email providers', icon: <Mail size={16} /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={16} /> },
    { id: 'accounting', label: 'Accounting', icon: <Calculator size={16} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={16} /> },
    { id: 'payments', label: 'Payment gateways', icon: <CreditCard size={16} /> },
    { id: 'webhooks', label: 'Webhooks', icon: <Webhook size={16} /> },
    { id: 'api', label: 'API keys', icon: <Key size={16} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'social':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {[
              { name: 'Instagram Business', status: 'Connected', lastSync: '12m ago', icon: <Share2 className="text-pink-600" /> },
              { name: 'LinkedIn API', status: 'Connected', lastSync: '1h ago', icon: <Share2 className="text-blue-700" /> },
              { name: 'TikTok Creator', status: 'Pending', lastSync: 'Never', icon: <Share2 className="text-black" /> },
              { name: 'X Developer', status: 'Disconnected', lastSync: '2d ago', icon: <Share2 className="text-gray-900" /> },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm group hover:border-blue-300 transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-blue-50 transition-all">
                    {item.icon}
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    item.status === 'Connected' ? 'bg-green-50 text-green-600' : 
                    item.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <h4 className="text-sm font-black text-gray-900 mb-1">{item.name}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Last sync: {item.lastSync}</p>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-gray-50 text-gray-600 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                    Manage
                  </button>
                  <button className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'payments':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: 'Stripe', desc: 'Accept credit cards, Apple Pay, and Google Pay worldwide.', status: 'Active', color: 'indigo' },
              { name: 'PayPal Business', desc: 'Secure payments with your customers PayPal account.', status: 'Active', color: 'blue' },
              { name: 'LemonSqueezy', desc: 'Merchant of record for SaaS and digital goods.', status: 'Inactive', color: 'purple' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all">
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl bg-${item.color}-50 flex items-center justify-center text-${item.color}-600`}>
                    <CreditCard size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500 font-medium max-w-xs">{item.desc}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${item.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {item.status}
                  </span>
                  <button className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                    Settings <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'api':
        return (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Your Private API Keys</h4>
                  <p className="text-xs text-gray-400 font-medium mt-1">Keep these secret! Do not share them in public repositories.</p>
                </div>
                <button className="px-5 py-2.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                   Generate New Key
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Production Dashboard', key: 'sk_live_51M...', date: 'Created May 12, 2025' },
                  { name: 'Mobile App Sync', key: 'sk_live_82K...', date: 'Created Jun 02, 2025' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                    <div className="flex items-center gap-4">
                       <div className="p-2 bg-white rounded-lg text-gray-400"><Key size={18} /></div>
                       <div>
                         <p className="text-sm font-bold text-gray-800">{item.name}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase">{item.date}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <code className="text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600">{item.key}</code>
                       <button className="p-2 text-gray-400 hover:text-blue-600 transition-all"><Copy size={16} /></button>
                       <button className="p-2 text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><MoreVertical size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-600 p-8 rounded-2xl text-white shadow-xl shadow-indigo-100 flex items-center justify-between overflow-hidden relative">
              <div className="relative z-10 max-w-lg">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={20} className="text-indigo-200" />
                  <h4 className="text-xs font-black uppercase tracking-widest">Security Best Practice</h4>
                </div>
                <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                  "Rotate your API keys every 90 days and use restricted permissions wherever possible to keep your solo business data secure."
                </p>
              </div>
              <button className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all relative z-10">
                 <ExternalLink size={24} />
              </button>
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            </div>
          </div>
        );

      case 'webhooks':
        return (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
              <div>
                <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">Active Webhook Listeners</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Connect SoloFlow events to other apps</p>
              </div>
              <button className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-50">+ Add Webhook</button>
            </div>
            <div className="p-12 text-center space-y-4">
               <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto">
                 <Webhook size={32} />
               </div>
               <h3 className="text-lg font-bold text-gray-800">No webhooks configured</h3>
               <p className="text-sm text-gray-500 max-w-xs mx-auto">Webhooks allow you to receive real-time notifications when important events happen in your business.</p>
               <button className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">Read the docs</button>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-20 text-center space-y-6">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto">
              {tabs.find(t => t.id === activeTab)?.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{tabs.find(t => t.id === activeTab)?.label}</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2 leading-relaxed">
                We are finishing the secure tunnel for these external connections.
              </p>
            </div>
            <button className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all text-sm shadow-xl shadow-blue-100">
              Refresh Module
            </button>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">External Integrations</h2>
          <p className="text-gray-500 text-sm font-medium">Connect your business to the tools you already use.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Gateway active</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-gray-200 sticky top-16 bg-gray-50/90 backdrop-blur-sm z-20 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all border-b-2 -mb-[2px] whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
            }`}
          >
            <span className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-300'}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Integrations;
