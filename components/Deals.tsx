
import React, { useState } from 'react';
import { 
  Handshake, 
  Trello, 
  Target, 
  FileText, 
  ThumbsUp, 
  ThumbsDown, 
  LineChart, 
  Plus, 
  MoreVertical, 
  DollarSign, 
  Calendar, 
  ChevronRight, 
  ArrowUpRight,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type DealsTab = 'pipeline' | 'opportunities' | 'quotes' | 'won' | 'lost' | 'forecast';

const forecastData = [
  { month: 'Jan', projected: 4500, actual: 4200 },
  { month: 'Feb', projected: 5200, actual: 5100 },
  { month: 'Mar', projected: 6000, actual: 5800 },
  { month: 'Apr', projected: 6500, actual: 7100 },
  { month: 'May', projected: 8000, actual: 0 },
  { month: 'Jun', projected: 9500, actual: 0 },
];

const Deals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DealsTab>('pipeline');

  const tabs: { id: DealsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'pipeline', label: 'Deal pipeline', icon: <Trello size={16} /> },
    { id: 'opportunities', label: 'Opportunities', icon: <Target size={16} /> },
    { id: 'quotes', label: 'Quotes', icon: <FileText size={16} /> },
    { id: 'won', label: 'Won deals', icon: <ThumbsUp size={16} /> },
    { id: 'lost', label: 'Lost deals', icon: <ThumbsDown size={16} /> },
    { id: 'forecast', label: 'Forecast', icon: <LineChart size={16} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pipeline':
        return (
          <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar h-[calc(100vh-20rem)] min-h-[500px]">
            {[
              { stage: 'Discovery', count: 4, total: '$12,500', deals: [{ name: 'Apex Solutions', val: '$3.5k', day: '2d ago' }, { name: 'CloudScale', val: '$9k', day: '5d ago' }] },
              { stage: 'Proposal', count: 2, total: '$24,000', deals: [{ name: 'Stellar App', val: '$15k', day: '1d ago' }, { name: 'Global Retail', val: '$9k', day: '3d ago' }] },
              { stage: 'Negotiation', count: 1, total: '$5,000', deals: [{ name: 'BioTech Retainer', val: '$5k', day: 'Just now' }] },
              { stage: 'Contracting', count: 1, total: '$45,000', deals: [{ name: 'Enterprise Overhaul', val: '$45k', day: '4h ago' }] },
            ].map((col, idx) => (
              <div key={idx} className="min-w-[300px] w-[300px] flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">{col.stage}</h4>
                    <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded-full">{col.count}</span>
                  </div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{col.total}</p>
                </div>
                <div className="bg-gray-100/50 rounded-2xl p-2 flex-1 flex flex-col gap-3 border border-gray-100 overflow-y-auto">
                  {col.deals.map((deal, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing group">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{deal.name}</p>
                        <button className="opacity-0 group-hover:opacity-100 transition-all text-gray-300"><MoreVertical size={14} /></button>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase mb-4">
                        <Clock size={10} /> {deal.day}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <span className="text-sm font-black text-gray-800">{deal.val}</span>
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-black text-blue-600">
                          {deal.name.charAt(0)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-300 hover:border-blue-300 hover:bg-white hover:text-blue-500 transition-all flex items-center justify-center gap-2 mt-auto">
                    <Plus size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">New Deal</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'opportunities':
      case 'won':
      case 'lost':
        return (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search deals..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                <Plus size={16} /> Add Opportunity
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Deal Name</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Close Probability</th>
                    <th className="px-6 py-4">Expected Close</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { name: 'Redesign Project', val: '$8,400', prob: '85%', date: 'Jun 15, 2025', color: 'blue' },
                    { name: 'Mobile App MVP', val: '$12,000', prob: '40%', date: 'Jul 02, 2025', color: 'indigo' },
                    { name: 'Branding Package', val: '$2,500', prob: '95%', date: 'Jun 05, 2025', color: 'emerald' },
                  ].map((deal, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full bg-${deal.color}-50 text-${deal.color}-600 flex items-center justify-center font-black text-xs`}>
                            {deal.name.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-gray-900">{deal.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-gray-800 text-sm">{deal.val}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full bg-blue-600`} style={{ width: deal.prob }}></div>
                          </div>
                          <span className="text-xs font-bold text-gray-500">{deal.prob}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold uppercase tracking-tighter">
                          <Calendar size={12} /> {deal.date}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"><MoreVertical size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'quotes':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: 'Q-2025-001', client: 'Skyline Inc.', val: '$4,200', status: 'Accepted', date: '2 days ago' },
              { id: 'Q-2025-004', client: 'Oceanic Group', val: '$15,000', status: 'Sent', date: '5h ago' },
              { id: 'Q-2025-005', client: 'Personal Branding', val: '$1,800', status: 'Draft', date: 'Just now' },
            ].map((quote, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-200 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:text-blue-500 transition-all">
                    <FileText size={20} />
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    quote.status === 'Accepted' ? 'bg-green-50 text-green-600' :
                    quote.status === 'Sent' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {quote.status}
                  </span>
                </div>
                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">{quote.id}</h4>
                <p className="text-lg font-bold text-gray-900 mb-4">{quote.client}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-lg font-black text-gray-800">{quote.val}</span>
                  <button className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    View <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            ))}
            <button className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-blue-300 hover:bg-blue-50 transition-all group">
              <Plus size={24} className="text-gray-300 group-hover:text-blue-600" />
              <p className="text-xs font-bold text-gray-400 group-hover:text-blue-600 uppercase">New Quote</p>
            </button>
          </div>
        );

      case 'forecast':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expected Revenue (Q2)</p>
                <p className="text-3xl font-black mt-2 text-gray-900">$24,500</p>
                <div className="flex items-center gap-2 mt-2 text-green-500 font-bold text-xs">
                  <TrendingUp size={14} /> +18% from Q1
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pipeline Value</p>
                <p className="text-3xl font-black mt-2 text-gray-900">$86,500</p>
                <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase">8 High Probability Deals</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-l-4 border-l-orange-400">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gap to Goal</p>
                <p className="text-3xl font-black mt-2 text-orange-600">$5,500</p>
                <div className="flex items-center gap-2 mt-2 text-gray-400 font-bold text-xs">
                  <AlertCircle size={14} /> Needs 2 more closed deals
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Projected vs Actual Revenue</h4>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Projected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Actual</span>
                  </div>
                </div>
              </div>
              <div className="h-80 w-full" style={{ minWidth: 0, minHeight: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      cursor={{fill: '#f9fafb'}}
                    />
                    <Bar dataKey="projected" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 sticky top-16 bg-gray-50/90 backdrop-blur-sm z-20 overflow-x-auto no-scrollbar">
        <div className="flex whitespace-nowrap scroll-smooth">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all border-b-2 -mb-[2px] ${
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
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both pb-20">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Deals;
