
import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  ChevronRight, 
  ExternalLink, 
  Copy, 
  Trash2, 
  Edit3,
  Mail,
  Instagram,
  MessageSquare,
  FileText,
  MousePointer2,
  CheckCircle2,
  Eye,
  Zap
} from 'lucide-react';

type TemplateCategory = 'All' | 'Social Media' | 'Email' | 'SMS' | 'Documents' | 'Blog/Art';

interface Template {
  id: string;
  title: string;
  description: string;
  type: 'Social Post' | 'Email Campaign' | 'SMS Reminder' | 'Blog Post' | 'Documents';
  category: TemplateCategory;
  thumbnailColor: string;
  content: string;
}

const TEMPLATES: Template[] = [
  { 
    id: '1', 
    title: 'Promotional Social Post', 
    description: 'Template for creating promotional social media posts.', 
    type: 'Social Post', 
    category: 'Social Media',
    thumbnailColor: 'bg-blue-100',
    content: 'Get ready for our biggest sale! {{Offer Percentage}} off all items starting {{Start Date}}. Click the link in bio to shop now.'
  },
  { 
    id: '2', 
    title: 'Weekly Newsletter', 
    description: 'Template for sending out weekly newsletters.', 
    type: 'Email Campaign', 
    category: 'Email',
    thumbnailColor: 'bg-green-100',
    content: 'Welcome to this weeks edition! {{Featured Topic}} is making waves in the industry. Here are the top 3 updates you need to know.'
  },
  { 
    id: '3', 
    title: 'Payment Reminder SMS', 
    description: 'Template for client payment reminder text messages.', 
    type: 'SMS Reminder', 
    category: 'SMS',
    thumbnailColor: 'bg-red-100',
    content: 'Hi {{Client Name}}, this is a friendly reminder that your payment for invoice {{Invoice ID}} is due on {{Due Date}}.'
  },
  { 
    id: '4', 
    title: 'Professional Proposal', 
    description: 'A formal proposal structure for business partners and high-ticket leads.', 
    type: 'Documents', 
    category: 'Documents',
    thumbnailColor: 'bg-teal-100',
    content: 'Proposal for: {{Client Company}}. Executive Summary: {{Summary Text}}. Timeline: {{Timeline Weeks}} weeks.'
  },
  { 
    id: '5', 
    title: 'Service Invoice', 
    description: 'Standard invoice template with auto-fill variables for solo operators.', 
    type: 'Email Campaign', 
    category: 'Email',
    thumbnailColor: 'bg-emerald-100',
    content: 'Invoice for services rendered during {{Month}}. Total Amount Due: {{Total Amount}}.'
  },
  { 
    id: '6', 
    title: 'Article Outline', 
    description: 'Template for drafting and structuring professional blog articles.', 
    type: 'Blog Post', 
    category: 'Blog/Art',
    thumbnailColor: 'bg-orange-100',
    content: 'Title: {{Article Title}}. Intro Hook: {{Hook}}. Section 1: {{Header 1}}. Conclusion: {{Conclusion Call to Action}}.'
  },
];

