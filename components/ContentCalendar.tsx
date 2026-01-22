
import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Calendar as CalendarIcon,
  Edit3,
  Clock,
  Copy,
  BarChart2,
  MoreVertical,
  Instagram,
  Linkedin,
  Mail,
  MessageSquare,
  FileText,
  Search,
  Settings,
  CheckCircle2,
  X,
  Facebook,
  Twitter,
  MessageCircle,
  Share2,
  Eye
} from 'lucide-react';

type CalendarView = 'month' | 'week' | 'day';

interface CalendarEntry {
  id: string;
  day: number;
  title: string;
  type: 'social' | 'email' | 'sms' | 'blog' | 'task';
  status: 'draft' | 'scheduled' | 'published';
  time?: string;
  platform?: string;
}

interface ContentCalendarProps {
  onNavigateToCreate?: () => void;
}

const ContentCalendar: React.FC<ContentCalendarProps> = ({ onNavigateToCreate }) => {
  const [view, setView] = useState<CalendarView>('month');
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState('All Types');
  const [viewingMetrics, setViewingMetrics] = useState<{ post: any; platform: string } | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, [currentDate]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      // Determine the range for the current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

      // We need to fetch posts that are EITHER scheduled OR published in this range
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .or(`scheduled_for.gte.${startOfMonth.toISOString()},published_at.gte.${startOfMonth.toISOString()}`)
        // We filter the end in JS or with a more complex OR filter if needed, 
        // but OR in Supabase with nested dates can be tricky. 
        // Let's fetch everything for this month based on scheduled_for OR published_at.
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedEntries: CalendarEntry[] = (posts || [])
        .filter(post => {
          const date = new Date(post.scheduled_for || post.published_at);
          return date >= startOfMonth && date <= endOfMonth;
        })
        .map(post => {
          const displayDate = new Date(post.scheduled_for || post.published_at);

          return {
            id: post.id,
            day: displayDate.getDate(),
            title: post.content.substring(0, 30) || 'Untitled Post',
            type: post.content_type === 'image' || post.content_type === 'video' ? 'social' :
              post.platforms?.includes('email') ? 'email' : 'social',
            status: post.status === 'scheduled' ? 'scheduled' : post.status === 'published' ? 'published' : 'draft',
            time: displayDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            platform: post.platforms?.[0] || 'Social'
          };
        });

      setEntries(mappedEntries);
    } catch (err) {
      console.error('Error fetching calendar entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      setEntries(prev => prev.filter(e => e.id !== id));
      setActivePopover(null);
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post');
    }
  };

  const handleDuplicatePost = async (entry: CalendarEntry) => {
    try {
      // Fetch the full post data first
      const { data: originalPost, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', entry.id)
        .single();

      if (fetchError) throw fetchError;

      // Create a duplicate with a new ID and slightly different title
      const { id, created_at, updated_at, ...rest } = originalPost;
      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          ...rest,
          content: `(Copy) ${rest.content}`,
          status: 'draft' // New copies are drafts by default
        });

      if (insertError) throw insertError;

      alert('Post duplicated as draft!');
      fetchEntries();
      setActivePopover(null);
    } catch (err) {
      console.error('Error duplicating post:', err);
      alert('Failed to duplicate post');
    }
  };

  const handleViewStats = async (entry: CalendarEntry) => {
    try {
      setLoadingPost(true);
      // Fetch the full post data
      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', entry.id)
        .single();

      if (error) throw error;
      if (!post) {
        alert('Post not found');
        return;
      }

      // Get the platform from the entry or post
      const platform = entry.platform?.toLowerCase() || post.platforms?.[0]?.toLowerCase() || 'facebook';
      setViewingMetrics({ post, platform });
      setActivePopover(null);
    } catch (err) {
      console.error('Error fetching post for stats:', err);
      alert('Failed to load post stats');
    } finally {
      setLoadingPost(false);
    }
  };

  // Generate stable mock metrics based on post ID
  const getMockMetrics = (post: any) => {
    const postIdHash = post?.id?.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) || 1234;
    return {
      likes: post?.analytics?.likes || (postIdHash % 500) + 50,
      shares: post?.analytics?.shares || (postIdHash % 200) + 10,
      comments: post?.analytics?.comments || (postIdHash % 100) + 5,
      views: post?.analytics?.views || (postIdHash % 2000) + 500,
      reach: post?.analytics?.reach || (postIdHash % 3000) + 1000,
      impressions: post?.analytics?.impressions || (postIdHash % 5000) + 2000,
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
    };
  };

  const filteredEntries = entries.filter(entry => {
    if (filterType === 'All Types') return true;
    if (filterType === 'Social Only') return entry.type === 'social';
    if (filterType === 'Email Only') return entry.type === 'email';
    if (filterType === 'Drafts Only') return entry.status === 'draft';
    return true;
  });

  const getEntryStyles = (type: string, status: string) => {
    const base = "px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 truncate cursor-pointer transition-all border shadow-sm ";
    switch (type) {
      case 'social': return base + "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100";
      case 'email': return base + "bg-green-50 text-green-600 border-green-100 hover:bg-green-100";
      case 'sms': return base + "bg-red-50 text-red-600 border-red-100 hover:bg-red-100";
      case 'blog': return base + "bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100";
      case 'task': return base + "bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-100";
      default: return base + "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'social': return <Instagram size={10} />;
      case 'email': return <Mail size={10} />;
      case 'sms': return <MessageSquare size={10} />;
      case 'blog': return <FileText size={10} />;
      case 'task': return <CheckCircle2 size={10} />;
      default: return <Plus size={10} />;
    }
  };

  const renderDays = () => {
    if (loading) {
      return Array.from({ length: 42 }).map((_, i) => (
        <div key={`loading-${i}`} className="min-h-[120px] bg-white border-r border-b border-gray-100 p-2 animate-pulse">
          <div className="h-4 w-6 bg-gray-100 rounded mb-2"></div>
          <div className="space-y-1">
            <div className="h-6 bg-gray-50 rounded"></div>
          </div>
        </div>
      ));
    }

    const days = [];
    
    // Calculate the first day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    
    // Calculate the number of days in the current month
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-gray-50/30 border-r border-b border-gray-100"></div>);
    }

    // Add cells for each day of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dayEntries = filteredEntries.filter(e => e.day === d);
      const isToday = d === new Date().getDate() && 
                      currentDate.getMonth() === new Date().getMonth() && 
                      currentDate.getFullYear() === new Date().getFullYear();
      
      days.push(
        <div key={d} className={`min-h-[120px] bg-white border-r border-b border-gray-100 p-2 group hover:bg-blue-50/10 transition-colors relative ${isToday ? 'bg-blue-50/30' : ''}`}>
          <div className="flex justify-between items-start mb-2">
            <span className={`text-xs font-black ${isToday ? 'text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full' : 'text-gray-400'}`}>
              {d}
            </span>
            <button
              onClick={onNavigateToCreate}
              className="opacity-0 group-hover:opacity-100 p-1 text-blue-500 hover:bg-blue-100 rounded transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1">
            {dayEntries.map(entry => (
              <div key={entry.id} className="relative">
                <div
                  onClick={() => setActivePopover(entry.id === activePopover ? null : entry.id)}
                  className={getEntryStyles(entry.type, entry.status)}
                >
                  {getEntryIcon(entry.type)}
                  <span className="truncate">{entry.title}</span>
                  {entry.time && <span className="text-[8px] opacity-60 ml-auto">{entry.time}</span>}
                </div>

                {activePopover === entry.id && (
                  <div className="absolute top-full left-0 z-50 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 rounded-t-2xl">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${getEntryStyles(entry.type, entry.status).split(' ')[0]}`}>
                          {getEntryIcon(entry.type)}
                        </div>
                        <h4 className="text-sm font-black text-gray-800">{entry.title}</h4>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setActivePopover(null); }} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                        <Clock size={14} /> {entry.time || 'All Day'}
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed italic">
                        {entry.platform && `Platform: ${entry.platform}`}
                      </p>
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        <button
                          onClick={onNavigateToCreate}
                          className="flex flex-col items-center gap-1.5 p-2 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all text-gray-500"
                        >
                          <Edit3 size={16} /> <span className="text-[9px] font-black uppercase">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeletePost(entry.id)}
                          className="flex flex-col items-center gap-1.5 p-2 bg-gray-50 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all text-gray-500"
                        >
                          <X size={16} /> <span className="text-[9px] font-black uppercase">Del</span>
                        </button>
                        <button
                          onClick={() => handleDuplicatePost(entry)}
                          className="flex flex-col items-center gap-1.5 p-2 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all text-gray-500"
                        >
                          <Copy size={16} /> <span className="text-[9px] font-black uppercase">Dup</span>
                        </button>
                        <button
                          onClick={() => handleViewStats(entry)}
                          disabled={loadingPost}
                          className="flex flex-col items-center gap-1.5 p-2 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all text-gray-500 disabled:opacity-50"
                        >
                          <BarChart2 size={16} /> <span className="text-[9px] font-black uppercase">Stats</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Fill remaining cells to complete the grid (6 rows x 7 columns = 42 cells)
    const totalCells = days.length;
    const remainingCells = 42 - totalCells;
    for (let i = 0; i < remainingCells; i++) {
      days.push(<div key={`empty-end-${i}`} className="min-h-[120px] bg-gray-50/30 border-r border-b border-gray-100"></div>);
    }
    
    return days;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-500">
      {/* Calendar Header Controls */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/20">
        <div className="flex items-center gap-4">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'month' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'week' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'day' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Day
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevMonth}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 transition-all shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-lg font-black text-gray-800 tracking-tight min-w-[200px] text-center uppercase tracking-widest">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer"
            >
              <option>All Types</option>
              <option>Social Only</option>
              <option>Email Only</option>
              <option>Drafts Only</option>
            </select>
          </div>
          <button
            onClick={onNavigateToCreate}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
          >
            <Plus size={16} /> Create Content
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 border-b border-gray-100 bg-white">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-50 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* The Grid */}
      <div className="grid grid-cols-7 bg-gray-50/10">
        {renderDays()}
      </div>

      {/* Legend Footer */}
      <div className="p-6 border-t border-gray-100 flex flex-wrap items-center justify-center gap-8 bg-gray-50/20">
        {[
          { label: 'Social Post', color: 'bg-blue-500' },
          { label: 'Email Campaign', color: 'bg-green-500' },
          { label: 'SMS Reminder', color: 'bg-red-500' },
          { label: 'Blog/Article', color: 'bg-orange-500' },
          { label: 'Task/Docs', color: 'bg-teal-500' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm`} />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.label}</span>
          </div>
        ))}
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
                      <MessageSquare className="text-white" size={20} />
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
                        {activity.type === 'comment' ? <MessageSquare size={16} /> :
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
                onClick={() => setViewingMetrics(null)}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all"
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

export default ContentCalendar;
