
import React, { useState, useEffect } from 'react';
import {
  Megaphone, Plus, Calendar as CalendarIcon, Clock, Target, TrendingUp,
  MoreVertical, ChevronDown, Facebook, Instagram, Twitter, Mail,
  MessageSquare, Search, CheckCircle2, Users, Smartphone, DollarSign,
  Zap, Layout, Activity, X, FileText, Share2, Globe, Briefcase, Check,
  ArrowRight, Filter, Download
} from 'lucide-react';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/lib/supabase';
import { useCurrency } from '../src/hooks/useCurrency';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// --- Types & Schemas ---

const campaignSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters"),
  type: z.enum(['marketing', 'sales', 'retention', 'onboarding', 'newsletter', 'event', 'other']),
  objective: z.enum(['awareness', 'traffic', 'engagement', 'leads', 'sales', 'retention']),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'archived']),
  start_date: z.string(),
  end_date: z.string(),
  budget: z.number().min(0),
  budget_currency: z.string().length(3),
  channels: z.array(z.string()).min(1, "Select at least one channel"),
  description: z.string().optional(),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

type Campaign = {
  id: string;
  name: string;
  type: string;
  objective: string;
  status: string;
  start_date: string;
  end_date: string;
  budget: number;
  budget_currency: string;
  channels: string[];
  progress: number;
  created_at: string;
  actual_metrics?: {
    reach?: number;
    roi?: number;
    impressions?: number;
    clicks?: number;
  };
};

const CreateCampaignModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void }> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { currency, symbol, availableCurrencies } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default currency to user's preference or USD
  const defaultCurrency = currency || 'USD';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      budget_currency: defaultCurrency,
      status: 'draft',
      channels: [],
      budget: 0
    }
  });

  // Watch channels for UI toggle
  const selectedChannels = watch('channels') || [];

  const toggleChannel = (channel: string) => {
    const current = selectedChannels;
    if (current.includes(channel)) {
      setValue('channels', current.filter(c => c !== channel));
    } else {
      setValue('channels', [...current, channel]);
    }
  };

  const onSubmit = async (data: CampaignFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);
      if (!workspaces?.length) throw new Error('No workspace found');

      const { error } = await supabase.from('campaigns').insert({
        ...data,
        workspace_id: workspaces[0].id,
        created_by: user.id
      });

      if (error) throw error;

      onSuccess();
      onClose();
      reset();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-slate-800">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">New Campaign</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Campaign Name</label>
              <input
                {...register('name')}
                className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-gray-900 dark:text-white"
                placeholder="e.g. Summer Sale 2024"
              />
              {errors.name && <p className="text-red-500 text-xs font-medium">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
              <select
                {...register('status')}
                className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-gray-900 dark:text-white"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
              <select
                {...register('type')}
                className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-gray-900 dark:text-white"
              >
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
                <option value="newsletter">Newsletter</option>
                <option value="event">Event</option>
                <option value="retention">Retention</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Objective</label>
              <select
                {...register('objective')}
                className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-gray-900 dark:text-white"
              >
                <option value="awareness">Awareness</option>
                <option value="traffic">Traffic</option>
                <option value="engagement">Engagement</option>
                <option value="leads">Leads</option>
                <option value="sales">Sales</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
              <input
                type="date"
                {...register('start_date')}
                className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-gray-900 dark:text-white"
              />
              {errors.start_date && <p className="text-red-500 text-xs font-medium">{errors.start_date.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">End Date</label>
              <input
                type="date"
                {...register('end_date')}
                className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-gray-900 dark:text-white"
              />
              {errors.end_date && <p className="text-red-500 text-xs font-medium">{errors.end_date.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Budget</label>
              <div className="relative">
                {/* Hidden input to satisfy strict Zod schema requiring budget_currency */}
                <input type="hidden" {...register('budget_currency')} />
                <div className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">
                  {symbol}
                </div>
                <input
                  type="number"
                  {...register('budget', { valueAsNumber: true })}
                  className="w-full h-10 pl-8 pr-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              {errors.budget && <p className="text-red-500 text-xs font-medium">{errors.budget.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Channels</label>
            <div className="flex flex-wrap gap-2">
              {['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'Email', 'Google Ads'].map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => toggleChannel(channel)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedChannels.includes(channel)
                      ? 'bg-brand-50 border-brand-200 text-brand-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                >
                  {channel}
                </button>
              ))}
            </div>
            {/* Hidden input to ensure proper registration if needed manually, though logic handles it via setValue */}
            {errors.channels && <p className="text-red-500 text-xs font-medium">{errors.channels.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-gray-900 dark:text-white resize-none"
              placeholder="Campaign details..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Launch Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Campaigns: React.FC = () => {
  const { user } = useAuth();
  const { currency, symbol } = useCurrency();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const fetchCampaigns = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);

    if (workspaces && workspaces.length > 0) {
      const workspaceId = workspaces[0].id;
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCampaigns(data as Campaign[]);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const filteredCampaigns = filterType === 'all'
    ? campaigns
    : campaigns.filter(c => c.status === filterType);

  // Calculate dynamic stats
  const totalReach = campaigns.reduce((acc, c) => acc + (c.actual_metrics?.reach || 0), 0);
  const activeCampaignsCount = campaigns.filter(c => c.status === 'active').length;
  // Calculate average ROI only for campaigns that have an ROI value to avoid skewing with 0s for new campaigns
  const campaignsWithRoi = campaigns.filter(c => c.actual_metrics?.roi !== undefined);
  const avgRoi = campaignsWithRoi.length > 0
    ? campaignsWithRoi.reduce((acc, c) => acc + (c.actual_metrics?.roi || 0), 0) / campaignsWithRoi.length
    : 0;

  // Helper to format large numbers (e.g., 1.2M)
  const formatCompact = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(num);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-300 text-xs font-black uppercase tracking-widest rounded-full">
              Marketing
            </span>
            <span className="text-gray-400 text-xs font-medium">/</span>
            <span className="text-gray-400 text-xs font-medium">Overview</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Campaigns</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2 font-medium">Manage and optimize your marketing initiatives across all channels.</p>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
            <Filter size={18} /> Filter
          </button>
          <button className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
            <Download size={18} /> Export
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2.5 bg-brand-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-brand-700 shadow-xl shadow-brand-500/20 transition-all flex items-center gap-2"
          >
            <Plus size={20} /> New Campaign
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Campaigns', value: activeCampaignsCount, icon: <Megaphone />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Budget', value: `${symbol}${formatCompact(campaigns.reduce((acc, c) => acc + (c.budget || 0), 0))}`, icon: <DollarSign />, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Reach', value: formatCompact(totalReach), icon: <Globe />, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Avg. ROI', value: `${avgRoi.toFixed(1)}%`, icon: <TrendingUp />, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} dark:bg-opacity-10`}>
                {React.cloneElement(stat.icon as any, { size: 22 })}
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {stat.label}
              </span>
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Campaigns List */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        {/* Table Filter Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-6 overflow-x-auto no-scrollbar">
          {['all', 'active', 'draft', 'scheduled', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterType(status)}
              className={`pb-4 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap capitalize ${filterType === status
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              {status} Campaigns
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400 font-medium">Loading campaigns...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Megaphone size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No campaigns found</h3>
            <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto mb-8">
              Get started by creating your first marketing campaign to reach your audience.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all flex items-center gap-2 mx-auto"
            >
              <Plus size={18} /> Create Campaign
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group flex flex-col md:flex-row md:items-center gap-6">
                {/* Status Indicator */}
                <div className="w-2 h-16 rounded-full hidden md:block" style={{
                  backgroundColor: campaign.status === 'active' ? '#10B981' : campaign.status === 'draft' ? '#9CA3AF' : '#2563EB'
                }}></div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{campaign.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${campaign.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon size={14} />
                      <span>{new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target size={14} />
                      <span className="capitalize">{campaign.objective}</span>
                    </div>
                  </div>
                </div>

                {/* Channels */}
                <div className="flex items-center -space-x-2">
                  {campaign.channels && campaign.channels.slice(0, 4).map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm" title={c}>
                      {c.charAt(0)}
                    </div>
                  ))}
                  {campaign.channels && campaign.channels.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-gray-500">
                      +{campaign.channels.length - 4}
                    </div>
                  )}
                </div>

                {/* Budget */}
                <div className="text-right min-w-[120px]">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Budget</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">
                    {campaign.budget_currency} {campaign.budget?.toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all">
                    <Layout size={18} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                    <MoreVertical size={18} />
                  </button>
                  <button className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-white rounded-lg hover:border-brand-500 transition-all">
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchCampaigns();
          // Optionally add a toast notification here
        }}
      />
    </div>
  );
};

export default Campaigns;
