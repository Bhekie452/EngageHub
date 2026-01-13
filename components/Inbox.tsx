
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
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
  Trash2
} from 'lucide-react';

type InboxCategory = 'all' | 'email' | 'whatsapp' | 'comments' | 'dms' | 'webchat' | 'missed' | 'archived';

interface MessageData {
  id: string;
  sender: string;
  text: string;
  time: string;
  platform: 'email' | 'whatsapp' | 'instagram' | 'linkedin' | 'webchat' | 'missed';
  category: InboxCategory;
  unread: boolean;
  archived?: boolean;
}

const MESSAGES: MessageData[] = [
  { id: '1', sender: 'Sarah Miller', text: 'Hi, I saw your latest post on LinkedIn. Do you offer consulting for small teams?', platform: 'linkedin', category: 'dms', time: '10m ago', unread: true },
  { id: '2', sender: 'Marcus Chen', text: 'Payment confirmed for the Q3 audit. Looking forward to the results!', platform: 'email', category: 'email', time: '1h ago', unread: false },
  { id: '3', sender: 'Emma Watson', text: 'Hey! Loved the new video. Would love to collab on a reel soon.', platform: 'instagram', category: 'comments', time: '3h ago', unread: true },
  { id: '4', sender: 'WhatsApp Lead', text: 'Is the early bird pricing still available for the course?', platform: 'whatsapp', category: 'whatsapp', time: '5h ago', unread: false },
  { id: '5', sender: 'Web Guest #402', text: 'Where can I find your pricing page?', platform: 'webchat', category: 'webchat', time: 'Yesterday', unread: false },
  { id: '6', sender: '+1 (555) 0123', text: 'Missed call from unknown number', platform: 'missed', category: 'missed', time: 'Yesterday', unread: true },
  { id: '7', sender: 'Old Client', text: 'Archived project discussion from last year.', platform: 'email', category: 'archived', time: '2 mo ago', unread: false, archived: true },
];

const Inbox: React.FC = () => {
  const [currentCategory, setCurrentCategory] = useState<InboxCategory>('all');
  const [selectedId, setSelectedId] = useState<string>(MESSAGES[0].id);

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

  const filteredMessages = useMemo(() => {
    if (currentCategory === 'all') return MESSAGES.filter(m => !m.archived);
    if (currentCategory === 'archived') return MESSAGES.filter(m => m.archived || m.category === 'archived');
    return MESSAGES.filter(m => m.category === currentCategory);
  }, [currentCategory]);

  const selectedMessage = MESSAGES.find(m => m.id === selectedId);

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
                onClick={() => setSelectedId(msg.id)}
                className={`w-full text-left p-4 transition-all hover:bg-gray-50 relative ${
                  selectedId === msg.id ? 'bg-blue-50/50' : ''
                }`}
              >
                {selectedId === msg.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm truncate pr-2 ${msg.unread ? 'font-black text-gray-900' : 'font-medium text-gray-600'}`}>
                    {msg.sender}
                  </span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap font-medium uppercase">{msg.time}</span>
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
                    <span className="text-[10px] text-gray-400 mt-2 block font-bold uppercase">{selectedMessage.time}</span>
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
                  className="flex-1 px-2 py-2 bg-transparent text-sm outline-none font-medium text-gray-800"
                />
                <button className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                  <Send size={20} />
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
