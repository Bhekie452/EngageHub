import { useMemo } from 'react';
import { useDeals } from './useDeals';
import { useTasks } from './useTasks';
import { useActivities } from './useActivities';

export interface Kpis {
  revenue: number;
  openDeals: number;
  winRate: number;
  overdueTasks: number;
}

export interface StageSummary {
  name: string;
  count: number;
  value: number;
  weighted: number;
}

export interface PerformanceRow {
  owner: string;
  dealsWon: number;
  revenue: number;
  winRate: number;
}

export interface RiskDeal {
  id: string;
  title: string;
  stage: string;
  amount: number;
  idleDays: number;
}

export interface ActivitySummary {
  calls: number;
  emails: number;
  messages: number;
  meetings: number;
  proposals: number;
}

export interface OverdueTask {
  id: string;
  title: string;
  owner?: string | null;
  daysLate: number;
}

export interface Alerts {
  idleDeals: number;
  winRateTrend?: string;
  proposalConversion?: string;
}

export function useCrmDashboard() {
  const { deals, wonDeals, lostDeals, isLoading: dealsLoading } = useDeals();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { activities, isLoading: activitiesLoading } = useActivities();

  const kpis: Kpis = useMemo(() => {
    const revenue = (wonDeals || []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const openDeals = (deals || []).filter((d) => d.status === 'open').length;
    const winRate =
      (wonDeals && lostDeals && wonDeals.length + lostDeals.length > 0)
        ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100
        : 0;
    const overdueTasks =
      (tasks || []).filter((t) => {
        if (!t.due_date) return false;
        const due = new Date(t.due_date).getTime();
        return due < Date.now() && !['done', 'completed'].includes(t.status);
      }).length;

    return { revenue, openDeals, winRate, overdueTasks };
  }, [deals, wonDeals, lostDeals, tasks]);

  const stageSummary: StageSummary[] = useMemo(() => {
    const stages = new Map<string, { count: number; value: number; weighted: number }>();
    (deals || []).forEach((deal) => {
      const stageName = deal.pipeline_stages?.name || 'Unassigned';
      const amount = Number(deal.amount) || 0;
      const probability = deal.pipeline_stages?.probability ?? deal.probability ?? 0;
      const entry = stages.get(stageName) || { count: 0, value: 0, weighted: 0 };
      entry.count += 1;
      entry.value += amount;
      entry.weighted += amount * (probability / 100);
      stages.set(stageName, entry);
    });
    return Array.from(stages.entries()).map(([name, val]) => ({
      name,
      count: val.count,
      value: val.value,
      weighted: val.weighted,
    }));
  }, [deals]);

  const performance: PerformanceRow[] = useMemo(() => {
    const byOwner = new Map<string, { won: number; revenue: number; lost: number }>();
    (wonDeals || []).forEach((deal) => {
      const owner = deal.owner_id || 'Unassigned';
      const entry = byOwner.get(owner) || { won: 0, revenue: 0, lost: 0 };
      entry.won += 1;
      entry.revenue += Number(deal.amount) || 0;
      byOwner.set(owner, entry);
    });
    (lostDeals || []).forEach((deal) => {
      const owner = deal.owner_id || 'Unassigned';
      const entry = byOwner.get(owner) || { won: 0, revenue: 0, lost: 0 };
      entry.lost += 1;
      byOwner.set(owner, entry);
    });

    return Array.from(byOwner.entries()).map(([owner, val]) => ({
      owner,
      dealsWon: val.won,
      revenue: val.revenue,
      winRate: val.won + val.lost > 0 ? (val.won / (val.won + val.lost)) * 100 : 0,
    }));
  }, [wonDeals, lostDeals]);

  const riskDeals: RiskDeal[] = useMemo(() => {
    const now = Date.now();
    return (deals || [])
      .filter((d) => d.status === 'open')
      .map((d) => {
        const last = d.updated_at || d.created_at;
        const idleDays = Math.floor((now - new Date(last).getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: d.id,
          title: d.title,
          stage: d.pipeline_stages?.name || 'Unassigned',
          amount: Number(d.amount) || 0,
          idleDays,
        };
      })
      .filter((d) => d.idleDays >= 3)
      .sort((a, b) => b.idleDays - a.idleDays)
      .slice(0, 5);
  }, [deals]);

  const activitySummary: ActivitySummary = useMemo(() => {
    const summary: ActivitySummary = { calls: 0, emails: 0, messages: 0, meetings: 0, proposals: 0 };
    (activities || []).forEach((a) => {
      switch (a.activity_type) {
        case 'call':
          summary.calls += 1;
          break;
        case 'email':
          summary.emails += 1;
          break;
        case 'message':
        case 'social':
          summary.messages += 1;
          break;
        case 'meeting':
          summary.meetings += 1;
          break;
        case 'deal':
          summary.proposals += 1;
          break;
        default:
          break;
      }
    });
    return summary;
  }, [activities]);

  const overdueTasksList: OverdueTask[] = useMemo(() => {
    return (tasks || [])
      .filter((t) => {
        if (!t.due_date) return false;
        const due = new Date(t.due_date).getTime();
        return due < Date.now() && !['done', 'completed'].includes(t.status);
      })
      .map((t) => ({
        id: t.id,
        title: t.title,
        owner: t.assigned_to,
        daysLate: Math.floor((Date.now() - new Date(t.due_date as string).getTime()) / (1000 * 60 * 60 * 24)),
      }))
      .sort((a, b) => b.daysLate - a.daysLate)
      .slice(0, 5);
  }, [tasks]);

  const alerts: Alerts = useMemo(() => {
    const idleDeals = riskDeals.length;
    const proposalStage = stageSummary.find((s) => s.name.toLowerCase().includes('proposal'));
    const proposalConversion =
      proposalStage && proposalStage.count > 0
        ? `Proposal stage load: ${proposalStage.count} deals (${proposalStage.value.toFixed(0)})`
        : undefined;
    return { idleDeals, proposalConversion };
  }, [riskDeals, stageSummary]);

  const isLoading = dealsLoading || tasksLoading || activitiesLoading;

  return {
    kpis,
    stageSummary,
    performance,
    riskDeals,
    activitySummary,
    overdueTasks: overdueTasksList,
    alerts,
    isLoading,
  };
}
