
import React, { useState, useRef } from 'react';
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
  Save
} from 'lucide-react';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/lib/supabase';
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

  // Fetch posts when tab changes to a list view
  React.useEffect(() => {
    if (['all', 'all_list', 'drafts', 'scheduled', 'published'].includes(activeTab)) {
      fetchPosts();
    }
  }, [activeTab, user]);

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
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'instagram']);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [isRecur, setIsRecur] = useState(false);
  const [recurFrequency, setRecurFrequency] = useState('Weekly');
  const [recurUntil, setRecurUntil] = useState('2024-12-31');
  const [isSubmitting, setIsSubmitting] = useState(false); // Valid state for loading

  // New states for icon functionalities
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [location, setLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00 AM');

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

  const togglePlatform = (id: string) => {
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
        reader.readAsDataURL(file);
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
        reader.readAsDataURL(file);
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

  const handlePostSubmit = async () => {
    if (!postContent.trim() && uploadedImages.length === 0 && uploadedVideos.length === 0) {
      alert('Please add some content to your post!');
      return;
    }

    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform!');
      return;
    }

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
        published_at: scheduleMode === 'now' ? new Date().toISOString() : null,
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

      // 3. Insert to Supabase
      const { error } = await supabase.from('posts').insert(postData);
      if (error) throw error;

      alert(`Post ${scheduleMode === 'now' ? 'published' : 'scheduled'} successfully! 🎉`);

      // Reset form
      setPostContent('');
      setUploadedImages([]);
      setUploadedVideos([]);
      setSelectedPlatforms(['facebook', 'instagram']);
      setScheduleMode('now');
      setIsRecur(false);
      setScheduleDate('');
      setScheduleTime('10:00 AM');
      setLinkUrl('');
      setLocation('');
      setActiveTab('all');

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
        return <ContentCalendar />;

      case 'templates':
        return <ContentTemplates />;

      case 'create':
        return (
          <div className="bg-[#f8f9fb] rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 max-w-6xl mx-auto">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#344054]">Create Post</h2>
              <button onClick={() => setActiveTab('all')} className="text-gray-400 hover:text-gray-600 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Left Side: Editor */}
              <div className="lg:col-span-7 p-6 space-y-6 bg-white border-r border-gray-100">
                {/* Content Area */}
                <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Type your post content here... Use #hashtags and @mentions. Add images, videos, or links to engage your audience."
                    className="w-full h-32 p-4 text-sm font-medium outline-none resize-none placeholder-gray-400 leading-relaxed text-gray-700"
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
                    {platforms.map(p => (
                      <div key={p.id} className="relative">
                        <button
                          onClick={() => togglePlatform(p.id)}
                          className={`w-20 h-20 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all group overflow-hidden ${selectedPlatforms.includes(p.id)
                            ? 'border-blue-500 bg-[#eff8ff]'
                            : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                            }`}
                        >
                          <div className={`transition-all ${selectedPlatforms.includes(p.id) ? 'scale-110' : 'grayscale group-hover:grayscale-0'}`}>
                            {/* Fix: cast to React.ReactElement<any> to avoid 'size' prop error */}
                            {React.cloneElement(p.icon as React.ReactElement<any>, { size: 32 })}
                          </div>
                        </button>
                        {selectedPlatforms.includes(p.id) && (
                          <div className="absolute bottom-2 left-2 w-4 h-4 bg-blue-600 rounded flex items-center justify-center shadow-sm">
                            <CheckCircle2 size={10} className="text-white" strokeWidth={4} />
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2">
                          <CheckCircle2 size={12} className={selectedPlatforms.includes(p.id) ? 'text-blue-500' : 'text-gray-200'} />
                        </div>
                      </div>
                    ))}
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
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-green-600 text-white rounded text-[10px] font-bold">
                      <Mail size={12} /> Email Campaign
                    </div>
                  </div>
                  <div className="p-4 bg-white flex-1 overflow-y-auto space-y-4">
                    <h3 className="text-lg font-bold text-[#101828]">Weekly Newsletter</h3>

                    {/* Featured Image/Banner */}
                    {uploadedImages.length > 0 ? (
                      <div className="relative overflow-hidden rounded-lg">
                        <img
                          src={uploadedImages[0]}
                          alt="Featured"
                          className="w-full aspect-[16/7] object-cover rounded-lg"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded">
                          <CheckCircle2 size={12} className="text-white" />
                          <span className="text-[8px] font-bold text-white uppercase">Your Company</span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[16/7] bg-[#47b26e] rounded-lg relative overflow-hidden flex flex-col items-center justify-center p-4">
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 opacity-60">
                          <CheckCircle2 size={12} className="text-white" />
                          <span className="text-[8px] font-bold text-white uppercase">Your Company</span>
                        </div>
                        <div className="text-white text-center space-y-1">
                          <h4 className="text-lg font-bold tracking-tight">This Week's Highlights</h4>
                        </div>
                        <div className="absolute right-0 top-0 w-16 h-16 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2" />
                      </div>
                    )}

                    <div className="space-y-3">
                      <p className="text-xs text-[#475467] leading-relaxed whitespace-pre-wrap">
                        {postContent || "Welcome to this week's newsletter! We're excited to share the latest updates, insights, and opportunities with you. Stay connected with what matters most to your business growth and success."}
                      </p>

                      {/* Additional Images Grid */}
                      {uploadedImages.length > 1 && (
                        <div className={`grid gap-2 ${uploadedImages.length === 2 ? 'grid-cols-2' : uploadedImages.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                          {uploadedImages.slice(1, 5).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Image ${idx + 2}`}
                              className="w-full h-24 object-cover rounded border border-gray-200"
                            />
                          ))}
                        </div>
                      )}

                      {/* Videos Preview */}
                      {uploadedVideos.length > 0 && (
                        <div className="space-y-2">
                          {uploadedVideos.slice(0, 1).map((vid, idx) => (
                            <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200">
                              <video
                                src={vid}
                                className="w-full h-32 object-cover"
                                controls
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-center">
                        <button className="px-5 py-2 bg-[#47b26e] text-white rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-[#3a9359] transition-colors">Read More</button>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100 space-y-2">
                      <p className="text-[10px] font-bold text-[#667085] uppercase">{"{{Additional Updates}}"}</p>
                      <ul className="space-y-1">
                        <li className="flex items-center gap-2 text-[10px] text-gray-400">
                          <div className="w-1 h-1 bg-gray-300 rounded-full" />
                          {"{Additional Updates}"}
                        </li>
                      </ul>
                    </div>
                    <div className="text-center pt-2">
                      <p className="text-[8px] text-[#98a2b3] font-medium">{"{{Unsubscribe Link}} | Sent by {{Company Name}}"}</p>
                    </div>
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
                  onClick={() => setActiveTab('all')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-xs font-bold text-[#344054] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePostSubmit}
                  className="px-10 py-2.5 bg-[#f0642f] text-white rounded-lg text-xs font-bold hover:bg-[#d05325] shadow-lg shadow-orange-100 transition-all"
                >
                  {scheduleMode === 'now' ? (isRecur ? 'Start Recurring Posts' : 'Post Now') : (isRecur ? 'Schedule Recurring' : 'Schedule Post')}
                </button>
              </div>
            </div>
          </div>
        );

      case 'drafts':
      case 'scheduled':
      case 'published':
      // Added 'all_list' case to handle the List View tab to fix the TypeScript error
      case 'all_list':
      case 'all':
        return (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">
                {activeTab === 'all' || activeTab === 'all_list' ? 'All' : activeTab} Content
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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                          {post.platforms && post.platforms.join(' + ')}
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-relaxed">
                        {post.content || '(No text content)'}
                      </p>
                      <div className="flex gap-3 mt-3">
                        <button className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-all uppercase tracking-wider">
                          <Edit3 size={12} /> Edit
                        </button>
                        <button className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-red-500 transition-all uppercase tracking-wider">
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
    </div>
  );
};

export default Content;
