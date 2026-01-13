
import React, { useState } from 'react';
import { 
  Zap, 
  Plus, 
  Settings, 
  History, 
  BrainCircuit, 
  Play, 
  Pause, 
  MoreVertical, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  ChevronRight,
  Database,
  Cloud,
  Bell,
  MessageSquare,
  Share2,
  Trash2,
  Copy,
  Layout,
  MousePointer2,
  Link,
  Sparkles,
  Wand2,
  Code,
  Users,
  DollarSign,
  FileText,
  TrendingUp
} from 'lucide-react';

type AutomationTab = 'active' | 'create' | 'triggers' | 'actions' | 'logs' | 'ai';

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused';
  lastRun: string;
  totalRuns: number;
  trigger: string;
}

const AUTOMATIONS: AutomationWorkflow[] = [
  { id: '1', name: 'New Lead Auto-Reply', description: 'Sends a personalized email via Gemini when a new lead hits the CRM.', status: 'active', lastRun: '22m ago', totalRuns: 142, trigger: 'CRM: New Lead' },
  { id: '2', name: 'Social Post Sync', description: 'Mirror Instagram posts to LinkedIn profile automatically.', status: 'active', lastRun: '1h ago', totalRuns: 45, trigger: 'Instagram: New Post' },
  { id: '3', name: 'High-Value Alert', description: 'Notify WhatsApp if a deal over $5k enters "Negotiation".', status: 'paused', lastRun: '3d ago', totalRuns: 12, trigger: 'Deals: Status Change' },
  { id: '4', name: 'Weekly Metric Digest', description: 'Compile weekly revenue and engagement into a Slack message.', status: 'active', lastRun: '6d ago', totalRuns: 28, trigger: 'Schedule: Every Monday' },
];

const LOGS = [
  { id: '101', event: 'New Lead Auto-Reply', status: 'success', time: '10:42 AM', duration: '1.2s' },
  { id: '102', event: 'Social Post Sync', status: 'success', time: '09:15 AM', duration: '0.8s' },
  { id: '103', event: 'High-Value Alert', status: 'failed', time: 'Yesterday', duration: '0.1s', error: 'API Timeout' },
  { id: '104', event: 'New Lead Auto-Reply', status: 'success', time: 'Yesterday', duration: '1.1s' },
];