const ContentTemplates: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('All');
  const [selectedId, setSelectedId] = useState<string>(TEMPLATES[1].id);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchesCat = activeCategory === 'All' || t.category === activeCategory;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const selectedTemplate = TEMPLATES.find(t => t.id === selectedId) || TEMPLATES[0];

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'Social Post': return 'bg-blue-600 text-white';
      case 'Email Campaign': return 'bg-green-600 text-white';
      case 'SMS Reminder': return 'bg-red-600 text-white';
      case 'Blog Post': return 'bg-orange-600 text-white';
      case 'Documents': return 'bg-teal-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Social Post': return <Instagram size={14} />;
      case 'Email Campaign': return <Mail size={14} />;
      case 'SMS Reminder': return <MessageSquare size={14} />;
      case 'Blog Post': return <FileText size={14} />;
      case 'Documents': return <FileText size={14} />;
      default: return <Zap size={14} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search and Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-black text-gray-900 tracking-tight">Templates</h2>
           <p className="text-gray-500 text-sm font-medium">Reusable blueprints for your business communication.</p>
        </div>
        <button className="px-6 py-2.5 bg-[#f56c2d] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#d45823] transition-all shadow-lg shadow-orange-100 flex items-center gap-2">
          Create New Template
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main Grid Area */}
        <div className="flex-1 space-y-6 w-full lg:w-auto">
          {/* Internal Navigation & Filtering */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
                {['All', 'Social Media', 'Email', 'SMS', 'Documents', 'Blog/Art'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat as TemplateCategory)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeCategory === cat ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Filter className="absolute left-3 top-2.5 text-gray-400" size={14} />
                  <select className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-50 appearance-none">
                    <option>Filter: All Types</option>
                  </select>
                </div>
                <div className="relative">
                   <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                   <input 
                    type="text" 
                    placeholder="Search templates..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium outline-none focus:ring-4 focus:ring-blue-50 transition-all w-48"
                   />
                </div>
              </div>
            </div>
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map((tpl) => (
              <div 
                key={tpl.id}
                onClick={() => setSelectedId(tpl.id)}
                className={`bg-white rounded-2xl border transition-all cursor-pointer group overflow-hidden ${
                  selectedId === tpl.id ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-200 hover:border-blue-300 shadow-sm'
                }`}
              >
                <div className={`aspect-[16/10] ${tpl.thumbnailColor} relative flex items-center justify-center`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-16 h-16 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center text-gray-400 shadow-sm group-hover:scale-110 transition-transform">
                     {getIcon(tpl.type)}
                  </div>
                  {tpl.id === '1' && (
                    <div className="absolute top-4 right-4 bg-[#f56c2d] text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase rotate-12">Sale!</div>
                  )}
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h4 className="text-base font-black text-gray-900 line-clamp-1">{tpl.title}</h4>
                    <p className="text-xs text-gray-400 font-medium line-clamp-2 leading-relaxed mt-1">{tpl.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-1 rounded-lg ${getTypeStyles(tpl.type)}`}>
                       {getIcon(tpl.type)} {tpl.type}
                     </span>
                     <button className="p-2 text-gray-300 hover:text-gray-600 transition-all opacity-0 group-hover:opacity-100">
                       <MoreVertical size={16} />
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side Preview Panel */}
        <div className="w-full lg:w-[400px] bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8 sticky top-32 animate-in slide-in-from-right-4 duration-500">
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                 <Eye size={16} /> Preview
              </div>
              <div className="flex gap-1">
                 <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Copy size={16} /></button>
                 <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
              </div>
           </div>

           <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 min-h-[400px] flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                 <div className={`p-2 rounded-lg ${getTypeStyles(selectedTemplate.type)}`}>
                   {getIcon(selectedTemplate.type)}
                 </div>
                 <h3 className="font-black text-gray-800">{selectedTemplate.title}</h3>
              </div>

              {selectedTemplate.id === '2' ? (
                /* Specialized Newsletter Mock */
                <div className="flex-1 space-y-6">
                   <div className="aspect-video bg-emerald-600 rounded-2xl flex flex-col items-center justify-center text-white p-4 text-center">
                      <Zap size={32} className="mb-2 opacity-50" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">Engagehub Weekly</p>
                      <h4 className="text-xl font-black mt-2">{"{{Featured Topic}}"}</h4>
                   </div>
                   <div className="space-y-4">
                      <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        Sed eget mi accumsan nisi tincidunt vulputate. Pelienteaque habliant, morbi tristique senectus et netus et malesuada fames ac turpis egestas.
                      </p>
                      <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100">Read More</button>
                      <div className="pt-4 border-t border-gray-200">
                         <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{"{{Additional Updates}}"}</h5>
                         <ul className="space-y-2">
                            {[1, 2].map(i => (
                              <li key={i} className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                 <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                 {"{Additional Update " + i + "}"}
                              </li>
                            ))}
                         </ul>
                      </div>
                   </div>
                </div>
              ) : (
                /* General Template Preview */
                <div className="flex-1">
                   <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm min-h-[200px]">
                      <p className="text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                        {selectedTemplate.content.split(/(\{\{.*?\}\})/).map((part, i) => (
                          part.startsWith('{{') ? (
                            <span key={i} className="text-blue-600 font-black bg-blue-50 px-1 py-0.5 rounded">{part}</span>
                          ) : part
                        ))}
                      </p>
                   </div>
                </div>
              )}

              <div className="mt-8 text-center">
                 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                    {"{{Unsubscribe Link}} | Sent by {{Company Name}}"}
                 </p>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-3 mt-8">
              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2">
                 Use Template <MousePointer2 size={16} />
              </button>
              <div className="grid grid-cols-3 gap-2">
                 <button className="py-3 bg-gray-50 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 flex items-center justify-center gap-2 border border-gray-100">
                    <Edit3 size={14} /> Edit
                 </button>
                 <button className="py-3 bg-gray-50 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 flex items-center justify-center gap-2 border border-gray-100">
                    <Copy size={14} /> Dup
                 </button>
                 <button className="py-3 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 flex items-center justify-center gap-2 border border-red-100">
                    <Trash2 size={14} /> Del
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ContentTemplates;
