
import React, { useState } from 'react';
import { 
  FolderOpen, 
  Image as ImageIcon, 
  Palette, 
  Type, 
  FileText, 
  Plus, 
  Search, 
  MoreVertical, 
  Download, 
  Copy, 
  Trash2,
  ExternalLink,
  UploadCloud,
  Layers,
  CheckCircle2
} from 'lucide-react';

type AssetsTab = 'media' | 'brandkit' | 'logos' | 'templates' | 'fonts' | 'documents';

const Assets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AssetsTab>('media');

  const tabs: { id: AssetsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'media', label: 'Media library', icon: <ImageIcon size={16} /> },
    { id: 'brandkit', label: 'Brand kit', icon: <Palette size={16} /> },
    { id: 'logos', label: 'Logos', icon: <Layers size={16} /> },
    { id: 'templates', label: 'Templates', icon: <Copy size={16} /> },
    { id: 'fonts', label: 'Fonts & colors', icon: <Type size={16} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'media':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search media assets..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                />
              </div>
              <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2">
                <UploadCloud size={16} /> Upload Media
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden group relative hover:border-blue-300 transition-all shadow-sm">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-300 group-hover:scale-105 transition-transform duration-500">
                    <ImageIcon size={40} />
                  </div>
                  <div className="p-3 bg-white relative z-10">
                    <p className="text-[10px] font-black text-gray-800 truncate uppercase tracking-tighter">Campaign_Hero_0{i}.png</p>
                    <p className="text-[9px] text-gray-400 font-bold">1200x800 • 2.4MB</p>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-1">
                    <button className="p-1.5 bg-white shadow-md rounded-lg text-gray-500 hover:text-blue-600"><Download size={14} /></button>
                    <button className="p-1.5 bg-white shadow-md rounded-lg text-gray-500 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'brandkit':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="lg:col-span-7 space-y-8">
               <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                 <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Primary Brand Colors</h3>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                   {[
                     { name: 'Engage Blue', hex: '#2563EB' },
                     { name: 'Deep Navy', hex: '#1E293B' },
                     { name: 'Soft Gray', hex: '#F8FAFC' },
                     { name: 'Accent Teal', hex: '#14B8A6' },
                   ].map((color, idx) => (
                     <div key={idx} className="space-y-2 group cursor-pointer" onClick={() => navigator.clipboard.writeText(color.hex)}>
                       <div className="aspect-square rounded-2xl shadow-sm border border-gray-100 transition-transform group-hover:scale-105" style={{ backgroundColor: color.hex }} />
                       <div className="flex justify-between items-center">
                         <p className="text-[10px] font-black text-gray-800 uppercase">{color.name}</p>
                         <button className="opacity-0 group-hover:opacity-100 transition-all text-blue-500"><Copy size={12} /></button>
                       </div>
                       <code className="text-[9px] font-mono text-gray-400">{color.hex}</code>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                 <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Typography</h3>
                 <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-blue-600 uppercase mb-2">Primary Font: Inter</p>
                      <p className="text-2xl font-black text-gray-900">The quick brown fox jumps over the lazy dog.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-blue-600 uppercase mb-2">Secondary Font: Roboto Mono</p>
                      <p className="text-sm font-mono text-gray-600">const engageHub = "Empowering single-operator businesses";</p>
                    </div>
                 </div>
               </div>
            </div>

            <div className="lg:col-span-5 space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                 <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Logo Variations</h3>
                 <div className="grid grid-cols-1 gap-4">
                    {[
                      { name: 'Full Logo (Primary)', type: 'SVG' },
                      { name: 'Icon Only', type: 'PNG' },
                      { name: 'White Monotone', type: 'SVG' },
                    ].map((logo, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:rotate-6 transition-all">
                             <Layers size={24} />
                           </div>
                           <div>
                             <p className="text-sm font-bold text-gray-800">{logo.name}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase">{logo.type}</p>
                           </div>
                        </div>
                        <button className="p-2 text-gray-300 hover:text-blue-600 transition-all"><Download size={18} /></button>
                      </div>
                    ))}
                 </div>
                 <button className="w-full mt-6 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-black text-gray-400 uppercase tracking-widest hover:border-blue-300 hover:text-blue-600 transition-all">
                   + Add Variation
                 </button>
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
             <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
              <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">Business Documents</h3>
              <button className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-100">+ Add Doc</button>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { name: 'Service_Agreement_v2.pdf', date: 'May 12, 2025', size: '1.2MB' },
                { name: 'Q3_Marketing_Strategy.docx', date: 'Jun 02, 2025', size: '450KB' },
                { name: 'Tax_Documents_2024.zip', date: 'Apr 15, 2025', size: '12MB' },
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-all group">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                       <FileText size={20} />
                     </div>
                     <div>
                       <p className="text-sm font-black text-gray-800">{doc.name}</p>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{doc.date} • {doc.size}</p>
                     </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="p-2 text-gray-400 hover:text-blue-600"><Download size={18} /></button>
                    <button className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-3xl border border-gray-200 p-20 text-center space-y-6">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto">
              <FolderOpen size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Asset Management</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mt-2 leading-relaxed">
                This asset type is currently being indexed for better search performance.
              </p>
            </div>
            <button className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all text-sm shadow-xl shadow-blue-100">
              Back to Library
            </button>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Brand & Media Assets</h2>
          <p className="text-gray-500 text-sm font-medium">Manage your creative library and brand identity.</p>
        </div>
        <div className="flex gap-2">
           <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
             <CheckCircle2 size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest">Brand synced</span>
           </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-gray-200 sticky top-16 bg-gray-50/90 backdrop-blur-sm z-20 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all border-b-2 -mb-[2px] whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
            }`}
          >
            <span className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-300'}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Assets;
