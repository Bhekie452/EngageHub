
import React, { useMemo, useState } from 'react';
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
  ArrowRight,
  Youtube
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
import { useAnalyticsDaily, useAnalyticsRollupDay } from '../src/hooks/useAnalytics';
import { useDeals } from '../src/hooks/useDeals';
import { useCustomers } from '../src/hooks/useCustomers';
import { usePosts } from '../src/hooks/usePosts';
import YouTubeSimpleConnect from './YouTubeSimpleConnect';

type AnalyticsTab = 'overview' | 'social' | 'campaigns' | 'crm' | 'revenue' | 'engagement';

function toDayString(d: Date) {
  return d.toISOString().slice(0, 10);
}

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);

  const { isConnected: youtubeConnected, loading: youtubeLoading } = useYouTubeConnection();

  const today = useMemo(() => new Date(), []);
  const toDay = useMemo(() => toDayString(today), [today]);
  const fromDay = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - (rangeDays - 1));
    return toDayString(d);
  }, [today, rangeDays]);

  const dailyQuery = useAnalyticsDaily(fromDay, toDay);
  const rollupDay = useAnalyticsRollupDay();

  // Product data (CRM/Deals) comes from Supabase services
  const { deals } = useDeals();
  const { customers } = useCustomers();
  const { posts } = usePosts();

  const daily = dailyQuery.data || [];

  const overview = useMemo(() => {
    const sum = (key: keyof (typeof daily)[number]) => daily.reduce((acc, r: any) => acc + (Number(r[key]) || 0), 0);
    const totalSessions = sum('sessions' as any);
    const totalDau = daily.length ? Math.round(sum('dau' as any) / daily.length) : 0;
    const totalInteractions = sum('interactions' as any);
    const totalViews = sum('post_views' as any);
    const engagementRate = totalViews > 0 ? (totalInteractions / totalViews) * 100 : 0;
    const avgSessionSeconds = daily.length ? Math.round(sum('avg_session_seconds' as any) / daily.length) : 0;
    return { totalSessions, totalDau, engagementRate, avgSessionSeconds, totalViews, totalInteractions };
  }, [daily]);

  const engagementSeries = useMemo(() => {
    return daily.map((r) => ({
      day: r.day?.slice(5) || r.day,
      likes: r.likes || 0,
      shares: r.shares || 0,
      comments: r.comments || 0,
      views: r.post_views || 0,
    }));
  }, [daily]);

  const platformData = useMemo(() => {
    // until we ingest per-platform events, show placeholder distribution
    return [
      { name: 'Instagram', value: 35, color: '#E1306C' },
      { name: 'LinkedIn', value: 25, color: '#0077B5' },
      { name: 'X', value: 10, color: '#000000' },
      { name: 'Facebook', value: 20, color: '#1877F2' },
      { name: 'Email', value: 10, color: '#3b82f6' },
    ];
  }, []);

  const revenueData = useMemo(() => {
    // If you later add revenue events, replace this with real rollups
    return daily.map((r) => ({ name: r.day?.slice(5) || r.day, revenue: 0, growth: 0 }));
  }, [daily]);

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
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs font-bold text-gray-500">
                Range: {fromDay} → {toDay}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={rangeDays}
                  onChange={(e) => setRangeDays(Number(e.target.value) as any)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={14}>Last 14 days</option>
                  <option value={30}>Last 30 days</option>
                </select>
                <button
                  onClick={() => rollupDay.mutate(toDay)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all"
                  disabled={rollupDay.isPending}
                >
                  {rollupDay.isPending ? 'Rolling up…' : 'Refresh'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                   <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={20} /></div>
                   <span className="text-xs font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowUpRight size={12}/> 12.4%</span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Posts</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{posts.length}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                   <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users size={20} /></div>
                   <span className="text-xs font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowUpRight size={12}/> 8.2%</span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customers</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{customers.length}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                   <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Activity size={20} /></div>
                   <span className="text-xs font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowDownRight size={12}/> 2.1%</span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Engagement Rate</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{overview.engagementRate.toFixed(2)}%</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                   <div className="p-2 bg-orange-50 text-orange-600 rounded-xl"><Zap size={20} /></div>
                   <span className="text-xs font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowUpRight size={12}/> 15%</span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg DAU</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{overview.totalDau}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-8">Engagement (daily)</h4>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={engagementSeries}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
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
            {/* YouTube Connection Prompt */}
            <YouTubeSimpleConnect />

            {/* YouTube Analytics Section */}
            {youtubeConnected && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <Youtube className="w-5 h-5 text-red-600" />
                    </div>
                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">YouTube Performance</h4>
                  </div>
                  <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Connected</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">2.4K</p>
                    <p className="text-xs text-gray-600 font-medium">Total Views</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">145</p>
                    <p className="text-xs text-gray-600 font-medium">Subscribers</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">8.2%</p>
                    <p className="text-xs text-gray-600 font-medium">Engagement Rate</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
               <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-8">Platform Engagement Distribution</h4>
               <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementSeries}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { platform: 'LinkedIn', reach: '12.5k', change: '+14%', topPost: 'Reflecting on 3 years of solo business...' },
                { platform: 'Instagram', reach: '8.2k', change: '+21%', topPost: 'Why minimalism in UI leads to higher...' },
                { platform: 'YouTube', reach: '2.4k', change: '+8%', topPost: 'How to build a scalable API architecture...', connected: youtubeConnected }
              ].map((p, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm group hover:border-blue-300 transition-all">
                  <div className="flex justify-between items-center mb-6">
                    <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest">{p.platform} Highlights</h5>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      p.connected ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {p.connected ? 'Connected' : p.change} Reach
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Top Performing Post</p>
                      <p className="text-sm font-bold text-gray-800 line-clamp-1 italic">"{p.topPost}"</p>
                    </div>
                    {!p.connected && p.platform === 'YouTube' ? (
                      <YouTubeSimpleConnect />
                    ) : (
                      <button className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                        View Platform Report <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
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
        {dailyQuery.isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500 font-medium">
            Loading analytics…
          </div>
        ) : dailyQuery.error ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-red-500 font-medium">
            Failed to load analytics (likely RLS / missing tables). Run `create_analytics_events.sql` and `fix_analytics_rls.sql` in Supabase.
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  );
};

export default Analytics;
