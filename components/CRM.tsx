
import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Building2, 
  Target, 
  Trello, 
  FileText, 
  History, 
  Plus, 
  Search, 
  MoreVertical, 
  Mail, 
  Phone, 
  Tag, 
  ChevronRight,
  Filter,
  ArrowUpRight,
  Clock,
  Calendar,
  X,
  Check,
  Edit2,
  Trash2
} from 'lucide-react';

type CRMTab = 'contacts' | 'companies' | 'leads' | 'pipelines' | 'notes' | 'history';

interface Contact {
  id: string;
  name: string;
  email: string;
  status: 'Customer' | 'Lead' | 'Prospect';
  company: string;
  lastContact: string;
  color: string;
}

const INITIAL_CONTACTS: Contact[] = [
  { id: '1', name: 'Sarah Miller', email: 'sarah@techflow.io', status: 'Customer', company: 'TechFlow Inc.', lastContact: '2 days ago', color: 'indigo' },
  { id: '2', name: 'Marcus Chen', email: 'm.chen@designhub.com', status: 'Lead', company: 'Design Hub', lastContact: '5h ago', color: 'orange' },
  { id: '3', name: 'Emma Watson', email: 'emma@creative.co', status: 'Prospect', company: 'Creative Co.', lastContact: '1 week ago', color: 'blue' },
  { id: '4', name: 'David Lee', email: 'd.lee@startup.net', status: 'Customer', company: 'Startup.net', lastContact: 'Yesterday', color: 'indigo' },
];

