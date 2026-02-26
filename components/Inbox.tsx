
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  Mail, 
  Instagram, 
  Linkedin, 
  Send, 
  LayoutGrid, 
  Phone, 
  Globe, 
  PhoneMissed, 
  Archive,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Loader2
} from 'lucide-react';
import { useInbox } from '../src/hooks/useInbox';
import { useWorkspace } from '../src/hooks/useWorkspace';
import { inboxService, InboxMessage } from '../src/services/api/inbox.service';

type InboxCategory = 'all' | 'email' | 'whatsapp' | 'comments' | 'dms' | 'webchat' | 'missed' | 'archived';

const Inbox: React.FC = () => {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const { messages, loading, error, refresh, sendReply, markAsRead } = useInbox(workspaceId);
  
  const [currentCategory, setCurrentCategory] = useState<InboxCategory>('all');
  const [selectedId, setSelectedId] = useState<string>('');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { id: InboxCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All messages', icon: <LayoutGrid size={18} /> },
    { id: 'email', label: 'Email', icon: <Mail size={18} /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <Phone size={18} /> },
    { id: 'comments', label: 'Social comments', icon: <MessageSquare size={18} /> },
    { id: 'dms', label: 'DMs', icon: <Send size={18} /> },
    { id: 'webchat', label: 'Website chat', icon: <Globe size={18} /> },
    { id: 'missed', label: 'Missed calls', icon: <PhoneMissed size={18} /> },
    { id: 'archived', label: 'Archived', icon: <Archive size={18} /> },
  ];

  // Filter messages based on category and search
  const filteredMessages = useMemo(() => {
    let filtered = messages;
    
    // Filter by category
    if (currentCategory === 'all') {
      filtered = messages.filter(m => !m.archived);
    } else if (currentCategory === 'archived') {
      filtered = messages.filter(m => m.archived || m.category === 'archived');
    } else {
      filtered = messages.filter(m => m.category === currentCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.sender.toLowerCase().includes(query) || 
        m.text.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [messages, currentCategory, searchQuery]);

  // Set initial selected message
  useEffect(() => {
    if (filteredMessages.length > 0 && !selectedId) {
      setSelectedId(filteredMessages[0].id);
    }
  }, [filteredMessages, selectedId]);

  const selectedMessage = messages.find(m => m.id === selectedId);

  // Mark as read when selecting a message
  const handleSelectMessage = async (msg: InboxMessage) => {
    setSelectedId(msg.id);
    if (msg.unread && msg.source) {
      await markAsRead(msg.id, msg.source);
    }
  };

  // Send reply
  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim() || !workspaceId) return;

    setSendingReply(true);
    try {
      await sendReply(
        selectedMessage.id,
        replyText,
        selectedMessage.platform,
        selectedMessage.source || 'messages',
        selectedMessage.platformPostId
      );
      setReplyText('');
    } catch (err) {
      console.error('Failed to send reply:', err);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  const getPlatformIcon = (p: string) => {
    switch(p) {
      case 'email': return <Mail size={14} />;
      case 'instagram': return <Instagram size={14} />;
      case 'linkedin': return <Linkedin size={14} />;
      case 'whatsapp': return <Phone size={14} />;
      case 'webchat': return <Globe size={14} />;
      case 'missed': return <PhoneMissed size={14} />;
      default: return <MessageSquare size={14} />;
    }
  };

  const formatTime = (timeString: string) => {
    return inboxService.formatTime(timeString);
  };

  // Loading state
  if (workspaceLoading || loading) {
    return (
      <div className="h-[calc(100vh-10rem)] bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Loading inbox...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-[calc(100vh-10rem)] bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-sm mb-2">Error loading inbox</p>
          <button 
            onClick={() => refresh()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-10rem)] bg-white rounded-2xl border border-gray-200 shadow-sm flex overflow-hidden">
      {/* Category Navigation (Inner Left Sidebar) */}
      <div className="w-16 md:w-56 border-r border-gray-100 bg-gray-50/50 flex flex-col">
        <div className="p-4 h-16 flex items-center border-b border-gray-100">
          <h3 className="font-black text-gray-800 hidden md:block uppercase tracking-wider text-xs">Unified Inbox</h3>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCurrentCategory(cat.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                currentCategory === cat.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'text-gray-500 hover:bg-white hover:text-gray-900'
              }`}
            >
              <span className="shrink-0">{cat.icon}</span>
              <span className="text-sm font-bold hidden md:block whitespace-nowrap">{cat.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Message List Panel */}
      <div className="w-80 border-r border-gray-100 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900">
              {categories.find(c => c.id === currentCategory)?.label}
            </h3>
            <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full uppercase">
              {filteredMessages.length} items
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredMessages.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-400 italic">No messages found here.</p>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => handleSelectMessage(msg)}
                className={`w-full text-left p-4 transition-all hover:bg-gray-50 relative ${
                  selectedId === msg.id ? 'bg-blue-50/50' : ''
                }`}
              >
                {selectedId === msg.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm truncate pr-2 ${msg.unread ? 'font-black text-gray-900' : 'font-medium text-gray-600'}`}>
                    {msg.sender}
                  </span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap font-medium uppercase">{formatTime(msg.time)}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 mb-2 font-medium">{msg.text}</p>
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
                    msg.platform === 'email' ? 'text-blue-500' : 
                    msg.platform === 'whatsapp' ? 'text-green-500' : 'text-purple-500'
                  }`}>
                    {getPlatformIcon(msg.platform)} {msg.platform}
                  </span>
                  {msg.unread && <div className="w-2 h-2 bg-blue-600 rounded-full shadow-lg shadow-blue-200" />}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Conversation Detail Panel */}
      <div className="flex-1 flex flex-col bg-gray-50/20">
        {selectedMessage ? (
          <>
            <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-600 shadow-sm">
                  {selectedMessage.sender.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900">{selectedMessage.sender}</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active via {selectedMessage.platform}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-all" title="Archive">
                  <Archive size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all" title="Delete">
                  <Trash2 size={18} />
                </button>
                <div className="w-px h-8 bg-gray-100 mx-1" />
                <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-all">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="flex justify-center">
                <span className="px-3 py-1 bg-white border border-gray-100 text-gray-400 text-[10px] rounded-full uppercase font-black tracking-widest shadow-sm">
                  Conversation Thread
                </span>
              </div>
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 max-w-[75%] shadow-sm">
                    <p className="text-sm text-gray-800 leading-relaxed font-medium">{selectedMessage.text}</p>
                    <span className="text-[10px] text-gray-400 mt-2 block font-bold uppercase">{formatTime(selectedMessage.time)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 self-end justify-end">
                  <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none max-w-[75%] shadow-xl shadow-blue-100">
                    <p className="text-sm leading-relaxed font-medium">
                      Hey {selectedMessage.sender.split(' ')[0]}! Thanks for reaching out. 
                      I've received your inquiry and I'm currently looking into the best way we can help.
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-2">
                      <span className="text-[10px] text-blue-200 font-bold uppercase">Sent via {selectedMessage.platform}</span>
                      <CheckCircle2 size={10} className="text-blue-200" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 transition-all group">
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all">
                  <LayoutGrid size={20} />
                </button>
                <input 
                  type="text" 
                  placeholder={`Reply via ${selectedMessage.platform}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                  className="flex-1 px-2 py-2 bg-transparent text-sm outline-none font-medium text-gray-800"
                />
                <button 
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReply ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/50">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-6 rotate-3">
              <MessageSquare size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">Select a conversation</h3>
            <p className="text-sm text-gray-400 max-w-xs font-medium">
              Choose a message from the list to start replying across all your business channels.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
