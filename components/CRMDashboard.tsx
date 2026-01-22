import React, { useEffect } from 'react';
import { TrendingUp, Briefcase, Percent, AlertTriangle, Clock, Users, Shield } from 'lucide-react';
import { useCrmDashboard } from '../src/hooks/useCrmDashboard';
import { useCurrency } from '../src/hooks/useCurrency';
import { useAuth } from '../src/hooks/useAuth';
import { formatCurrency as formatCurrencyLib } from '../src/lib/currency';

const CRMDashboard: React.FC = () => {
  const { symbol, fetchCurrency } = useCurrency();
  const { user } = useAuth();
  const formatCurrency = (value: number) => formatCurrencyLib(value, symbol);

  // Ensure currency is fetched when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchCurrency(user.id);
    }
  }, [user?.id, fetchCurrency]);
  const {
    kpis,
    stageSummary,
    performance,
    riskDeals,
    activitySummary,
    overdueTasks,
    alerts,
    isLoading,
  } = useCrmDashboard();

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading CRM dashboard...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters (placeholder for now) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 flex flex-wrap gap-3">
        <button className="px-3 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          Date: Last 30 days
        </button>
        <button className="px-3 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          Pipeline: Sales
        </button>
        <button className="px-3 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          Owner: All
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-500 uppercase">Revenue</p>
            <TrendingUp size={16} className="text-green-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-slate-100 mt-2">{formatCurrency(kpis.revenue)}</p>
          <p className="text-xs text-gray-400">Won deals in range</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-500 uppercase">Open Deals</p>
            <Briefcase size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-slate-100 mt-2">{kpis.openDeals}</p>
          <p className="text-xs text-gray-400">Active in pipeline</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-500 uppercase">Win Rate</p>
            <Percent size={16} className="text-purple-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-slate-100 mt-2">{kpis.winRate.toFixed(0)}%</p>
          <p className="text-xs text-gray-400">Won / Won+Lost</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-500 uppercase">Overdue Tasks</p>
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-slate-100 mt-2">{kpis.overdueTasks}</p>
          <p className="text-xs text-gray-400">Needs action</p>
        </div>
      </div>

      {/* Pipeline summary */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-slate-100">Pipeline Overview</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Deal count, value, weighted per stage</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stageSummary.map((stage) => (
            <div key={stage.name} className="p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-gray-900 dark:text-slate-100 uppercase">{stage.name}</h4>
                <span className="text-xs font-bold text-gray-500">{stage.count} deals</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">Value: {formatCurrency(stage.value)}</p>
              <p className="text-xs text-gray-400">Weighted: {formatCurrency(stage.weighted)}</p>
            </div>
          ))}
          {stageSummary.length === 0 && (
            <p className="text-sm text-gray-500 col-span-full">No deals in pipeline.</p>
          )}
        </div>
      </div>

      {/* Sales performance & Deal health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-black text-gray-900 dark:text-slate-100 mb-4">Sales Performance (by owner)</h3>
          <div className="space-y-2">
            {performance.length === 0 && <p className="text-sm text-gray-500">No performance data.</p>}
            {performance.map((row) => (
              <div key={row.owner} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-800 last:border-0">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{row.owner}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Won: {row.dealsWon} • Win Rate: {row.winRate.toFixed(0)}%</p>
                </div>
                <p className="text-sm font-black text-gray-900 dark:text-slate-100">{formatCurrency(row.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-black text-gray-900 dark:text-slate-100 mb-4">Deal Health (high risk)</h3>
          <div className="space-y-2">
            {riskDeals.length === 0 && <p className="text-sm text-gray-500">No risky deals right now.</p>}
            {riskDeals.map((deal) => (
              <div key={deal.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-800 last:border-0">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{deal.title}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{deal.stage} • Idle {deal.idleDays} days</p>
                </div>
                <p className="text-sm font-black text-gray-900 dark:text-slate-100">{formatCurrency(deal.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-black text-gray-900 dark:text-slate-100 mb-4">Team Activity (today)</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">Calls: <span className="font-bold">{activitySummary.calls}</span></div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">Emails: <span className="font-bold">{activitySummary.emails}</span></div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">Messages: <span className="font-bold">{activitySummary.messages}</span></div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">Meetings: <span className="font-bold">{activitySummary.meetings}</span></div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">Proposals: <span className="font-bold">{activitySummary.proposals}</span></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-black text-gray-900 dark:text-slate-100 mb-4">Overdue / Due Today</h3>
          <div className="space-y-2 text-sm">
            {overdueTasks.length === 0 && <p className="text-sm text-gray-500">No overdue tasks.</p>}
            {overdueTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-800 last:border-0">
                <div>
                  <p className="font-bold text-gray-900 dark:text-slate-100">{t.title}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Owner: {t.owner || 'Unassigned'}</p>
                </div>
                <span className="text-xs font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">Late {t.daysLate}d</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={18} className="text-red-500" />
          <h3 className="text-lg font-black text-gray-900 dark:text-slate-100">Alerts & Risks</h3>
        </div>
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2"><AlertTriangle size={14} className="text-red-500" /> {alerts.idleDeals} deals idle over threshold</p>
          {alerts.proposalConversion && (
            <p className="flex items-center gap-2"><AlertTriangle size={14} className="text-orange-500" /> {alerts.proposalConversion}</p>
          )}
          {!alerts.proposalConversion && alerts.idleDeals === 0 && (
            <p className="text-gray-500">No major alerts right now.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;