const Automations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AutomationTab>('active');
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);

  const tabs: { id: AutomationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'active', label: 'Active automations', icon: <Play size={16} /> },
    { id: 'create', label: 'Create automation', icon: <Plus size={16} /> },
    { id: 'triggers', label: 'Triggers', icon: <Zap size={16} /> },
    { id: 'actions', label: 'Actions', icon: <Settings size={16} /> },
    { id: 'logs', label: 'Logs', icon: <History size={16} /> },
    { id: 'ai', label: 'AI workflows', icon: <BrainCircuit size={16} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'active':
        return (
          <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {AUTOMATIONS.map((flow) => (
              <div key={flow.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all">
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-2xl ${flow.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'} transition-colors shadow-sm`}>
                    <Zap size={24} fill={flow.status === 'active' ? 'currentColor' : 'none'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base font-black text-gray-900">{flow.name}</h4>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${flow.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {flow.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium mb-2">{flow.description}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">Trigger: {flow.trigger}</span>
                      <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Runs: {flow.totalRuns}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right mr-4 hidden sm:block">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Run</p>
                    <p className="text-xs font-black text-gray-800">{flow.lastRun}</p>
                  </div>
                  <button className={`p-2 rounded-xl transition-all ${flow.status === 'active' ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                    {flow.status === 'active' ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button className="p-2 text-gray-300 hover:text-gray-600 rounded-lg">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Quick Action Card */}
            <div className="mt-8 bg-blue-50 p-6 rounded-3xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                   <Sparkles size={24} />
                 </div>
                 <div>
                   <h4 className="font-black text-blue-900">Automation Ideas</h4>
                   <p className="text-sm text-blue-700 font-medium leading-tight">Gemini suggested 3 new ways to save 5+ hours this week.</p>
                 </div>
               </div>
               <button onClick={() => setActiveTab('ai')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 whitespace-nowrap">
                 View Suggestions
               </button>
            </div>
          </div>
        );

      case 'create':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Visual Builder Header */}
             <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row gap-12">
                   <div className="flex-1 space-y-10">
                      <div>
                        <h3 className="text-lg font-black text-gray-900 mb-2">Workflow Builder</h3>
                        <p className="text-sm text-gray-500 font-medium">Design your logic step-by-step or pick a template.</p>
                      </div>
                      
                      {/* Visual Flow Mock */}
                      <div className="flex flex-col items-center gap-8 relative py-4">
                         {/* Trigger Node */}
                         <div className={`w-full max-w-sm p-4 rounded-2xl border-2 ${selectedTrigger ? 'border-blue-600 bg-blue-50' : 'border-dashed border-gray-200 bg-white'} flex items-center justify-between transition-all group cursor-pointer`}>
                            <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-xl ${selectedTrigger ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'} flex items-center justify-center`}>
                                  <Zap size={20} />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trigger</p>
                                  <p className="text-sm font-bold text-gray-800">{selectedTrigger || 'Select an event...'}</p>
                               </div>
                            </div>
                            {!selectedTrigger && <Plus size={18} className="text-gray-300 group-hover:text-blue-500" />}
                         </div>

                         {/* Arrow */}
                         <div className="w-0.5 h-8 bg-gray-200 relative">
                            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-r-2 border-gray-200 rotate-45" />
                         </div>

                         {/* Action Node */}
                         <div className="w-full max-w-sm p-4 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex items-center justify-between group grayscale opacity-50">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-white text-gray-300 flex items-center justify-center border border-gray-100">
                                  <Settings size={20} />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</p>
                                  <p className="text-sm font-bold text-gray-300 italic">Select an action...</p>
                               </div>
                            </div>
                            <Plus size={18} className="text-gray-200" />
                         </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                         <button className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-100 text-xs uppercase tracking-widest">
                           Enable Automation
                         </button>
                         <button className="px-6 py-3 border border-gray-200 text-gray-400 font-bold rounded-xl hover:bg-gray-50 text-xs uppercase tracking-widest">
                           Test
                         </button>
                      </div>
                   </div>

                   <div className="w-full md:w-80 bg-gray-50 rounded-3xl p-6 space-y-6">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quick Templates</h4>
                      <div className="space-y-3">
                         {[
                           { name: 'Auto-reply to DMs', icon: <MessageSquare size={14} />, color: 'blue' },
                           { name: 'Backup leads to Drive', icon: <Cloud size={14} />, color: 'indigo' },
                           { name: 'Social mirror post', icon: <Share2 size={14} />, color: 'pink' },
                           { name: 'Invoice reminders', icon: <History size={14} />, color: 'orange' },
                         ].map((tpl, i) => (
                           <button onClick={() => setSelectedTrigger(tpl.name)} key={i} className="w-full p-3 bg-white rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-sm transition-all text-left flex items-center gap-3 group">
                              <div className={`p-2 rounded-lg bg-${tpl.color}-50 text-${tpl.color}-600 group-hover:bg-${tpl.color}-600 group-hover:text-white transition-all`}>
                                 {tpl.icon}
                              </div>
                              <span className="text-xs font-bold text-gray-700">{tpl.name}</span>
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                   <Layout size={300} />
                </div>
             </div>
          </div>
        );

      case 'triggers':
      case 'actions':
        const isTriggers = activeTab === 'triggers';
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">{isTriggers ? 'Available Triggers' : 'Available Actions'}</h3>
                   <p className="text-xs text-gray-400 font-medium">Connect these building blocks to create powerful logic.</p>
                </div>
                <div className="relative">
                   <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                   <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-blue-50 transition-all" />
                </div>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {[
                 { name: 'CRM Update', icon: <Database size={24} />, color: 'blue' },
                 { name: 'Social Mention', icon: <AtSign size={24} />, color: 'pink' },
                 { name: 'Incoming Message', icon: <MessageSquare size={24} />, color: 'indigo' },
                 { name: 'Email Received', icon: <Cloud size={24} />, color: 'orange' },
                 { name: 'New Lead', icon: <Users size={24} />, color: 'emerald' },
                 { name: 'Scheduled Time', icon: <History size={24} />, color: 'purple' },
                 { name: 'Webhook Hit', icon: <Code size={24} />, color: 'gray' },
                 { name: 'Payment Success', icon: <DollarSign size={24} />, color: 'amber' },
               ].map((item, idx) => (
                 <button key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center gap-4 text-center group">
                   <div className={`p-5 rounded-2xl bg-${item.color}-50 text-${item.color}-600 group-hover:bg-blue-600 group-hover:text-white transition-all`}>
                     {item.icon}
                   </div>
                   <p className="text-xs font-black text-gray-800 uppercase tracking-widest">{item.name}</p>
                 </button>
               ))}
             </div>
          </div>
        );

      case 'logs':
        return (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
              <div>
                 <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">Execution History</h3>
                 <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Real-time engine status</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2.5 bg-white border border-gray-100 text-gray-400 hover:text-gray-600 rounded-xl transition-all shadow-sm"><Search size={18} /></button>
                <button className="p-2.5 bg-white border border-gray-100 text-gray-400 hover:text-gray-600 rounded-xl transition-all shadow-sm"><Filter size={18} /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/10">
                    <th className="px-8 py-5">Workflow</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Time</th>
                    <th className="px-8 py-5">Duration</th>
                    <th className="px-8 py-5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {LOGS.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-all group">
                      <td className="px-8 py-5 font-bold text-gray-800 text-sm">{log.event}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-1.5">
                          {log.status === 'success' ? <CheckCircle2 size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                          <span className={`text-[10px] font-black uppercase ${log.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {log.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-xs text-gray-400 font-bold uppercase">{log.time}</td>
                      <td className="px-8 py-5 text-xs text-gray-400 font-medium">{log.duration}</td>
                      <td className="px-8 py-5 text-right">
                        <button className="p-2 text-gray-300 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-blue-100 relative overflow-hidden">
               <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-6">
                   <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/20">
                     <BrainCircuit size={32} />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black tracking-tight">AI Workflow Intelligence</h3>
                     <p className="text-indigo-100 font-medium">Gemini-powered business automation.</p>
                   </div>
                 </div>
                 <p className="text-indigo-100 max-w-xl leading-relaxed font-medium mb-10 text-lg">
                   Automatically process natural language inputs into structured business actions. Score leads, draft replies, and categorize feedback without lifting a finger.
                 </p>
                 <button className="px-10 py-4 bg-white text-indigo-600 font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-50 transition-all shadow-xl shadow-white/10 flex items-center gap-3 text-xs">
                   Build Custom AI Agent <ArrowRight size={20} />
                 </button>
               </div>
               <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />
               <div className="absolute top-10 right-10 opacity-10 animate-pulse">
                  <Wand2 size={200} />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { name: 'Sentiment Router', desc: 'Analyzes the mood of incoming DMs and routes high-priority complaints or praise to specific folders.', runs: '4.2k', status: 'Active', icon: <Smile size={20} /> },
                { name: 'Smart Proposal Drafter', desc: 'When a lead says "Send me more info", Gemini drafts a proposal based on past successful wins.', runs: '890', status: 'Draft', icon: <FileText size={20} /> },
                { name: 'Inbox Summarizer', desc: 'Daily morning digest of all cross-platform messages grouped by project.', runs: '1.5k', status: 'Active', icon: <Layout size={20} /> },
                { name: 'Lead Velocity Scorer', desc: 'Predicts deal closure probability based on communication patterns.', runs: '320', status: 'Testing', icon: <TrendingUp size={20} /> },
              ].map((ai, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all group">
                  <div className="flex justify-between items-start mb-8">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                       {ai.icon}
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      ai.status === 'Active' ? 'bg-green-50 text-green-600' : 
                      ai.status === 'Draft' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {ai.status}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-gray-900 mb-3">{ai.name}</h4>
                  <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed h-12 overflow-hidden">{ai.desc}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{ai.runs} Runs this month</span>
                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 hover:gap-2 transition-all">
                      Configure <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-24 text-center space-y-8 shadow-sm">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto animate-bounce">
              <Zap size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900">Module Initializing</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mt-2 leading-relaxed font-medium">
                The visual automation builder is being optimized for touch and desktop. Hang tight!
              </p>
            </div>
            <button onClick={() => setActiveTab('active')} className="px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all text-xs shadow-2xl shadow-blue-100">
              Return to Workflows
            </button>
          </div>
        );
    }
  };

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Workflow Automations</h2>
          <p className="text-gray-500 text-lg font-medium">Clone yourself through intelligent, time-saving business logic.</p>
        </div>
        <div className="flex gap-3">
           <div className="flex items-center gap-3 px-5 py-2.5 bg-white border border-gray-100 rounded-2xl shadow-sm">
             <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[11px] font-black text-gray-600 uppercase tracking-widest">Engine: Healthy</span>
           </div>
           <button onClick={() => setActiveTab('create')} className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2">
             <Plus size={18} /> Create Workflow
           </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-gray-200 sticky top-16 bg-gray-50/95 backdrop-blur-md z-20 overflow-x-auto no-scrollbar -mx-8 px-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedTrigger(null);
            }}
            className={`flex items-center gap-2 px-8 py-6 text-sm font-bold transition-all border-b-4 -mb-[2px] whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600 bg-blue-50/10' 
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
            }`}
          >
            <span className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-300 transition-colors group-hover:text-blue-500'}>{tab.icon}</span>
            <span className="uppercase tracking-widest text-[11px] font-black">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-4">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Helper Icons
const AtSign = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>
);

const Smile = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
);

export default Automations;
