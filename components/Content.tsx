
import React, { useState, useRef, useMemo } from 'react';
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
  Share2
} from 'lucide-react';
import { initFacebookSDK, loginWithFacebook, getPageTokens } from '../src/lib/facebook';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/lib/supabase';
import { trackEventSafe } from '../src/lib/analytics';
import AIStudio from './AIStudio';
import ContentCalendar from './ContentCalendar';
import ContentTemplates from './ContentTemplates';

// Added 'all_list' to the allowed tabs to fix the assignment error on line 66
type ContentTab = 'all' | 'all_list' | 'create' | 'drafts' | 'scheduled' | 'published' | 'calendar' | 'templates' | 'hashtags' | 'ai';

const Content: React.FC = () => {
  const { user } = useAuth(); // Get authenticated user
  const [activeTab, setActiveTab] = useState<ContentTab>('create');

  const [posts, setPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [postCampaignMap, setPostCampaignMap] = useState<Record<string, { id: string; name: string }>>({});
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Basic analytics tracking for content page usage
  React.useEffect(() => {
    if (!user) return;
    trackEventSafe({ event_type: 'post_view', entity_type: 'page', entity_id: null, metadata: { page: 'content', tab: activeTab } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  // Fetch posts and initialize social accounts
  React.useEffect(() => {
    if (['all', 'all_list', 'drafts', 'scheduled', 'published'].includes(activeTab)) {
      fetchPosts();
    }
  }, [activeTab, user]);

  React.useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  React.useEffect(() => {
    if (user) {
      initFacebookSDK().then(() => {
        fetchSocialAccounts();
      });
    }
  }, [user]);

  const fetchSocialAccounts = async () => {
    if (!user) return;
    try {
      // Temporarily skip fetching from database - set all as connected for testing
      // Get workspace
      // const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);
      // if (!workspaces?.length) return;

      // const { data } = await supabase
      //   .from('social_accounts')
      //   .select('platform')
      //   .eq('workspace_id', workspaces[0].id)
      //   .eq('is_active', true);

      // Temporarily set all platforms as connected
      const linked: Record<string, boolean> = {
        facebook: true, 
        instagram: true, 
        twitter: true, 
        linkedin: true, 
        whatsapp: true
      };
      // data?.forEach(acc => {
      //   linked[acc.platform] = true;
      // });
      setSocialAccounts(linked);
    } catch (err) {
      console.error('Error fetching social accounts:', err);
      // On error, still set all as connected for testing
      setSocialAccounts({
        facebook: true, 
        instagram: true, 
        twitter: true, 
        linkedin: true, 
        whatsapp: true
      });
    }
  };

  const fetchCampaigns = async () => {
    if (!user) return;
    try {
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);
      if (!workspaces?.length) return;
      const workspaceId = workspaces[0].id;

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

  const fetchPosts = async () => {
    if (!user) return;
    setIsLoadingPosts(true);
    try {
      // Get workspace first
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);
      if (!workspaces?.length) return;

      let query = supabase
        .from('posts')
        .select('*')
        .eq('workspace_id', workspaces[0].id)
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

      const { data, error } = await query;
      if (error) throw error;
      const postsData = data || [];
      setPosts(postsData);

      // Fetch campaign links for these posts
      if (postsData.length > 0) {
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
    } finally {
      setIsLoadingPosts(false);
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
    { id: 'whatsapp', icon: <MessageCircle className="text-[#25D366]" />, label: 'WhatsApp' },
  ];

  // Temporarily set all platforms as connected for testing
  const [socialAccounts, setSocialAccounts] = useState<Record<string, boolean>>({
    facebook: true,
    instagram: true,
    twitter: true,
    linkedin: true,
    whatsapp: true
  });

  const togglePlatform = (id: string) => {
    // Temporarily allow selection even if not connected (for testing)
    // if (!socialAccounts[id]) {
    //   alert(`Please connect your ${id} account in the Social Media tab first.`);
    //   return;
    // }
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Handler functions for icon actions
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedVideos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file as Blob);
      });
    }
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
      const response = await fetch(`https://graph.facebook.com/v21.0/${account.platform_account_id}/feed`, {
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
        media_urls: [...uploadedImages, ...uploadedVideos], // Note: in production, upload these to Supabase Storage first!
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

      // 4. Actual Social Publishing (if 'Post Now')
      // Temporarily skip actual publishing (for testing)
      // if (scheduleMode === 'now') {
      //   if (selectedPlatforms.includes('facebook')) {
      //     await publishToFacebook(postContent, [...uploadedImages, ...uploadedVideos]);
      //   }
      // }

      alert(`Post ${editingPost ? 'updated' : scheduleMode === 'now' ? 'published' : 'scheduled'} successfully! 🎉`);
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
      alert(`Failed to create post: ${error.message}`);
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'calendar':
        return <ContentCalendar onNavigateToCreate={() => setActiveTab('create')} />;

      case 'templates':
        return <ContentTemplates />;

      case 'create':
        return (
          <div className="bg-[#f8f9fb] rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 max-w-6xl mx-auto">
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
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
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
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {platforms.map(p => {
                      const isConnected = socialAccounts[p.id];
                      const isSelected = selectedPlatforms.includes(p.id);

                      return (
                        <div key={p.id} className="relative group">
                          <button
                            onClick={() => togglePlatform(p.id)}
                            disabled={false}
                            className={`w-20 h-20 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all overflow-hidden cursor-pointer ${isSelected
                                ? 'border-blue-500 bg-[#eff8ff]'
                                : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                              }`}
                          >
                            <div className={`transition-all ${isSelected ? 'scale-110' : ''}`}>
                              {React.cloneElement(p.icon as React.ReactElement<any>, { size: 32 })}
                            </div>
                          </button>
                          {isSelected && (
                            <div className="absolute bottom-2 left-2 w-4 h-4 bg-blue-600 rounded flex items-center justify-center shadow-sm">
                              <CheckCircle2 size={10} className="text-white" strokeWidth={4} />
                            </div>
                          )}
                            <div className="absolute bottom-2 right-2">
                              <CheckCircle2 size={12} className={isSelected ? 'text-blue-500' : 'text-green-500'} />
                            </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Accounts Selected: {selectedPlatforms.length} Accounts</span>
                    <button className="text-xs font-bold text-blue-600 hover:text-blue-700">+ Add Account</button>
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
                      /* Show Metrics when editing - COMBINED from all platforms */
                      <div className="space-y-4">
                        {/* Platform Count Badge - Use currently selected platforms */}
                        {selectedPlatforms.length > 1 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-blue-600 font-bold uppercase">
                              Combined Metrics from {selectedPlatforms.length} Platforms: {selectedPlatforms.join(', ').toUpperCase()}
                            </p>
                    </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                            <p className="text-[9px] text-blue-600 font-bold uppercase mb-1">Likes</p>
                            <p className="text-xl font-black text-blue-900">{getMockMetrics(editingPost, selectedPlatforms).likes.toLocaleString()}</p>
                  </div>
                          <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                            <p className="text-[9px] text-green-600 font-bold uppercase mb-1">Shares</p>
                            <p className="text-xl font-black text-green-900">{getMockMetrics(editingPost, selectedPlatforms).shares.toLocaleString()}</p>
                </div>
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                            <p className="text-[9px] text-purple-600 font-bold uppercase mb-1">Comments</p>
                            <p className="text-xl font-black text-purple-900">{getMockMetrics(editingPost, selectedPlatforms).comments.toLocaleString()}</p>
                          </div>
                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                            <p className="text-[9px] text-orange-600 font-bold uppercase mb-1">Views</p>
                            <p className="text-xl font-black text-orange-900">{getMockMetrics(editingPost, selectedPlatforms).views.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-gray-200 space-y-2">
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
                        </div>
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
        );

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
            <div className="divide-y divide-gray-50">
              {isLoadingPosts ? (
                <div className="p-10 text-center text-gray-400">Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className="p-10 text-center text-gray-400">No posts found.</div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="p-5 flex items-start gap-4 hover:bg-gray-50 transition-all group">
                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 shrink-0 border border-gray-100 overflow-hidden">
                      {post.media_urls && post.media_urls.length > 0 ? (
                        <img src={post.media_urls[0]} alt="Post media" className="w-full h-full object-cover" />
                      ) : (
                        <FileText size={24} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {post.platforms && post.platforms.map((platform: string, idx: number) => (
                          <React.Fragment key={idx}>
                            <button
                              onClick={() => setViewingMetrics({ post, platform })}
                              className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest cursor-pointer hover:underline transition-all"
                            >
                              {platform}
                            </button>
                            {idx < post.platforms.length - 1 && (
                              <span className="text-[10px] text-blue-600">+</span>
                            )}
                          </React.Fragment>
                        ))}
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                        {postCampaignMap[post.id] && (
                          <span className="text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-700 px-2 py-0.5 rounded">
                            {postCampaignMap[post.id].name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-relaxed">
                        {post.content || '(No text content)'}
                      </p>
                      <div className="flex gap-3 mt-3">
                        <button 
                          onClick={() => setViewingPost(post)}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-purple-600 transition-all uppercase tracking-wider cursor-pointer"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button 
                          onClick={() => handleEditPost(post)}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-all uppercase tracking-wider cursor-pointer"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-red-500 transition-all uppercase tracking-wider cursor-pointer"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${post.status === 'published' ? 'bg-green-50 text-green-600' :
                        post.status === 'scheduled' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {post.status}
                      </span>
                      <button className="p-2 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
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
            <div className="divide-y divide-gray-100">
              {isLoadingPosts ? (
                <div className="p-10 text-center text-gray-400">Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className="p-10 text-center text-gray-400">No posts found.</div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-all group">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 shrink-0 border border-gray-200 overflow-hidden">
                      {post.media_urls && post.media_urls.length > 0 ? (
                        <img src={post.media_urls[0]} alt="Post media" className="w-full h-full object-cover" />
                      ) : (
                        <FileText size={20} />
                      )}
                    </div>
                    
                    {/* Platforms */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1 flex-wrap">
                        {post.platforms && post.platforms.map((platform: string, idx: number) => (
                          <React.Fragment key={idx}>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                              {platform}
                            </span>
                            {idx < post.platforms.length - 1 && (
                              <span className="text-[10px] text-blue-600 font-black">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                      
                      {/* Date */}
                      <div className="text-[10px] text-gray-500 font-medium mb-1">
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                      
                      {/* Campaign Tag */}
                      {postCampaignMap[post.id] && (
                        <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-700 px-2 py-0.5 rounded mb-1">
                          {postCampaignMap[post.id].name}
                        </span>
                      )}
                      
                      {/* Title/Content */}
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1 mt-1">
                        {post.content || '(No text content)'}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button 
                        onClick={() => setViewingPost(post)}
                        className="flex items-center gap-1 text-[10px] font-bold text-gray-600 hover:text-purple-600 transition-all uppercase tracking-wider"
                      >
                        <Eye size={14} /> VIEW
                      </button>
                      <button 
                        onClick={() => handleEditPost(post)}
                        className="flex items-center gap-1 text-[10px] font-bold text-gray-600 hover:text-blue-600 transition-all uppercase tracking-wider"
                      >
                        <Edit3 size={14} /> EDIT
                      </button>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="flex items-center gap-1 text-[10px] font-bold text-gray-600 hover:text-red-500 transition-all uppercase tracking-wider"
                      >
                        <Trash2 size={14} /> DELETE
                      </button>
                      
                      {/* Status */}
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter ml-2 ${
                        post.status === 'published' ? 'text-green-600' :
                        post.status === 'scheduled' ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
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

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <CheckCircle2 className="text-white" size={20} />
                    </div>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Likes</p>
                  </div>
                  <p className="text-3xl font-black text-blue-900 dark:text-blue-100">
                    {getMockMetrics(viewingMetrics.post).likes}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                    +{getMockMetrics(viewingMetrics.post).likesGrowth}% from last week
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Share2 className="text-white" size={20} />
                    </div>
                    <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase">Shares</p>
                  </div>
                  <p className="text-3xl font-black text-green-900 dark:text-green-100">
                    {getMockMetrics(viewingMetrics.post).shares}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                    +{getMockMetrics(viewingMetrics.post).sharesGrowth}% from last week
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <MessageCircle className="text-white" size={20} />
                    </div>
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Comments</p>
                  </div>
                  <p className="text-3xl font-black text-purple-900 dark:text-purple-100">
                    {getMockMetrics(viewingMetrics.post).comments}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">
                    +{getMockMetrics(viewingMetrics.post).commentsGrowth}% from last week
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-500 rounded-lg">
                      <Eye className="text-white" size={20} />
                    </div>
                    <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">Views</p>
                  </div>
                  <p className="text-3xl font-black text-orange-900 dark:text-orange-100">
                    {getMockMetrics(viewingMetrics.post).views}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                    +{getMockMetrics(viewingMetrics.post).viewsGrowth}% from last week
                  </p>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Reach</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">
                    {getMockMetrics(viewingMetrics.post).reach}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Unique people who saw this post</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Impressions</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">
                    {getMockMetrics(viewingMetrics.post).impressions}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total times post was shown</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Engagement Rate</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">
                    {(() => {
                      const m = getMockMetrics(viewingMetrics.post);
                      return ((m.likes + m.comments + m.shares) / m.reach * 100).toFixed(1);
                    })()}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Likes + Comments + Shares / Reach</p>
                </div>
              </div>

              {/* Platform-Specific Metrics */}
              {viewingMetrics.platform === 'facebook' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                    <Facebook className="text-[#1877F2]" size={18} />
                    Facebook-Specific Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Reactions</p>
                      <p className="text-lg font-black text-blue-900 dark:text-blue-100">
                        {getMockMetrics(viewingMetrics.post).reactions}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Clicks</p>
                      <p className="text-lg font-black text-blue-900 dark:text-blue-100">
                        {getMockMetrics(viewingMetrics.post).clicks}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Saves</p>
                      <p className="text-lg font-black text-blue-900 dark:text-blue-100">
                        {getMockMetrics(viewingMetrics.post).saves}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Video Views</p>
                      <p className="text-lg font-black text-blue-900 dark:text-blue-100">
                        {getMockMetrics(viewingMetrics.post).videoViews || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {viewingMetrics.platform === 'instagram' && (
                <div className="bg-pink-50 dark:bg-pink-900/20 p-5 rounded-xl border border-pink-200 dark:border-pink-800">
                  <h3 className="text-sm font-bold text-pink-900 dark:text-pink-100 mb-4 flex items-center gap-2">
                    <Instagram className="text-[#E4405F]" size={18} />
                    Instagram-Specific Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-pink-600 dark:text-pink-400 font-medium">Saves</p>
                      <p className="text-lg font-black text-pink-900 dark:text-pink-100">
                        {getMockMetrics(viewingMetrics.post).instagramSaves}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-pink-600 dark:text-pink-400 font-medium">Profile Visits</p>
                      <p className="text-lg font-black text-pink-900 dark:text-pink-100">
                        {getMockMetrics(viewingMetrics.post).instagramProfileVisits}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-pink-600 dark:text-pink-400 font-medium">Website Clicks</p>
                      <p className="text-lg font-black text-pink-900 dark:text-pink-100">
                        {getMockMetrics(viewingMetrics.post).instagramWebsiteClicks || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-pink-600 dark:text-pink-400 font-medium">Reach</p>
                      <p className="text-lg font-black text-pink-900 dark:text-pink-100">
                        {getMockMetrics(viewingMetrics.post).instagramReach}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Engagement Timeline */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Recent Engagement Activity</h3>
                <div className="space-y-3">
                  {[
                    { time: '1 hour ago', action: 'New comment', user: '@user123', type: 'comment' },
                    { time: '2 hours ago', action: 'Liked by', user: '@user456', type: 'like' },
                    { time: '3 hours ago', action: 'Shared by', user: '@user789', type: 'share' },
                    { time: '5 hours ago', action: 'New comment', user: '@user321', type: 'comment' },
                    { time: '6 hours ago', action: 'Liked by', user: '@user654', type: 'like' },
                  ].map((activity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'comment' ? 'bg-purple-100 text-purple-600' :
                        activity.type === 'like' ? 'bg-blue-100 text-blue-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {activity.type === 'comment' ? <MessageCircle size={16} /> :
                         activity.type === 'like' ? <CheckCircle2 size={16} /> :
                         <Share2 size={16} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {activity.action} <span className="text-blue-600">{activity.user}</span>
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setViewingPost(viewingMetrics.post);
                  setViewingMetrics(null);
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-all"
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
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                  viewingPost.status === 'published' ? 'bg-green-100 text-green-700' :
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
    </div>
  );
};

export default Content;
