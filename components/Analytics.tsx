
import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Share2, 
  Target, 
  Users, 
  DollarSign, 
  PieChart as PieChartIcon,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  Activity,
  Zap,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  LineChart, Line, 
  XAxis, YAxis, 
  CartesianGrid, Tooltip, 
  ResponsiveContainer, 
  PieChart, Pie, Cell,
  Legend
} from 'recharts';

type AnalyticsTab = 'overview' | 'social' | 'campaigns' | 'crm' | 'revenue' | 'engagement';

const revenueData = [
  { name: 'Jan', revenue: 4200, growth: 12 },
  { name: 'Feb', revenue: 3800, growth: -5 },
  { name: 'Mar', revenue: 5100, growth: 22 },
  { name: 'Apr', revenue: 6200, growth: 18 },
  { name: 'May', revenue: 8400, growth: 35 },
  { name: 'Jun', revenue: 7900, growth: -2 },
];

const platformData = [
  { name: 'Instagram', value: 45, color: '#E1306C' },
  { name: 'LinkedIn', value: 30, color: '#0077B5' },
  { name: 'X', value: 15, color: '#000000' },
  { name: 'Email', value: 10, color: '#3b82f6' },
];

const engagementData = [
  { day: 'Mon', likes: 120, shares: 45, comments: 22 },
  { day: 'Tue', likes: 150, shares: 52, comments: 28 },
  { day: 'Wed', likes: 220, shares: 88, comments: 45 },
  { day: 'Thu', likes: 180, shares: 60, comments: 32 },
  { day: 'Fri', likes: 250, shares: 110, comments: 55 },
  { day: 'Sat', likes: 310, shares: 140, comments: 72 },
  { day: 'Sun', likes: 280, shares: 120, comments: 65 },
];

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

  const tabs: { id: AnalyticsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { id: 'social', label: 'Social performance', icon: <Share2 size={16} /> },
    { id: 'campaigns', label: 'Campaign analytics', icon: <Target size={16} /> },
    { id: 'crm', label: 'CRM metrics', icon: <Users size={16} /> },
    { id: 'revenue', label: 'Revenue reports', icon: <DollarSign size={16} /> },
    { id: 'engagement', label: 'Engagement reports', icon: <Activity size={16} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                   <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={20} /></div>
                   <span className="text-xs font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowUpRight size={12}/> 12.4%</span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gross Revenue</p>
                <p className="text-2xl font-black text-gray-900 mt-1">$42,400.00</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                   <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users size={20} /></div>
                   <span className="text-xs font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowUpRight size={12}/> 8.2%</span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Customers</p>
                <p className="text-2xl font-black text-gray-900 mt-1">1,240</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                   <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Activity size={20} /></div>
                   <span className="text-xs font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowDownRight size={12}/> 2.1%</span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg. Engagement</p>
                <p className="text-2xl font-black text-gray-900 mt-1">4.82%</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                   <div className="p-2 bg-orange-50 text-orange-600 rounded-xl"><Zap size={20} /></div>
                   <span className="text-xs font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowUpRight size={12}/> 15%</span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Automation Efficiency</p>
                <p className="text-2xl font-black text-gray-900 mt-1">84%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-8">Revenue Growth (6 Mo)</h4>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-8">Traffic by Platform</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={platformData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                   {platformData.map(p => (
                     <div key={p.name} className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                         <span className="text-xs font-bold text-gray-600">{p.name}</span>
                       </div>
                       <span className="text-xs font-black text-gray-400">{p.value}%</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'social':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
               <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-8">Platform Engagement Distribution</h4>
               <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                      <Legend iconType="circle" />
                      <Bar dataKey="likes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="shares" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="comments" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { platform: 'LinkedIn', reach: '12.5k', change: '+14%', topPost: 'Reflecting on 3 years of solo business...' },
                { platform: 'Instagram', reach: '8.2k', change: '+21%', topPost: 'Why minimalism in UI leads to higher...' }
              ].map((p, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm group hover:border-blue-300 transition-all">
                  <div className="flex justify-between items-center mb-6">
                    <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest">{p.platform} Highlights</h5>
                    <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{p.change} Reach</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Top Performing Post</p>
                      <p className="text-sm font-bold text-gray-800 line-clamp-1 italic">"{p.topPost}"</p>
                    </div>
                    {/* Fixed ArrowRight missing icon name */}
                    <button className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                      View Platform Report <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'campaigns':
        return (
          <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-gray-200 text-center flex flex-col items-center justify-center">
             <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-6">
               <Target size={40} />
             </div>
             <h3 className="text-xl font-black text-gray-900 mb-2">Campaign Analytics Studio</h3>
             <p className="text-sm text-gray-500 max-w-sm mb-8 leading-relaxed font-medium">
               Deep-dive into multichannel campaign ROI, funnel conversion rates, and asset attribution.
             </p>
             <button className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all text-sm shadow-xl shadow-blue-100">
               Sync Campaign Data
             </button>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-20 text-center space-y-6">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto">
              {tabs.find(t => t.id === activeTab)?.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{tabs.find(t => t.id === activeTab)?.label}</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2 leading-relaxed font-medium">
                This analytics module is currently gathering data to provide precise insights.
              </p>
            </div>
            <button className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm shadow-xl shadow-indigo-100">
              Refresh Data Source
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
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Analytics & Growth</h2>
          <p className="text-gray-500 text-sm font-medium">Measuring performance across your solo empire.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
            <Download size={16} /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
            <Filter size={16} /> Filter Date
          </button>
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

export default Analytics;
