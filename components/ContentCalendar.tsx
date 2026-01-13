
import React, { useState } from 'react';
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
  X
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

const ENTRIES: CalendarEntry[] = [
  { id: '1', day: 4, title: 'Social Media Post Draft', type: 'social', status: 'draft', platform: 'LinkedIn' },
  { id: '2', day: 5, title: 'Email Campaign Scheduled', type: 'email', status: 'scheduled', time: '10:00 AM' },
  { id: '3', day: 8, title: 'Blog Post Published', type: 'blog', status: 'published' },
  { id: '4', day: 11, title: 'Newsletter Ready to Send', type: 'email', status: 'scheduled', time: '10:00 AM' },
  { id: '5', day: 12, title: 'Client Reminder SMS', type: 'sms', status: 'scheduled', time: '2:00 PM' },
  { id: '6', day: 16, title: 'Promo Offer Scheduled', type: 'email', status: 'scheduled' },
  { id: '7', day: 18, title: 'Report Submission Due', type: 'blog', status: 'scheduled' },
  { id: '8', day: 22, title: 'Document E-Signed Completed', type: 'task', status: 'published' },
  { id: '9', day: 23, title: 'Facebook Ad Campaign Live', type: 'social', status: 'published', platform: 'Facebook' },
  { id: '10', day: 25, title: 'Survey Email Sent', type: 'blog', status: 'published' },
];

const ContentCalendar: React.FC = () => {
  const [view, setView] = useState<CalendarView>('month');
  const [activePopover, setActivePopover] = useState<string | null>(null);

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
    const days = [];
    // Start empty cells for Sun-Mon (Jan 2022 started on Saturday, but we'll use a fixed example)
    for (let i = 0; i < 6; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-gray-50/30 border-r border-b border-gray-100"></div>);
    }

    for (let d = 1; d <= 31; d++) {
      const dayEntries = ENTRIES.filter(e => e.day === d);
      days.push(
        <div key={d} className={`min-h-[120px] bg-white border-r border-b border-gray-100 p-2 group hover:bg-blue-50/10 transition-colors relative`}>
          <div className="flex justify-between items-start mb-2">
            <span className={`text-xs font-black ${[3, 10, 17, 24, 31].includes(d) ? 'text-red-500' : 'text-gray-400'}`}>
              {d}
            </span>
            <button className="opacity-0 group-hover:opacity-100 p-1 text-blue-500 hover:bg-blue-100 rounded transition-all">
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
                        "Send out client payment reminder SMS at 2:00 PM."
                      </p>
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        <button className="flex flex-col items-center gap-1.5 p-2 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all text-gray-500">
                           <Edit3 size={16} /> <span className="text-[9px] font-black uppercase">Edit</span>
                        </button>
                        <button className="flex flex-col items-center gap-1.5 p-2 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all text-gray-500">
                           <Clock size={16} /> <span className="text-[9px] font-black uppercase">Time</span>
                        </button>
                        <button className="flex flex-col items-center gap-1.5 p-2 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all text-gray-500">
                           <Copy size={16} /> <span className="text-[9px] font-black uppercase">Dup</span>
                        </button>
                        <button className="flex flex-col items-center gap-1.5 p-2 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all text-gray-500">
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
             <button className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 transition-all shadow-sm"><ChevronLeft size={18} /></button>
             <h3 className="text-lg font-black text-gray-800 tracking-tight min-w-[140px] text-center uppercase tracking-widest">January 2022</h3>
             <button className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 transition-all shadow-sm"><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
             <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
             <select className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer">
               <option>Filter: All Types</option>
               <option>Social Only</option>
               <option>Email Only</option>
               <option>Drafts Only</option>
             </select>
          </div>
          <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2">
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
    </div>
  );
};

export default ContentCalendar;
