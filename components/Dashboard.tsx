
import React, { useEffect, useMemo } from 'react';
import {
  Calendar,
  MessageSquare,
  TrendingUp,
  Users,
  CheckCircle2,
  DollarSign,
  Clock,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  MessageCircle,
  PenTool,
  Target
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useYouTubeOAuthCallback } from './YouTubeConnection';
import { usePosts } from '../src/hooks/usePosts';
import { useDeals } from '../src/hooks/useDeals';
import { useCustomers } from '../src/hooks/useCustomers';
import { useTasks } from '../src/hooks/useTasks';
import { useWorkspace } from '../src/hooks/useWorkspace';
import { useInbox } from '../src/hooks/useInbox';
import { useLeads } from '../src/hooks/useLeads';


const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
        <Icon size={20} className={color.replace('bg-', 'text-')} />
      </div>
      <span className="text-green-500 text-xs font-semibold bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
        <ArrowUpRight size={12} /> {change}
      </span>
    </div>
    <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold mt-1 tracking-tight text-gray-900">{value}</p>
  </div>
);

const SectionHeader = ({ title, linkText }: { title: string, linkText?: string }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-base font-bold text-gray-800">{title}</h3>
    {linkText && (
      <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
        {linkText} <ChevronRight size={14} />
      </button>
    )}
  </div>
);

const Dashboard: React.FC = () => {
  // Handle YouTube OAuth callback
  useYouTubeOAuthCallback();

  // grab underlying data hooks
  const { posts, scheduledPosts } = usePosts();
  const { deals, wonDeals } = useDeals();
  const { tasks } = useTasks();
  const { workspaceId } = useWorkspace();
  const { messages } = useInbox(workspaceId);
  const { leads } = useLeads();

  // metrics
  const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
  const winRate = deals.length > 0 ? (wonDeals.length / deals.length * 100).toFixed(1) : '0';

  // compute weekly revenue chart (last 7 days) - use useMemo to prevent recreation
  const chartData = useMemo(() => {
    const now = new Date();
    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString('en-US', { weekday: 'short' });
      dailyMap[key] = 0;
    }
    wonDeals.forEach(d => {
      if (d.created_at) {
        const dt = new Date(d.created_at);
        const diff = now.getTime() - dt.getTime();
        if (diff < 7 * 24 * 60 * 60 * 1000) {
          const key = dt.toLocaleDateString('en-US', { weekday: 'short' });
          if (dailyMap[key] !== undefined) {
            dailyMap[key] += Number(d.amount) || 0;
          }
        }
      }
    });
    const data: Array<{ name: string; revenue: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString('en-US', { weekday: 'short' });
      data.push({ name: key, revenue: dailyMap[key] || 0 });
    }
    return data;
  }, [wonDeals]);

  // prepare dashboard panels
  const pendingTasks = tasks.filter(t => t.status === 'pending').slice(0, 3);
  const upcomingPosts = scheduledPosts.slice(0, 2);
  const unreadMsgs = messages.filter(m => m.unread).slice(0, 2);
  const recentLeads = leads.slice(0, 2);

  const aiInsightText = `You have ${leads.filter(l => l.status === 'new').length} new lead${leads.filter(l => l.status === 'new').length !== 1 ? 's' : ''} in your workspace. Reach out soon to boost conversion.`;

  return (
    <div className="space-y-6">
    {/* 1. Today Overview Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Today Overview</h2>
        <p className="text-gray-500 text-sm mt-0.5">Monday, June 24th — You have 3 tasks and 2 posts scheduled.</p>
      </div>
      <div className="flex gap-2">
        <button
          title="Change colors, theme and branding"
          onClick={() => {
            // take user straight to branding section of settings
            window.dispatchEvent(new CustomEvent('navigate', { detail: { section: 'Settings', tab: 'branding' } }));
          }}
          className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          Customize
        </button>
        <button
          title="Jump to the new post editor"
          onClick={() => {
            // navigate to Content area and open create tab
            window.dispatchEvent(new CustomEvent('navigate', { detail: { section: 'Content', contentTab: 'create' } }));
          }}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
        >
          Quick Create
        </button>
      </div>
    </div>

    {/* 2. Key Metrics including Total Posts Snapshot */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total Posts" value={posts.length} change="+14.2%" icon={PenTool} color="bg-blue-500" />
      <StatCard title="Total Deals" value={deals.length} change="+12.4%" icon={Target} color="bg-emerald-500" />
      <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} change="+8.2%" icon={DollarSign} color="bg-indigo-500" />
      <StatCard title="Win Rate" value={`${winRate}%`} change="+2.1%" icon={TrendingUp} color="bg-orange-500" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main Column */}
      <div className="lg:col-span-8 space-y-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <SectionHeader title="Revenue Trends" linkText="Full Report" />
          <div className="h-64 w-full" style={{ minWidth: 0, minHeight: 256 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 3. Pending Tasks */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <SectionHeader title="Pending Tasks" linkText="View All" />
            <div className="space-y-3">
              {pendingTasks.length > 0 ? (
                pendingTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-50 transition-all">
                      <CheckCircle2 size={12} className="text-transparent group-hover:text-blue-500" />
                    </div>
                    <span className="text-sm text-gray-700 flex-1">{task.title || task.text}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${task.priority === 'high' ? 'bg-red-50 text-red-600' :
                        task.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500'
                      }`}>
                      {task.priority}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No pending tasks</p>
              )}
            </div>
          </div>

          {/* 4. Scheduled Posts */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <SectionHeader title="Scheduled Posts" linkText="Calendar" />
            <div className="space-y-4">
              {upcomingPosts.length > 0 ? (
                upcomingPosts.map(post => (
                  <div key={post.id} className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-gray-900 truncate">{post.content || post.text || ''}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-blue-600 font-semibold">{post.platform}</span>
                        <span className="text-[10px] text-gray-400">{new Date(post.scheduled_at || post.time || '').toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No scheduled posts</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Column */}
      <div className="lg:col-span-4 space-y-6">
        {/* 5. AI Suggestions */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-xl text-white shadow-lg shadow-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-indigo-200" />
            <h3 className="font-bold">AI Insights</h3>
          </div>
          <p className="text-sm text-indigo-100 mb-6 leading-relaxed">
            {aiInsightText}
          </p>
          <button className="w-full py-2.5 bg-white text-indigo-600 font-bold rounded-lg text-sm hover:bg-indigo-50 transition-colors">
            Execute AI Action
          </button>
        </div>

        {/* 6. Messages Requiring Reply */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <SectionHeader title="Needs Reply" linkText="Inbox" />
          <div className="space-y-4">
            {unreadMsgs.length > 0 ? (
              unreadMsgs.map((msg, idx) => (
                <div key={msg.id || idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-all cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs">
                    {msg.sender.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 truncate">{msg.sender}</p>
                    <p className="text-xs text-gray-500 truncate">{msg.text}</p>
                  </div>
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{msg.platform}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No unread messages</p>
            )}
          </div>
        </div>

        {/* 7. New Leads */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <SectionHeader title="Recent Leads" linkText="CRM" />
          <div className="space-y-4">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead, idx) => (
                <div key={lead.id || idx} className="flex items-center justify-between p-2 rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{lead.name}</p>
                      <p className="text-xs text-gray-400">{lead.source}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${lead.status === 'new' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                    {lead.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent leads</p>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Dashboard;
