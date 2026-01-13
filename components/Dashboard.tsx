
import React from 'react';
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
  PenTool
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 2000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 2390 },
  { name: 'Sun', revenue: 3490 },
];

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
  return (
    <div className="space-y-6">
      {/* 1. Today Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Today Overview</h2>
          <p className="text-gray-500 text-sm mt-0.5">Monday, June 24th — You have 3 tasks and 2 posts scheduled.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            Customize
          </button>
          <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-200">
            Quick Create
          </button>
        </div>
      </div>

      {/* 2. Key Metrics including Total Posts Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Posts" value="156" change="+14.2%" icon={PenTool} color="bg-blue-500" />
        <StatCard title="New Leads" value="24" change="+12%" icon={Users} color="bg-blue-500" />
        <StatCard title="Engagement Rate" value="4.8%" change="+2.4%" icon={TrendingUp} color="bg-indigo-500" />
        <StatCard title="Response Time" value="1.2h" change="-15%" icon={Clock} color="bg-orange-500" />
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
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                {[
                  { id: 1, text: 'Review Q3 Marketing Plan', priority: 'High' },
                  { id: 2, text: 'Follow up with lead: SolarTech', priority: 'Medium' },
                  { id: 3, text: 'Record tutorial video', priority: 'Low' },
                ].map(task => (
                  <div key={task.id} className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-50 transition-all">
                      <CheckCircle2 size={12} className="text-transparent group-hover:text-blue-500" />
                    </div>
                    <span className="text-sm text-gray-700 flex-1">{task.text}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      task.priority === 'High' ? 'bg-red-50 text-red-600' : 
                      task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Scheduled Posts */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <SectionHeader title="Scheduled Posts" linkText="Calendar" />
              <div className="space-y-4">
                {[
                  { id: 1, platform: 'LinkedIn', time: 'Today, 2:00 PM', content: 'The future of solo-ops...' },
                  { id: 2, platform: 'Instagram', time: 'Tomorrow, 10:00 AM', content: 'Launch day countdown!' },
                ].map(post => (
                  <div key={post.id} className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-gray-900 truncate">{post.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-blue-600 font-semibold">{post.platform}</span>
                        <span className="text-[10px] text-gray-400">{post.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
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
              "You have 3 leads that haven't been contacted in 48 hours. Reaching out now could increase conversion by 30%."
            </p>
            <button className="w-full py-2.5 bg-white text-indigo-600 font-bold rounded-lg text-sm hover:bg-indigo-50 transition-colors">
              Execute AI Action
            </button>
          </div>

          {/* 6. Messages Requiring Reply */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <SectionHeader title="Needs Reply" linkText="Inbox" />
            <div className="space-y-4">
              {[
                { name: 'Sarah Miller', text: 'Pricing for the pro plan?', platform: 'WhatsApp' },
                { name: 'Dave Wilson', text: 'Can we move our call?', platform: 'LinkedIn' },
              ].map((msg, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-all cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs">
                    {msg.name.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 truncate">{msg.name}</p>
                    <p className="text-xs text-gray-500 truncate">{msg.text}</p>
                  </div>
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{msg.platform}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 7. New Leads */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <SectionHeader title="Recent Leads" linkText="CRM" />
            <div className="space-y-4">
              {[
                { name: 'TechFlow Inc.', industry: 'SaaS', status: 'Hot' },
                { name: 'Greenery Co.', industry: 'E-commerce', status: 'Warm' },
              ].map((lead, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{lead.name}</p>
                      <p className="text-xs text-gray-400">{lead.industry}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    lead.status === 'Hot' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
