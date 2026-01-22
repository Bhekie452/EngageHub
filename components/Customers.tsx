
import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  UserMinus, 
  Layers, 
  Tag, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Mail, 
  ChevronRight,
  TrendingUp,
  CreditCard,
  MessageCircle,
  ArrowUpRight,
  X,
  Edit2,
  Trash2,
  Check,
  RefreshCw
} from 'lucide-react';
import { useCustomers } from '../src/hooks/useCustomers';
import CustomerProfile from './CustomerProfile';

type CustomerTab = 'all' | 'active' | 'lead' | 'inactive';

const Customers: React.FC = () => {
  const { customers, isLoading, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const [activeTab, setActiveTab] = useState<CustomerTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Reset selectedCustomerId if it's invalid or customers are loaded and it doesn't exist
  React.useEffect(() => {
    if (!isLoading && customers && selectedCustomerId) {
      const customerExists = customers.some(c => c.id === selectedCustomerId);
      if (!customerExists) {
        setSelectedCustomerId(null);
      }
    }
  }, [customers, isLoading, selectedCustomerId]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    customer_type: 'individual' as 'individual' | 'company',
    lifecycle_stage: 'lead' as 'lead' | 'prospect' | 'client',
    status: 'active' as 'active' | 'inactive',
    social_profiles: {
      twitter: '',
      linkedin: '',
      instagram: '',
      facebook: '',
      youtube: ''
    },
    notes: '',
    tags: ''
  });

  const suggestedTags = ['VIP', 'Influencer', 'Enterprise'];

  const tabs: { id: CustomerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All customers', icon: <Users size={16} /> },
    { id: 'active', label: 'Active', icon: <UserCheck size={16} /> },
    { id: 'lead', label: 'Leads', icon: <UserPlus size={16} /> },
    { id: 'inactive', label: 'Inactive', icon: <UserMinus size={16} /> },
  ];

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    return customers.filter(c => {
      const customerName = c.name || '';
      const matchesSearch = customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (c.phone && c.phone.toLowerCase().includes(searchQuery.toLowerCase()));
      if (activeTab === 'all') return matchesSearch;
      if (activeTab === 'active') return matchesSearch && c.status === 'active';
      if (activeTab === 'lead') return matchesSearch && (c.lifecycle_stage === 'lead' || !c.lifecycle_stage);
      if (activeTab === 'inactive') return matchesSearch && c.status === 'inactive';
      return false;
    });
  }, [activeTab, searchQuery, customers]);

  const openEditModal = (customer: any) => {
    const resolvedType: 'individual' | 'company' =
      customer.customer_type || (customer.company || customer.company_name ? 'company' : 'individual');

    setEditingCustomer(customer);
    const socialProfiles = typeof customer.social_profiles === 'object' && customer.social_profiles 
      ? customer.social_profiles 
      : { twitter: '', linkedin: '', instagram: '', facebook: '', youtube: '' };
    
    setFormData({ 
      name: customer.name, 
      email: customer.email,
      phone: customer.phone || '',
      company: resolvedType === 'company' ? (customer.company || '') : '',
      customer_type: resolvedType,
      lifecycle_stage: customer.lifecycle_stage || 'lead',
      status: customer.status === 'active' || customer.status === 'inactive' ? customer.status : 'active',
      social_profiles: {
        twitter: socialProfiles.twitter || '',
        linkedin: socialProfiles.linkedin || '',
        instagram: socialProfiles.instagram || '',
        facebook: socialProfiles.facebook || '',
        youtube: socialProfiles.youtube || ''
      },
      notes: customer.notes || '',
      tags: customer.tags ? customer.tags.join(', ') : ''
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ 
      name: '', 
      email: '',
      phone: '',
      company: '',
      customer_type: 'individual',
      lifecycle_stage: 'lead',
      status: 'active',
      social_profiles: {
        twitter: '',
        linkedin: '',
        instagram: '',
        facebook: '',
        youtube: ''
      },
      notes: '',
      tags: ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      await deleteCustomer.mutateAsync(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert comma-separated tags string to array
    const tagsArray = formData.tags 
      ? formData.tags.split(',').map(s => s.trim()).filter(s => s)
      : [];

    // For company customers, persist the name as the company value.
    // For individuals, we clear any company value.
    const companyValue = formData.customer_type === 'company' ? formData.name : '';
    
    // Clean social profiles - only include non-empty values
    const cleanedSocialProfiles: any = {};
    if (formData.social_profiles.twitter) cleanedSocialProfiles.twitter = formData.social_profiles.twitter;
    if (formData.social_profiles.linkedin) cleanedSocialProfiles.linkedin = formData.social_profiles.linkedin;
    if (formData.social_profiles.instagram) cleanedSocialProfiles.instagram = formData.social_profiles.instagram;
    if (formData.social_profiles.facebook) cleanedSocialProfiles.facebook = formData.social_profiles.facebook;
    if (formData.social_profiles.youtube) cleanedSocialProfiles.youtube = formData.social_profiles.youtube;
    
    if (editingCustomer) {
      await updateCustomer.mutateAsync({ 
        id: editingCustomer.id, 
        updates: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: companyValue,
          customer_type: formData.customer_type,
          lifecycle_stage: formData.lifecycle_stage,
          status: formData.status,
          social_profiles: cleanedSocialProfiles,
          notes: formData.notes,
          tags: tagsArray
        }
      });
    } else {
      await createCustomer.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: companyValue,
        customer_type: formData.customer_type,
        lifecycle_stage: formData.lifecycle_stage,
        status: formData.status,
        social_profiles: cleanedSocialProfiles,
        notes: formData.notes,
        tags: tagsArray
      });
    }
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData({ 
      name: '', 
      email: '', 
      phone: '', 
      company: '', 
      customer_type: 'individual', 
      lifecycle_stage: 'lead',
      status: 'active',
      social_profiles: { twitter: '', linkedin: '', instagram: '', facebook: '', youtube: '' },
      notes: '', 
      tags: '' 
    });
  };

  // Show customer profile if one is selected AND customer exists
  if (selectedCustomerId) {
    // Check if customer exists before showing profile
    const customerExists = customers?.some(c => c.id === selectedCustomerId);
    if (customerExists) {
      return (
        <CustomerProfile
          customerId={selectedCustomerId}
          onBack={() => setSelectedCustomerId(null)}
        />
      );
    }
    // If customer doesn't exist, useEffect will reset selectedCustomerId, so we continue to show list
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 animate-spin text-brand-600 mx-auto" />
          <p className="text-gray-500">Loading customers...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    if (['all', 'active', 'lead', 'inactive'].includes(activeTab)) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30 dark:bg-slate-800/20">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search customers..." 
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
                <Plus size={16} /> New Customer
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-slate-800">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Tags</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => {
                    const customerName = customer.full_name || customer.name || 'Unknown';
                    const initials = customerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <tr
                        key={customer.id}
                        onClick={() => setSelectedCustomerId(customer.id)}
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
                              {customer.avatar_url ? (
                                <img src={customer.avatar_url} alt={customerName} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                initials
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{customerName}</p>
                              <p className="text-[10px] text-gray-400 font-medium">{customer.email || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                              customer.customer_type === 'company'
                                ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300'
                                : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'
                            }`}
                          >
                            {customer.customer_type === 'company' ? 'Company' : 'Individual'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                            customer.lifecycle_stage === 'client' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 
                            customer.lifecycle_stage === 'prospect' ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' : 
                            'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          }`}>
                            {customer.lifecycle_stage?.toUpperCase() || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                            customer.status === 'active' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 
                            'text-gray-400 bg-gray-100 dark:bg-slate-800'
                          }`}>
                            {customer.status?.toUpperCase() || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 dark:text-slate-400">{customer.company || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 dark:text-slate-400">{customer.phone || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {customer.tags && Array.isArray(customer.tags) && customer.tags.length > 0 ? (
                              customer.tags.slice(0, 2).map((s, idx) => (
                                <span key={idx} className="text-[9px] font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(customer);
                              }}
                              className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(customer.id);
                              }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic">No customers found matching your criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
    );
    }

    if (activeTab === 'segments') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'VIP Power Users', count: 12, description: 'Customers with LTV > $5k and active daily.', color: 'emerald' },
            { name: 'New Signups', count: 48, description: 'Users who joined in the last 7 days.', color: 'blue' },
            { name: 'Churn Risk', count: 5, description: 'Inactive for more than 30 days.', color: 'red' },
            { name: 'Beta Testers', count: 24, description: 'Early adopters helping test new features.', color: 'indigo' },
          ].map((segment, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm hover:border-brand-300 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-xl bg-${segment.color}-50 dark:bg-${segment.color}-900/20 text-${segment.color}-600`}>
                  <Layers size={20} />
                </div>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{segment.count} Members</span>
              </div>
              <h4 className="text-base font-black text-gray-900 dark:text-slate-100 mb-1">{segment.name}</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed mb-6">{segment.description}</p>
              <button className="w-full py-2 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-brand-600 hover:text-white transition-all">
                View Segment Customers
              </button>
            </div>
          ))}
          <button className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-slate-800/50 transition-all group min-h-[180px]">
            <Plus size={24} className="text-gray-300 group-hover:text-brand-600" />
            <p className="text-xs font-bold text-gray-400 group-hover:text-brand-600 uppercase">Create New Segment</p>
          </button>
        </div>
      );
    }

    if (activeTab === 'timeline') {
      return (
        <div className="max-w-2xl mx-auto space-y-8 pb-12">
          <div className="relative space-y-6">
            <div className="absolute left-4 top-2 bottom-0 w-px bg-gray-100 dark:bg-slate-800"></div>
            {[
              { type: 'Purchase', customer: 'Sophie Turner', text: 'Sophie upgraded to the Enterprise Plan ($1,200/mo).', time: '10m ago', icon: <CreditCard size={12} />, color: 'emerald' },
              { type: 'Engagement', customer: 'Sarah Miller', text: 'Sarah liked 3 posts and commented on your LinkedIn update.', time: '2h ago', icon: <TrendingUp size={12} />, color: 'blue' },
              { type: 'Message', customer: 'Marcus Chen', text: 'Inquiry received via website chat regarding team discounts.', time: '5h ago', icon: <MessageCircle size={12} />, color: 'orange' },
              { type: 'Signup', customer: 'New User #502', text: 'A new prospect just signed up for the early access newsletter.', time: 'Yesterday', icon: <UserPlus size={12} />, color: 'indigo' },
            ].map((event, idx) => (
              <div key={idx} className="relative pl-10">
                <div className={`absolute left-2 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-${event.color}-500 z-10 flex items-center justify-center text-${event.color}-500 shadow-sm`}>
                  {event.icon}
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm group hover:border-brand-100 dark:hover:border-brand-900 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest text-${event.color}-600 bg-${event.color}-50 dark:bg-${event.color}-900/20 px-2 py-0.5 rounded-full`}>
                      {event.type}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{event.time}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-1">{event.customer}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-medium leading-relaxed">{event.text}</p>
                  <button className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-brand-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    View Profile <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-20 text-center space-y-6">
        <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center text-brand-600 mx-auto">
          {tabs.find(t => t.id === activeTab)?.icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">{tabs.find(t => t.id === activeTab)?.label}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed">
            This module is being refined to provide deep insights into your customer base.
          </p>
        </div>
        <button className="px-8 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all text-sm shadow-xl shadow-brand-500/20">
          Coming Soon
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
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

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both pb-20">
        {renderTabContent()}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md max-h-[90vh] rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-6 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 tracking-tight">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col flex-1 min-h-0">
              <form id="customer-form" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
                {/* Customer type toggle: Individual vs Company */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Type</label>
                  <div className="inline-flex rounded-2xl bg-gray-50 dark:bg-slate-800 p-1 border border-transparent">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, customer_type: 'individual', company: '' })}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-2xl transition-all ${
                        formData.customer_type === 'individual'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                          : 'text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      Individual
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, customer_type: 'company' })}
                      className={`ml-1 px-3 py-1.5 text-[11px] font-bold rounded-2xl transition-all ${
                        formData.customer_type === 'company'
                          ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm'
                          : 'text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      Company
                    </button>
                  </div>
                </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {formData.customer_type === 'company' ? 'Company Name' : 'Full Name'}
                </label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                  placeholder={formData.customer_type === 'company' ? 'e.g. Acme Corp' : 'e.g. Alexander Pierce'}
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
                  placeholder="alex@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              {/* Lifecycle Stage (Lead, Prospect, Client) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Type</label>
                <select 
                  value={formData.lifecycle_stage}
                  onChange={e => setFormData({...formData, lifecycle_stage: e.target.value as 'lead' | 'prospect' | 'client'})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100 appearance-none"
                >
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="client">Client</option>
                </select>
              </div>

              {/* Status (Active/Inactive) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100 appearance-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Social Profiles */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Social Profiles</label>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    value={formData.social_profiles.twitter}
                    onChange={e => setFormData({...formData, social_profiles: {...formData.social_profiles, twitter: e.target.value}})}
                    className="px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-xl focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                    placeholder="Twitter"
                  />
                  <input 
                    type="text" 
                    value={formData.social_profiles.linkedin}
                    onChange={e => setFormData({...formData, social_profiles: {...formData.social_profiles, linkedin: e.target.value}})}
                    className="px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-xl focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                    placeholder="LinkedIn"
                  />
                  <input 
                    type="text" 
                    value={formData.social_profiles.instagram}
                    onChange={e => setFormData({...formData, social_profiles: {...formData.social_profiles, instagram: e.target.value}})}
                    className="px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-xl focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                    placeholder="Instagram"
                  />
                  <input 
                    type="text" 
                    value={formData.social_profiles.facebook}
                    onChange={e => setFormData({...formData, social_profiles: {...formData.social_profiles, facebook: e.target.value}})}
                    className="px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-xl focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                    placeholder="Facebook"
                  />
                  <input 
                    type="text" 
                    value={formData.social_profiles.youtube}
                    onChange={e => setFormData({...formData, social_profiles: {...formData.social_profiles, youtube: e.target.value}})}
                    className="px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-xl focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                    placeholder="YouTube"
                  />
                </div>
              </div>

              {/* Tags with suggestions */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {suggestedTags.map((tag) => {
                    const tagsArray = formData.tags ? formData.tags.split(',').map(s => s.trim()) : [];
                    const isSelected = tagsArray.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const tagsArray = formData.tags ? formData.tags.split(',').map(s => s.trim()).filter(s => s) : [];
                          if (isSelected) {
                            setFormData({...formData, tags: tagsArray.filter(t => t !== tag).join(', ')});
                          } else {
                            setFormData({...formData, tags: [...tagsArray, tag].join(', ')});
                          }
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          isSelected
                            ? 'bg-brand-600 text-white'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <input 
                  type="text" 
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                  placeholder="Or type custom tags (comma separated)"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100 resize-none"
                  placeholder="Additional notes about this customer..."
                />
              </div>
              </form>
              <div className="p-6 pt-4 border-t border-gray-50 dark:border-slate-800 flex gap-3 flex-shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  form="customer-form"
                  className="flex-[2] py-3 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 shadow-xl shadow-brand-500/20 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Check size={18} /> {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
