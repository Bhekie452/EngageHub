import React, { useState } from 'react';
import {
  Building2, Mail, Phone, Globe, Tag, Calendar, MessageSquare, PhoneCall,
  FileText, Plus, Sparkles, Send, CheckCircle2, Clock, TrendingUp,
  Share2, Target, Activity, ArrowLeft, MoreVertical, Users,
  Instagram, Facebook, Twitter, Linkedin, Mail as MailIcon, MessageCircle as MessageCircleIcon
} from 'lucide-react';
import { useCompanies } from '../src/hooks/useCompanies';

type ProfileTab = 'timeline' | 'deals' | 'campaigns' | 'contacts' | 'tasks' | 'notes' | 'activity';

interface CompanyProfileProps {
  companyId: string;
  onBack: () => void;
}

const CompanyProfile: React.FC<CompanyProfileProps> = ({ companyId, onBack }) => {
  const { companies } = useCompanies();
  const company = companies?.find(c => c.id === companyId);
  const [activeTab, setActiveTab] = useState<ProfileTab>('timeline');
  const [engagementScore, setEngagementScore] = useState(75);

  // Mock data for timeline
  const timelineEvents = [
    { type: 'social', platform: 'LinkedIn', action: 'Company Page Viewed', content: 'Viewed company profile', time: '1 day ago', color: 'blue' },
    { type: 'email', action: 'Email Opened', subject: 'Partnership Proposal', time: '2 days ago', color: 'green' },
    { type: 'deal', action: 'Deal Moved', stage: 'Negotiation → Won', value: 'E45,000', time: '5 days ago', color: 'purple' },
    { type: 'contact', action: 'Contact Added', content: 'New contact: John Doe', time: '1 week ago', color: 'orange' },
  ];

  // Mock deals
  const deals = [
    { id: '1', name: 'Enterprise Package', stage: 'Won', value: 45000, owner: 'Sales Team' },
    { id: '2', name: 'Annual Maintenance', stage: 'Negotiation', value: 12000, owner: 'Account Manager' },
  ];

  // Mock campaigns
  const campaigns = [
    { name: 'Q1 Enterprise Campaign', action: 'Engaged', date: '15 Jan' },
    { name: 'Partnership Outreach', action: 'Opened', date: '10 Feb' },
  ];

  // Mock contacts at company
  const companyContacts = [
    { id: '1', name: 'John Doe', role: 'CEO', email: 'john@company.com' },
    { id: '2', name: 'Jane Smith', role: 'CTO', email: 'jane@company.com' },
  ];

  // Mock tasks
  const tasks = [
    { id: '1', title: 'Follow up on proposal', due: 'Due today', completed: false },
    { id: '2', title: 'Schedule demo call', due: 'Tomorrow', completed: false },
  ];

  // Mock notes
  const notes = [
    { id: '1', content: 'Company is expanding to new markets', author: 'Sales Team', time: '3 days ago' },
    { id: '2', content: 'Decision maker prefers email communication', author: 'Account Manager', time: '1 week ago' },
  ];

  if (!company) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Company not found</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  const companyName = company.name || 'Unknown Company';
  const initials = companyName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        <span>Back to Companies</span>
      </button>

      {/* Company Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              {company.logo_url ? (
                <img src={company.logo_url} alt={companyName} className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-1">{companyName}</h1>
              {company.legal_name && (
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">{company.legal_name}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400 mb-2 flex-wrap">
                {company.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail size={14} />
                    <span>{company.email}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={14} />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-1.5">
                    <Globe size={14} />
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {company.website}
                    </a>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {company.industry && (
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">
                    {company.industry}
                  </span>
                )}
                {company.company_size && (
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">
                    {company.company_size}
                  </span>
                )}
                <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                  company.lifecycle_stage === 'customer' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                  company.lifecycle_stage === 'opportunity' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' :
                  'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                }`}>
                  {company.lifecycle_stage || 'lead'}
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400">
                  <TrendingUp size={14} />
                  Engagement Score: {engagementScore}%
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
            <Send size={16} /> Send Message
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <PhoneCall size={16} /> Log Call
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <FileText size={16} /> Add Note
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <Plus size={16} /> Create Deal
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <Users size={16} /> Add Contact
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
            <div className="flex border-b border-gray-200 dark:border-slate-800 overflow-x-auto">
              {[
                { id: 'timeline', label: 'Timeline', icon: <Clock size={16} /> },
                { id: 'deals', label: 'Deals', icon: <Target size={16} /> },
                { id: 'campaigns', label: 'Campaigns', icon: <Share2 size={16} /> },
                { id: 'contacts', label: 'Contacts', icon: <Users size={16} /> },
                { id: 'tasks', label: 'Tasks', icon: <CheckCircle2 size={16} /> },
                { id: 'notes', label: 'Notes', icon: <FileText size={16} /> },
                { id: 'activity', label: 'Activity', icon: <Activity size={16} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ProfileTab)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  {timelineEvents.map((event, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        event.color === 'green' ? 'bg-green-500' :
                        event.color === 'blue' ? 'bg-blue-500' :
                        event.color === 'purple' ? 'bg-purple-500' :
                        'bg-orange-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
                            {event.platform && `${event.platform} `}{event.action}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-slate-400">{event.time}</span>
                        </div>
                        {event.content && (
                          <p className="text-sm text-gray-700 dark:text-slate-300 mb-1">{event.content}</p>
                        )}
                        {event.subject && (
                          <p className="text-sm text-gray-700 dark:text-slate-300 mb-1">Subject: {event.subject}</p>
                        )}
                        {event.stage && (
                          <p className="text-sm text-gray-700 dark:text-slate-300 mb-1">
                            Stage: {event.stage} {event.value && `• Value: ${event.value}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'deals' && (
                <div className="space-y-3">
                  {deals.map((deal) => (
                    <div key={deal.id} className="p-4 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-slate-100">{deal.name}</p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">Stage: {deal.stage} • Owner: {deal.owner}</p>
                        </div>
                        <p className="text-lg font-black text-gray-900 dark:text-slate-100">E{deal.value.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'campaigns' && (
                <div className="space-y-3">
                  {campaigns.map((campaign, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-slate-100">{campaign.name}</p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">Action: {campaign.action}</p>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400">{campaign.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'contacts' && (
                <div className="space-y-3">
                  {companyContacts.map((contact) => (
                    <div key={contact.id} className="p-4 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-slate-100">{contact.name}</p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">{contact.role} • {contact.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-4 border border-gray-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={task.completed} className="w-4 h-4" />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-slate-100">{task.title}</p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">{task.due}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 border border-gray-200 dark:border-slate-800 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">{note.content}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                        <span>{note.author}</span>
                        <span>•</span>
                        <span>{note.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-slate-400">Activity logs will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-sm font-black text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-4">Company Summary</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Industry</p>
                <p className="text-gray-900 dark:text-slate-100">{company.industry || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Company Size</p>
                <p className="text-gray-900 dark:text-slate-100">{company.company_size || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">First Seen</p>
                <p className="text-gray-900 dark:text-slate-100">{new Date(company.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Last Activity</p>
                <p className="text-gray-900 dark:text-slate-100">{company.updated_at ? new Date(company.updated_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Total Contacts</p>
                <p className="text-gray-900 dark:text-slate-100">{companyContacts.length}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Campaigns</p>
                <p className="text-gray-900 dark:text-slate-100">{campaigns.length}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Deals</p>
                <p className="text-gray-900 dark:text-slate-100">{deals.length}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Revenue</p>
                <p className="text-gray-900 dark:text-slate-100 font-black">E{deals.reduce((sum, d) => sum + d.value, 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* AI Panel */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-black text-gray-900 dark:text-slate-100">AI Insights</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700 dark:text-slate-300">• High-value opportunity (Enterprise)</p>
              <p className="text-gray-700 dark:text-slate-300">• Best contact time: 9am–11am</p>
              <p className="text-gray-700 dark:text-slate-300">• Suggested approach: Partnership</p>
              <p className="text-gray-700 dark:text-slate-300">• Recommended campaign: Enterprise Outreach</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