const CRM: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CRMTab>('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: 'Prospect' as Contact['status'],
    company: ''
  });

  const tabs: { id: CRMTab; label: string; icon: React.ReactNode }[] = [
    { id: 'contacts', label: 'Contacts', icon: <Users size={16} /> },
    { id: 'companies', label: 'Companies', icon: <Building2 size={16} /> },
    { id: 'leads', label: 'Leads', icon: <Target size={16} /> },
    { id: 'pipelines', label: 'Pipelines', icon: <Trello size={16} /> },
    { id: 'notes', label: 'Notes & activities', icon: <FileText size={16} /> },
    { id: 'history', label: 'Communication history', icon: <History size={16} /> },
  ];

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({ name: '', email: '', status: 'Prospect', company: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({ 
      name: contact.name, 
      email: contact.email, 
      status: contact.status, 
      company: contact.company 
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      setContacts(contacts.filter(c => c.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContact) {
      setContacts(contacts.map(c => c.id === editingContact.id ? { 
        ...c, 
        ...formData 
      } : c));
    } else {
      const colors = ['indigo', 'blue', 'orange', 'emerald', 'purple', 'pink'];
      const newContact: Contact = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        lastContact: 'Just now',
        color: colors[Math.floor(Math.random() * colors.length)]
      };
      setContacts([newContact, ...contacts]);
    }
    setIsModalOpen(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'contacts':
        return (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30 dark:bg-slate-800/20">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search contacts..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all">
                  <Filter size={16} /> Filter
                </button>
                <button 
                  onClick={openAddModal}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all"
                >
                  <Plus size={16} /> Add Contact
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-slate-800">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Last Contact</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full bg-${contact.color}-50 dark:bg-${contact.color}-900/20 text-${contact.color}-600 flex items-center justify-center font-black text-xs`}>
                              {contact.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{contact.name}</p>
                              <p className="text-[10px] text-gray-400 font-medium">{contact.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            contact.status === 'Customer' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 
                            contact.status === 'Lead' ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' : 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          }`}>
                            {contact.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400 font-medium">{contact.company}</td>
                        <td className="px-6 py-4 text-xs text-gray-400 font-bold uppercase">{contact.lastContact}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => openEditModal(contact)}
                              className="p-2 text-gray-400 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(contact.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg" title="Send Mail">
                              <Mail size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic">No contacts found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'pipelines':
        return (
          <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar">
            {[
              { title: 'Prospecting', deals: 3, total: '$12k', items: ['Global Brand Deal', 'Agency Collab', 'Course Launch'] },
              { title: 'Negotiation', deals: 2, total: '$8.5k', items: ['SolarTech Retainer', 'UI Kit Bulk'] },
              { title: 'Verbal Won', deals: 1, total: '$5k', items: ['SaaS Dashboard Design'] },
              { title: 'Closed Won', deals: 12, total: '$45k', items: ['App Refresh', 'Landing Page X'] },
            ].map((col, idx) => (
              <div key={idx} className="min-w-[280px] w-[280px] flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div>
                    <h4 className="text-sm font-black text-gray-800 dark:text-slate-200 uppercase tracking-widest">{col.title}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{col.deals} Deals • {col.total}</p>
                  </div>
                  <button className="text-gray-300 hover:text-gray-600"><Plus size={16} /></button>
                </div>
                <div className="bg-gray-100/50 dark:bg-slate-800/20 rounded-2xl p-2 min-h-[400px] flex flex-col gap-2 border border-gray-100 dark:border-slate-800">
                  {col.items.map((item, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:border-brand-200 dark:hover:border-brand-900 transition-all cursor-grab active:cursor-grabbing group">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold text-gray-900 dark:text-slate-100 line-clamp-2">{item}</p>
                        <button className="opacity-0 group-hover:opacity-100 transition-all text-gray-300"><MoreVertical size={14} /></button>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] font-black text-brand-600 uppercase">Medium Priority</span>
                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-800 border border-white dark:border-slate-700 flex items-center justify-center text-[8px] font-bold text-gray-500">
                          {item.charAt(0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'leads':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Skyline Real Estate', source: 'Web Form', value: '$2,400', status: 'Hot', time: '2h ago' },
              { name: 'PetCare Solutions', source: 'LinkedIn DM', value: '$1,200', status: 'Warm', time: '5h ago' },
              { name: 'Modern Architecture', source: 'Email Outbound', value: '$8,000', status: 'Hot', time: 'Yesterday' },
              { name: 'Local Coffee Shop', source: 'Referral', value: '$500', status: 'Cold', time: '2 days ago' },
            ].map((lead, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm hover:border-brand-200 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    lead.status === 'Hot' ? 'bg-red-50 text-red-600' : 
                    lead.status === 'Warm' ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {lead.status} Lead
                  </span>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{lead.time}</p>
                </div>
                <h4 className="text-base font-black text-gray-900 dark:text-slate-100 mb-1">{lead.name}</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-4">Source: {lead.source}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Est. Value</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{lead.value}</p>
                  </div>
                  <button className="p-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 rounded-xl hover:bg-brand-600 hover:text-white transition-all">
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'notes':
        return (
          <div className="max-w-2xl mx-auto space-y-8 pb-12">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm focus-within:ring-4 focus-within:ring-brand-50/20 transition-all">
               <textarea 
                placeholder="Log a new activity or quick note..." 
                className="w-full h-24 p-2 bg-transparent text-sm font-medium outline-none resize-none dark:text-slate-200"
               />
               <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50 dark:border-slate-800">
                 <div className="flex gap-2">
                   <button className="p-2 text-gray-400 hover:text-brand-600 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg"><Clock size={16} /></button>
                   <button className="p-2 text-gray-400 hover:text-brand-600 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg"><Tag size={16} /></button>
                 </div>
                 <button className="px-4 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20">Log Activity</button>
               </div>
            </div>

            <div className="relative space-y-6">
              <div className="absolute left-4 top-2 bottom-0 w-px bg-gray-100 dark:bg-slate-800"></div>
              {[
                { type: 'Call', text: 'Spoke with Sarah about the Q3 project scope. She requested a new quote by Friday.', time: '2h ago', icon: <Phone size={12} /> },
                { type: 'Meeting', text: 'Internal review of the pipeline. Moved 3 leads to negotiation phase.', time: '5h ago', icon: <Users size={12} /> },
                { type: 'Email', text: 'Sent proposal to Skyline Real Estate. Awaiting their response.', time: 'Yesterday', icon: <Mail size={12} /> },
              ].map((note, idx) => (
                <div key={idx} className="relative pl-10">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-brand-500 z-10"></div>
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm group hover:border-brand-100 dark:hover:border-brand-900 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center gap-1 text-[10px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-full">
                        {note.icon} {note.type}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{note.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium leading-relaxed">{note.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-16 text-center space-y-6 shadow-sm">
            <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center text-brand-600 mx-auto">
              {tabs.find(t => t.id === activeTab)?.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">{tabs.find(t => t.id === activeTab)?.label}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed font-medium">
                This CRM module is being built to handle deep business relationships for solo operators.
              </p>
            </div>
            <button className="px-8 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all text-sm">
              Explore Feature
            </button>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-slate-800 sticky top-16 bg-gray-50/90 dark:bg-slate-950/90 backdrop-blur-sm z-20 overflow-x-auto no-scrollbar">
        <div className="flex whitespace-nowrap scroll-smooth">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all border-b-2 -mb-[2px] ${
                activeTab === tab.id 
                  ? 'border-brand-600 text-brand-600' 
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-brand-600' : 'text-gray-300'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        {renderTabContent()}
      </div>

      {/* Add/Edit CRM Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 tracking-tight">
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100 appearance-none"
                  >
                    <option value="Prospect">Prospect</option>
                    <option value="Lead">Lead</option>
                    <option value="Customer">Customer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company</label>
                  <input 
                    required
                    type="text" 
                    value={formData.company}
                    onChange={e => setFormData({...formData, company: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                    placeholder="Company Name"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-3 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 shadow-xl shadow-brand-500/20 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Check size={18} /> {editingContact ? 'Update Contact' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM;
