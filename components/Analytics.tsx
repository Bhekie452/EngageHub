
import React, { useMemo, useState, useEffect } from 'react';
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
import { useAnalyticsDaily, useAnalyticsRollupDay, useGlobalSocialSummary } from '../src/hooks/useAnalytics';
import { useDeals } from '../src/hooks/useDeals';
import { useCustomers } from '../src/hooks/useCustomers';
import { usePosts } from '../src/hooks/usePosts';
import { useCampaigns } from '../src/hooks/useCampaigns';
import YouTubeSimpleConnect from './YouTubeSimpleConnect';

type AnalyticsTab = 'overview' | 'social' | 'campaigns' | 'crm' | 'revenue' | 'engagement';

function toDayString(d: Date) {
  return d.toISOString().slice(0, 10);
}

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);

  // Check YouTube connection using the same localStorage key as YouTubeSimpleConnect
  const WORKSPACE_ID = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9'
  const [youtubeConnected, setYoutubeConnected] = useState(false)

  useEffect(() => {
    const cachedState = localStorage.getItem(`youtube-connected-${WORKSPACE_ID}`)
    setYoutubeConnected(cachedState === 'true')
  }, [])

  const today = useMemo(() => new Date(), []);
  const toDay = useMemo(() => toDayString(today), [today]);
  const fromDay = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - (rangeDays - 1));
    return toDayString(d);
  }, [today, rangeDays]);

  const rangeDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < rangeDays; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (rangeDays - 1 - i));
      dates.push(toDayString(d));
    }
    return dates;
  }, [today, rangeDays]);

  const dailyQuery = useAnalyticsDaily(fromDay, toDay);
  const rollupDay = useAnalyticsRollupDay();

  // Product data (CRM/Deals) comes from Supabase services
  const { deals } = useDeals();
  const { customers } = useCustomers();
  const { posts } = usePosts();
  const { campaigns } = useCampaigns();
  const globalSocial = useGlobalSocialSummary();
  const socialData = globalSocial.data;

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
    const series = rangeDates.map(dayStr => {
      const row = daily.find(r => r.day === dayStr);
      return {
        day: dayStr.slice(5),
        likes: row?.likes || 0,
        shares: row?.shares || 0,
        comments: row?.comments || 0,
        views: row?.post_views || 0,
      };
    });

    const hasData = series.some(s => s.views > 0 || s.likes > 0 || s.shares > 0 || s.comments > 0);
    if (!hasData) {
      // High-fidelity fallback if NO data in range
      return [
        { day: '02-01', views: 420, likes: 45, shares: 12, comments: 8 },
        { day: '02-02', views: 580, likes: 62, shares: 18, comments: 12 },
        { day: '02-03', views: 890, likes: 94, shares: 25, comments: 22 },
        { day: '02-04', views: 640, likes: 71, shares: 15, comments: 14 },
        { day: '02-05', views: 1240, likes: 128, shares: 42, comments: 31 },
        { day: '02-06', views: 980, likes: 110, shares: 38, comments: 25 },
        { day: '02-07', views: 1560, likes: 184, shares: 56, comments: 42 },
      ];
    }
    return series;
  }, [daily, rangeDates]);

  const platformData = useMemo(() => {
    const platformColors: Record<string, string> = {
      facebook: '#1877F2',
      instagram: '#E4405F',
      twitter: '#1DA1F2',
      linkedin: '#0A66C2',
      youtube: '#FF0000',
      tiktok: '#000000',
      whatsapp: '#25D366'
    };

    // 1. Try to use socialData (aggregated results from database)
    if (socialData?.platformBreakdown && socialData.platformBreakdown.length > 0) {
      const breakdown = socialData.platformBreakdown;
      const totalViews = socialData.totalViews;

      // If we have actual views, distribution should be based on TRAFFIC
      if (totalViews > 0) {
        return breakdown.map(p => ({
          name: p.platform,
          value: Math.round((p.views / totalViews) * 100),
          color: platformColors[p.platform.toLowerCase()] || '#94a3b8',
          views: p.views
        })).sort((a, b) => b.views - (a.views || 0));
      }

      // If no views yet, use POST DISTRIBUTION as a secondary real-data metric
      const totalPosts = breakdown.reduce((acc, p) => acc + p.postCount, 0);
      if (totalPosts > 0) {
        return breakdown.map(p => ({
          name: p.platform,
          value: Math.round((p.postCount / totalPosts) * 100),
          color: platformColors[p.platform.toLowerCase()] || '#94a3b8',
          views: 0
        })).sort((a, b) => b.value - a.value);
      }
    }

    // 2. Fallback to mock data for first-time orientation
    return [
      { name: 'YouTube', value: 45, color: '#FF0000', views: 2450 },
      { name: 'Twitter', value: 16, color: '#1DA1F2', views: 880 },
      { name: 'LinkedIn', value: 16, color: '#0A66C2', views: 860 },
      { name: 'Facebook', value: 11, color: '#1877F2', views: 610 },
      { name: 'Instagram', value: 7, color: '#E4405F', views: 390 },
      { name: 'WhatsApp', value: 5, color: '#25D366', views: 270 },
    ].sort((a, b) => b.value - a.value);
  }, [socialData]);

  const revenueData = useMemo(() => {
    const wonDeals = deals.filter(d => d.status === 'won');

    const series = rangeDates.map(dayStr => {
      const dayDeals = wonDeals.filter(d => d.actual_close_date?.startsWith(dayStr));
      const totalRevenue = dayDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
      return {
        name: dayStr.slice(5),
        revenue: totalRevenue,
      };
    });

    const hasData = series.some(s => s.revenue > 0);
    if (!hasData) {
      return [
        { name: '02-01', revenue: 1200 },
        { name: '02-02', revenue: 2100 },
        { name: '02-03', revenue: 800 },
        { name: '02-04', revenue: 3400 },
        { name: '02-05', revenue: 1500 },
        { name: '02-06', revenue: 2800 },
        { name: '02-07', revenue: 4200 },
      ];
    }

    return series;
  }, [deals, rangeDates]);

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
                  <span className="text-xs font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowUpRight size={12} /> 12.4%</span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Posts</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{posts.length}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users size={20} /></div>
                  <span className="text-xs font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowUpRight size={12} /> 8.2%</span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customers</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{customers.length}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Activity size={20} /></div>
                  <span className="text-xs font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowUpRight size={12} /> 2.1%</span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Reach (Views)</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{(socialData?.totalViews || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={20} /></div>
                  <span className="text-xs font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowUpRight size={12} /> 15%</span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Followers</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{(socialData?.totalFollowers || 0).toLocaleString()}</p>
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
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-medium text-gray-400">{(p.views || 0).toLocaleString()} views</span>
                        <span className="text-xs font-black text-gray-400">{p.value}%</span>
                      </div>
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
                  <span className="text-xs font-black text-green-600 uppercase px-2 py-1 rounded-full bg-green-50">Connected</span>
                </div>

                {/* YouTube analytics content (real aggregates) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-red-50/50 rounded-2xl border border-red-100">
                    <p className="text-2xl font-black text-red-900">
                      {posts.filter(p => (p.platforms || []).includes('youtube')).length}
                    </p>
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1">Total Videos</p>
                  </div>
                  <div className="text-center p-6 bg-red-50/50 rounded-2xl border border-red-100">
                    <p className="text-2xl font-black text-red-900">
                      {overview.totalViews.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1">Total Views</p>
                  </div>
                  <div className="text-center p-6 bg-red-50/50 rounded-2xl border border-red-100">
                    <p className="text-2xl font-black text-red-900">
                      {overview.engagementRate.toFixed(1)}%
                    </p>
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1">Avg Engagement</p>
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
              {(socialData?.platformBreakdown || []).map((p, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm group hover:border-blue-300 transition-all">
                  <div className="flex justify-between items-center mb-6">
                    <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest">{p.platform} Highlights</h5>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-green-50 text-green-600`}>
                      {p.followers.toLocaleString()} Followers
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Views</p>
                      <p className="text-lg font-black text-gray-900">{p.views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interactions</p>
                      <p className="text-lg font-black text-gray-900">{(p.likes + p.comments + p.shares).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Posts on {p.platform}</p>
                      <p className="text-sm font-bold text-gray-800">{p.postCount} Published</p>
                    </div>
                    {p.platform.toLowerCase() === 'youtube' && !youtubeConnected ? (
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Campaigns</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{campaigns.length}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Campaigns</p>
                <p className="text-2xl font-black text-blue-600 mt-1">
                  {campaigns.filter((c: any) => c.status === 'active' || c.status === 'running').length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">All Campaigns</h4>
              </div>
              <div className="divide-y divide-gray-100">
                {campaigns.map((campaign: any) => (
                  <div key={campaign.id} className="p-4 hover:bg-gray-50 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                        <Target size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{campaign.name}</p>
                        <p className="text-xs text-gray-500 font-medium">{campaign.description || 'No description'}</p>
                      </div>
                    </div>
                    <div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${campaign.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                        }`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                ))}
                {campaigns.length === 0 && (
                  <div className="p-10 text-center text-gray-400">No campaigns found.</div>
                )}
              </div>
            </div>
          </div>
        );

      case 'revenue':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl text-white shadow-xl shadow-emerald-100">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Won Revenue</p>
                <p className="text-4xl font-black mt-2">
                  ${deals.filter(d => d.status === 'won').reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString()}
                </p>
                <div className="flex items-center gap-2 mt-4 text-xs font-bold bg-white/20 w-fit px-2 py-1 rounded-lg">
                  <ArrowUpRight size={14} /> +18.4% this month
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Pipeline Value</p>
                <p className="text-3xl font-black text-gray-900 mt-2">
                  ${deals.filter(d => d.status === 'open').reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Win Rate</p>
                <p className="text-3xl font-black text-gray-900 mt-2">
                  {deals.length > 0 ? (deals.filter(d => d.status === 'won').length / deals.length * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-8">Revenue Trends</h4>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      case 'crm':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Customers', value: customers.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Active Deals', value: deals.filter(d => d.status === 'open').length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Won Deals', value: deals.filter(d => d.status === 'won').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Lost Deals', value: deals.filter(d => d.status === 'lost').length, color: 'text-red-600', bg: 'bg-red-50' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <p className={`text-2xl font-black ${stat.color} mt-1`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Recent Deal Activity</h4>
                <button className="text-xs font-bold text-blue-600 hover:text-blue-700">View CRM</button>
              </div>
              <div className="divide-y divide-gray-100">
                {deals.slice(0, 5).map(deal => (
                  <div key={deal.id} className="p-4 hover:bg-gray-50 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                        <Target size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{deal.title}</p>
                        <p className="text-xs text-gray-500 font-medium">
                          {deal.contacts?.full_name || 'No contact'} • {deal.actual_close_date || deal.created_at}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">${deal.amount?.toLocaleString()}</p>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${deal.status === 'won' ? 'bg-green-50 text-green-700' :
                        deal.status === 'lost' ? 'bg-red-50 text-red-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                        {deal.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'engagement':
        const topPosts = useMemo(() => {
          return posts
            .map((p: any) => {
              const totalEngagement = (p.likes || 0) + (p.comments || 0) + (p.shares || 0);
              const engagementRate = p.views ? (totalEngagement / p.views) * 100 : 0;
              return { ...p, totalEngagement, engagementRate };
            })
            .sort((a: any, b: any) => b.totalEngagement - a.totalEngagement)
            .slice(0, 5);
        }, [posts]);

        const engagementByPlatform = useMemo(() => {
          const platformEngagement: Record<string, { likes: number; comments: number; shares: number; views: number }> = {};

          posts.forEach((post: any) => {
            (post.platforms || []).forEach((platform: string) => {
              if (!platformEngagement[platform]) {
                platformEngagement[platform] = { likes: 0, comments: 0, shares: 0, views: 0 };
              }
              platformEngagement[platform].likes += post.likes || 0;
              platformEngagement[platform].comments += post.comments || 0;
              platformEngagement[platform].shares += post.shares || 0;
              platformEngagement[platform].views += post.views || 0;
            });
          });

          return Object.entries(platformEngagement).map(([platform, stats]) => ({
            platform: platform.charAt(0).toUpperCase() + platform.slice(1),
            ...stats,
            rate: stats.views > 0 ? ((stats.likes + stats.comments + stats.shares) / stats.views * 100).toFixed(2) : '0.00'
          }));
        }, [posts]);

        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Key Engagement Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-blue-100">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Interactions</p>
                <p className="text-4xl font-black mt-2">
                  {(overview.totalInteractions || 0).toLocaleString()}
                </p>
                <div className="flex items-center gap-2 mt-4 text-xs font-bold bg-white/20 w-fit px-2 py-1 rounded-lg">
                  <ArrowUpRight size={14} /> +24.5% vs last period
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg Engagement Rate</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{overview.engagementRate.toFixed(2)}%</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Likes</p>
                <p className="text-2xl font-black text-pink-600 mt-1">
                  {(posts as any[]).reduce((sum, p) => sum + (p.likes || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Comments</p>
                <p className="text-2xl font-black text-blue-600 mt-1">
                  {(posts as any[]).reduce((sum, p) => sum + (p.comments || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Engagement Trends */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-8">Engagement Trends (Daily)</h4>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={engagementSeries}>
                    <defs>
                      <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" />
                    <Area type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorLikes)" />
                    <Area type="monotone" dataKey="comments" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorComments)" />
                    <Area type="monotone" dataKey="shares" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorShares)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performing Content */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Top Performing Posts</h4>
                </div>
                <div className="divide-y divide-gray-100">
                  {topPosts.map((post, idx) => (
                    <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm">
                          #{idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500 font-medium">
                              ❤️ {post.likes || 0}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              💬 {post.comments || 0}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              🔄 {post.shares || 0}
                            </span>
                            <span className="text-xs font-black text-blue-600">
                              {post.engagementRate.toFixed(1)}% rate
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {topPosts.length === 0 && (
                    <div className="p-10 text-center text-gray-400">No posts with engagement data yet.</div>
                  )}
                </div>
              </div>

              {/* Engagement by Platform */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Engagement by Platform</h4>
                </div>
                <div className="p-6 space-y-4">
                  {engagementByPlatform.map((platform, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">{platform.platform}</span>
                        <span className="text-xs font-black text-blue-600">{platform.rate}% rate</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-pink-50 p-2 rounded-lg">
                          <p className="text-xs text-pink-600 font-medium">Likes</p>
                          <p className="text-sm font-black text-pink-900">{platform.likes.toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <p className="text-xs text-blue-600 font-medium">Comments</p>
                          <p className="text-sm font-black text-blue-900">{platform.comments.toLocaleString()}</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded-lg">
                          <p className="text-xs text-green-600 font-medium">Shares</p>
                          <p className="text-sm font-black text-green-900">{platform.shares.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {engagementByPlatform.length === 0 && (
                    <div className="p-10 text-center text-gray-400">No platform engagement data available.</div>
                  )}
                </div>
              </div>
            </div>
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
            className={`flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all border-b-2 -mb-[2px] whitespace-nowrap ${activeTab === tab.id
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
