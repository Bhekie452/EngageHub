
import React, { useState, useEffect } from 'react';
import {
  Megaphone, Plus, Calendar as CalendarIcon, Clock, Target, TrendingUp,
  MoreVertical, ChevronDown, Facebook, Instagram, Twitter, Mail,
  MessageSquare, Search, CheckCircle2, Users, Smartphone, DollarSign,
  Zap, Layout, Activity, X, FileText, Share2, Globe, Briefcase, Check,
  ArrowRight, Filter, Download, ArrowLeft, Heart, MessageCircle
} from 'lucide-react';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/lib/supabase';
import { useCurrency } from '../src/hooks/useCurrency';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

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
    leads?: number;
    conversions?: number;
  };
  post_count?: number;
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

const ManageCampaignModal: React.FC<{ isOpen: boolean; onClose: () => void; campaign: Campaign | null; onUpdate: () => void }> = ({ isOpen, onClose, campaign, onUpdate }) => {
  const { user } = useAuth();
  const { currency, symbol } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'posts' | 'analytics'>('overview');
  const [campaignPosts, setCampaignPosts] = useState<any[]>([]);
  const [availablePosts, setAvailablePosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  // Mock metrics for demo/preview when actual_metrics is missing
  const getMockMetrics = (c: Campaign) => {
    const base = c.id
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

    const leads = (base % 900) + 300; // 300 - 1,200
    const conversions = Math.round(leads * 0.25);
    const revenue = conversions * 50;
    const clicks = leads * 1.3;
    const reach = leads * 4;

    const series = Array.from({ length: 7 }).map((_, idx) => ({
      date: `Day ${idx + 1}`,
      leads: Math.round(leads * (0.3 + idx * 0.1)),
      clicks: Math.round(clicks * (0.25 + idx * 0.08)),
      conversions: Math.round(conversions * (0.2 + idx * 0.1)),
    }));

    return {
      leads,
      conversions,
      revenue,
      clicks,
      reach,
      roi: 18.5,
      performance_series: series,
    };
  };

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
      budget_currency: currency || 'USD',
      status: 'draft',
      channels: [],
      budget: 0
    }
  });

  const selectedChannels = watch('channels') || [];

  React.useEffect(() => {
    if (campaign) {
      setValue('name', campaign.name);
      setValue('type', campaign.type as any);
      setValue('objective', campaign.objective as any);
      setValue('status', campaign.status as any);
      setValue('start_date', campaign.start_date);
      setValue('end_date', campaign.end_date);
      setValue('budget', campaign.budget);
      setValue('budget_currency', campaign.budget_currency);
      setValue('channels', campaign.channels || []);
      setValue('description', (campaign as any).description || '');
    }
  }, [campaign, setValue]);

  const toggleChannel = (channel: string) => {
    const current = selectedChannels;
    if (current.includes(channel)) {
      setValue('channels', current.filter(c => c !== channel));
    } else {
      setValue('channels', [...current, channel]);
    }
  };

  const onSubmit = async (data: CampaignFormValues) => {
    if (!user || !campaign) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .update(data)
        .eq('id', campaign.id);

      if (error) throw error;

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating campaign:', error);
      alert('Failed to update campaign: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign || !confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaign.id);

      if (error) throw error;

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign: ' + error.message);
    }
  };

  // Fetch posts linked to this campaign
  const fetchCampaignPosts = async () => {
    if (!campaign || !user) return;
    setIsLoadingPosts(true);
    try {
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (!workspaces?.length) return;

      // Get campaign_posts links
      const { data: links, error: linksError } = await supabase
        .from('campaign_posts')
        .select('post_id, position')
        .eq('campaign_id', campaign.id)
        .order('position', { ascending: true });

      if (linksError) throw linksError;

      if (links && links.length > 0) {
        const postIds = links.map(l => l.post_id);
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .in('id', postIds)
          .eq('workspace_id', workspaces[0].id)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;
        setCampaignPosts(posts || []);
      } else {
        setCampaignPosts([]);
      }
    } catch (error: any) {
      console.error('Error fetching campaign posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Fetch available posts that can be added
  const fetchAvailablePosts = async () => {
    if (!user) return;
    try {
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (!workspaces?.length) return;

      // Get posts already linked to this campaign
      const { data: existingLinks } = await supabase
        .from('campaign_posts')
        .select('post_id')
        .eq('campaign_id', campaign?.id);

      const linkedPostIds = existingLinks?.map(l => l.post_id) || [];

      // Fetch all posts not already linked
      let query = supabase
        .from('posts')
        .select('*')
        .eq('workspace_id', workspaces[0].id)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: posts, error } = await query;

      if (error) throw error;

      // Filter out already linked posts
      const available = (posts || []).filter(p => !linkedPostIds.includes(p.id));
      setAvailablePosts(available);
    } catch (error: any) {
      console.error('Error fetching available posts:', error);
    }
  };

  // Load posts when Posts tab is active
  React.useEffect(() => {
    if (activeTab === 'posts' && campaign) {
      fetchCampaignPosts();
      fetchAvailablePosts();
    }
  }, [activeTab, campaign]);

  // Add posts to campaign
  const handleAddPosts = async () => {
    if (!campaign || selectedPostIds.length === 0) return;

    try {
      const inserts = selectedPostIds.map((postId, idx) => ({
        campaign_id: campaign.id,
        post_id: postId,
        position: campaignPosts.length + idx,
      }));

      const { error } = await supabase
        .from('campaign_posts')
        .insert(inserts);

      if (error) throw error;

      setSelectedPostIds([]);
      setIsAddPostModalOpen(false);
      fetchCampaignPosts();
      fetchAvailablePosts();
    } catch (error: any) {
      console.error('Error adding posts to campaign:', error);
      alert('Failed to add posts: ' + error.message);
    }
  };

  // Remove post from campaign
  const handleRemovePost = async (postId: string) => {
    if (!campaign || !confirm('Remove this post from the campaign?')) return;

    try {
      const { error } = await supabase
        .from('campaign_posts')
        .delete()
        .eq('campaign_id', campaign.id)
        .eq('post_id', postId);

      if (error) throw error;

      fetchCampaignPosts();
      fetchAvailablePosts();
    } catch (error: any) {
      console.error('Error removing post:', error);
      alert('Failed to remove post: ' + error.message);
    }
  };

  if (!isOpen) return null;

  if (!campaign) {
    console.warn('ManageCampaignModal: campaign is null');
    return null;
  }

  const metrics = campaign.actual_metrics && Object.keys(campaign.actual_metrics).length > 0
    ? {
      ...getMockMetrics(campaign),
      ...campaign.actual_metrics,
    }
    : getMockMetrics(campaign);

  const mockLeadsTable = [
    { name: 'Emily Johnson', email: 'emily.johnson@email.com', source: 'Facebook Ads', date: 'Jun 17, 2024' },
    { name: 'Michael Smith', email: 'michael.smith@email.com', source: 'Google Ads', date: 'Jun 16, 2024' },
    { name: 'Sarah Williams', email: 'sarah.williams@email.com', source: 'Landing Page', date: 'Jun 15, 2024' },
    { name: 'James Brown', email: 'james.brown@email.com', source: 'Referral', date: 'Jun 14, 2024' },
    { name: 'Byron Scott', email: 'byron.scott@email.com', source: 'Instagram Ads', date: 'Jun 13, 2024' },
  ];

  const mockSources = [
    { label: 'Google Ads', value: Math.round(metrics.leads * 0.4), color: 'bg-emerald-500' },
    { label: 'Facebook Ads', value: Math.round(metrics.leads * 0.3), color: 'bg-blue-500' },
    { label: 'Instagram Ads', value: Math.round(metrics.leads * 0.2), color: 'bg-purple-500' },
    { label: 'Referral', value: Math.round(metrics.leads * 0.1), color: 'bg-slate-500' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col">
        {/* Header with breadcrumbs and title */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Campaigns / {campaign.name}</span>
          </button>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">{campaign.name}</h2>
                <span className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${campaign.status === 'active'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : campaign.status === 'draft'
                    ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    : campaign.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                  {campaign.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                {(campaign as any).description || 'Marketing campaign for reaching your target audience'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('edit')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Edit Campaign <ArrowRight size={14} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <MoreVertical size={20} className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-100 dark:border-slate-800 flex gap-4">
          {[
            { id: 'overview', label: 'Overview', icon: <Activity size={16} /> },
            { id: 'edit', label: 'Edit', icon: <FileText size={16} /> },
            { id: 'posts', label: 'Posts', icon: <Share2 size={16} /> },
            { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === tab.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top metric cards: Leads, Spend, Revenue (compact like reference) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-5 py-4 rounded-xl flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                    <Users size={18} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                      {metrics.leads.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-slate-300 font-medium">
                      Leads
                    </span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-5 py-4 rounded-xl flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300">
                    <Megaphone size={18} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                      {campaign.budget_currency}{' '}
                      {((campaign as any).spent_amount ??
                        campaign.budget ??
                        Math.round(metrics.leads * 1.5)
                      ).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-slate-300 font-medium">
                      Spend
                    </span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-5 py-4 rounded-xl flex items-center gap-3">
                  <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300">
                    <DollarSign size={18} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                      {campaign.budget_currency} {metrics.revenue.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-slate-300 font-medium">
                      Revenue
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance chart & engagement summary */}
                <div className="lg:col-span-2 bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <button className="text-xs font-bold text-brand-600 border-b-2 border-brand-600 pb-1">
                        Campaign Performance
                      </button>
                      <button className="text-xs font-bold text-gray-400">
                        Leads
                      </button>
                      <button className="text-xs font-bold text-gray-400">
                        Conversions
                      </button>
                    </div>
                    <span className="text-xs font-bold text-green-600">
                      ROI {metrics.roi.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={(metrics as any).performance_series}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                        <YAxis stroke="#9ca3af" fontSize={11} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="conversions" stroke="#a855f7" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Engagement strip under chart */}
                  <div className="mt-4 flex flex-wrap gap-6 text-sm border-t border-gray-200 dark:border-slate-700 pt-4">
                    <div className="flex items-center gap-2">
                      <Heart size={18} className="text-pink-500 fill-pink-500" />
                      <span className="font-bold text-gray-900 dark:text-white">
                        {(metrics.clicks + Math.round(metrics.leads * 0.5)).toLocaleString()} Likes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle size={18} className="text-blue-500" />
                      <span className="font-bold text-gray-900 dark:text-white">
                        {Math.round(metrics.leads * 0.2).toLocaleString()} Comments
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Share2 size={18} className="text-slate-600 dark:text-slate-400" />
                      <span className="font-bold text-gray-900 dark:text-white">
                        {Math.round(metrics.leads * 0.15).toLocaleString()} Shares
                      </span>
                    </div>
                  </div>
                </div>

                {/* Side details panel */}
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Campaign Details</p>
                    <dl className="space-y-2 text-sm text-gray-700 dark:text-slate-200">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Status</dt>
                        <dd className="font-semibold capitalize">{campaign.status}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Objective</dt>
                        <dd className="font-semibold capitalize">{campaign.objective}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Start Date</dt>
                        <dd className="font-semibold">
                          {new Date(campaign.start_date).toLocaleDateString()}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">End Date</dt>
                        <dd className="font-semibold">
                          {new Date(campaign.end_date).toLocaleDateString()}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Budget</dt>
                        <dd className="font-semibold">
                          {campaign.budget_currency} {campaign.budget?.toLocaleString()}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Channels</p>
                    <div className="flex flex-wrap gap-2">
                      {(campaign.channels || []).map((c) => (
                        <span
                          key={c}
                          className="px-2 py-1 rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-[11px] font-semibold text-gray-700 dark:text-slate-200"
                        >
                          {c}
                        </span>
                      ))}
                      {(!campaign.channels || campaign.channels.length === 0) && (
                        <p className="text-xs text-gray-400">No channels set.</p>
                      )}
                    </div>
                  </div>

                  {/* Top sources */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Top Sources</p>
                    <div className="space-y-2">
                      {mockSources.map((s) => (
                        <div key={s.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-200">
                            <span>{s.label}</span>
                            <span className="font-semibold">{s.value.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${s.color}`}
                              style={{ width: `${Math.min(100, (s.value / mockSources[0].value) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Leads table */}
              <div className="mt-4 bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-400 uppercase">Recent Leads</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="border-b border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-300">
                      <tr>
                        <th className="py-2 pr-4 text-left font-semibold">Name</th>
                        <th className="py-2 pr-4 text-left font-semibold">Email</th>
                        <th className="py-2 pr-4 text-left font-semibold">Source</th>
                        <th className="py-2 text-left font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-100">
                      {mockLeadsTable.map((lead) => (
                        <tr key={lead.email}>
                          <td className="py-2 pr-4 whitespace-nowrap font-semibold">{lead.name}</td>
                          <td className="py-2 pr-4 whitespace-nowrap">{lead.email}</td>
                          <td className="py-2 pr-4 whitespace-nowrap">{lead.source}</td>
                          <td className="py-2 whitespace-nowrap">{lead.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'edit' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Campaign Name</label>
                  <input
                    {...register('name')}
                    className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-gray-900 dark:text-white"
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
                    <option value="completed">Completed</option>
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
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">End Date</label>
                  <input
                    type="date"
                    {...register('end_date')}
                    className="w-full h-10 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Budget</label>
                  <div className="relative">
                    <input type="hidden" {...register('budget_currency')} />
                    <div className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">
                      {symbol}
                    </div>
                    <input
                      type="number"
                      {...register('budget', { valueAsNumber: true })}
                      className="w-full h-10 pl-8 pr-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-gray-900 dark:text-white"
                    />
                  </div>
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
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-gray-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-600 font-bold hover:bg-red-50 rounded-lg transition-all"
                >
                  Delete Campaign
                </button>
                <div className="flex gap-3">
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
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Campaign Posts</h3>
                <button
                  onClick={() => {
                    setSelectedPostIds([]);
                    setIsAddPostModalOpen(true);
                    fetchAvailablePosts();
                  }}
                  className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-all flex items-center gap-2"
                >
                  <Plus size={18} /> Add Post to Campaign
                </button>
              </div>

              {isLoadingPosts ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading posts...</p>
                </div>
              ) : campaignPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <Share2 size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Posts Yet</h3>
                  <p className="text-gray-500 dark:text-slate-400 mb-6">
                    Posts associated with this campaign will appear here.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedPostIds([]);
                      setIsAddPostModalOpen(true);
                      fetchAvailablePosts();
                    }}
                    className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-all"
                  >
                    Add Post to Campaign
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaignPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex items-start justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {post.platforms?.map((platform: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded uppercase"
                            >
                              {platform}
                            </span>
                          ))}
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${post.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                            post.status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                              'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                            {post.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                          {post.content || '(No content)'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemovePost(post.id)}
                        className="ml-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove from campaign"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Post Modal */}
              {isAddPostModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setIsAddPostModalOpen(false);
                    setSelectedPostIds([]);
                  }
                }}>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                      <h2 className="text-xl font-black text-gray-900 dark:text-white">Add Posts to Campaign</h2>
                      <button
                        onClick={() => {
                          setIsAddPostModalOpen(false);
                          setSelectedPostIds([]);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <X size={20} className="text-gray-500" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                      {availablePosts.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-gray-500 dark:text-slate-400">No available posts to add.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {availablePosts.map((post) => (
                            <label
                              key={post.id}
                              className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedPostIds.includes(post.id)
                                ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedPostIds.includes(post.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPostIds([...selectedPostIds, post.id]);
                                  } else {
                                    setSelectedPostIds(selectedPostIds.filter(id => id !== post.id));
                                  }
                                }}
                                className="mt-1 w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {post.platforms?.map((platform: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded uppercase"
                                    >
                                      {platform}
                                    </span>
                                  ))}
                                </div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                                  {post.content || '(No content)'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                  {new Date(post.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setIsAddPostModalOpen(false);
                          setSelectedPostIds([]);
                        }}
                        className="px-4 py-2 text-gray-700 dark:text-slate-300 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddPosts}
                        disabled={selectedPostIds.length === 0}
                        className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add {selectedPostIds.length > 0 ? `${selectedPostIds.length} ` : ''}Post{selectedPostIds.length !== 1 ? 's' : ''}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (() => {
            // Generate mock analytics data based on campaign
            const campaignIdHash = campaign.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

            // Time series data for last 30 days
            // Use seeded random to avoid hydration mismatches
            const seededRandom = (seed: number) => {
              const x = Math.sin(seed) * 10000;
              return x - Math.floor(x);
            };

            const generateTimeSeries = () => {
              const days = 30;
              const startDate = new Date(campaign.start_date);
              const series = [];
              for (let i = 0; i < days; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const base = campaignIdHash % 100;
                const seed = campaignIdHash + i;
                series.push({
                  date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  impressions: base * 50 + Math.floor(seededRandom(seed) * 200) + (i * 10),
                  clicks: base * 20 + Math.floor(seededRandom(seed + 1) * 80) + (i * 5),
                  conversions: base * 5 + Math.floor(seededRandom(seed + 2) * 20) + (i * 2),
                  cost: base * 2 + Math.floor(seededRandom(seed + 3) * 10) + (i * 0.5),
                });
              }
              return series;
            };

            const timeSeriesData = generateTimeSeries();

            // Channel performance data
            const channelData = campaign.channels?.map((channel, idx) => ({
              name: channel,
              value: Math.round(metrics.leads * (0.4 - idx * 0.1)) || Math.round(metrics.leads * 0.25),
              clicks: Math.round(metrics.clicks * (0.35 - idx * 0.08)) || Math.round(metrics.clicks * 0.2),
              conversions: Math.round(metrics.conversions * (0.3 - idx * 0.07)) || Math.round(metrics.conversions * 0.15),
            })) || [
                { name: 'Facebook', value: Math.round(metrics.leads * 0.4), clicks: Math.round(metrics.clicks * 0.35), conversions: Math.round(metrics.conversions * 0.3) },
                { name: 'Instagram', value: Math.round(metrics.leads * 0.3), clicks: Math.round(metrics.clicks * 0.25), conversions: Math.round(metrics.conversions * 0.25) },
                { name: 'Google Ads', value: Math.round(metrics.leads * 0.2), clicks: Math.round(metrics.clicks * 0.2), conversions: Math.round(metrics.conversions * 0.2) },
                { name: 'LinkedIn', value: Math.round(metrics.leads * 0.1), clicks: Math.round(metrics.clicks * 0.2), conversions: Math.round(metrics.conversions * 0.25) },
              ];

            const pieColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

            // Conversion funnel
            const funnelData = [
              { stage: 'Impressions', value: metrics.impressions || metrics.clicks * 10, color: '#3b82f6' },
              { stage: 'Clicks', value: metrics.clicks, color: '#8b5cf6' },
              { stage: 'Leads', value: metrics.leads, color: '#10b981' },
              { stage: 'Conversions', value: metrics.conversions, color: '#f59e0b' },
            ];

            // Calculate conversion rates
            const ctr = metrics.impressions > 0 ? ((metrics.clicks / metrics.impressions) * 100).toFixed(2) : '0.00';
            const conversionRate = metrics.leads > 0 ? ((metrics.conversions / metrics.leads) * 100).toFixed(2) : '0.00';
            const cpa = metrics.conversions > 0 ? ((metrics.revenue * 0.3) / metrics.conversions).toFixed(2) : '0.00';

            return (
              <div className="space-y-6">
                {/* Key Metrics Grid - modern, compact cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-5 py-4 shadow-sm flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                      <Activity size={18} />
                    </div>
                    <div className="relative flex-1">
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-6 -right-10 w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full" />
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.16em] mb-1">
                        CTR
                      </p>
                      <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">{ctr}%</p>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-5 py-4 shadow-sm flex items-center gap-3">
                    <div className="p-2 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300">
                      <TrendingUp size={18} />
                    </div>
                    <div className="relative flex-1">
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-6 -right-10 w-20 h-20 bg-violet-50 dark:bg-violet-900/20 rounded-full" />
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.16em] mb-1">
                        Conversion Rate
                      </p>
                      <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">{conversionRate}%</p>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-5 py-4 shadow-sm flex items-center gap-3">
                    <div className="p-2 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300">
                      <DollarSign size={18} />
                    </div>
                    <div className="relative flex-1">
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-6 -right-10 w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full" />
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.16em] mb-1">
                        CPA
                      </p>
                      <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
                        {campaign.budget_currency} {cpa}
                      </p>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-5 py-4 shadow-sm flex items-center gap-3">
                    <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300">
                      <Target size={18} />
                    </div>
                    <div className="relative flex-1">
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-6 -right-10 w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full" />
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.16em] mb-1">
                        ROAS
                      </p>
                      <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
                        {metrics.roi.toFixed(1)}x
                      </p>
                    </div>
                  </div>
                </div>

                {/* Performance Over Time */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Performance Over Time</h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeSeriesData}>
                        <defs>
                          <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                        <YAxis stroke="#9ca3af" fontSize={11} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="impressions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorImpressions)" />
                        <Area type="monotone" dataKey="clicks" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorClicks)" />
                        <Area type="monotone" dataKey="conversions" stroke="#10b981" fillOpacity={1} fill="url(#colorConversions)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Channel Performance */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Channel Performance</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={channelData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                          <YAxis stroke="#9ca3af" fontSize={11} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#3b82f6" name="Leads" />
                          <Bar dataKey="clicks" fill="#8b5cf6" name="Clicks" />
                          <Bar dataKey="conversions" fill="#10b981" name="Conversions" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Lead Distribution by Channel */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Lead Distribution</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={channelData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {channelData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Conversion Funnel */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Conversion Funnel</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={funnelData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#9ca3af" fontSize={11} />
                        <YAxis dataKey="stage" type="category" stroke="#9ca3af" fontSize={11} width={100} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Engagement Metrics */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Engagement Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                      <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                        <Heart size={20} className="text-pink-500 dark:text-pink-400 fill-pink-500 dark:fill-pink-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-2xl font-black text-gray-900 dark:text-white">
                          {(metrics.clicks + Math.round(metrics.leads * 0.5)).toLocaleString()}
                        </p>
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Likes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <MessageCircle size={20} className="text-blue-500 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-2xl font-black text-gray-900 dark:text-white">
                          {Math.round(metrics.leads * 0.2).toLocaleString()}
                        </p>
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Comments</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                      <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <Share2 size={20} className="text-purple-500 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-2xl font-black text-gray-900 dark:text-white">
                          {Math.round(metrics.leads * 0.15).toLocaleString()}
                        </p>
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Shares</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <Activity size={20} className="text-green-500 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-2xl font-black text-gray-900 dark:text-white">
                          {metrics.clicks.toLocaleString()}
                        </p>
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Clicks</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
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
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCampaigns = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);

    if (workspaces && workspaces.length > 0) {
      const workspaceId = workspaces[0].id;
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, campaign_posts(count)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const campaignsWithCounts = (data as any[]).map(c => ({
          ...c,
          post_count: c.campaign_posts?.[0]?.count || 0
        }));
        setCampaigns(campaignsWithCounts as Campaign[]);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const filteredCampaigns = (filterType === 'all'
    ? campaigns
    : campaigns.filter(c => c.status === filterType)
  ).filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Campaigns List - table style like reference UI */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filter + search row */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {['all', 'active', 'draft', 'scheduled', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterType(status)}
                className={`pb-2 text-sm font-bold border-b-2 transition-all capitalize ${filterType === status
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="flex-1 md:ml-auto">
            <div className="relative max-w-sm ml-auto">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-sm text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Loading campaigns...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-slate-400 text-sm">
            No campaigns match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/40 border-b border-gray-100 dark:border-slate-800">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Campaign Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Posts</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Leads</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversions</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredCampaigns.map((campaign) => {
                  const leads = (campaign as any).actual_metrics?.leads ?? null;
                  const conversions = (campaign as any).actual_metrics?.conversions ?? null;
                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{campaign.name}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 capitalize">
                          {campaign.objective}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${campaign.status === 'active'
                            ? 'bg-green-50 text-green-700'
                            : campaign.status === 'paused'
                              ? 'bg-yellow-50 text-yellow-700'
                              : campaign.status === 'draft'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-gray-900 dark:text-white font-bold">
                        {campaign.post_count || 0}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-900 dark:text-white">
                        {leads !== null ? leads.toLocaleString() : '0'}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-900 dark:text-white">
                        {conversions !== null ? conversions.toLocaleString() : '0'}
                      </td>
                      <td className="px-4 py-4 text-gray-900 dark:text-white">
                        {new Date(campaign.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setIsManageModalOpen(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

      <ManageCampaignModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setSelectedCampaign(null);
        }}
        campaign={selectedCampaign}
        onUpdate={() => {
          fetchCampaigns();
        }}
      />
    </div>
  );
};

export default Campaigns;
