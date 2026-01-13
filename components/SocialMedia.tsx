
import React, { useState } from 'react';
import { 
  Link2, 
  Calendar, 
  BarChart2, 
  AtSign, 
  MessageCircle, 
  Mail, 
  Plus, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Facebook, 
  CheckCircle2,
  ExternalLink,
  MoreVertical,
  Youtube,
  Music,
  Pin,
  Store,
  Share2
} from 'lucide-react';

type SocialTab = 'accounts' | 'schedule' | 'engagement' | 'mentions' | 'comments' | 'dms';

const SocialMedia: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SocialTab>('accounts');

  const tabs: { id: SocialTab; label: string; icon: React.ReactNode }[] = [
    { id: 'accounts', label: 'Connected accounts', icon: <Link2 size={16} /> },
    { id: 'schedule', label: 'Posting schedule', icon: <Calendar size={16} /> },
    { id: 'engagement', label: 'Engagement', icon: <BarChart2 size={16} /> },
    { id: 'mentions', label: 'Mentions', icon: <AtSign size={16} /> },
    { id: 'comments', label: 'Comments', icon: <MessageCircle size={16} /> },
    { id: 'dms', label: 'Direct messages', icon: <Mail size={16} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'accounts':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[
              { name: 'Instagram', handle: '@engagehub_creations', connected: true, icon: <Instagram className="text-pink-600" /> },
              { name: 'LinkedIn Profile', handle: 'John Doe', connected: true, icon: <Linkedin className="text-blue-700" /> },
              { name: 'LinkedIn Page', handle: 'Doe Consulting', connected: true, icon: <Linkedin className="text-blue-600" /> },
              { name: 'X (Twitter)', handle: '@engagehub', connected: true, icon: <Twitter className="text-sky-500" /> },
              { name: 'TikTok', handle: '@engagehub_official', connected: true, icon: <Music className="text-black" /> },
              { name: 'YouTube', handle: 'Engagehub Tutorials', connected: false, icon: <Youtube className="text-red-600" /> },
              { name: 'Facebook Page', handle: 'Engagehub Community', connected: false, icon: <Facebook className="text-blue-600" /> },
              { name: 'Pinterest', handle: 'Engagehub Design', connected: false, icon: <Pin className="text-red-700" /> },
              { name: 'Google Business', handle: 'Engagehub HQ', connected: false, icon: <Store className="text-blue-500" /> },
            ].map((account, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 flex items-center justify-between group hover:border-blue-300 transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    {account.icon}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-bold truncate">{account.name}</h4>
                    <p className="text-xs text-gray-500 truncate">{account.handle}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {account.connected ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase">
                      <CheckCircle2 size={10} /> Live
                    </span>
                  ) : (
                    <button className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-tight">Connect</button>
                  )}
                  <button className="p-1 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all group min-h-[94px]">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600">
                <Plus size={18} />
              </div>
              <span className="text-xs font-bold text-gray-400 group-hover:text-blue-600 uppercase">Add Account</span>
            </button>
          </div>
        );
      case 'schedule':
        return (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Queue</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md font-medium text-gray-600 shadow-sm">Calendar</button>
                <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md font-bold shadow-sm">+ New Post</button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { time: 'Today, 4:00 PM', platform: 'Instagram', content: 'Exciting news! Our summer collection is officially live.', status: 'scheduled' },
                { time: 'Tomorrow, 9:00 AM', platform: 'LinkedIn', content: 'Reflecting on 3 years of solo business ownership. #entrepreneur', status: 'scheduled' },
                { time: 'Friday, 12:00 PM', platform: 'X (Twitter)', content: 'Thread: Why minimalism in UI design leads to higher conversion rates 🧵', status: 'scheduled' },
                { time: 'Saturday, 10:00 AM', platform: 'TikTok', content: 'Behind the scenes: How I set up my morning workflow. 🎥', status: 'draft' },
              ].map((item, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50 transition-all flex gap-4 items-center">
                  <div className="w-12 h-12 rounded bg-gray-100 shrink-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-blue-100/50 rounded flex items-center justify-center text-blue-500">
                      <Share2 size={16} />
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{item.platform}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${item.status === 'scheduled' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{item.content}</p>
                    <p className="text-[10px] text-gray-400 mt-1 font-semibold uppercase">{item.time}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <ExternalLink size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'engagement':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Likes</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">12,402</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-green-500 font-bold">+14%</span>
                  <span className="text-[10px] text-gray-400 font-medium">vs last month</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Shares</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">842</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-green-500 font-bold">+3%</span>
                  <span className="text-[10px] text-gray-400 font-medium">vs last month</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profile Visits</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">3,200</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-red-500 font-bold">-2%</span>
                  <span className="text-[10px] text-gray-400 font-medium">vs last month</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-12 rounded-xl border border-gray-200 h-64 flex flex-col items-center justify-center text-gray-400 gap-4">
               <div className="p-4 bg-gray-50 rounded-full">
                 <BarChart2 size={32} />
               </div>
               <div className="text-center">
                 <p className="text-sm font-bold text-gray-600">Engagement Visualization</p>
                 <p className="text-xs text-gray-400">Sync more accounts to see comparative metrics across platforms.</p>
               </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto animate-pulse">
              {tabs.find(t => t.id === activeTab)?.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-800">{tabs.find(t => t.id === activeTab)?.label}</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                Connect your {activeTab === 'dms' ? 'Direct Messages' : activeTab === 'mentions' ? 'Mentions' : 'Comments'} feed to manage all platform interactions from one place.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all text-sm shadow-lg shadow-blue-100">
                Setup Integration
              </button>
              <button className="px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-50 transition-all text-sm">
                Learn More
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200">
        <div className="flex overflow-x-auto no-scrollbar scroll-smooth">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 -mb-[2px] ${
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
        <div className="pb-3 hidden lg:block">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">Real-time Sync Active</p>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SocialMedia;
