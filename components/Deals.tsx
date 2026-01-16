
import React, { useState, useMemo } from 'react';
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
import { useDeals } from './src/hooks/useDeals';
import { useCurrency } from './src/hooks/useCurrency';
import { useAuth } from './src/hooks/useAuth';
import { formatCurrency, formatCompactCurrency, formatCurrencyWithCommas } from './src/lib/currency';

type DealsTab = 'pipeline' | 'opportunities' | 'quotes' | 'won' | 'lost' | 'forecast';

// Map database stage names to UI stage names
const stageMapping: Record<string, string> = {
  'discovery': 'Discovery',
  'qualification': 'Discovery',
  'lead': 'Discovery',
  'proposal': 'Proposal',
  'quotation': 'Proposal',
  'negotiation': 'Negotiation',
  'contracting': 'Contracting',
  'closed-won': 'Won',
  'closed-lost': 'Lost',
};

// Default pipeline stages for UI
const defaultStages = ['Discovery', 'Proposal', 'Negotiation', 'Contracting'];

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const Deals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DealsTab>('pipeline');
  const { deals, wonDeals, lostDeals, isLoading, error } = useDeals();
  const { symbol } = useCurrency();
  const { user } = useAuth();

  const tabs: { id: DealsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'pipeline', label: 'Deal pipeline', icon: <Trello size={16} /> },
    { id: 'opportunities', label: 'Opportunities', icon: <Target size={16} /> },
    { id: 'quotes', label: 'Quotes', icon: <FileText size={16} /> },
    { id: 'won', label: 'Won deals', icon: <ThumbsUp size={16} /> },
    { id: 'lost', label: 'Lost deals', icon: <ThumbsDown size={16} /> },
    { id: 'forecast', label: 'Forecast', icon: <LineChart size={16} /> },
  ];

  // Group deals by stage for pipeline view
  const dealsByStage = useMemo(() => {
    const grouped: Record<string, typeof deals> = {};
    defaultStages.forEach(stage => {
      grouped[stage] = [];
    });

    deals
      .filter(deal => deal.status === 'open')
      .forEach(deal => {
        const stageName = deal.pipeline_stages?.name || '';
        const uiStage = stageMapping[stageName.toLowerCase()] || 
                       (stageName ? stageName : 'Discovery');
        
        if (defaultStages.includes(uiStage)) {
          if (!grouped[uiStage]) grouped[uiStage] = [];
          grouped[uiStage].push(deal);
        }
      });

    return defaultStages.map(stage => ({
      stage,
      count: grouped[stage]?.length || 0,
      total: formatCurrencyWithCommas(
        (grouped[stage] || []).reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0),
        symbol
      ),
      deals: (grouped[stage] || []).map(deal => ({
        id: deal.id,
        name: deal.title,
        val: formatCompactCurrency(Number(deal.amount) || 0, symbol),
        day: formatTimeAgo(deal.updated_at || deal.created_at),
        deal,
      })),
    }));
  }, [deals, symbol]);

  // Get open deals for opportunities tab
  const openDeals = useMemo(() => {
    return deals.filter(deal => deal.status === 'open');
  }, [deals]);

  // Calculate forecast data
  const forecastData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, 6).map((month, idx) => {
      const monthIndex = (currentMonth + idx) % 12;
      const projected = openDeals.reduce((sum, deal) => {
        if (deal.expected_close_date) {
          const closeDate = new Date(deal.expected_close_date);
          if (closeDate.getMonth() === monthIndex) {
            return sum + (Number(deal.amount) || 0) * (deal.probability / 100);
          }
        }
        return sum;
      }, 0);
      
      const actual = wonDeals.reduce((sum, deal) => {
        if (deal.actual_close_date) {
          const closeDate = new Date(deal.actual_close_date);
          if (closeDate.getMonth() === monthIndex) {
            return sum + (Number(deal.amount) || 0);
          }
        }
        return sum;
      }, 0);

      return { month, projected, actual };
    });
  }, [openDeals, wonDeals]);

  // Calculate forecast stats
  const forecastStats = useMemo(() => {
    const q2Start = new Date(new Date().getFullYear(), 3, 1); // April 1
    const q2End = new Date(new Date().getFullYear(), 5, 30); // June 30
    
    const expectedRevenue = openDeals
      .filter(deal => {
        if (!deal.expected_close_date) return false;
        const closeDate = new Date(deal.expected_close_date);
        return closeDate >= q2Start && closeDate <= q2End;
      })
      .reduce((sum, deal) => sum + (Number(deal.amount) || 0) * (deal.probability / 100), 0);

    const pipelineValue = openDeals.reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
    const highProbabilityDeals = openDeals.filter(deal => deal.probability >= 70).length;
    const goal = 30000; // You can make this configurable
    const gap = Math.max(0, goal - expectedRevenue);

    return {
      expectedRevenue,
      pipelineValue,
      highProbabilityDeals,
      gap,
    };
  }, [openDeals]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading deals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">Error loading deals</p>
          <p className="text-sm text-gray-400">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pipeline':
        return (
          <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar h-[calc(100vh-20rem)] min-h-[500px]">
            {dealsByStage.map((col, idx) => (
              <div key={idx} className="min-w-[300px] w-[300px] flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">{col.stage}</h4>
                    <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded-full">{col.count}</span>
                  </div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{col.total}</p>
                </div>
                <div className="bg-gray-100/50 rounded-2xl p-2 flex-1 flex flex-col gap-3 border border-gray-100 overflow-y-auto">
                  {col.deals.map((deal) => (
                    <div key={deal.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing group">
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
                          {deal.name.charAt(0).toUpperCase()}
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
                  {openDeals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        No opportunities found. Create your first deal to get started.
                      </td>
                    </tr>
                  ) : (
                    openDeals.map((deal) => {
                      const colors = ['blue', 'indigo', 'emerald', 'purple', 'pink'];
                      const color = colors[deal.title.length % colors.length];
                      const closeDate = deal.expected_close_date 
                        ? new Date(deal.expected_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Not set';
                      
                      return (
                        <tr key={deal.id} className="hover:bg-gray-50/50 transition-all group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full bg-${color}-50 text-${color}-600 flex items-center justify-center font-black text-xs`}>
                                {deal.title.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-bold text-gray-900">{deal.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-black text-gray-800 text-sm">
                            {formatCurrencyWithCommas(Number(deal.amount) || 0, symbol)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: `${deal.probability}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-gray-500">{deal.probability}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold uppercase tracking-tighter">
                              <Calendar size={12} /> {closeDate}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"><MoreVertical size={16} /></button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'won':
        return (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search won deals..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Deal Name</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Closed Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {wonDeals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                        No won deals yet. Keep working on your pipeline!
                      </td>
                    </tr>
                  ) : (
                    wonDeals.map((deal) => {
                      const closeDate = deal.actual_close_date 
                        ? new Date(deal.actual_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Not set';
                      
                      return (
                        <tr key={deal.id} className="hover:bg-gray-50/50 transition-all group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-black text-xs">
                                {deal.title.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-bold text-gray-900">{deal.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-black text-gray-800 text-sm">
                            {formatCurrencyWithCommas(Number(deal.amount) || 0, symbol)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold uppercase tracking-tighter">
                              <Calendar size={12} /> {closeDate}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"><MoreVertical size={16} /></button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'lost':
        return (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search lost deals..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Deal Name</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Lost Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lostDeals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                        No lost deals. Great job!
                      </td>
                    </tr>
                  ) : (
                    lostDeals.map((deal) => {
                      const closeDate = deal.actual_close_date 
                        ? new Date(deal.actual_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Not set';
                      
                      return (
                        <tr key={deal.id} className="hover:bg-gray-50/50 transition-all group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-black text-xs">
                                {deal.title.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-bold text-gray-900">{deal.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-black text-gray-800 text-sm">
                            {formatCurrencyWithCommas(Number(deal.amount) || 0, symbol)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold uppercase tracking-tighter">
                              <Calendar size={12} /> {closeDate}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"><MoreVertical size={16} /></button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'quotes':
        // Quotes are typically proposals in the pipeline - show deals in proposal stage
        const proposalDeals = dealsByStage.find(s => s.stage === 'Proposal')?.deals || [];
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposalDeals.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                No quotes available. Create deals in the Proposal stage to see them here.
              </div>
            ) : (
              proposalDeals.map((deal) => {
                const status = 'Sent'; // You can add a status field to deals if needed
                return (
                  <div key={deal.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-200 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:text-blue-500 transition-all">
                        <FileText size={20} />
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                        {status}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">
                      {deal.deal.contacts?.full_name || deal.deal.companies?.name || 'Quote'}
                    </h4>
                    <p className="text-lg font-bold text-gray-900 mb-4">{deal.name}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <span className="text-lg font-black text-gray-800">{deal.val}</span>
                      <button className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        View <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
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
                <p className="text-3xl font-black mt-2 text-gray-900">
                  {formatCurrencyWithCommas(forecastStats.expectedRevenue, symbol)}
                </p>
                <div className="flex items-center gap-2 mt-2 text-green-500 font-bold text-xs">
                  <TrendingUp size={14} /> Based on probability
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pipeline Value</p>
                <p className="text-3xl font-black mt-2 text-gray-900">
                  {formatCurrencyWithCommas(forecastStats.pipelineValue, symbol)}
                </p>
                <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase">
                  {forecastStats.highProbabilityDeals} High Probability Deals
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-l-4 border-l-orange-400">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gap to Goal</p>
                <p className="text-3xl font-black mt-2 text-orange-600">
                  {formatCurrencyWithCommas(forecastStats.gap, symbol)}
                </p>
                <div className="flex items-center gap-2 mt-2 text-gray-400 font-bold text-xs">
                  <AlertCircle size={14} /> {forecastStats.gap > 0 ? 'Needs more closed deals' : 'Goal achieved!'}
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
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${symbol}${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      cursor={{fill: '#f9fafb'}}
                      formatter={(value: number) => formatCurrencyWithCommas(value, symbol)}
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
