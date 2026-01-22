import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Building2, Tag, Calendar, MessageSquare, PhoneCall,
  FileText, Plus, Sparkles, Send, CheckCircle2, Clock, TrendingUp,
  Share2, Target, Activity, X, Edit2, Trash2, ArrowLeft, MoreVertical,
  Instagram, Facebook, Twitter, Linkedin, Mail as MailIcon, MessageCircle as MessageCircleIcon
} from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { useContacts } from '../src/hooks/useContacts';
import { useCustomers } from '../src/hooks/useCustomers';
import { useCustomerTimeline } from '../src/hooks/useCustomerTimeline';

type ProfileTab = 'timeline' | 'deals' | 'campaigns' | 'messages' | 'tasks' | 'notes' | 'activity';

interface CustomerProfileProps {
  customerId: string;
  onBack: () => void;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customerId, onBack }) => {
  const { contacts } = useContacts();
  const { customers } = useCustomers();
  const { items: timelineItems, isLoading: isTimelineLoading } = useCustomerTimeline(customerId);
  
  // Check both contacts and customers tables
  const contact = contacts?.find(c => c.id === customerId);
  const customer = customers?.find(c => c.id === customerId);
  
  // Prefer customer over contact if both exist, but use contact data structure
  const displayCustomer = customer || contact;
  const [activeTab, setActiveTab] = useState<ProfileTab>('timeline');
  const [engagementScore, setEngagementScore] = useState(82);

  // Mock deals
  const deals = [
    { id: '1', name: 'Website Package', stage: 'Proposal', value: 12000, owner: 'Vusi' },
    { id: '2', name: 'Maintenance', stage: 'Negotiation', value: 3000, owner: 'Sales Team' },
  ];

  // Mock campaigns
  const campaigns = [
    { name: 'January Promo', action: 'Clicked', date: '12 Jan' },
    { name: 'Valentine Discount', action: 'Viewed', date: '05 Feb' },
  ];

  // Mock messages
  const messages = [
    { platform: 'WhatsApp', content: 'Hello, I\'m interested in your services', time: '2 hours ago', direction: 'inbound' },
    { platform: 'Email', subject: 'Re: Welcome Offer', time: 'Yesterday', direction: 'inbound' },
  ];

  // Mock tasks
  const tasks = [
    { id: '1', title: 'Follow up call', due: 'Due today', completed: false },
    { id: '2', title: 'Send proposal', due: 'Tomorrow', completed: false },
  ];

  // Mock notes
  const notes = [
    { id: '1', content: 'Customer prefers WhatsApp', author: 'Vusi', time: '2 days ago' },
    { id: '2', content: 'Decision maker is brother', author: 'Sales Team', time: '1 week ago' },
  ];

  if (!displayCustomer) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Customer not found</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  // Handle both contact and customer data structures
  const customerName = (displayCustomer as any)?.full_name || (displayCustomer as any)?.name || `${(displayCustomer as any)?.first_name || ''} ${(displayCustomer as any)?.last_name || ''}`.trim() || 'Unknown';
  const initials = customerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        <span>Back to Customers</span>
      </button>

      {/* Customer Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              {(displayCustomer as any)?.avatar_url ? (
                <img src={(displayCustomer as any).avatar_url} alt={customerName} className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 mb-1">{customerName}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                {displayCustomer.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail size={14} />
                    <span>{displayCustomer.email}</span>
                  </div>
                )}
                {(displayCustomer.phone || (displayCustomer as any).mobile) && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={14} />
                    <span>{displayCustomer.phone || (displayCustomer as any).mobile}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {(displayCustomer as any).lead_source && (
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    Source: {(displayCustomer as any).lead_source}
                  </span>
                )}
                <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                  (displayCustomer as any).status === 'customer' || (displayCustomer as any).status === 'active' ? 'bg-green-100 text-green-700' :
                  (displayCustomer as any).status === 'qualified' || (displayCustomer as any).lifecycle_stage === 'lead' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {(displayCustomer as any).status || (displayCustomer as any).lifecycle_stage || 'unknown'}
                </span>
                {displayCustomer.tags && displayCustomer.tags.length > 0 && (
                  <div className="flex gap-1">
                    {displayCustomer.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs font-bold text-orange-600">
                  <TrendingUp size={14} />
                  Engagement Score: {engagementScore}%
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
            <Send size={16} /> Send Message
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
            <PhoneCall size={16} /> Log Call
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
            <FileText size={16} /> Add Note
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
            <Plus size={16} /> Create Deal
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
            <Sparkles size={16} /> AI Suggest Reply
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {[
                { id: 'timeline', label: 'Timeline', icon: <Clock size={16} /> },
                { id: 'deals', label: 'Deals', icon: <Target size={16} /> },
                { id: 'campaigns', label: 'Campaigns', icon: <Share2 size={16} /> },
                { id: 'messages', label: 'Messages', icon: <MessageCircleIcon size={16} /> },
                { id: 'tasks', label: 'Tasks', icon: <CheckCircle2 size={16} /> },
                { id: 'notes', label: 'Notes', icon: <FileText size={16} /> },
                { id: 'activity', label: 'Activity', icon: <Activity size={16} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ProfileTab)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
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
                  {isTimelineLoading ? (
                    <p className="text-sm text-gray-500">Loading timeline...</p>
                  ) : timelineItems.length === 0 ? (
                    <p className="text-sm text-gray-500">No timeline activity yet.</p>
                  ) : (
                    timelineItems.map((event) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-gray-900">
                              {event.type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(event.activityDate).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">{event.title}</p>
                          {event.content && (
                            <p className="text-sm text-gray-600">{event.content}</p>
                          )}
                          {event.value && (
                            <p className="text-sm text-gray-700 font-bold">Value: {event.value}</p>
                          )}
                          {event.platform && (
                            <span className="text-xs text-gray-500">Platform: {event.platform}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'deals' && (
                <div className="space-y-3">
                  {deals.map((deal) => (
                    <div key={deal.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{deal.name}</p>
                          <p className="text-sm text-gray-500">Stage: {deal.stage} • Owner: {deal.owner}</p>
                        </div>
                        <p className="text-lg font-black text-gray-900">E{deal.value.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'campaigns' && (
                <div className="space-y-3">
                  {campaigns.map((campaign, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{campaign.name}</p>
                          <p className="text-sm text-gray-500">Action: {campaign.action}</p>
                        </div>
                        <p className="text-sm text-gray-500">{campaign.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'messages' && (
                <div className="space-y-3">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">{msg.platform}</span>
                        <span className="text-xs text-gray-400">{msg.time}</span>
                      </div>
                      {msg.content && <p className="text-sm text-gray-700">{msg.content}</p>}
                      {msg.subject && <p className="text-sm text-gray-700">{msg.subject}</p>}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={task.completed} className="w-4 h-4" />
                        <div>
                          <p className="font-bold text-gray-900">{task.title}</p>
                          <p className="text-sm text-gray-500">{task.due}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-700 mb-2">{note.content}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
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
                  <p className="text-sm text-gray-500">Activity logs will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">Customer Summary</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Lead Source</p>
                <p className="text-gray-900">{(displayCustomer as any).lead_source || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">First Seen</p>
                <p className="text-gray-900">{new Date(displayCustomer.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Last Activity</p>
                <p className="text-gray-900">{(displayCustomer as any).last_activity_at ? new Date((displayCustomer as any).last_activity_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total Messages</p>
                <p className="text-gray-900">24</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Campaigns</p>
                <p className="text-gray-900">3</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Deals</p>
                <p className="text-gray-900">2</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Revenue</p>
                <p className="text-gray-900 font-black">E15,000</p>
              </div>
            </div>
          </div>

          {/* AI Panel */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-purple-600" />
              <h3 className="text-sm font-black text-gray-900">AI Insights</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">• Likely to convert (High)</p>
              <p className="text-gray-700">• Best contact time: 6pm–8pm</p>
              <p className="text-gray-700">• Suggested reply tone: Friendly</p>
              <p className="text-gray-700">• Recommended campaign: Promo B</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
