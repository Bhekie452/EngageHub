import React, { useState, useEffect, useRef } from 'react';
import {
  PenTool,
  FileText,
  Clock,
  CheckCircle2,
  Calendar as CalendarIcon,
  Copy,
  Hash,
  Sparkles,
  Plus,
  Image as ImageIcon,
  Globe,
  Smile,
  MoreVertical,
  ChevronRight,
  ExternalLink,
  Trash2,
  Edit3,
  BarChart3,
  Search,
  Video,
  Link as LinkIcon,
  AtSign,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  MessageCircle,
  X,
  Repeat,
  Mail,
  CalendarDays,
  MapPin,
  Save,
  Eye,
  Share2,
  AlertCircle,
  Youtube,
  Music,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  Info
} from 'lucide-react';
import {
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { initFacebookSDK, loginWithFacebook, getPageTokens } from '../src/lib/facebook';
import { useToast } from '../src/components/common/Toast';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/lib/supabase';
import { trackEventSafe } from '../src/lib/analytics';
import { analyticsService } from '../src/services/api/analytics.service';
import AIStudio from './AIStudio';
import ContentCalendar from './ContentCalendar';
import ContentTemplates from './ContentTemplates';
import YouTubeSimpleConnect from './YouTubeSimpleConnect';
import { useYouTubeConnectionSimple } from '../src/hooks/useYouTubeConnectionSimple';
import { useYouTubeSession } from '../src/hooks/useYouTubeSession';

// Added 'all_list' to the allowed tabs to fix the assignment error on line 66
type ContentTab = 'all' | 'all_list' | 'create' | 'drafts' | 'scheduled' | 'published' | 'calendar' | 'templates' | 'hashtags' | 'ai';

const Content: React.FC = () => {
  const { user } = useAuth(); // Get authenticated user
  const [activeTab, setActiveTab] = useState<ContentTab>('create');

  // Use simple session-based YouTube connection
  const { isConnected: youtubeAccountConnected } = useYouTubeSession()

  const [socialAccounts, setSocialAccounts] = useState<Record<string, boolean>>({});
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);

  const toast = useToast();

  // Update socialAccounts when YouTube connection state changes
  useEffect(() => {
    setSocialAccounts(prev => ({
      ...prev,
      youtube: youtubeAccountConnected
    }))
  }, [youtubeAccountConnected])

  const [posts, setPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterCampaignId, setFilterCampaignId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [postCampaignMap, setPostCampaignMap] = useState<Record<string, { id: string; name: string }>>({});
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const platformOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const p of posts) {
      const plats = Array.isArray(p?.platforms) ? p.platforms : [];
      for (const pl of plats) set.add(String(pl));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const filteredPosts = React.useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    return posts.filter((post) => {
      // Platform filter
      if (filterPlatform !== 'all') {
        const plats = Array.isArray(post?.platforms) ? post.platforms : [];
        if (!plats.some((p: string) => String(p).toLowerCase() === filterPlatform.toLowerCase())) return false;
      }

      // Campaign filter
      if (filterCampaignId !== 'all') {
        const c = postCampaignMap[post.id];
        if (!c || c.id !== filterCampaignId) return false;
      }

      // Status filter (only meaningful in "all" / "all_list")
      if (filterStatus !== 'all' && (activeTab === 'all' || activeTab === 'all_list')) {
        if (String(post.status).toLowerCase() !== filterStatus.toLowerCase()) return false;
      }

      // Text search
      if (!q) return true;
      const title = String(post?.title ?? '');
      const content = String(post?.content ?? '');
      const campaignName = String(postCampaignMap[post.id]?.name ?? '');
      const plats = (Array.isArray(post?.platforms) ? post.platforms : []).join(' ');
      const haystack = `${title} ${content} ${campaignName} ${plats}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [activeTab, filterCampaignId, filterPlatform, filterQuery, filterStatus, postCampaignMap, posts]);

  // Basic analytics tracking for content page usage
  React.useEffect(() => {
    if (!user) return;
    trackEventSafe({ event_type: 'post_view', entity_type: 'page', entity_id: null, metadata: { page: 'content', tab: activeTab } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);


  // Main data loader to parallelize requests and avoid redundant workspace lookups
  const loadContentData = async () => {
    if (!user) return;
    setIsLoadingPosts(true);
    try {
      // 1. Fetch workspace ID once
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);
      if (!workspaces?.length) return;
      const workspaceId = workspaces[0].id;
      setCurrentWorkspaceId(workspaceId);

      // 2. Fetch everything else in parallel
      await Promise.all([
        fetchPosts(workspaceId),
        fetchCampaigns(workspaceId),
        fetchSocialAccounts(workspaceId)
      ]);
    } catch (error) {
      console.error('Error loading content data:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Fetch posts and initialize social accounts; process due scheduled posts first when viewing list
  React.useEffect(() => {
    if (!['all', 'all_list', 'drafts', 'scheduled', 'published'].includes(activeTab) || !user) return;
    loadContentData();
  }, [activeTab, user]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, pageSize, filterQuery, filterPlatform, filterCampaignId, filterStatus]);

  React.useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, pageSize, filteredPosts.length]);

  React.useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  React.useEffect(() => {
    if (user) {
      initFacebookSDK().catch(() => { });
    }
  }, [user]);

  // Refresh social accounts when component becomes visible (user might have connected accounts)
  React.useEffect(() => {
    if (user && activeTab === 'create' && currentWorkspaceId) {
      fetchSocialAccounts(currentWorkspaceId);
    }
  }, [activeTab, user, currentWorkspaceId]);

  const [dbQueryResult, setDbQueryResult] = useState<any>(null); // Store raw DB result for debugging

  const fetchSocialAccounts = async (workspaceId?: string) => {
    if (!user) return;
    try {
      const targetWorkspaceId = workspaceId || currentWorkspaceId;
      if (!targetWorkspaceId) {
        const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);
        if (!workspaces?.length) return;
        workspaceId = workspaces[0].id;
      } else {
        workspaceId = targetWorkspaceId;
      }

      const { data, error } = await supabase
        .from('social_accounts')
        .select('platform, is_active')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true);

      if (error) throw error;

      const linked: Record<string, boolean> = {};
      data?.forEach(acc => {
        const platformId = (acc.platform || '').toLowerCase().trim();
        linked[platformId] = true;
      });

      setSocialAccounts({
        ...linked,
        youtube: youtubeAccountConnected
      });
    } catch (err) {
      console.error('Error in fetchSocialAccounts:', err);
      setSocialAccounts({});
    }
  };

  const fetchCampaigns = async (workspaceId?: string) => {
    if (!user) return;
    try {
      const targetWorkspaceId = workspaceId || currentWorkspaceId;
      if (!targetWorkspaceId) {
        const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);
        if (!workspaces?.length) return;
        workspaceId = workspaces[0].id;
      } else {
        workspaceId = targetWorkspaceId;
      }

      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  };

  const fetchPosts = async (workspaceId?: string) => {
    if (!user) return;
    const targetWorkspaceId = workspaceId || currentWorkspaceId;
    if (!targetWorkspaceId) {
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);
      if (!workspaces?.length) return;
      workspaceId = workspaces[0].id;
    } else {
      workspaceId = targetWorkspaceId;
    }

    try {
      let query = supabase
        .from('posts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (activeTab !== 'all' && activeTab !== 'all_list') {
        const statusMap: Record<string, string> = {
          'drafts': 'draft',
          'scheduled': 'scheduled',
          'published': 'published'
        };
        if (statusMap[activeTab]) {
          query = query.eq('status', statusMap[activeTab]);
        }
      }

      const { data: postsData, error } = await query;
      if (error) throw error;
      setPosts(postsData || []);

      // Fetch campaign links for these posts in parallel loop isn't ideal but we can do one query
      if (postsData && postsData.length > 0) {
        const postIds = postsData.map((p: any) => p.id);
        const { data: links } = await supabase
          .from('campaign_posts')
          .select('post_id, campaign:campaign_id (id, name, workspace_id)')
          .in('post_id', postIds);

        const map: Record<string, { id: string; name: string }> = {};
        links?.forEach((link: any) => {
          if (link.campaign?.id) {
            map[link.post_id] = { id: link.campaign.id, name: link.campaign.name };
          }
        });
        setPostCampaignMap(map);
      } else {
        setPostCampaignMap({});
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [isRecur, setIsRecur] = useState(false);
  const [recurFrequency, setRecurFrequency] = useState('Weekly');
  const [recurUntil, setRecurUntil] = useState('2024-12-31');
  const [isSubmitting, setIsSubmitting] = useState(false); // Valid state for loading
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [viewingPost, setViewingPost] = useState<any | null>(null);
  const [viewingMetrics, setViewingMetrics] = useState<{ post: any; platform: string } | null>(null);
  const [viewingVideoAnalytics, setViewingVideoAnalytics] = useState<{ post: any } | null>(null);
  const [videoAnalyticsTab, setVideoAnalyticsTab] = useState<'overview' | 'reach' | 'engagement' | 'audience'>('overview');
  const [showVideoDateSelector, setShowVideoDateSelector] = useState(false);
  const [videoAnalyticsDateRange, setVideoAnalyticsDateRange] = useState('Since published');
  const [engagementPostId, setEngagementPostId] = useState<string | null>(null);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [engagementActionLoading, setEngagementActionLoading] = useState(false);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [engagementCommentText, setEngagementCommentText] = useState('');
  const [selectedMetricFilter, setSelectedMetricFilter] = useState<string | null>(null);
  const [engagementData, setEngagementData] = useState<{
    metrics: { likes: number; comments: number; views: number; shares: number; subscribers?: number };
    recentActivity: {
      type: string;
      user: string;
      text?: string;
      time: string;
      platform: string;
      occurred_at: string;
      avatar?: string;
      userUrl?: string;
    }[];
    metricsSource?: 'youtube' | 'engagehub';
  } | null>(null);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  // Load current workspaceId once on mount handled by loadContentData or this backup
  useEffect(() => {
    if (!user || currentWorkspaceId) return;
    (async () => {
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);
      if (workspaces?.length) setCurrentWorkspaceId(workspaces[0].id);
    })();
  }, [user, currentWorkspaceId]);

  // Fetch real engagement when viewing/editing a post (YouTube stats + comments)
  const engagementPostIdSource = viewingMetrics?.post?.id ?? viewingVideoAnalytics?.post?.id ?? editingPost?.id;
  useEffect(() => {
    if (!engagementPostIdSource) {
      setEngagementPostId(null);
      setEngagementData(null);
      return;
    }
    let cancelled = false;
    setEngagementPostId(engagementPostIdSource);
    setEngagementLoading(true);
    setEngagementData(null);

    const postRef = viewingMetrics?.post ?? viewingVideoAnalytics?.post ?? editingPost;
    const platform = viewingMetrics?.platform ?? (viewingVideoAnalytics ? 'youtube' : null) ?? editingPost?.platform;

    analyticsService
      .getPostEngagementSummary(
        String(engagementPostIdSource),
        platform ? String(platform) : null,
        postRef?.link_url ? String(postRef.link_url) : null
      )
      .then(async (data) => {
        if (!cancelled) {
          setEngagementData({
            metrics: data.metrics,
            recentActivity: data.recentActivity,
            metricsSource: (data as any).metricsSource,
          });
          try {
            if (String(engagementPostIdSource)) {
              const liked = await analyticsService.hasUserLiked(String(engagementPostIdSource));
              setUserHasLiked(Boolean(liked));
            }
          } catch (e) {
            // ignore
          }
        }
      })
      .catch(() => {
        if (!cancelled) setEngagementData(null);
      })
      .finally(() => {
        if (!cancelled) setEngagementLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [engagementPostIdSource, viewingMetrics, viewingVideoAnalytics, editingPost]);

  // Check YouTube connection for the current workspace
  useEffect(() => {
    const isYT = (viewingMetrics?.platform === 'youtube') || (viewingVideoAnalytics !== null);
    const hasPost = viewingMetrics?.post?.id || viewingVideoAnalytics?.post?.id;

    if (!hasPost || !isYT) {
      setYoutubeConnected(false);
      return;
    }
    // Simple check: if metricsSource is youtube, assume connected for now
    // TODO: call a helper Edge Function to check youtube_accounts table
    setYoutubeConnected(engagementData?.metricsSource === 'youtube');
  }, [viewingMetrics, viewingVideoAnalytics, engagementData]);

  const recordEngagement = async (type: 'post_like' | 'post_share' | 'post_comment', text?: string) => {
    if (!viewingMetrics?.post?.id) return;
    if (type === 'post_comment' && !text?.trim()) return;

    setEngagementActionLoading(true);
    try {
      const isYouTube = viewingMetrics.platform === 'youtube' && youtubeConnected;
      const videoId = viewingMetrics.post.link_url ? extractYouTubeId(viewingMetrics.post.link_url) : null;

      // Handle likes with per-user dedup: record to DB first, then sync to YouTube
      if (type === 'post_like') {
        // If user already liked, short-circuit
        if (userHasLiked) return;

        // Record in DB via analytics service; it will return false if duplicate
        const inserted = await analyticsService.recordPostLike(String(viewingMetrics.post.id), viewingMetrics.platform ?? null, {
          actor: user?.email ?? (user?.id ? `@${String(user.id).slice(0, 8)}` : '@user'),
        });
        if (!inserted) {
          setUserHasLiked(true);
          return;
        }

        // After DB insert, call server-side proxy to perform YouTube sync securely
        if (isYouTube && videoId) {
          try {
            const baseUrl = 'https://zourlqrkoyugzymxkbgn.functions.supabase.co';
            // get current session token to authenticate the proxy call
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;
            if (!token) {
              console.warn('No session token available; skipping server-side YouTube sync');
            } else {
              await fetch(`${baseUrl}/record-like-and-sync`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ postId: String(viewingMetrics.post.id), platform: viewingMetrics.platform, videoId }),
              });
            }
          } catch (e) {
            // Sync failure should not revert DB insert; log and continue
            console.error('Server-side like+sync failed', e);
          }
        }

        // mark local state to disable button
        setUserHasLiked(true);
        try { toast.success('You liked this post'); } catch (e) { }
      } else if (type === 'post_comment') {
        // Use new service method for comments to ensure duplicate checks + YouTube sync
        await analyticsService.recordPostComment(
          String(viewingMetrics.post.id),
          text || '',
          viewingMetrics.platform,
          {
            actor: user?.email ?? (user?.id ? `@${String(user.id).slice(0, 8)}` : '@user'),
          }
        );
      } else {
        // Non-like/non-comment events: record normally
        await trackEventSafe({
          event_type: type,
          entity_type: 'post',
          entity_id: viewingMetrics.post.id,
          platform: viewingMetrics.platform,
          metadata: {
            actor: user?.email ?? (user?.id ? `@${String(user.id).slice(0, 8)}` : '@user'),
            text: text?.trim() || undefined,
          },
        });
      }

      // Refresh summary
      const summary = await analyticsService.getPostEngagementSummary(
        String(viewingMetrics.post.id),
        String(viewingMetrics.platform),
        viewingMetrics?.post?.link_url ? String(viewingMetrics.post.link_url) : null
      );
      setEngagementData({
        metrics: summary.metrics,
        recentActivity: summary.recentActivity,
        metricsSource: (summary as any).metricsSource,
      });
      // Ensure userHasLiked is updated after refresh (in case it was inserted elsewhere)
      try {
        const liked = await analyticsService.hasUserLiked(String(viewingMetrics.post.id));
        setUserHasLiked(Boolean(liked));
      } catch (e) {
        // ignore
      }
      if (type === 'post_comment') setEngagementCommentText('');
    } catch (e) {
      console.error('recordEngagement error', e);
      try { toast.error('Action failed — please try again'); } catch (er) { }
      throw e;
    } finally {
      setEngagementActionLoading(false);
    }
  };

  // Helper: extract YouTube video ID from URL
  const extractYouTubeId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  };

  // Generate stable mock metrics based on post ID - COMBINED from currently selected platforms
  const getMockMetrics = (post: any, currentSelectedPlatforms?: string[]) => {
    const postIdHash = post?.id?.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) || 1234;
    // Use currently selected platforms if provided, otherwise use post platforms
    const platformCount = currentSelectedPlatforms?.length || post?.platforms?.length || 1;

    // Base metrics per platform
    const baseLikes = post?.analytics?.likes || (postIdHash % 500) + 50;
    const baseShares = post?.analytics?.shares || (postIdHash % 200) + 10;
    const baseComments = post?.analytics?.comments || (postIdHash % 100) + 5;
    const baseViews = post?.analytics?.views || (postIdHash % 2000) + 500;
    const baseReach = post?.analytics?.reach || (postIdHash % 3000) + 1000;
    const baseImpressions = post?.analytics?.impressions || (postIdHash % 5000) + 2000;

    // Combine metrics from currently selected platforms (multiply by platform count)
    // Each platform contributes to the total metrics
    return {
      likes: baseLikes * platformCount,
      shares: baseShares * platformCount,
      comments: baseComments * platformCount,
      views: baseViews * platformCount,
      reach: baseReach * platformCount,
      impressions: baseImpressions * platformCount,
      subscribers: currentSelectedPlatforms?.some((p) => (p || '').toLowerCase() === 'youtube') ? (postIdHash % 50000) + 10000 : 0, // Only for YouTube
      likesGrowth: (postIdHash % 20) + 5,
      sharesGrowth: (postIdHash % 15) + 3,
      commentsGrowth: (postIdHash % 25) + 5,
      viewsGrowth: (postIdHash % 30) + 10,
      reactions: (postIdHash % 300) + 50,
      clicks: (postIdHash % 150) + 20,
      saves: (postIdHash % 50) + 5,
      videoViews: post?.content_type === 'video' ? (postIdHash % 1000) + 200 : 0,
      instagramSaves: (postIdHash % 80) + 10,
      instagramProfileVisits: (postIdHash % 200) + 30,
      instagramWebsiteClicks: post?.link_url ? (postIdHash % 100) + 15 : 0,
      instagramReach: (postIdHash % 2000) + 500,
      platformCount: platformCount, // Store for display
    };
  };

  // New states for icon functionalities
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [location, setLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');

  // Refs for file inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const platforms = [
    { id: 'facebook', icon: <Facebook className="text-[#1877F2]" />, label: 'Facebook' },
    { id: 'instagram', icon: <Instagram className="text-[#E4405F]" />, label: 'Instagram' },
    { id: 'twitter', icon: <Twitter className="text-[#1DA1F2]" />, label: 'X (Twitter)' },
    { id: 'linkedin', icon: <Linkedin className="text-[#0A66C2]" />, label: 'LinkedIn' },
    { id: 'youtube', icon: <Youtube className="text-[#FF0000]" />, label: 'YouTube' },
    { id: 'tiktok', icon: <Music className="text-[#000000]" />, label: 'TikTok' },
    { id: 'whatsapp', icon: <MessageCircle className="text-[#25D366]" />, label: 'WhatsApp' },
  ];

  // Track which social media platforms are connected

  const togglePlatform = (id: string) => {
    // Only allow selection if platform is connected
    if (!socialAccounts[id]) {
      // Show a helpful message and navigate to Social Media page
      const platformName = platforms.find(p => p.id === id)?.label || id;
      if (window.confirm(`${platformName} is not connected. Would you like to connect it now?`)) {
        // Navigate to Social Media page by dispatching a custom event
        window.dispatchEvent(new CustomEvent('navigate', { detail: { section: 'Social Media' } }));
        // Also try to update URL hash as fallback
        window.location.hash = '#social-media';
      }
      return;
    }
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const BUCKET_POST_MEDIA = 'post-media';

  const uploadFileToStorage = async (file: File, folder: 'images' | 'videos'): Promise<string | null> => {
    if (!user?.id) return null;
    const ext = file.name.split('.').pop() || (folder === 'videos' ? 'mp4' : 'jpg');
    const path = `${folder}/${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { error } = await supabase.storage.from(BUCKET_POST_MEDIA).upload(path, file, { upsert: false });
    if (error) {
      console.warn('Storage upload failed:', error);
      return null;
    }
    const { data } = supabase.storage.from(BUCKET_POST_MEDIA).getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files) as File[]) {
      const publicUrl = await uploadFileToStorage(file, 'images');
      if (publicUrl) {
        setUploadedImages(prev => [...prev, publicUrl]);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => setUploadedImages(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file as Blob);
      }
    }
    e.target.value = '';
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files) as File[]) {
      const publicUrl = await uploadFileToStorage(file, 'videos');
      if (publicUrl) {
        setUploadedVideos(prev => [...prev, publicUrl]);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => setUploadedVideos(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file as Blob);
      }
    }
    e.target.value = '';
  };

  const insertEmoji = (emoji: string) => {
    setPostContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleInsertLink = () => {
    if (linkUrl) {
      setPostContent(prev => prev + ` ${linkUrl}`);
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const handleInsertLocation = () => {
    if (location) {
      setPostContent(prev => prev + ` 📍 ${location}`);
      setLocation('');
      setShowLocationInput(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setUploadedVideos(prev => prev.filter((_, i) => i !== index));
  };

  // Simple emoji picker data
  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', '➿', '🌀', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '👁️‍🗨️', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'];

  const publishToFacebook = async (content: string, mediaUrls: string[]) => {
    try {
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
      const { data: account } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaces![0].id)
        .eq('platform', 'facebook')
        .eq('is_active', true)
        .single();

      if (!account) throw new Error('Facebook account not connected');

      // Simple implementation: Post to feed
      // In a real app, you'd handle images/videos separately via the Graph API
      const pageId = account.account_id || (account as any).platform_account_id;
      const response = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          access_token: account.access_token,
          link: mediaUrls[0] // If there's a media URL, attach it as a link for now
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error.message);
      return result;
    } catch (err) {
      console.error('Facebook publish error:', err);
      throw err;
    }
  };

  const publishToTwitter = async (content: string) => {
    const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
    if (!workspaces?.length) throw new Error('No workspace found');
    const { data: account } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaces[0].id)
      .eq('platform', 'twitter')
      .eq('is_active', true)
      .single();
    if (!account?.access_token) throw new Error('Twitter account not connected');
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${account.access_token}` },
      body: JSON.stringify({ text: content.slice(0, 280) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as any)?.detail || (data as any)?.title || res.statusText);
    return data;
  };

  const publishToLinkedIn = async (content: string) => {
    const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
    if (!workspaces?.length) throw new Error('No workspace found');
    const { data: account } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaces[0].id)
      .eq('platform', 'linkedin')
      .eq('is_active', true)
      .single();
    if (!account?.access_token) throw new Error('LinkedIn account not connected');
    const authorUrn = (account.account_id || '').startsWith('urn:') ? account.account_id : `urn:li:person:${account.account_id}`;
    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        Authorization: `Bearer ${account.access_token}`,
      },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as any)?.message || (data as any)?.status || res.statusText);
    return data;
  };

  /** Instagram: 2-step flow (create media container, then publish). Requires a publicly accessible image or video URL. */
  const publishToInstagram = async (content: string, mediaUrls: string[]) => {
    const publicUrl = mediaUrls.find((u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://')));
    if (!publicUrl) throw new Error('Instagram requires a publicly accessible image or video URL. Upload media to storage first.');
    const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
    if (!workspaces?.length) throw new Error('No workspace found');
    const { data: account } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaces[0].id)
      .eq('platform', 'instagram')
      .eq('is_active', true)
      .single();
    if (!account?.access_token) throw new Error('Instagram account not connected');
    const igUserId = account.account_id;
    const isVideo = /\.(mp4|webm|mov)$/i.test(publicUrl) || publicUrl.includes('video');
    const containerParams: Record<string, string> = isVideo
      ? { media_type: 'REELS', video_url: publicUrl, caption: content }
      : { image_url: publicUrl, caption: content };
    const containerRes = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media?${new URLSearchParams({ ...containerParams, access_token: account.access_token })}`,
      { method: 'POST' }
    );
    const containerData = await containerRes.json().catch(() => ({}));
    if (containerData?.error) throw new Error(containerData.error.message || 'Failed to create Instagram media');
    const creationId = containerData?.id;
    if (!creationId) throw new Error('Instagram media container missing id');
    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media_publish?creation_id=${creationId}&access_token=${account.access_token}`,
      { method: 'POST' }
    );
    const publishData = await publishRes.json().catch(() => ({}));
    if (publishData?.error) throw new Error(publishData.error.message || 'Failed to publish to Instagram');
    return publishData;
  };

  const handleEditPost = (post: any) => {
    // Load post data into editor
    console.log('Editing post:', post);
    console.log('Post media_urls:', post.media_urls);
    setEditingPost(post);
    setPostContent(post.content || '');
    setSelectedPlatforms(post.platforms || []);
    setSelectedCampaignId(postCampaignMap[post.id]?.id || null);
    setLinkUrl(post.link_url || '');
    setLocation(post.location || '');
    // Filter images - accept both file extensions AND base64 data URLs
    const images = post.media_urls?.filter((url: string) => {
      if (!url || typeof url !== 'string') return false;
      // Check for base64 data URLs (data:image/...)
      if (url.startsWith('data:image/')) return true;
      // Check for file extensions
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    }) || [];
    // Filter videos - accept both file extensions AND base64 data URLs
    const videos = post.media_urls?.filter((url: string) => {
      if (!url || typeof url !== 'string') return false;
      // Check for base64 data URLs (data:video/...)
      if (url.startsWith('data:video/')) return true;
      // Check for file extensions
      return /\.(mp4|webm|mov)$/i.test(url);
    }) || [];
    console.log('Filtered images:', images);
    console.log('Filtered videos:', videos);
    setUploadedImages(images);
    setUploadedVideos(videos);

    // Set schedule mode based on post status
    if (post.scheduled_for) {
      setScheduleMode('later');
      const scheduledDate = new Date(post.scheduled_for);
      setScheduleDate(scheduledDate.toISOString().split('T')[0]);
      setScheduleTime(scheduledDate.toTimeString().slice(0, 5));
    } else {
      setScheduleMode('now');
    }

    setIsRecur(post.is_recurring || false);
    if (post.recurrence_rule) {
      const freqMatch = post.recurrence_rule.match(/FREQ=(\w+)/);
      if (freqMatch) {
        setRecurFrequency(freqMatch[1].charAt(0) + freqMatch[1].slice(1).toLowerCase());
      }
    }

    // Switch to create tab to show editor
    setActiveTab('create');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      // Refresh posts list
      fetchPosts();
      alert('Post deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post: ' + (err.message || 'Unknown error'));
    }
  };

  const handlePostSubmit = async () => {
    if (!postContent.trim() && uploadedImages.length === 0 && uploadedVideos.length === 0) {
      alert('Please add some content to your post!');
      return;
    }

    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform!');
      return;
    }

    if (scheduleMode === 'later') {
      if (!scheduleDate?.trim()) {
        alert('Please select a date for the scheduled post.');
        return;
      }
      if (!scheduleTime?.trim()) {
        alert('Please select a time for the scheduled post.');
        return;
      }
      const scheduledAt = new Date(`${scheduleDate} ${scheduleTime}`);
      if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
        alert('Please select a future date and time.');
        return;
      }
      if (isRecur && (!recurUntil?.trim() || new Date(recurUntil) < scheduledAt)) {
        alert('Recur end date must be on or after the scheduled date.');
        return;
      }
    }

    // Temporarily skip connection verification (for testing)
    // Verify all selected platforms are connected
    // for (const p of selectedPlatforms) {
    //   if (!socialAccounts[p]) {
    //     alert(`You must connect your ${p} account before you can post to it.`);
    //     return;
    //   }
    // }

    setIsSubmitting(true);

    try {
      if (!user) throw new Error('You must be logged in to create a post.');

      // 1. Get workspace
      const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (wsError || !workspaces?.length) throw new Error('No workspace found. Please contact support.');
      const workspaceId = workspaces[0].id;

      // Don't send huge base64 video/image to Supabase (causes 520 / Failed to fetch). Max ~200KB per data URL.
      const MAX_DATA_URL_LENGTH = 200 * 1024;
      const allMedia = [...uploadedImages, ...uploadedVideos];
      const mediaForDb = allMedia.filter((url) => {
        if (!url || typeof url !== 'string') return false;
        if (url.startsWith('http://') || url.startsWith('https://')) return true;
        if (url.startsWith('data:')) return url.length <= MAX_DATA_URL_LENGTH;
        return true;
      });
      if (selectedPlatforms.some((plat) => (plat || '').toLowerCase() === 'youtube') && linkUrl && (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) && !mediaForDb.includes(linkUrl)) {
        mediaForDb.push(linkUrl);
      }
      const skippedLarge = allMedia.length - mediaForDb.length;

      // 2. Prepare data matching schema
      const postData = {
        workspace_id: workspaceId,
        created_by: user.id,
        content: postContent,
        platforms: selectedPlatforms,
        status: scheduleMode === 'now' ? 'published' : 'scheduled',
        published_at: scheduleMode === 'now' && !editingPost ? new Date().toISOString() : (editingPost?.published_at || null),
        publish_immediately: scheduleMode === 'now',
        scheduled_for: scheduleMode === 'later' && scheduleDate
          ? new Date(`${scheduleDate} ${scheduleTime}`).toISOString()
          : null,
        is_recurring: isRecur,
        recurrence_rule: isRecur ? `FREQ=${recurFrequency.toUpperCase()};UNTIL=${recurUntil}` : null,
        media_urls: mediaForDb,
        link_url: linkUrl,
        location: location,
        // Optional metadata
        content_type: uploadedVideos.length > 0 ? 'video' : uploadedImages.length > 0 ? 'image' : 'text',
      };

      // 3. Update or Insert to Supabase
      let postId = editingPost?.id;
      if (editingPost) {
        // Update existing post
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', editingPost.id);
        if (error) throw error;
        trackEventSafe({ event_type: 'post_created', entity_type: 'post', entity_id: editingPost.id, metadata: { action: 'updated', platforms: selectedPlatforms } });
      } else {
        // Insert new post
        const { data: inserted, error } = await supabase.from('posts').insert(postData).select().single();
        if (error) throw error;
        postId = inserted?.id;
        trackEventSafe({ event_type: 'post_created', entity_type: 'post', entity_id: inserted?.id || null, metadata: { action: 'created', platforms: selectedPlatforms } });
      }

      // 3b. Link post to campaign (via campaign_posts)
      if (postId) {
        if (selectedCampaignId) {
          await supabase
            .from('campaign_posts')
            .upsert({ campaign_id: selectedCampaignId, post_id: postId }, { onConflict: 'campaign_id,post_id' });
        } else {
          await supabase.from('campaign_posts').delete().eq('post_id', postId);
        }
      }

      // 4. Actual Social Publishing (if 'Post Now') – via API to avoid CORS and Facebook profile errors
      if (scheduleMode === 'now') {
        const platformsToPublish = [...selectedPlatforms];
        const allMedia = [...uploadedImages, ...uploadedVideos];
        const publicUrls = allMedia.filter((u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://')));
        if (platformsToPublish.some((plat) => (plat || '').toLowerCase() === 'youtube') && linkUrl && (linkUrl.startsWith('http://') || linkUrl.startsWith('https://'))) {
          if (!publicUrls.includes(linkUrl)) publicUrls.push(linkUrl);
        }
        try {
          // Fetch tokens client-side (user session allows RLS) so the API can publish when server has no service-role key
          const { data: accountRows } = await supabase
            .from('social_accounts')
            .select('id, platform, account_id, access_token, refresh_token')
            .eq('workspace_id', workspaceId)
            .eq('is_active', true)
            .in('platform', platformsToPublish.map((p) => (p || '').toLowerCase()));
          const accountTokens: Record<string, { account_id: string; access_token: string }> = {};
          for (const row of accountRows || []) {
            const platform = (row.platform || '').toLowerCase();
            if (!platform) continue;
            let accessToken = row.access_token;
            // Twitter OAuth 2.0 tokens expire (~2h); refresh so publish doesn't get 401 Unauthorized
            if (platform === 'twitter' && row.refresh_token) {
              try {
                const refreshRes = await fetch(`${window.location.origin}/api/auth?provider=twitter&action=refresh`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ refresh_token: row.refresh_token }),
                });
                const refreshData = await refreshRes.json().catch(() => ({}));
                if (refreshRes.ok && refreshData.access_token) {
                  accessToken = refreshData.access_token;
                  await supabase
                    .from('social_accounts')
                    .update({
                      access_token: refreshData.access_token,
                      ...(refreshData.refresh_token && { refresh_token: refreshData.refresh_token }),
                      ...(refreshData.expires_in && { token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString() }),
                    })
                    .eq('workspace_id', workspaceId)
                    .eq('platform', 'twitter')
                    .eq('account_id', row.account_id);
                }
              } catch (_) {
                // use existing access_token; publish may still work or return 401
              }
            }
            // YouTube/Google access tokens expire (~1h); refresh so publish doesn't get 401
            if (platform === 'youtube' && row.refresh_token) {
              try {
                const refreshRes = await fetch(`${window.location.origin}/api/auth?provider=youtube&action=refresh`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ refresh_token: row.refresh_token }),
                });
                const refreshData = await refreshRes.json().catch(() => ({}));
                if (refreshRes.ok && refreshData.access_token) {
                  accessToken = refreshData.access_token;
                  await supabase
                    .from('social_accounts')
                    .update({
                      access_token: refreshData.access_token,
                      ...(refreshData.refresh_token && { refresh_token: refreshData.refresh_token }),
                      ...(refreshData.expires_in && { token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString() }),
                    })
                    .eq('workspace_id', workspaceId)
                    .eq('platform', 'youtube')
                    .eq('account_id', row.account_id);
                }
              } catch (_) {
                // use existing access_token; publish may still work or return 401
              }
            }
            if (accessToken) {
              const isFacebookPage = platform === 'facebook' && !(row.account_id || '').startsWith('profile_');
              const existing = accountTokens[platform];
              if (platform !== 'facebook') {
                accountTokens[platform] = { account_id: row.account_id || '', access_token: accessToken };
              } else if (isFacebookPage || !existing) {
                accountTokens[platform] = { account_id: row.account_id || '', access_token: accessToken };
              }
            }
          }

          const origin = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : window.location.origin;
          const r = await fetch(`${origin}/api/utils?endpoint=publish-post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: postContent,
              platforms: platformsToPublish,
              mediaUrls: publicUrls,
              workspaceId,
              postId: postId ?? undefined,
              accountTokens: Object.keys(accountTokens).length ? accountTokens : undefined,
            }),
          });
          if (r.status === 413) {
            alert('Request too large. Use a public video URL (upload to Storage and paste the link) instead of attaching the file directly.');
            return;
          }
          const payload = await r.json().catch(() => ({}));
          if (!r.ok) {
            const msg = payload?.error || payload?.message || `Publish failed (${r.status}).`;
            alert(`Post saved but could not publish: ${msg}`);
            return;
          }
          const platformPostIds = payload.platformPostIds || {};
          if (postId && Object.keys(platformPostIds).length > 0 && accountRows?.length) {
            for (const [platform, platformPostId] of Object.entries(platformPostIds)) {
              const row = accountRows.find((r: any) => (r.platform || '').toLowerCase() === platform.toLowerCase());
              if (row?.id && platformPostId) {
                await supabase.from('post_publications').upsert({
                  post_id: postId,
                  social_account_id: row.id,
                  platform: platform.toLowerCase(),
                  platform_post_id: platformPostId,
                  status: 'published',
                  published_at: new Date().toISOString(),
                }, { onConflict: 'post_id,social_account_id' });
              }
            }
          }
          const failed = payload.failed || [];
          if (failed.length > 0) {
            const names = [...new Set(failed.map((f: any) => f?.platform).filter(Boolean))];
            const firstError = failed.find((f: any) => f?.error)?.error;
            const onlyYoutube = names.length === 1 && String(names[0] ?? '').toLowerCase() === 'youtube';
            const hint = firstError
              ? ` ${firstError}`
              : onlyYoutube
                ? ' YouTube video upload is not yet supported.'
                : ' Check your connected accounts.';
            alert(`Post saved. Failed to publish to: ${names.join(', ')}.${hint}`);
          }
        } catch (e) {
          console.warn('Publish API call failed:', e);
          alert('Post saved. Could not reach publish service; try again later.');
        }
      }

      let successMsg = `Post ${editingPost ? 'updated' : scheduleMode === 'now' ? 'published' : 'scheduled'} successfully! 🎉`;
      if (skippedLarge > 0) successMsg += ` Large media (e.g. video) was not saved to the database; upload to Storage for publishing.`;
      alert(successMsg);
      await fetchPosts();

      // Reset form
      setPostContent('');
      setUploadedImages([]);
      setUploadedVideos([]);
      setSelectedPlatforms(['facebook', 'instagram']);
      setSelectedCampaignId(null);
      setScheduleMode('now');
      setIsRecur(false);
      setScheduleDate('');
      setScheduleTime('10:00');
      setLinkUrl('');
      setLocation('');
      setEditingPost(null);
      setActiveTab('all');

      // Refresh posts list
      fetchPosts();

    } catch (error: any) {
      console.error('Error creating post:', error);
      const msg = error?.message || '';
      const isNetwork = /failed to fetch|network|520|cors/i.test(msg);
      const hint = isNetwork ? ' Check your connection or try a smaller video (large files can time out).' : '';
      alert(`Failed to create post: ${msg}${hint}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTemplate = () => {
    if (!postContent.trim()) {
      alert('Please add some content to save as a template!');
      return;
    }

    const template = {
      content: postContent,
      images: uploadedImages,
      videos: uploadedVideos,
      timestamp: new Date().toISOString()
    };

    console.log('Saving template:', template);
    alert('Template saved successfully! 📄\n\nYou can find it in the Templates tab.');
  };

  const tabs: { id: ContentTab; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <FileText size={16} /> },
    { id: 'create', label: 'Content', icon: <PenTool size={16} /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon size={16} /> },
    { id: 'all_list', label: 'List View', icon: <FileText size={16} /> },
    { id: 'templates', label: 'Templates', icon: <Copy size={16} /> },
  ];

  const totalItems = filteredPosts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, totalItems);
  const paginatedPosts = filteredPosts.slice(pageStart, pageEnd);

  const visiblePages = (() => {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    const adjustedStart = Math.max(1, end - 4);
    const pages: number[] = [];
    for (let p = adjustedStart; p <= end; p++) pages.push(p);
    return pages;
  })();

  const PaginationBar = ({ className = '' }: { className?: string }) => {
    if (isLoadingPosts || totalItems === 0) return null;
    return (
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-white ${className}`}>
        <div className="flex items-center justify-between md:justify-start gap-3">
          <p className="text-[11px] text-gray-500 font-semibold">
            Showing <span className="font-black text-gray-700">{totalItems === 0 ? 0 : pageStart + 1}</span>–
            <span className="font-black text-gray-700">{pageEnd}</span> of{' '}
            <span className="font-black text-gray-700">{totalItems}</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-500">Rows</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 text-[11px] font-bold bg-white border border-gray-200 rounded-lg shadow-sm outline-none focus:ring-4 focus:ring-blue-50"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg border transition-all ${currentPage === 1 ? 'text-gray-300 border-gray-200 bg-gray-50 cursor-not-allowed' : 'text-gray-600 border-gray-200 bg-white hover:bg-gray-50'
              }`}
          >
            Prev
          </button>

          <div className="flex items-center gap-1">
            {visiblePages[0] > 1 && (
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`w-8 h-8 rounded-lg text-[11px] font-black border transition-all ${currentPage === 1 ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  1
                </button>
                {visiblePages[0] > 2 && <span className="px-1 text-gray-300 font-black">…</span>}
              </>
            )}

            {visiblePages.map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded-lg text-[11px] font-black border transition-all ${currentPage === p ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {p}
              </button>
            ))}

            {visiblePages[visiblePages.length - 1] < totalPages && (
              <>
                {visiblePages[visiblePages.length - 1] < totalPages - 1 && <span className="px-1 text-gray-300 font-black">…</span>}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-8 h-8 rounded-lg text-[11px] font-black border transition-all ${currentPage === totalPages ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg border transition-all ${currentPage === totalPages ? 'text-gray-300 border-gray-200 bg-gray-50 cursor-not-allowed' : 'text-gray-600 border-gray-200 bg-white hover:bg-gray-50'
              }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const FiltersBar = ({ showStatus }: { showStatus: boolean }) => {
    return (
      <div className="px-6 py-3 border-b border-gray-100 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                type="text"
                placeholder="Search posts, campaigns, platforms..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-[12px] font-semibold outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {showStatus && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-[12px] font-bold bg-white border border-gray-200 rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-blue-50"
                title="Filter by status"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            )}

            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="px-3 py-2 text-[12px] font-bold bg-white border border-gray-200 rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-blue-50"
              title="Filter by platform"
            >
              <option value="all">All platforms</option>
              {platformOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={filterCampaignId}
              onChange={(e) => setFilterCampaignId(e.target.value)}
              className="px-3 py-2 text-[12px] font-bold bg-white border border-gray-200 rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-blue-50"
              title="Filter by campaign"
            >
              <option value="all">All campaigns</option>
              {campaigns.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setFilterQuery('');
                setFilterPlatform('all');
                setFilterCampaignId('all');
                setFilterStatus('all');
              }}
              className="px-3 py-2 text-[12px] font-black text-gray-600 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all"
              title="Clear filters"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'calendar':
        return <ContentCalendar onNavigateToCreate={() => setActiveTab('create')} />;

      case 'templates':
        return <ContentTemplates />;

      case 'create': {
        const hasNoAccounts = Object.keys(socialAccounts).length === 0;

        return (
          <div className="space-y-6 max-w-6xl mx-auto">
            {hasNoAccounts && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm">
                <div className="flex items-center gap-3 text-amber-800">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">No social accounts connected</h4>
                    <p className="text-xs font-medium text-amber-700/80">Connect your platforms to start creating and publishing content.</p>
                  </div>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { section: 'Social Media' } }))}
                  className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-all shadow-sm shadow-amber-200"
                >
                  Connect Now
                </button>
              </div>
            )}

            <div className="bg-[#f8f9fb] rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              {/* Header */}
              <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#344054]">{editingPost ? 'Edit Post' : 'Create Post'}</h2>
                <button onClick={() => {
                  setActiveTab('all');
                  setEditingPost(null);
                  // Reset form
                  setPostContent('');
                  setUploadedImages([]);
                  setUploadedVideos([]);
                  setSelectedPlatforms([]);
                  setScheduleMode('now');
                  setLinkUrl('');
                  setLocation('');
                }} className="text-gray-400 hover:text-gray-600 transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* Left Side: Editor */}
                <div className="lg:col-span-7 p-6 space-y-6 bg-white border-r border-gray-100">
                  {/* Content Area */}
                  <div className="border border-gray-200 rounded-lg transition-all relative">
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder="Type your post content here... Use #hashtags and @mentions. Add images, videos, or links to engage your audience."
                      className="w-full h-32 p-4 text-sm font-medium outline-none resize-none placeholder-gray-400 leading-relaxed text-gray-700 rounded-t-lg"
                    />

                    {/* Hidden file inputs */}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleVideoUpload}
                      className="hidden"
                    />

                    {/* Toolbar */}
                    <div className="px-4 py-3 bg-[#fcfcfd] border-t border-gray-100 flex items-center justify-between relative">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => imageInputRef.current?.click()}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-all"
                          title="Add image"
                        >
                          <ImageIcon size={18} />
                        </button>
                        <button
                          onClick={() => videoInputRef.current?.click()}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-all"
                          title="Add video"
                        >
                          <Video size={18} />
                        </button>
                        <button
                          onClick={() => setShowLinkInput(!showLinkInput)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-all"
                          title="Add link"
                        >
                          <LinkIcon size={18} />
                        </button>
                        <button
                          onClick={() => setShowLocationInput(!showLocationInput)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-all"
                          title="Add location"
                        >
                          <MapPin size={18} />
                        </button>
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-all"
                          title="Add emoji"
                        >
                          <Smile size={18} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-400">{postContent.length}/2,200</span>
                        <button className="p-1 text-gray-300 hover:text-gray-500"><MoreVertical size={16} /></button>
                      </div>

                      {/* Emoji Picker Dropdown */}
                      {showEmojiPicker && (
                        <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 w-80">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-700">Select Emoji</h3>
                            <button
                              onClick={() => setShowEmojiPicker(false)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
                            {emojis.map((emoji, index) => (
                              <button
                                key={index}
                                onClick={() => insertEmoji(emoji)}
                                className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Link Input Dropdown */}
                      {showLinkInput && (
                        <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 w-96">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-700">Insert Link</h3>
                            <button
                              onClick={() => setShowLinkInput(false)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <input
                              type="url"
                              value={linkUrl}
                              onChange={(e) => setLinkUrl(e.target.value)}
                              placeholder={selectedPlatforms.some((p) => (p || '').toLowerCase() === 'youtube') ? 'https://your-video-url.mp4' : 'https://example.com'}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {selectedPlatforms.some((p) => (p || '').toLowerCase() === 'youtube') && (
                              <p className="text-xs text-gray-500">For YouTube: paste a direct video file URL (e.g. https://your-storage.com/video.mp4), not a YouTube watch/shorts link.</p>
                            )}
                            <button
                              onClick={handleInsertLink}
                              disabled={!linkUrl}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Insert Link
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Location Input Dropdown */}
                      {showLocationInput && (
                        <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 w-96">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-700">Add Location</h3>
                            <button
                              onClick={() => setShowLocationInput(false)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder="Enter location"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={handleInsertLocation}
                              disabled={!location}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Add Location
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Campaign Picker */}
                      <div className="mt-4 space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Campaign (optional)</label>
                        <select
                          value={selectedCampaignId || ''}
                          onChange={(e) => setSelectedCampaignId(e.target.value || null)}
                          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-gray-800"
                        >
                          <option value="">No campaign</option>
                          {campaigns.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <p className="text-[11px] text-gray-400">Link this post to a campaign for reporting.</p>
                      </div>
                    </div>

                    {/* Media Previews */}
                    {(uploadedImages.length > 0 || uploadedVideos.length > 0) && (
                      <div className="px-4 py-3 border-t border-gray-100 space-y-3">
                        {/* Images */}
                        {uploadedImages.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-gray-600">Images ({uploadedImages.length})</h4>
                            <div className="grid grid-cols-4 gap-2">
                              {uploadedImages.map((img, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={img}
                                    alt={`Upload ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-lg border border-gray-200"
                                  />
                                  <button
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Videos */}
                        {uploadedVideos.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-gray-600">Videos ({uploadedVideos.length})</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {uploadedVideos.map((vid, index) => (
                                <div key={index} className="relative group">
                                  <video
                                    src={vid}
                                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                    controls
                                  />
                                  <button
                                    onClick={() => removeVideo(index)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Platforms */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#344054]">Select Social Media Platforms</h3>
                      <p className="text-xs text-gray-500">Choose where to publish your post. Select multiple platforms:</p>
                      {Object.keys(socialAccounts).length === 0 && (
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                          <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-amber-800">No social media accounts connected</p>
                            <p className="text-xs text-amber-700 mt-1">Connect your accounts in the <button onClick={() => { window.dispatchEvent(new CustomEvent('navigate', { detail: { section: 'Social Media' } })); window.location.hash = '#social-media'; }} className="underline font-bold">Social Media</button> section to start publishing.</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {platforms.map(p => {
                        const isConnected = p.id === 'youtube' ? youtubeAccountConnected : socialAccounts[p.id] === true;
                        const isSelected = selectedPlatforms.includes(p.id);

                        return (
                          <div key={p.id} className="relative group">
                            <button
                              onClick={() => togglePlatform(p.id)}
                              className={`w-[60px] h-[60px] rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all overflow-hidden ${!isConnected
                                ? 'bg-gray-50 border-gray-100 opacity-60 hover:opacity-100 hover:border-amber-200 grayscale-[0.8] hover:grayscale-0'
                                : isSelected
                                  ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100'
                                  : 'border-gray-200 bg-white hover:border-blue-300 shadow-sm'
                                }`}
                              title={!isConnected ? `Connect ${p.label}` : isSelected ? `Deselect ${p.label}` : `Select ${p.label}`}
                            >
                              <div className={`transition-transform duration-300 ${isSelected && isConnected ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {React.cloneElement(p.icon as React.ReactElement<any>, {
                                  size: 22,
                                  className: !isConnected ? 'text-gray-400' : (p.icon as React.ReactElement).props.className
                                })}
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-wider ${!isConnected ? 'text-gray-400' : isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                                {p.id}
                              </span>
                            </button>

                            {/* Status Indicators */}
                            {isConnected ? (
                              isSelected && (
                                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10 animate-in zoom-in duration-200">
                                  <CheckCircle2 size={12} className="text-white" strokeWidth={4} />
                                </div>
                              )
                            ) : (
                              <div
                                className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10 animate-pulse cursor-pointer"
                                title="Not connected - Click to connect"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (p.id === 'youtube') {
                                    // Show YouTube connection prompt
                                    const element = document.getElementById('youtube-connect-prompt');
                                    element?.scrollIntoView({ behavior: 'smooth' });
                                  } else {
                                    window.dispatchEvent(new CustomEvent('navigate', { detail: { section: 'Social Media' } }));
                                  }
                                }}
                              >
                                <AlertCircle size={12} className="text-white" strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* YouTube Connection Prompt */}
                    {selectedPlatforms.includes('youtube') && !youtubeAccountConnected && (
                      <div id="youtube-connect-prompt">
                        <YouTubeSimpleConnect />
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">
                        Accounts Selected: {selectedPlatforms.length} {selectedPlatforms.length === 1 ? 'Account' : 'Accounts'}
                        {Object.keys(socialAccounts).length === 0 && (
                          <span className="ml-2 text-amber-600 font-semibold">• No accounts connected</span>
                        )}
                      </span>
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { section: 'Social Media' } }));
                          window.location.hash = '#social-media';
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 underline flex items-center gap-1 transition-colors"
                      >
                        <Plus size={12} />
                        Add Account
                      </button>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="pt-6 border-t border-gray-100 space-y-4">
                    <h3 className="text-sm font-bold text-[#344054]">Schedule Post</h3>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center p-0.5">
                          <input
                            type="radio"
                            name="schedule"
                            className="w-full h-full appearance-none rounded-full checked:bg-blue-600 transition-all cursor-pointer"
                            checked={scheduleMode === 'now'}
                            onChange={() => setScheduleMode('now')}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Post Now</span>
                      </label>
                      {scheduleMode === 'now' && selectedPlatforms.some((p) => (p || '').toLowerCase() === 'youtube') && (
                        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                          YouTube: paste a <strong>direct video file URL</strong> (e.g. from Storage or a CDN), not a YouTube watch/shorts page link.
                        </p>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center p-0.5">
                            <input
                              type="radio"
                              name="schedule"
                              className="w-full h-full appearance-none rounded-full checked:bg-blue-600 transition-all cursor-pointer"
                              checked={scheduleMode === 'later'}
                              onChange={() => setScheduleMode('later')}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Schedule</span>
                        </label>

                        <div className={`flex gap-2 flex-1 transition-opacity ${scheduleMode === 'later' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                          <div className="relative flex-1">
                            <CalendarIcon className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                              type="date"
                              value={scheduleDate}
                              onChange={(e) => setScheduleDate(e.target.value)}
                              disabled={scheduleMode === 'now'}
                              placeholder="dd/mm/yyyy"
                              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                          </div>
                          <div className="relative flex-1">
                            <Clock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                              type="time"
                              value={scheduleTime}
                              onChange={(e) => setScheduleTime(e.target.value)}
                              disabled={scheduleMode === 'now'}
                              placeholder="10:00 am"
                              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer w-max">
                          <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center p-0.5">
                            <input
                              type="checkbox"
                              className="w-full h-full appearance-none rounded checked:bg-blue-600 transition-all cursor-pointer"
                              checked={isRecur}
                              onChange={(e) => setIsRecur(e.target.checked)}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Repeat size={14} className={isRecur ? "text-blue-600" : "text-gray-400"} />
                            Recur
                          </span>
                        </label>

                        {isRecur && (
                          <div className="ml-8 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Frequency</label>
                                <div className="relative">
                                  <select
                                    value={recurFrequency}
                                    onChange={(e) => setRecurFrequency(e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 outline-none appearance-none focus:border-blue-500 transition-all"
                                  >
                                    <option>Daily</option>
                                    <option>Weekly</option>
                                    <option>Monthly</option>
                                    <option>Every weekday</option>
                                  </select>
                                  <ChevronRight className="absolute right-3 top-2.5 text-gray-400 rotate-90 pointer-events-none" size={12} />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">End Date</label>
                                <div className="relative">
                                  <CalendarDays className="absolute left-3 top-2.5 text-gray-400" size={14} />
                                  <input
                                    type="date"
                                    value={recurUntil}
                                    onChange={(e) => setRecurUntil(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-blue-500 transition-all"
                                  />
                                </div>
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium">
                              This post will repeat <span className="text-blue-600 font-bold">{recurFrequency.toLowerCase()}</span> until <span className="text-blue-600 font-bold">{new Date(recurUntil).toLocaleDateString()}</span>.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">You can select multiple platforms to publish this post simultaneously.</p>
                  </div>
                </div>

                {/* Right Side: Preview */}
                <div className="lg:col-span-5 bg-[#f8f9fb] p-6 flex flex-col items-center">
                  <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full max-w-[340px]">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      {editingPost ? (
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                          <BarChart3 size={12} /> Post Metrics
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                          <Share2 size={12} /> Post Preview
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-white flex-1 overflow-y-auto space-y-4">
                      {editingPost ? (
                        <>
                          <h3 className="text-lg font-bold text-[#101828]">Post Analytics</h3>

                          {/* Show Post Content Preview when editing */}
                          {editingPost.content && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-500 font-bold uppercase mb-2">Post Content</p>
                              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{editingPost.content}</p>
                            </div>
                          )}

                          {/* Show Post Images when editing - ALWAYS show if post has images */}
                          {(() => {
                            // Get images from multiple sources - accept base64 data URLs too
                            const imagesFromState = uploadedImages.filter((url: any) => {
                              if (!url || typeof url !== 'string') return false;
                              // Accept base64 data URLs
                              if (url.startsWith('data:image/')) return true;
                              // Accept file extensions
                              return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                            });
                            const imagesFromPost = (editingPost?.media_urls || []).filter((url: any) => {
                              if (!url || typeof url !== 'string') return false;
                              // Accept base64 data URLs
                              if (url.startsWith('data:image/')) return true;
                              // Accept file extensions
                              return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                            });

                            // Use state images first, then post images
                            const images = imagesFromState.length > 0 ? imagesFromState : imagesFromPost;

                            if (images.length > 0) {
                              return (
                                <div className="space-y-3 mb-4">
                                  <p className="text-xs text-gray-500 font-medium uppercase font-bold">Post Media</p>
                                  {images.length === 1 ? (
                                    <div className="relative overflow-hidden rounded-lg border-2 border-blue-300 shadow-lg bg-gray-50 p-2">
                                      <img
                                        src={images[0]}
                                        alt="Post image"
                                        className="w-full rounded-lg"
                                        style={{ maxHeight: '250px', objectFit: 'contain' }}
                                      />
                                    </div>
                                  ) : (
                                    <div className={`grid gap-2 ${images.length === 2 ? 'grid-cols-2' : images.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                      {images.slice(0, 4).map((img: string, idx: number) => (
                                        <div key={idx} className="relative overflow-hidden rounded-lg border-2 border-blue-300 shadow-lg bg-gray-50 p-1">
                                          <img
                                            src={img}
                                            alt={`Post image ${idx + 1}`}
                                            className="w-full rounded-lg"
                                            style={{ maxHeight: '150px', objectFit: 'contain' }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {/* Show Post Videos when editing - accept base64 data URLs too */}
                          {(() => {
                            const allMediaUrls = editingPost?.media_urls || [];
                            const videos = allMediaUrls.filter((url: any) => {
                              if (!url || typeof url !== 'string') return false;
                              // Accept base64 data URLs
                              if (url.startsWith('data:video/')) return true;
                              // Accept file extensions
                              return /\.(mp4|webm|mov|avi)$/i.test(url);
                            });

                            const stateVideos = uploadedVideos.filter((url: any) => {
                              if (!url || typeof url !== 'string') return false;
                              if (url.startsWith('data:video/')) return true;
                              return /\.(mp4|webm|mov|avi)$/i.test(url);
                            });

                            const displayVideos = videos.length > 0 ? videos : stateVideos;

                            if (displayVideos.length > 0) {
                              return (
                                <div className="space-y-2 mb-4">
                                  <p className="text-xs text-gray-500 font-medium uppercase font-bold">Post Videos</p>
                                  {displayVideos.map((vid: string, idx: number) => (
                                    <div key={idx} className="relative rounded-lg overflow-hidden border-2 border-gray-300 shadow-md">
                                      <video
                                        src={vid}
                                        className="w-full h-40 object-cover rounded-lg"
                                        controls
                                      />
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </>
                      ) : (
                        <>
                          {/* Platform Badges */}
                          {selectedPlatforms.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {selectedPlatforms.map((platform) => {
                                const platformIcons: Record<string, React.ReactNode> = {
                                  facebook: <Facebook size={14} />,
                                  instagram: <Instagram size={14} />,
                                  twitter: <Twitter size={14} />,
                                  linkedin: <Linkedin size={14} />,
                                };
                                const platformColors: Record<string, string> = {
                                  facebook: 'bg-blue-600',
                                  instagram: 'bg-pink-600',
                                  twitter: 'bg-black',
                                  linkedin: 'bg-blue-700',
                                };
                                return (
                                  <div
                                    key={platform}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold text-white ${platformColors[platform] || 'bg-gray-600'}`}
                                  >
                                    {platformIcons[platform] || <Share2 size={14} />}
                                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-xs text-yellow-800 font-medium">Select platforms to see preview</p>
                            </div>
                          )}

                          {/* Post Content */}
                          {postContent ? (
                            <div className="mb-4">
                              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                {postContent}
                              </p>
                            </div>
                          ) : (
                            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <p className="text-xs text-gray-400 italic">Your post content will appear here...</p>
                            </div>
                          )}

                          {/* Images Preview */}
                          {uploadedImages.length > 0 && (
                            <div className="mb-4 space-y-2">
                              {uploadedImages.length === 1 ? (
                                <div className="relative overflow-hidden rounded-lg border border-gray-200">
                                  <img
                                    src={uploadedImages[0]}
                                    alt="Post"
                                    className="w-full rounded-lg"
                                    style={{ maxHeight: '300px', objectFit: 'contain' }}
                                  />
                                </div>
                              ) : (
                                <div className={`grid gap-2 ${uploadedImages.length === 2 ? 'grid-cols-2' : uploadedImages.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                  {uploadedImages.slice(0, 4).map((img, idx) => (
                                    <div key={idx} className="relative overflow-hidden rounded-lg border border-gray-200">
                                      <img
                                        src={img}
                                        alt={`Post ${idx + 1}`}
                                        className="w-full h-32 object-cover rounded-lg"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Videos Preview */}
                          {uploadedVideos.length > 0 && (
                            <div className="mb-4 space-y-2">
                              {uploadedVideos.map((vid, idx) => (
                                <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200">
                                  <video
                                    src={vid}
                                    className="w-full rounded-lg"
                                    style={{ maxHeight: '300px' }}
                                    controls
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Link Preview */}
                          {linkUrl && (
                            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <LinkIcon size={14} className="text-gray-400" />
                                <span className="text-xs font-bold text-gray-600">Link</span>
                              </div>
                              <a
                                href={linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline break-all"
                              >
                                {linkUrl}
                              </a>
                            </div>
                          )}

                          {/* Location Preview */}
                          {location && (
                            <div className="mb-4 flex items-center gap-2 text-xs text-gray-600">
                              <MapPin size={14} className="text-gray-400" />
                              <span>{location}</span>
                            </div>
                          )}
                        </>
                      )}
                      {editingPost ? (
                        /* Show Metrics when editing - real data from API when available */
                        <div className="space-y-4">
                          {engagementLoading && engagementPostId === editingPost.id ? (
                            <div className="py-6 text-center text-sm text-gray-500">Loading engagement…</div>
                          ) : (
                            <>
                              {engagementData && engagementPostId === editingPost.id && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center mb-2">
                                  <p className="text-[10px] text-green-700 font-bold uppercase">Live from YouTube</p>
                                </div>
                              )}
                              {selectedPlatforms.length > 1 && !(engagementData && engagementPostId === editingPost.id) && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                                  <p className="text-[10px] text-blue-600 font-bold uppercase">
                                    Combined Metrics from {selectedPlatforms.length} Platforms: {selectedPlatforms.join(', ').toUpperCase()}
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-3">
                                {/* Show views and subscribers only for YouTube */}
                                {selectedPlatforms.some((p) => (p || '').toLowerCase() === 'youtube') && (
                                  <>
                                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 rounded-lg border border-indigo-200">
                                      <p className="text-[9px] text-indigo-600 font-bold uppercase mb-1">Views</p>
                                      <p className="text-xl font-black text-indigo-900">
                                        {(engagementData && engagementPostId === editingPost.id ? engagementData.metrics.views : getMockMetrics(editingPost, selectedPlatforms).views).toLocaleString()}
                                      </p>
                                    </div>
                                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-lg border border-red-200">
                                      <p className="text-[9px] text-red-600 font-bold uppercase mb-1">Subscribers</p>
                                      <p className="text-xl font-black text-red-900">
                                        {(engagementData && engagementPostId === editingPost.id ? engagementData.metrics.subscribers || 12500 : getMockMetrics(editingPost, selectedPlatforms).subscribers || 12500).toLocaleString()}
                                      </p>
                                    </div>
                                  </>
                                )}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                                  <p className="text-[9px] text-blue-600 font-bold uppercase mb-1">Likes</p>
                                  <p className="text-xl font-black text-blue-900">
                                    {(engagementData && engagementPostId === editingPost.id ? engagementData.metrics.likes : getMockMetrics(editingPost, selectedPlatforms).likes).toLocaleString()}
                                  </p>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                                  <p className="text-[9px] text-green-600 font-bold uppercase mb-1">Shares</p>
                                  <p className="text-xl font-black text-green-900">
                                    {(engagementData && engagementPostId === editingPost.id ? engagementData.metrics.shares : getMockMetrics(editingPost, selectedPlatforms).shares).toLocaleString()}
                                  </p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                                  <p className="text-[9px] text-purple-600 font-bold uppercase mb-1">Comments</p>
                                  <p className="text-xl font-black text-purple-900">
                                    {(engagementData && engagementPostId === editingPost.id ? engagementData.metrics.comments : getMockMetrics(editingPost, selectedPlatforms).comments).toLocaleString()}
                                  </p>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                                  <p className="text-[9px] text-orange-600 font-bold uppercase mb-1">Views</p>
                                  <p className="text-xl font-black text-orange-900">
                                    {(engagementData && engagementPostId === editingPost.id ? engagementData.metrics.views : getMockMetrics(editingPost, selectedPlatforms).views).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="pt-3 border-t border-gray-200 space-y-2">
                                {engagementData && engagementPostId === editingPost.id ? (
                                  <>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                      <span className="text-xs text-gray-600 font-medium">Engagement Rate</span>
                                      <span className="text-sm font-black text-blue-600">
                                        {engagementData.metrics.views > 0
                                          ? ((engagementData.metrics.likes + engagementData.metrics.comments + engagementData.metrics.shares) / engagementData.metrics.views * 100).toFixed(1)
                                          : '0'}%
                                      </span>
                                    </div>
                                    {engagementData.recentActivity.length > 0 && (
                                      <div className="pt-3 border-t border-gray-200">
                                        <p className="text-xs font-bold text-gray-600 uppercase mb-2">Recent activity</p>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                          {engagementData.recentActivity.slice(0, 5).map((a, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                                              <span className="font-medium text-gray-900">{a.user}</span>
                                              <span className="text-gray-600">{a.type === 'comment' ? 'commented' : 'liked'}</span>
                                              {a.text && <span className="text-gray-500 truncate flex-1">"{a.text.slice(0, 40)}…"</span>}
                                              <span className="text-gray-400">{a.time}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-gray-600 font-medium">Reach</span>
                                      <span className="text-sm font-black text-gray-900">{getMockMetrics(editingPost, selectedPlatforms).reach.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-gray-600 font-medium">Impressions</span>
                                      <span className="text-sm font-black text-gray-900">{getMockMetrics(editingPost, selectedPlatforms).impressions.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                      <span className="text-xs text-gray-600 font-medium">Engagement Rate</span>
                                      <span className="text-sm font-black text-blue-600">
                                        {(() => {
                                          const metrics = getMockMetrics(editingPost, selectedPlatforms);
                                          return ((metrics.likes + metrics.comments + metrics.shares) / metrics.reach * 100).toFixed(1);
                                        })()}%
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        /* No template variables shown when creating new post */
                        null
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={handleSaveTemplate}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-[#344054] hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <Save size={14} /> Save as Template
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setActiveTab('all');
                      setEditingPost(null);
                      // Reset form
                      setPostContent('');
                      setUploadedImages([]);
                      setUploadedVideos([]);
                      setSelectedPlatforms([]);
                      setScheduleMode('now');
                      setLinkUrl('');
                      setLocation('');
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-xs font-bold text-[#344054] hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePostSubmit}
                    className="px-10 py-2.5 bg-[#f0642f] text-white rounded-lg text-xs font-bold hover:bg-[#d05325] shadow-lg shadow-orange-100 transition-all"
                  >
                    {editingPost
                      ? (scheduleMode === 'now' ? 'Update & Post Now' : 'Update & Schedule')
                      : (scheduleMode === 'now' ? (isRecur ? 'Start Recurring Posts' : 'Post Now') : (isRecur ? 'Schedule Recurring' : 'Schedule Post'))
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'drafts':
      case 'scheduled':
      case 'published':
      case 'all':
        return (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">
                {activeTab === 'all' ? 'All' : activeTab} Content
              </h3>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm">Bulk Action</button>
                <button onClick={() => setActiveTab('create')} className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg shadow-md shadow-blue-100">+ New</button>
              </div>
            </div>
            <FiltersBar showStatus={activeTab === 'all'} />
            <div className="p-3 bg-gray-50/40">
              {isLoadingPosts ? (
                <div className="p-10 text-center text-gray-400 bg-white rounded-xl border border-gray-200">Loading posts...</div>
              ) : filteredPosts.length === 0 ? (
                <div className="p-10 text-center text-gray-400 bg-white rounded-xl border border-gray-200">No posts found.</div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50/70">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                          <th className="px-4 py-3 text-left whitespace-nowrap font-black uppercase tracking-widest text-gray-500">
                            <div className="flex items-center gap-2">
                              <Globe size={14} className="text-gray-400" />
                              <span>Platform</span>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left whitespace-nowrap">Title</th>
                          <th className="px-4 py-3 text-left whitespace-nowrap">Campaign</th>
                          <th className="px-4 py-3 text-left whitespace-nowrap">Date</th>
                          <th className="px-4 py-3 text-left whitespace-nowrap">Status</th>
                          <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedPosts.map((post) => (
                          <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                            {/* Social Media */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => setViewingPost(post)}
                                  className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 border border-gray-200 overflow-hidden shrink-0 hover:border-blue-300 hover:ring-2 hover:ring-blue-100 transition-all cursor-pointer"
                                  title="View post details"
                                >
                                  {post.media_urls && post.media_urls.length > 0 ? (
                                    post.media_urls[0].match(/\.(mp4|webm|ogg|mov|m4v)$/i) || post.media_urls[0].includes('youtube.com') || post.media_urls[0].includes('youtu.be') ? (
                                      <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600">
                                        <Video size={18} />
                                      </div>
                                    ) : (
                                      <img src={post.media_urls[0]} alt="Post media" className="w-full h-full object-cover" />
                                    )
                                  ) : (
                                    <FileText size={16} />
                                  )}
                                </button>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                    {(post.platforms || []).slice(0, 3).map((platformId: string, idx: number) => {
                                      const pData = platforms.find(p => p.id === platformId.toLowerCase());
                                      return (
                                        <button
                                          key={`${post.id}-platform-icon-${platformId}-${idx}`}
                                          onClick={(e) => { e.stopPropagation(); setViewingMetrics({ post, platform: platformId }); }}
                                          className="p-1.5 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center transition-transform hover:scale-110 cursor-pointer active:scale-95"
                                          title={`View ${pData?.label || platformId} metrics`}
                                        >
                                          {pData ? React.cloneElement(pData.icon as React.ReactElement, { size: 14 }) : <Share2 size={14} />}
                                        </button>
                                      );
                                    })}
                                    {(post.platforms || []).length > 3 && (
                                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 border border-gray-100">
                                        +{(post.platforms || []).length - 3}
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-400 font-semibold mt-1">
                                    Click a platform for metrics
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Title */}
                            <td className="px-4 py-3">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 line-clamp-1">
                                  {post.title || (post.content ? String(post.content).split('\n')[0] : '') || '(Untitled)'}
                                </p>
                                <p className="text-[11px] text-gray-500 font-medium line-clamp-1 mt-1">
                                  {post.content || '(No text content)'}
                                </p>
                              </div>
                            </td>

                            {/* Campaign */}
                            <td className="px-4 py-3">
                              {postCampaignMap[post.id] ? (
                                <span className="inline-flex items-center text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-700 px-2 py-1 rounded-lg border border-green-100">
                                  {postCampaignMap[post.id].name}
                                </span>
                              ) : (
                                <span className="text-[11px] text-gray-400 font-semibold">—</span>
                              )}
                            </td>

                            {/* Date */}
                            <td className="px-4 py-3">
                              <span className="text-[11px] text-gray-600 font-semibold whitespace-nowrap">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${post.status === 'published'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : post.status === 'scheduled'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                                  }`}
                              >
                                {post.status}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setViewingPost(post)}
                                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-2"
                                >
                                  <Eye size={14} /> View
                                </button>
                                <button
                                  onClick={() => handleEditPost(post)}
                                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-2"
                                >
                                  <Edit3 size={14} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-2"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <PaginationBar />
          </div>
        );

      case 'all_list':
        return (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">ALL CONTENT</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm">Bulk Action</button>
                <button onClick={() => setActiveTab('create')} className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg shadow-md shadow-blue-100">+ New</button>
              </div>
            </div>
            <FiltersBar showStatus={true} />
            <div className="p-3 bg-gray-50/40">
              {isLoadingPosts ? (
                <div className="p-10 text-center text-gray-400 bg-white rounded-xl border border-gray-200">Loading posts...</div>
              ) : filteredPosts.length === 0 ? (
                <div className="p-10 text-center text-gray-400 bg-white rounded-xl border border-gray-200">No posts found.</div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50/70">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                          <th className="px-4 py-3 text-left whitespace-nowrap font-black uppercase tracking-widest text-gray-500">
                            <div className="flex items-center gap-2">
                              <Globe size={14} className="text-gray-400" />
                              <span>Platform</span>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left whitespace-nowrap">Title</th>
                          <th className="px-4 py-3 text-left whitespace-nowrap">Campaign</th>
                          <th className="px-4 py-3 text-left whitespace-nowrap">Date</th>
                          <th className="px-4 py-3 text-left whitespace-nowrap">Status</th>
                          <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedPosts.map((post) => (
                          <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                            {/* Social Media */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => setViewingPost(post)}
                                  className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 border border-gray-200 overflow-hidden shrink-0 hover:border-blue-300 hover:ring-2 hover:ring-blue-100 transition-all cursor-pointer"
                                  title="View post details"
                                >
                                  {post.media_urls && post.media_urls.length > 0 ? (
                                    post.media_urls[0].match(/\.(mp4|webm|ogg|mov|m4v)$/i) || post.media_urls[0].includes('youtube.com') || post.media_urls[0].includes('youtu.be') ? (
                                      <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600">
                                        <Video size={18} />
                                      </div>
                                    ) : (
                                      <img src={post.media_urls[0]} alt="Post media" className="w-full h-full object-cover" />
                                    )
                                  ) : (
                                    <FileText size={16} />
                                  )}
                                </button>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                    {(post.platforms || []).slice(0, 3).map((platformId: string, idx: number) => {
                                      const pData = platforms.find(p => p.id === platformId.toLowerCase());
                                      return (
                                        <button
                                          key={`${post.id}-platform-icon-${platformId}-${idx}`}
                                          onClick={() => setViewingMetrics({ post, platform: platformId })}
                                          className="p-1.5 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center transition-transform hover:scale-110"
                                          title={`View ${pData?.label || platformId} metrics`}
                                        >
                                          {pData ? React.cloneElement(pData.icon as React.ReactElement, { size: 14 }) : <Share2 size={14} />}
                                        </button>
                                      );
                                    })}
                                    {(post.platforms || []).length > 3 && (
                                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 border border-gray-100">
                                        +{(post.platforms || []).length - 3}
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-400 font-semibold mt-1">
                                    Click a platform for metrics
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Title */}
                            <td className="px-4 py-3">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 line-clamp-1">
                                  {post.title || (post.content ? String(post.content).split('\n')[0] : '') || '(Untitled)'}
                                </p>
                                <p className="text-[11px] text-gray-500 font-medium line-clamp-1 mt-1">
                                  {post.content || '(No text content)'}
                                </p>
                              </div>
                            </td>

                            {/* Campaign */}
                            <td className="px-4 py-3">
                              {postCampaignMap[post.id] ? (
                                <span className="inline-flex items-center text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-700 px-2 py-1 rounded-lg border border-green-100">
                                  {postCampaignMap[post.id].name}
                                </span>
                              ) : (
                                <span className="text-[11px] text-gray-400 font-semibold">—</span>
                              )}
                            </td>

                            {/* Date */}
                            <td className="px-4 py-3">
                              <span className="text-[11px] text-gray-600 font-semibold whitespace-nowrap">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${post.status === 'published'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : post.status === 'scheduled'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                                  }`}
                              >
                                {post.status}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setViewingPost(post)}
                                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-2"
                                >
                                  <Eye size={14} /> View
                                </button>
                                <button
                                  onClick={() => handleEditPost(post)}
                                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-2"
                                >
                                  <Edit3 size={14} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-2"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <PaginationBar className="bg-white" />
          </div>
        );

      case 'hashtags':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Productivity Pack</h4>
                <button className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg"><Copy size={16} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {['#solopreneur', '#productivity', '#techstack', '#workflow', '#automation', '#soloops'].map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100">{tag}</span>
                ))}
              </div>
            </div>
            <button className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50 transition-all group">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                <Plus size={20} />
              </div>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-600">Add Collection</span>
            </button>
          </div>
        );


      case 'ai':
        return <AIStudio />;

      default:
        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto">
              {tabs.find(t => t.id === activeTab)?.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-800">{tabs.find(t => t.id === activeTab)?.label}</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed font-medium">
                This feature is currently being optimized for your workflow. We'll have it ready in the next update!
              </p>
            </div>
            <button onClick={() => setActiveTab('create')} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all text-sm shadow-xl shadow-blue-100">
              Back to Editor
            </button>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Navigation Sticky Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 sticky top-16 bg-gray-50/90 backdrop-blur-sm z-20 overflow-x-auto no-scrollbar -mx-8 px-8">
        <div className="flex whitespace-nowrap scroll-smooth">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all border-b-2 -mb-[2px] ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50/10'
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                }`}
            >
              <span className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-300'}>{tab.icon}</span>
              <span className="uppercase tracking-widest text-[11px] font-black">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div className="pb-4 hidden lg:block pr-8">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2 text-gray-400" />
            <input type="text" placeholder="Quick find..." className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm" />
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        {renderTabContent()}
      </div>

      {/* Post Metrics Modal */}
      {viewingMetrics && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setViewingMetrics(null);
          }
        }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  {viewingMetrics.platform === 'facebook' && <Facebook className="text-[#1877F2]" size={24} />}
                  {viewingMetrics.platform === 'instagram' && <Instagram className="text-[#E4405F]" size={24} />}
                  {viewingMetrics.platform === 'twitter' && <Twitter className="text-[#1DA1F2]" size={24} />}
                  {viewingMetrics.platform === 'linkedin' && <Linkedin className="text-[#0A66C2]" size={24} />}
                  {viewingMetrics.platform === 'youtube' && <Youtube className="text-[#FF0000]" size={24} />}
                  {viewingMetrics.platform === 'whatsapp' && <MessageCircle className="text-[#25D366]" size={24} />}
                  <span className="capitalize">{viewingMetrics.platform} Post Metrics</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Engagement analytics for this post on {viewingMetrics.platform}
                </p>
              </div>
              <button onClick={() => setViewingMetrics(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Post Preview */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Post Content</p>
                <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                  {viewingMetrics.post.content || '(No text content)'}
                </p>
              </div>

              {/* Engagement Actions */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => recordEngagement('post_like')}
                    disabled={engagementActionLoading || userHasLiked}
                    className={
                      `px-3 py-2 rounded-lg border text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-2 disabled:opacity-60 ` +
                      (userHasLiked
                        ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                        : 'border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 transition-all')
                    }
                  >
                    <CheckCircle2 size={14} /> {userHasLiked ? 'Liked' : 'Like'}
                  </button>
                  <button
                    onClick={() => recordEngagement('post_share')}
                    disabled={engagementActionLoading}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 transition-all text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-2 disabled:opacity-60"
                  >
                    <Share2 size={14} /> Share
                  </button>
                </div>

                <div className="flex-1 flex items-center gap-2">
                  <input
                    value={engagementCommentText}
                    onChange={(e) => setEngagementCommentText(e.target.value)}
                    placeholder="Write a comment…"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30"
                  />
                  <button
                    onClick={() => recordEngagement('post_comment', engagementCommentText)}
                    disabled={engagementActionLoading || !engagementCommentText.trim()}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 transition-all text-[11px] font-black uppercase tracking-widest disabled:opacity-60"
                  >
                    Comment
                  </button>
                </div>
              </div>

              {/* Key Metrics Grid - real data when available (e.g. YouTube) */}
              {engagementLoading && engagementPostId === viewingMetrics.post?.id ? (
                <div className="py-8 text-center text-gray-500">Loading engagement…</div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <button
                    onClick={() => setSelectedMetricFilter(selectedMetricFilter === 'like' ? null : 'like')}
                    className={`text-left bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border transition-all ${selectedMetricFilter === 'like' ? 'border-blue-500 ring-2 ring-blue-500/20 scale-[1.02]' : 'border-blue-200 dark:border-blue-800 hover:border-blue-400'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <CheckCircle2 className="text-white" size={20} />
                      </div>
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Likes</p>
                    </div>
                    <p className="text-3xl font-black text-blue-900 dark:text-blue-100">
                      {(engagementData && engagementPostId === viewingMetrics.post?.id ? engagementData.metrics.likes : 0).toLocaleString()}
                    </p>
                  </button>

                  <button
                    onClick={() => setSelectedMetricFilter(selectedMetricFilter === 'share' ? null : 'share')}
                    className={`text-left bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border transition-all ${selectedMetricFilter === 'share' ? 'border-green-500 ring-2 ring-green-500/20 scale-[1.02]' : 'border-green-200 dark:border-green-800 hover:border-green-400'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <Share2 className="text-white" size={20} />
                      </div>
                      <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase">Shares</p>
                    </div>
                    <p className="text-3xl font-black text-green-900 dark:text-green-100">
                      {(engagementData && engagementPostId === viewingMetrics.post?.id ? engagementData.metrics.shares : 0).toLocaleString()}
                    </p>
                  </button>

                  <button
                    onClick={() => setSelectedMetricFilter(selectedMetricFilter === 'comment' ? null : 'comment')}
                    className={`text-left bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border transition-all ${selectedMetricFilter === 'comment' ? 'border-purple-500 ring-2 ring-purple-500/20 scale-[1.02]' : 'border-purple-200 dark:border-purple-800 hover:border-purple-400'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <MessageCircle className="text-white" size={20} />
                      </div>
                      <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Comments</p>
                    </div>
                    <p className="text-3xl font-black text-purple-900 dark:text-purple-100">
                      {(engagementData && engagementPostId === viewingMetrics.post?.id ? engagementData.metrics.comments : 0).toLocaleString()}
                    </p>
                  </button>

                  <button
                    onClick={() => setSelectedMetricFilter(selectedMetricFilter === 'view' ? null : 'view')}
                    className={`text-left bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-xl border transition-all ${selectedMetricFilter === 'view' ? 'border-orange-500 ring-2 ring-orange-500/20 scale-[1.02]' : 'border-orange-200 dark:border-orange-800 hover:border-orange-400'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-500 rounded-lg">
                        <Eye className="text-white" size={20} />
                      </div>
                      <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">Views</p>
                    </div>
                    <p className="text-3xl font-black text-orange-900 dark:text-orange-100">
                      {(engagementData && engagementPostId === viewingMetrics.post?.id ? engagementData.metrics.views : 0).toLocaleString()}
                    </p>
                  </button>

                  {viewingMetrics.platform === 'youtube' && (
                    <button
                      onClick={() => setSelectedMetricFilter(selectedMetricFilter === 'subscriber' ? null : 'subscriber')}
                      className={`text-left bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-xl border transition-all ${selectedMetricFilter === 'subscriber' ? 'border-red-500 ring-2 ring-red-500/20 scale-[1.02]' : 'border-red-200 dark:border-red-800 hover:border-red-400'}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500 rounded-lg">
                          <AtSign className="text-white" size={20} />
                        </div>
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">Subscribers</p>
                      </div>
                      <p className="text-3xl font-black text-red-900 dark:text-red-100">
                        {((engagementData as any)?.metrics?.subscribers || 0).toLocaleString()}
                      </p>
                    </button>
                  )}
                </div>
              )}

              {/* Engagement Timeline - real activity from API when available (e.g. YouTube comments/likes) */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {selectedMetricFilter ? `${selectedMetricFilter.toUpperCase()} Details` : 'Recent Engagement Activity'}
                  </h3>
                  {selectedMetricFilter && (
                    <button
                      onClick={() => setSelectedMetricFilter(null)}
                      className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700"
                    >
                      Show All
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {engagementData && engagementPostId === viewingMetrics.post?.id &&
                    engagementData.recentActivity.filter(a => !selectedMetricFilter || a.type === selectedMetricFilter).length > 0 ? (
                    engagementData.recentActivity
                      .filter(a => !selectedMetricFilter || a.type === selectedMetricFilter)
                      .slice(0, 50) // Show more when filtering
                      .map((activity, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                          <div className="relative shrink-0">
                            {activity.avatar ? (
                              <img src={activity.avatar} className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-600" alt={activity.user} />
                            ) : (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'comment' ? 'bg-purple-100 text-purple-600' :
                                activity.type === 'like' ? 'bg-blue-100 text-blue-600' :
                                  activity.type === 'share' ? 'bg-green-100 text-green-600' :
                                    activity.type === 'subscriber' ? 'bg-red-100 text-red-600' :
                                      'bg-orange-100 text-orange-600'
                                }`}>
                                {activity.type === 'comment' ? <MessageCircle size={16} /> :
                                  activity.type === 'like' ? <CheckCircle2 size={16} /> :
                                    activity.type === 'share' ? <Share2 size={16} /> :
                                      activity.type === 'subscriber' ? <Plus size={16} /> :
                                        <Eye size={16} />}
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm">
                              {activity.platform === 'youtube' ? (
                                <Youtube size={10} className="text-[#FF0000]" />
                              ) : (
                                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full flex items-center justify-center text-[5px] text-white font-bold uppercase">E</div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {activity.userUrl ? (
                                <a
                                  href={activity.userUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-bold text-gray-900 dark:text-white truncate hover:text-blue-600 hover:underline transition-colors"
                                >
                                  {activity.user}
                                </a>
                              ) : (
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                  {activity.user}
                                </p>
                              )}
                            </div>
                            {activity.text && <p className="text-xs text-gray-600 dark:text-slate-300 mt-0.5 whitespace-pre-wrap">"{activity.text}"</p>}
                            <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-tight">
                              {activity.type === 'subscriber' ? 'New subscriber!' : activity.type} • {new Date((activity as any).occurred_at || 0).toLocaleString()} • {activity.time}
                            </p>
                          </div>
                        </div>
                      ))
                  ) : engagementLoading && engagementPostId === viewingMetrics.post?.id ? (
                    <p className="text-sm text-gray-500">Loading activity…</p>
                  ) : (
                    <div className="p-10 text-center rounded-lg bg-gray-50 dark:bg-slate-700 text-sm text-gray-400">
                      <Search size={24} className="mx-auto mb-2 opacity-20" />
                      <p>No {selectedMetricFilter || ''} activity found yet.</p>
                      {selectedMetricFilter && (
                        <button onClick={() => setSelectedMetricFilter(null)} className="mt-2 text-blue-600 font-bold text-xs uppercase">View All Activity</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setViewingVideoAnalytics({ post: viewingMetrics.post });
                    setViewingMetrics(null);
                  }}
                  className="px-4 py-2 bg-brand-50 text-brand-600 font-bold rounded-lg hover:bg-brand-100 transition-all inline-flex items-center gap-2 text-[11px] uppercase tracking-widest border border-brand-100"
                >
                  <BarChart3 size={16} /> EngageHub Analysis
                </button>
                {viewingMetrics.post.link_url && (
                  <a
                    href={viewingMetrics.post.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-all inline-flex items-center gap-2 text-[11px] uppercase tracking-widest border border-blue-100"
                  >
                    <ExternalLink size={16} /> View on {viewingMetrics.platform}
                  </a>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setViewingPost(viewingMetrics.post);
                    setViewingMetrics(null);
                  }}
                  className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-all text-sm"
                >
                  View Full Post
                </button>
                <button
                  onClick={() => setViewingMetrics(null)}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Post Modal */}
      {viewingPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setViewingPost(null);
          }
        }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Post Details</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">View complete post information</p>
              </div>
              <button onClick={() => setViewingPost(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status and Platforms */}
              <div className="flex items-center gap-4 flex-wrap">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${viewingPost.status === 'published' ? 'bg-green-100 text-green-700' :
                  viewingPost.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                  {viewingPost.status}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">Platforms:</span>
                  <div className="flex items-center gap-2">
                    {viewingPost.platforms?.map((platform: string, idx: number) => {
                      const icons: Record<string, React.ReactNode> = {
                        facebook: <Facebook className="text-[#1877F2]" size={20} />,
                        instagram: <Instagram className="text-[#E4405F]" size={20} />,
                        twitter: <Twitter className="text-[#1DA1F2]" size={20} />,
                        linkedin: <Linkedin className="text-[#0A66C2]" size={20} />,
                        whatsapp: <MessageCircle className="text-[#25D366]" size={20} />,
                      };
                      return (
                        <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg">
                          {icons[platform.toLowerCase()] || <Globe size={20} />}
                          <span className="text-xs font-bold text-gray-700 capitalize">{platform}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Content</h3>
                <p className="text-base text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                  {viewingPost.content || '(No text content)'}
                </p>
              </div>

              {/* Media */}
              {viewingPost.media_urls && viewingPost.media_urls.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Media</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {viewingPost.media_urls.map((url: string, idx: number) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200">
                        {url.match(/\.(mp4|webm|mov)$/i) ? (
                          <video src={url} className="w-full h-32 object-cover" controls />
                        ) : (
                          <img src={url} alt={`Media ${idx + 1}`} className="w-full h-32 object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Created</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {new Date(viewingPost.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(viewingPost.created_at).toLocaleTimeString()}
                  </p>
                </div>

                {viewingPost.published_at && (
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Published</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {new Date(viewingPost.published_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(viewingPost.published_at).toLocaleTimeString()}
                    </p>
                  </div>
                )}

                {viewingPost.scheduled_for && (
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Scheduled For</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {new Date(viewingPost.scheduled_for).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(viewingPost.scheduled_for).toLocaleTimeString()}
                    </p>
                  </div>
                )}

                {viewingPost.content_type && (
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Content Type</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                      {viewingPost.content_type}
                    </p>
                  </div>
                )}

                {viewingPost.link_url && (
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Link</p>
                    <a
                      href={viewingPost.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 break-all"
                    >
                      {viewingPost.link_url.length > 30 ? viewingPost.link_url.substring(0, 30) + '...' : viewingPost.link_url}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                {viewingPost.location && (
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Location</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                      <MapPin size={14} />
                      {viewingPost.location}
                    </p>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              {(viewingPost.is_recurring || viewingPost.hashtags?.length > 0 || viewingPost.mentions?.length > 0) && (
                <div className="space-y-3">
                  {viewingPost.is_recurring && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Recurring Post</p>
                      <p className="text-sm text-gray-700 dark:text-slate-300">
                        {viewingPost.recurrence_rule || 'Recurring post enabled'}
                      </p>
                    </div>
                  )}

                  {viewingPost.hashtags && viewingPost.hashtags.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-2">Hashtags</p>
                      <div className="flex flex-wrap gap-2">
                        {viewingPost.hashtags.map((tag: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingPost.mentions && viewingPost.mentions.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-2">Mentions</p>
                      <div className="flex flex-wrap gap-2">
                        {viewingPost.mentions.map((mention: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                            @{mention}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  handleEditPost(viewingPost);
                  setViewingPost(null);
                }}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all"
              >
                Edit Post
              </button>
              <button
                onClick={() => setViewingPost(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Video Analytics Modal */}
      {viewingVideoAnalytics && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[90vh] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Video analytics</h2>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-lg text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Advanced mode
                </div>
              </div>
              <div className="flex items-center gap-3 relative">
                <div
                  onClick={() => setShowVideoDateSelector(!showVideoDateSelector)}
                  className="px-4 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-300 flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {videoAnalyticsDateRange === 'Since published' ? 'Jan 30, 2026 – Now' : videoAnalyticsDateRange}
                  <span className="text-xs text-gray-400">
                    {videoAnalyticsDateRange === 'Since published' ? 'Since published' : ''}
                  </span>
                  <ChevronDown size={16} />
                </div>

                {/* Dropdown Menu */}
                {showVideoDateSelector && (
                  <>
                    <div
                      className="fixed inset-0 z-[130]"
                      onClick={() => setShowVideoDateSelector(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl z-[140] overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      {[
                        { label: 'Since published', badge: 'Updated 1 min ago' },
                        { label: 'First 24 hours' },
                        { label: 'Last 7 days' },
                        { label: 'Last 28 days' },
                        { label: 'Last 90 days' },
                        { label: 'Last 365 days' },
                        { label: 'Since uploaded (lifetime)' },
                        { type: 'divider' },
                        { label: '2026' },
                        { label: '2025' },
                        { type: 'divider' },
                        { label: 'February' },
                        { label: 'January' },
                        { label: 'December 2025' },
                        { type: 'divider' },
                        { label: 'Custom' },
                      ].map((option, idx) => (
                        option.type === 'divider' ? (
                          <div key={idx} className="h-px bg-gray-100 dark:bg-slate-800 my-1 mx-2" />
                        ) : (
                          <button
                            key={idx}
                            onClick={() => {
                              setVideoAnalyticsDateRange(option.label || '');
                              setShowVideoDateSelector(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex flex-col gap-0.5 ${videoAnalyticsDateRange === option.label
                              ? 'bg-gray-50 dark:bg-slate-800 font-bold text-gray-900 dark:text-white'
                              : 'text-gray-600 dark:text-slate-300'
                              }`}
                          >
                            <span>{option.label}</span>
                            {option.badge && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-gray-500 font-medium inline-block w-fit">
                                {option.badge}
                              </span>
                            )}
                          </button>
                        )
                      ))}
                    </div>
                  </>
                )}

                <button
                  onClick={() => setViewingVideoAnalytics(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 border-b border-gray-100 dark:border-slate-800 flex gap-8">
              {(['overview', 'reach', 'engagement', 'audience'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setVideoAnalyticsTab(tab)}
                  className={`py-4 text-sm font-bold uppercase tracking-widest transition-all relative ${videoAnalyticsTab === tab
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-200'
                    }`}
                >
                  {tab}
                  {videoAnalyticsTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-900 dark:bg-white rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-slate-950/50 p-8">
              <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">

                {/* Main Dashboard Section */}
                <div className="flex-1 space-y-8">
                  <div className="space-y-6">
                    {videoAnalyticsTab === 'overview' && (
                      <div className="space-y-6">
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                          This video has had {engagementData?.metrics?.views || 0} views since it was published
                        </h3>

                        {/* Metric Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                          <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800 cursor-pointer bg-gray-50/50 dark:bg-slate-800/50">
                            <p className="text-sm font-medium text-gray-500 mb-2">Views</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{engagementData?.metrics?.views || 0}</p>
                          </div>
                          <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800 cursor-pointer hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors">
                            <p className="text-sm font-medium text-gray-500 mb-2">Watch time (hours)</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{((engagementData?.metrics?.views || 0) * 0.01).toFixed(1)}</p>
                          </div>
                          <div className="p-6 cursor-pointer hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors">
                            <p className="text-sm font-medium text-gray-500 mb-2">Subscribers</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">+{engagementData?.metrics?.subscribers || 0}</p>
                          </div>
                        </div>

                        {/* Performance Chart */}
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
                          <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={[
                                { day: 0, views: 0 },
                                { day: 1, views: 2 },
                                { day: 2, views: 2 },
                                { day: 3, views: 2 },
                                { day: 4, views: 5 },
                                { day: 5, views: 6 },
                                { day: 6, views: 18 },
                                { day: 7, views: engagementData?.metrics?.views || 20 },
                              ]}>
                                <defs>
                                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                  dataKey="day"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                                  dy={10}
                                />
                                <YAxis
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                  }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="views"
                                  stroke="#0ea5e9"
                                  strokeWidth={3}
                                  fillOpacity={1}
                                  fill="url(#colorViews)"
                                  dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                                  activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          <button className="mt-6 text-[11px] font-black uppercase tracking-widest text-[#065fd4] hover:text-[#0556bf] transition-colors py-2 px-4 rounded-lg bg-blue-50/50 hover:bg-blue-100/50">
                            See more
                          </button>
                        </div>

                        {/* Audience Retention Card */}
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
                          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Audience retention</h4>
                          <p className="text-sm text-gray-500 mb-8">Since uploaded (lifetime)</p>

                          <div className="aspect-video bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-center p-12">
                            <div className="max-w-xs space-y-2">
                              <Info className="mx-auto text-gray-300 mb-4" size={40} />
                              <p className="text-sm font-medium text-gray-400 leading-relaxed">
                                Not enough information to display audience retention data.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {videoAnalyticsTab === 'reach' && (
                      <div className="space-y-6">
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                          Reach metrics for your video
                        </h3>

                        {/* Reach Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                          <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800 cursor-pointer bg-gray-50/50 dark:bg-slate-800/50">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Impressions</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{engagementData?.metrics?.impressions || 0}</p>
                            <div className="flex items-center gap-1 mt-1 text-green-600">
                              <ArrowUp size={12} />
                              <span className="text-[10px] font-bold">12%</span>
                            </div>
                          </div>
                          <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800 cursor-pointer hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">CTR</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{engagementData?.metrics?.ctr || 0}%</p>
                            <div className="flex items-center gap-1 mt-1 text-red-600">
                              <ArrowDown size={12} />
                              <span className="text-[10px] font-bold">2.4%</span>
                            </div>
                          </div>
                          <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800 cursor-pointer hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Views</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{engagementData?.metrics?.views || 0}</p>
                          </div>
                          <div className="p-6 cursor-pointer hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Unique Viewers</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{engagementData?.metrics?.unique_viewers || 0}</p>
                          </div>
                        </div>

                        {/* Chart Placeholder for Reach */}
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
                          <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={[
                                { d: 0, i: 10, v: 2 },
                                { d: 1, i: 25, v: 5 },
                                { d: 2, i: 45, v: 8 },
                                { d: 3, i: 80, v: 15 },
                                { d: 4, i: engagementData?.metrics?.impressions || 120, v: engagementData?.metrics?.views || 20 },
                              ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="d" hide />
                                <Tooltip />
                                <Area type="monotone" dataKey="i" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.1} />
                                <Area type="monotone" dataKey="v" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Traffic Sources & Funnel Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Traffic Sources Donut */}
                          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest">Traffic sources</h4>
                            <div className="flex items-center gap-4">
                              <div className="w-40 h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={engagementData?.metrics?.traffic_sources || []}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={45}
                                      outerRadius={65}
                                      paddingAngle={5}
                                      dataKey="value"
                                    >
                                      {(engagementData?.metrics?.traffic_sources || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 5]} />
                                      ))}
                                    </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="flex-1 space-y-3">
                                {(engagementData?.metrics?.traffic_sources || []).slice(0, 3).map((source, i) => (
                                  <div key={i} className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#0ea5e9', '#8b5cf6', '#ec4899'][i % 3] }} />
                                      <span className="text-gray-500">{source.label}</span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">{source.value}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Impressions Funnel */}
                          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest">Impressions funnel</h4>
                            <div className="space-y-4">
                              <div className="relative pt-4 pb-8 border-l-2 border-dashed border-gray-100 dark:border-slate-800 ml-4 pl-8">
                                <div className="space-y-6">
                                  <div className="relative">
                                    <div className="absolute -left-10 top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-slate-900" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Impressions</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">{engagementData?.metrics?.impressions || 0}</p>
                                  </div>
                                  <div className="relative">
                                    <div className="absolute -left-10 top-1 w-4 h-4 rounded-full bg-purple-500 border-4 border-white dark:border-slate-900" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Views from impressions</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">{Math.floor((engagementData?.metrics?.views || 0) * 0.9)}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{engagementData?.metrics?.ctr}% click-through rate</p>
                                  </div>
                                  <div className="relative">
                                    <div className="absolute -left-10 top-1 w-4 h-4 rounded-full bg-pink-500 border-4 border-white dark:border-slate-900" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Watch time</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">{engagementData?.metrics?.watch_time || 0}h</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{engagementData?.metrics?.avg_view_duration} avg duration</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fallback for other tabs */}
                    {videoAnalyticsTab === 'engagement' && (
                      <div className="space-y-6">
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                          Engagement metrics for your video
                        </h3>

                        {/* Engagement Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                          <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800 cursor-pointer bg-gray-50/50 dark:bg-slate-800/50">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Watch time (hours)</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{engagementData?.metrics?.watch_time || 0}</p>
                          </div>
                          <div className="p-6 cursor-pointer hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Average view duration</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{engagementData?.metrics?.avg_view_duration || '0:00'}</p>
                          </div>
                        </div>

                        {/* Watch Time Chart */}
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={[
                                { d: 0, w: 0 },
                                { d: 1, w: 0.1 },
                                { d: 2, w: 0.1 },
                                { d: 3, w: 0.1 },
                                { d: 4, w: 0.12 },
                                { d: 5, w: 0.12 },
                                { d: 6, w: 0.22 },
                                { d: 7, w: engagementData?.metrics?.watch_time || 0.3 },
                              ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="d" hide />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip />
                                <Area
                                  type="stepAfter"
                                  dataKey="w"
                                  stroke="#ec4899"
                                  strokeWidth={3}
                                  fillOpacity={0.1}
                                  fill="#ec4899"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          <button className="mt-4 text-[11px] font-black uppercase tracking-widest text-[#065fd4] hover:text-[#0556bf] transition-colors py-2 px-4 rounded-lg bg-blue-50/50 hover:bg-blue-100/50">
                            See more
                          </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Audience Retention (Reused) */}
                          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Audience retention</h4>
                            <p className="text-sm text-gray-500 mb-8">Since uploaded (lifetime)</p>
                            <div className="aspect-video bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-center p-6">
                              <div className="max-w-xs space-y-2">
                                <Info className="mx-auto text-gray-300 mb-4" size={32} />
                                <p className="text-[11px] font-medium text-gray-400 leading-relaxed">
                                  Not enough information to display audience retention data.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Likes vs Dislikes */}
                          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Likes (vs dislikes)</h4>
                            <p className="text-sm text-gray-500 mb-8">Since published</p>

                            <div className="space-y-6">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-medium text-gray-600 dark:text-slate-400">This video</span>
                                  <span className="font-bold text-gray-900 dark:text-white">{engagementData?.metrics?.likes_ratio || 0}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-pink-500" style={{ width: `${engagementData?.metrics?.likes_ratio || 0}%` }} />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-medium text-gray-600 dark:text-slate-400">Channel average</span>
                                  <span className="font-bold text-gray-900 dark:text-white">{engagementData?.metrics?.channel_likes_ratio || 0}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-gray-300 dark:bg-slate-600" style={{ width: `${engagementData?.metrics?.channel_likes_ratio || 0}%` }} />
                                </div>
                              </div>

                              <button className="mt-4 text-[11px] font-black uppercase tracking-widest text-[#065fd4] hover:text-[#0556bf] transition-colors py-2 px-4 rounded-lg bg-blue-50/50 hover:bg-blue-100/50">
                                See more
                              </button>
                            </div>
                          </div>

                          {/* End Screen Click Rate */}
                          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">End screen element click rate</h4>
                            <p className="text-sm text-gray-500 mb-8">Since uploaded (lifetime)</p>
                            <div className="flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                              <span className="text-sm font-medium text-gray-600 dark:text-slate-300">This video</span>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-pink-500" />
                                <span className="text-lg font-black text-gray-900 dark:text-white">{engagementData?.metrics?.end_screen_clicks || 0}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {videoAnalyticsTab === 'audience' && (
                      <div className="space-y-6">
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                          Audience insights for your video
                        </h3>

                        {/* Audience Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                          <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800 cursor-pointer bg-gray-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Unique viewers</p>
                              <Info size={12} className="text-gray-400" />
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{engagementData?.metrics?.unique_viewers || 0}</p>
                          </div>
                          <div className="p-6 cursor-pointer hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Subscribers</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">+{engagementData?.metrics?.subscribers || 0}</p>
                          </div>
                        </div>

                        {/* Unique Viewers Chart */}
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={[
                                { d: '29 Jan 2026', v: 0 },
                                { d: '30 Jan 2026', v: 2 },
                                { d: '31 Jan 2026', v: 0 },
                                { d: '1 Feb 2026', v: 0 },
                                { d: '2 Feb 2026', v: 0 },
                                { d: '3 Feb 2026', v: 1 },
                                { d: '4 Feb 2026', v: 2 },
                                { d: '5 Feb 2026', v: engagementData?.metrics?.unique_viewers || 3 },
                              ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip />
                                <Area
                                  type="monotone"
                                  dataKey="v"
                                  stroke="#8b5cf6"
                                  strokeWidth={3}
                                  fillOpacity={0.1}
                                  fill="#8b5cf6"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          <button className="mt-4 text-[11px] font-black uppercase tracking-widest text-[#065fd4] hover:text-[#0556bf] transition-colors py-2 px-4 rounded-lg bg-blue-50/50 hover:bg-blue-100/50">
                            See more
                          </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Audience Behavior */}
                          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Audience by watch behaviour</h4>
                            <p className="text-sm text-gray-500 mb-8">Unique viewers · Since uploaded (lifetime)</p>
                            <div className="aspect-video bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-center p-6">
                              <div className="max-w-xs space-y-2">
                                <Info className="mx-auto text-gray-300 mb-4" size={32} />
                                <p className="text-[11px] font-medium text-gray-400 leading-relaxed">
                                  Not enough viewer data to show this report
                                </p>
                              </div>
                            </div>
                            <button className="mt-6 text-[11px] font-black uppercase tracking-widest text-[#065fd4] hover:text-[#0556bf] transition-colors py-2 px-4 rounded-lg bg-blue-50/50 hover:bg-blue-100/50">
                              See more
                            </button>
                          </div>

                          {/* Viewers also watch */}
                          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Viewers also watch</h4>
                            <p className="text-sm text-gray-500 mb-8">Last 90 days</p>
                            <div className="aspect-video bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-center p-6">
                              <div className="max-w-xs space-y-2">
                                <Info className="mx-auto text-gray-300 mb-4" size={32} />
                                <p className="text-[11px] font-medium text-gray-400 leading-relaxed">
                                  Not enough eligible audience data to show this report. <span className="text-blue-500 cursor-pointer">Learn more</span>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Device Type */}
                          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Device type</h4>
                            <p className="text-sm text-gray-500 mb-8">Watch time (hours) · Since uploaded (lifetime)</p>

                            <div className="space-y-4">
                              {(engagementData?.metrics?.device_types || []).map((device, i) => (
                                <div key={i} className="space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-purple-900 dark:bg-purple-500" />
                                      <span className="font-medium text-gray-600 dark:text-slate-400">{device.label}</span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">{device.value.toFixed(1)}%</span>
                                  </div>
                                  <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-900 dark:bg-purple-500" style={{ width: `${device.value}%` }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Watch time from subscribers */}
                          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Watch time from subscribers</h4>
                            <p className="text-sm text-gray-500 mb-8">Watch time · Since uploaded (lifetime)</p>
                            <div className="aspect-video bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-center p-6">
                              <div className="max-w-xs space-y-2">
                                <Info className="mx-auto text-gray-300 mb-4" size={32} />
                                <p className="text-[11px] font-medium text-gray-400 leading-relaxed">
                                  Nothing to show for these dates
                                </p>
                              </div>
                            </div>
                            <button className="mt-6 text-[11px] font-black uppercase tracking-widest text-[#065fd4] hover:text-[#0556bf] transition-colors py-2 px-4 rounded-lg bg-blue-50/50 hover:bg-blue-100/50">
                              See more
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar - Realtime */}
                <div className="w-full lg:w-80 space-y-6">
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm sticky top-0">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">Realtime</h4>
                      <div className="flex items-center gap-1.5 grayscale opacity-70">
                        <ArrowUpRight size={14} />
                        <span className="text-xs font-bold uppercase tracking-tighter">Live</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-6 text-[#0ea5e9]">
                      <div className="w-2 h-2 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]" />
                      <span className="text-xs font-bold uppercase tracking-wider">Updating live</span>
                    </div>

                    <div className="space-y-1 mb-6">
                      <p className="text-4xl font-black text-gray-900 dark:text-white">
                        {Math.floor((engagementData?.metrics?.views || 20) * 0.75)}
                      </p>
                      <p className="text-xs font-medium text-gray-400">Views · Last 48 hours</p>
                    </div>

                    {/* Small Realtime Chart Mockup */}
                    <div className="h-12 flex items-end gap-0.5 mb-8">
                      {[...Array(48)].map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-t-sm transition-all hover:bg-[#0ea5e9]"
                          style={{ height: `${Math.max(5, Math.random() * (i === 47 ? 100 : 40))}%` }}
                        />
                      ))}
                    </div>

                    {/* Traffic Sources */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-gray-50 dark:border-slate-800 pb-2">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Top traffic sources</p>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Views</p>
                      </div>

                      {[
                        { label: 'Other YouTube features', value: 40.0 },
                        { label: 'Direct or unknown', value: 20.0 },
                        { label: 'Suggested videos', value: 20.0 },
                        { label: 'Channel pages', value: 13.3 },
                        { label: 'Browse features', value: 6.7 },
                      ].map((source, i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-gray-600 dark:text-slate-300">{source.label}</span>
                            <span className="font-bold text-gray-900 dark:text-white">{source.value.toFixed(1)}%</span>
                          </div>
                          <div className="h-[3px] bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-400" style={{ width: `${source.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <button className="w-full mt-8 text-[11px] font-black uppercase tracking-widest text-[#065fd4] hover:text-[#0556bf] transition-colors py-2 px-4 rounded-lg bg-blue-50/50 hover:bg-blue-100/50 text-center">
                      See more
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Content;