
import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  MessageSquare, 
  Users, 
  Megaphone, 
  Target, 
  Zap, 
  Send, 
  Copy, 
  RefreshCw, 
  ChevronRight,
  Lightbulb,
  ArrowRight,
  BrainCircuit,
  Bot
} from 'lucide-react';
import { generateContentSuggestion, analyzeCRMLead } from '../services/geminiService';

type AISubTab = 'content' | 'crm' | 'inbox' | 'campaigns' | 'scoring' | 'automations';

const AIStudio: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<AISubTab>('content');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const tabs: { id: AISubTab; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'content', label: 'Content Generator', icon: <Wand2 size={16} />, desc: 'Draft hooks, captions, and blog posts.' },
    { id: 'crm', label: 'CRM Assistant', icon: <Users size={16} />, desc: 'Draft follow-ups and relationship summaries.' },
    { id: 'inbox', label: 'Inbox Replies', icon: <MessageSquare size={16} />, desc: 'Smart, context-aware message responses.' },
    { id: 'campaigns', label: 'Campaign Planner', icon: <Megaphone size={16} />, desc: 'Strategic multichannel launch blueprints.' },
    { id: 'scoring', label: 'Lead Scoring', icon: <Target size={16} />, desc: 'Analyze lead quality and probability.' },
    { id: 'automations', label: 'Automation Rules', icon: <Zap size={16} />, desc: 'Solo-op workflow optimization ideas.' },
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const input = customPrompt || prompt;
    if (!input.trim()) return;
    
    setLoading(true);
    setResult('');
    
    let suggestion = '';
    if (activeSubTab === 'scoring') {
      suggestion = await analyzeCRMLead(input);
    } else {
      // For general tasks, we use the content suggestion service with mode-aware prefixes
      const prefix = {
        content: "Draft high-converting social media content for: ",
        crm: "Draft a personalized professional follow-up for this contact situation: ",
        inbox: "Respond professionally and helpfully to this customer message: ",
        campaigns: "Create a detailed 7-day marketing campaign blueprint for: ",
        automations: "Suggest 3 efficient automation workflows for this solo business task: "
      }[activeSubTab as keyof typeof prefix] || "";
      
      suggestion = await generateContentSuggestion(prefix + input);
    }
    
    setResult(suggestion || 'No response generated. Please try again.');
    setLoading(false);
  };

  const renderTabContent = () => {
    const activeInfo = tabs.find(t => t.id === activeSubTab);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Left Input Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                {activeInfo?.icon}
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{activeInfo?.label}</h3>
                <p className="text-xs text-gray-400 font-medium">{activeInfo?.desc}</p>
              </div>
            </div>

            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  activeSubTab === 'content' ? "Describe the topic or product..." :
                  activeSubTab === 'crm' ? "Who are you following up with and why?" :
                  activeSubTab === 'inbox' ? "Paste the customer message here..." :
                  activeSubTab === 'campaigns' ? "What are you launching? (Goal, Audience)" :
                  activeSubTab === 'scoring' ? "Paste lead details, history, and notes..." :
                  "What task do you find yourself doing repeatedly?"
                }
                className="w-full h-48 p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all outline-none resize-none text-sm font-medium leading-relaxed"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                 {loading ? (
                    <div className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-100">
                      <RefreshCw size={16} className="animate-spin" />
                      <span className="text-xs font-bold uppercase">Processing</span>
                    </div>
                 ) : (
                    <button 
                      onClick={() => handleGenerate()}
                      disabled={!prompt.trim()}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-indigo-100"
                    >
                      <Sparkles size={16} />
                      <span className="text-xs font-bold uppercase">Generate</span>
                    </button>
                 )}
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
             <div className="relative z-10">
               <div className="flex items-center gap-2 mb-3">
                 <Lightbulb size={18} className="text-indigo-200" />
                 <h4 className="text-xs font-black uppercase tracking-widest">Smart Suggestion</h4>
               </div>
               <p className="text-xs text-indigo-100 font-medium leading-relaxed mb-4">
                 {activeSubTab === 'content' ? "Try asking for a 3-part Instagram carousel script for a productivity tool launch." :
                  activeSubTab === 'crm' ? "Ask me to summarize the last 3 meetings with client 'Apex Solutions' into action points." :
                  "You can paste raw notes here and I'll structure them into a professional outcome."}
               </p>
               <button 
                onClick={() => setPrompt("Create a 3-part carousel script for a productivity tool launch")}
                className="text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 py-1.5 px-3 rounded-lg transition-all"
               >
                 Try this prompt
               </button>
             </div>
             <BrainCircuit className="absolute -right-8 -bottom-8 w-32 h-32 text-white/5" />
          </div>
        </div>

        {/* Right Result Section */}
        <div className="lg:col-span-7">
          {result ? (
            <div className="bg-white h-full min-h-[400px] rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">AI Generated Response</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigator.clipboard.writeText(result)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <Copy size={16} />
                  </button>
                  <button 
                    onClick={() => handleGenerate()}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
              <div className="p-8 flex-1 overflow-y-auto prose prose-sm max-w-none text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
                {result}
              </div>
              <div className="p-4 bg-indigo-50/30 border-t border-gray-50 flex justify-between items-center">
                 <p className="text-[10px] font-bold text-indigo-400 uppercase">Powered by Gemini 3 Flash</p>
                 <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-50">
                   Execute Action <ArrowRight size={14} />
                 </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100/30 h-full min-h-[400px] rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-12">
               <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-indigo-400 mb-6 rotate-3">
                 <Bot size={40} />
               </div>
               <h3 className="text-xl font-black text-gray-800 mb-2 tracking-tight">AI Command Center</h3>
               <p className="text-sm text-gray-400 max-w-sm font-medium leading-relaxed">
                 Enter your requirements on the left to generate high-quality {activeInfo?.label.toLowerCase()} tailored for your solo business.
               </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      {/* AI Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <Sparkles size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">AI Studio</h2>
            <p className="text-gray-500 text-sm font-medium">Your intelligent co-pilot for growth and efficiency.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex -space-x-2 px-2">
             {[1,2,3].map(i => (
               <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-indigo-100" />
             ))}
           </div>
           <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest pr-2">32 Credits remaining</p>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex border-b border-gray-200 sticky top-16 bg-gray-50/90 backdrop-blur-sm z-20 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id);
              setResult('');
              setPrompt('');
            }}
            className={`flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all border-b-2 -mb-[2px] whitespace-nowrap ${
              activeSubTab === tab.id 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
            }`}
          >
            <span className={activeSubTab === tab.id ? 'text-indigo-600' : 'text-gray-300'}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AIStudio;
