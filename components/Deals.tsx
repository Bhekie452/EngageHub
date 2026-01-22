
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Handshake, 
  Trello, 
  Target, 
  FileText, 
  ThumbsUp, 
  ThumbsDown, 
  LineChart, 
  Plus, 
  MoreVertical, 
  DollarSign, 
  Calendar, 
  ChevronRight, 
  ArrowUpRight,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  X,
  Edit3,
  Trash2,
  Save
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDeals } from '../src/hooks/useDeals';
import { useCurrency } from '../src/hooks/useCurrency';
import { useAuth } from '../src/hooks/useAuth';
import { formatCurrency, formatCompactCurrency, formatCurrencyWithCommas } from '../src/lib/currency';
import { supabase } from '../src/lib/supabase';
import { Deal } from '../src/services/api/deals.service';

type DealsTab = 'pipeline' | 'list' | 'opportunities' | 'quotes' | 'won' | 'lost' | 'forecast';

// Map database stage names to UI stage names
const stageMapping: Record<string, string> = {
  'discovery': 'Discovery',
  'qualification': 'Discovery',
  'lead': 'Discovery',
  'proposal': 'Proposal',
  'quotation': 'Proposal',
  'negotiation': 'Negotiation',
  'contracting': 'Contracting',
  'closed-won': 'Won',
  'closed-lost': 'Lost',
};

// Default pipeline stages for UI
const defaultStages = ['Discovery', 'Proposal', 'Negotiation', 'Contracting'];

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getDealHealth(deal: Deal) {
  const lastActivity = new Date(deal.updated_at || deal.created_at);
  const now = new Date();
  const diffDays = (now.getTime() - lastActivity.getTime()) / 86400000;

  if (diffDays <= 2) return { label: 'Healthy', color: 'text-green-600 bg-green-50 border-green-100' };
  if (diffDays <= 5) return { label: 'Risk', color: 'text-amber-600 bg-amber-50 border-amber-100' };
  return { label: 'Critical', color: 'text-red-600 bg-red-50 border-red-100' };
}

const Deals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DealsTab>('pipeline');
  const { deals, wonDeals, lostDeals, isLoading, error, createDeal, updateDeal, deleteDeal } = useDeals();
  const { symbol, currency: userCurrency, availableCurrencies } = useCurrency();
  const { user } = useAuth();
  
  // Modal and form state
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>('Discovery');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    currency: userCurrency || 'USD', // Use user's currency preference
    probability: 50,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    expected_close_date: '',
    contact_id: '',
    company_id: '',
  });
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQueryList, setSearchQueryList] = useState<string>('');
  
  // Update currency when user currency changes
  useEffect(() => {
    if (userCurrency && !editingDeal) {
      setFormData(prev => ({ ...prev, currency: userCurrency }));
    }
  }, [userCurrency, editingDeal]);
  
  // Pipeline and stage data
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  
  // Fetch workspace, pipelines, stages, contacts, and companies
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      
      try {
        setLoadingData(true);
        
        // Get workspace
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
        
        const { data: workspaceData } = await supabase
          .from('workspaces')
          .select('id')
          .eq('owner_id', authUser.id)
          .single();
        
        if (workspaceData) {
          setWorkspaceId(workspaceData.id);
          
          // Fetch pipelines
          const { data: pipelinesData } = await supabase
            .from('pipelines')
            .select('*')
            .eq('workspace_id', workspaceData.id)
            .order('position');
          
          if (pipelinesData && pipelinesData.length > 0) {
            setPipelines(pipelinesData);
            const defaultPipeline = pipelinesData.find((p: any) => p.is_default) || pipelinesData[0];
            
            // Fetch stages for default pipeline
            const { data: stagesData } = await supabase
              .from('pipeline_stages')
              .select('*')
              .eq('pipeline_id', defaultPipeline.id)
              .order('position');
            
            if (stagesData) {
              setStages(stagesData);
            }
          } else {
            // Create default pipeline and stages if they don't exist
            const { data: newPipeline } = await supabase
              .from('pipelines')
              .insert({
                workspace_id: workspaceData.id,
                name: 'Sales Pipeline',
                is_default: true,
                type: 'sales',
              })
              .select()
              .single();
            
            if (newPipeline) {
              setPipelines([newPipeline]);
              
              // Create default stages
              const defaultStageNames = ['Discovery', 'Proposal', 'Negotiation', 'Contracting'];
              const { data: newStages } = await supabase
                .from('pipeline_stages')
                .insert(
                  defaultStageNames.map((name, idx) => ({
                    pipeline_id: newPipeline.id,
                    name,
                    position: idx,
                    probability: (idx + 1) * 25,
                  }))
                )
                .select();
              
              if (newStages) {
                setStages(newStages);
              }
            }
          }
          
          // Fetch contacts
          const { data: contactsData } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, full_name, email')
            .eq('workspace_id', workspaceData.id)
            .limit(100);
          
          if (contactsData) {
            // Map contacts to ensure we have a display name
            const mappedContacts = contactsData.map((contact: any) => ({
              id: contact.id,
              full_name: contact.full_name || 
                        `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 
                        contact.email || 
                        'Unnamed Contact',
              email: contact.email || '',
            }));
            setContacts(mappedContacts);
            console.log('Fetched contacts:', mappedContacts); // Debug log
          } else {
            console.log('No contacts found in database'); // Debug log
          }
          
          // Fetch companies
          const { data: companiesData } = await supabase
            .from('companies')
            .select('id, name')
            .eq('workspace_id', workspaceData.id)
            .limit(100);
          
          if (companiesData) setCompanies(companiesData);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchInitialData();
  }, [user]);

  const tabs: { id: DealsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'pipeline', label: 'Deal pipeline', icon: <Trello size={16} /> },
    { id: 'list', label: 'Deals list', icon: <FileText size={16} /> },
    { id: 'opportunities', label: 'Opportunities', icon: <Target size={16} /> },
    { id: 'quotes', label: 'Quotes', icon: <FileText size={16} /> },
    { id: 'won', label: 'Won deals', icon: <ThumbsUp size={16} /> },
    { id: 'lost', label: 'Lost deals', icon: <ThumbsDown size={16} /> },
    { id: 'forecast', label: 'Forecast', icon: <LineChart size={16} /> },
  ];

  // Group deals by stage for pipeline view
  const dealsByStage = useMemo(() => {
    const grouped: Record<string, typeof deals> = {};
    defaultStages.forEach(stage => {
      grouped[stage] = [];
    });

    deals
      .filter(deal => deal.status === 'open')
      .forEach(deal => {
        const stageName = deal.pipeline_stages?.name || '';
        const uiStage = stageMapping[stageName.toLowerCase()] || 
                       (stageName ? stageName : 'Discovery');
        
        if (defaultStages.includes(uiStage)) {
          if (!grouped[uiStage]) grouped[uiStage] = [];
          grouped[uiStage].push(deal);
        }
      });

    return defaultStages.map(stage => ({
      stage,
      count: grouped[stage]?.length || 0,
      total: formatCurrencyWithCommas(
        (grouped[stage] || []).reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0),
        symbol
      ),
      deals: (grouped[stage] || []).map(deal => ({
        id: deal.id,
        name: deal.title,
        val: formatCompactCurrency(Number(deal.amount) || 0, symbol),
        day: formatTimeAgo(deal.updated_at || deal.created_at),
        deal,
      })),
    }));
  }, [deals, symbol]);

  const filteredListDeals = useMemo(() => {
    return deals.filter((deal) => {
      const stageName = deal.pipeline_stages?.name?.toLowerCase() || '';
      const status = (deal.status || '').toLowerCase();
      const matchStage = stageFilter === 'all' ? true : stageName === stageFilter.toLowerCase();
      const matchStatus = statusFilter === 'all' ? true : status === statusFilter.toLowerCase();
      const matchSearch =
        !searchQueryList ||
        deal.title.toLowerCase().includes(searchQueryList.toLowerCase()) ||
        deal.companies?.name?.toLowerCase().includes(searchQueryList.toLowerCase()) ||
        deal.contacts?.full_name?.toLowerCase().includes(searchQueryList.toLowerCase());
      return matchStage && matchStatus && matchSearch;
    });
  }, [deals, stageFilter, statusFilter, searchQueryList]);

  // Get open deals for opportunities tab
  const openDeals = useMemo(() => {
    return deals.filter(deal => deal.status === 'open');
  }, [deals]);

  // Calculate forecast data
  const forecastData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, 6).map((month, idx) => {
      const monthIndex = (currentMonth + idx) % 12;
      const projected = openDeals.reduce((sum, deal) => {
        if (deal.expected_close_date) {
          const closeDate = new Date(deal.expected_close_date);
          if (closeDate.getMonth() === monthIndex) {
            return sum + (Number(deal.amount) || 0) * (deal.probability / 100);
          }
        }
        return sum;
      }, 0);
      
      const actual = wonDeals.reduce((sum, deal) => {
        if (deal.actual_close_date) {
          const closeDate = new Date(deal.actual_close_date);
          if (closeDate.getMonth() === monthIndex) {
            return sum + (Number(deal.amount) || 0);
          }
        }
        return sum;
      }, 0);

      return { month, projected, actual };
    });
  }, [openDeals, wonDeals]);

  // Calculate forecast stats
  const forecastStats = useMemo(() => {
    const q2Start = new Date(new Date().getFullYear(), 3, 1); // April 1
    const q2End = new Date(new Date().getFullYear(), 5, 30); // June 30
    
    const expectedRevenue = openDeals
      .filter(deal => {
        if (!deal.expected_close_date) return false;
        const closeDate = new Date(deal.expected_close_date);
        return closeDate >= q2Start && closeDate <= q2End;
      })
      .reduce((sum, deal) => sum + (Number(deal.amount) || 0) * (deal.probability / 100), 0);

    const pipelineValue = openDeals.reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
    const highProbabilityDeals = openDeals.filter(deal => deal.probability >= 70).length;
    const goal = 30000; // You can make this configurable
    const gap = Math.max(0, goal - expectedRevenue);

    return {
      expectedRevenue,
      pipelineValue,
      highProbabilityDeals,
      gap,
    };
  }, [openDeals]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading deals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">Error loading deals</p>
          <p className="text-sm text-gray-400">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
  
  // Get stage ID from stage name
  const getStageId = (stageName: string): string | null => {
    const stage = stages.find(s => {
      const name = s.name.toLowerCase();
      return name === stageName.toLowerCase() || 
             stageMapping[name] === stageName ||
             (stageName === 'Discovery' && (name.includes('discovery') || name.includes('qualification') || name.includes('lead'))) ||
             (stageName === 'Proposal' && (name.includes('proposal') || name.includes('quotation'))) ||
             (stageName === 'Negotiation' && name.includes('negotiation')) ||
             (stageName === 'Contracting' && name.includes('contracting'));
    });
    return stage?.id || stages[0]?.id || null;
  };
  
  // Handlers
  const handleOpenModal = (deal?: Deal, stage?: string) => {
    if (deal) {
      setEditingDeal(deal);
      const stageName = deal.pipeline_stages?.name || 'Discovery';
      const uiStage = stageMapping[stageName.toLowerCase()] || stageName;
      setSelectedStage(uiStage);
      setFormData({
        title: deal.title || '',
        description: deal.description || '',
        amount: String(deal.amount || 0),
        currency: deal.currency || 'USD',
        probability: deal.probability || 50,
        priority: deal.priority || 'medium',
        expected_close_date: deal.expected_close_date ? deal.expected_close_date.split('T')[0] : '',
        contact_id: deal.contact_id || '',
        company_id: deal.company_id || '',
      });
    } else {
      setEditingDeal(null);
      setSelectedStage(stage || 'Discovery');
      setFormData({
        title: '',
        description: '',
        amount: '',
        currency: userCurrency || 'USD', // Use user's currency preference
        probability: 50,
        priority: 'medium',
        expected_close_date: '',
        contact_id: '',
        company_id: '',
      });
    }
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDeal(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !user) return;
    
    const defaultPipeline = pipelines.find((p: any) => p.is_default) || pipelines[0];
    if (!defaultPipeline) {
      alert('No pipeline found. Please create a pipeline first.');
      return;
    }
    
    const stageId = getStageId(selectedStage);
    if (!stageId) {
      alert('Invalid stage selected.');
      return;
    }
    
    const dealData = {
      workspace_id: workspaceId,
      pipeline_id: defaultPipeline.id,
      stage_id: stageId,
      title: formData.title,
      description: formData.description || undefined,
      amount: parseFloat(formData.amount) || 0,
      currency: formData.currency,
      probability: formData.probability,
      priority: formData.priority,
      expected_close_date: formData.expected_close_date || undefined,
      contact_id: formData.contact_id || undefined,
      company_id: formData.company_id || undefined,
      status: 'open' as const,
    };
    
    try {
      if (editingDeal) {
        await updateDeal.mutateAsync({ id: editingDeal.id, updates: dealData });
      } else {
        await createDeal.mutateAsync(dealData);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving deal:', err);
      alert('Failed to save deal. Please try again.');
    }
  };
  
  const handleDelete = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    
    try {
      await deleteDeal.mutateAsync(dealId);
    } catch (err) {
      console.error('Error deleting deal:', err);
      alert('Failed to delete deal. Please try again.');
    }
  };
  
  const handleMarkWon = async (deal: Deal) => {
    if (!confirm('Mark this deal as won?')) return;
    
    try {
      await updateDeal.mutateAsync({
        id: deal.id,
        updates: {
          status: 'won',
          actual_close_date: new Date().toISOString().split('T')[0],
        },
      });
    } catch (err) {
      console.error('Error marking deal as won:', err);
      alert('Failed to update deal. Please try again.');
    }
  };
  
  const handleMarkLost = async (deal: Deal) => {
    if (!confirm('Mark this deal as lost?')) return;
    
    try {
      await updateDeal.mutateAsync({
        id: deal.id,
        updates: {
          status: 'lost',
          actual_close_date: new Date().toISOString().split('T')[0],
        },
      });
    } catch (err) {
      console.error('Error marking deal as lost:', err);
      alert('Failed to update deal. Please try again.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pipeline':
        return (
          <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar h-[calc(100vh-20rem)] min-h-[500px]">
            {dealsByStage.map((col, idx) => (
              <div key={idx} className="min-w-[300px] w-[300px] flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">{col.stage}</h4>
                    <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded-full">{col.count}</span>
                  </div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{col.total}</p>
                </div>
                <div className="bg-gray-100/50 rounded-2xl p-2 flex-1 flex flex-col gap-3 border border-gray-100 overflow-y-auto">
                  {col.deals.map((deal) => (
                    <div key={deal.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-blue-300 transition-all cursor-pointer group relative">
                      <div 
                        onClick={() => {
                          setSelectedDeal(deal.deal);
                          setIsDetailOpen(true);
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-bold text-gray-900 line-clamp-1">{deal.name}</p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(deal.deal, col.stage);
                              }}
                              className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(deal.id);
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase mb-4">
                          <Clock size={10} /> {deal.day}
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                          <span className="text-sm font-black text-gray-800">{deal.val}</span>
                          <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-black text-blue-600">
                            {deal.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => handleOpenModal(undefined, col.stage)}
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-300 hover:border-blue-300 hover:bg-white hover:text-blue-500 transition-all flex items-center justify-center gap-2 mt-auto"
                  >
                    <Plus size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">New Deal</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'list':
        return (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search deals or customers..." 
                    value={searchQueryList}
                    onChange={(e) => setSearchQueryList(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none w-72"
                  />
                </div>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                >
                  <option value="all">All stages</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.name.toLowerCase()}>{s.name}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                >
                  <option value="all">All status</option>
                  <option value="open">Open</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
              >
                <Plus size={16} /> New Deal
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Deal Name</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Stage</th>
                    <th className="px-6 py-4">Value</th>
                    <th className="px-6 py-4">Owner</th>
                    <th className="px-6 py-4">Age</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredListDeals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        No deals found.
                      </td>
                    </tr>
                  ) : (
                    filteredListDeals.map((deal) => {
                      const stageName = deal.pipeline_stages?.name || '—';
                      const ageDays = Math.max(0, Math.floor((Date.now() - new Date(deal.created_at).getTime()) / 86400000));
                      const health = getDealHealth(deal);
                      return (
                        <tr key={deal.id} className="hover:bg-gray-50/50 transition-all cursor-pointer" onClick={() => { setSelectedDeal(deal); setIsDetailOpen(true); }}>
                          <td className="px-6 py-4 font-bold text-gray-900">{deal.title}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{deal.contacts?.full_name || deal.companies?.name || '—'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{stageName}</td>
                          <td className="px-6 py-4 font-black text-gray-800">{formatCurrencyWithCommas(Number(deal.amount) || 0, symbol)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{deal.owner_id ? deal.owner_id.slice(0, 6) + '…' : '—'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{ageDays}d</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${health.color}`}>
                              {health.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'opportunities':
        return (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search deals..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                />
              </div>
              <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
              >
                <Plus size={16} /> Add Opportunity
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Deal Name</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Close Probability</th>
                    <th className="px-6 py-4">Expected Close</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {openDeals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        No opportunities found. Create your first deal to get started.
                      </td>
                    </tr>
                  ) : (
                    openDeals.map((deal) => {
                      const colors = ['blue', 'indigo', 'emerald', 'purple', 'pink'];
                      const color = colors[deal.title.length % colors.length];
                      const closeDate = deal.expected_close_date 
                        ? new Date(deal.expected_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Not set';
                      
                      return (
                        <tr key={deal.id} className="hover:bg-gray-50/50 transition-all group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full bg-${color}-50 text-${color}-600 flex items-center justify-center font-black text-xs`}>
                                {deal.title.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-bold text-gray-900">{deal.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-black text-gray-800 text-sm">
                            {formatCurrencyWithCommas(Number(deal.amount) || 0, symbol)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: `${deal.probability}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-gray-500">{deal.probability}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold uppercase tracking-tighter">
                              <Calendar size={12} /> {closeDate}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => handleOpenModal(deal)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(deal.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'won':
        return (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search won deals..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Deal Name</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Closed Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {wonDeals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                        No won deals yet. Keep working on your pipeline!
                      </td>
                    </tr>
                  ) : (
                    wonDeals.map((deal) => {
                      const closeDate = deal.actual_close_date 
                        ? new Date(deal.actual_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Not set';
                      
                      return (
                        <tr key={deal.id} className="hover:bg-gray-50/50 transition-all group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-black text-xs">
                                {deal.title.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-bold text-gray-900">{deal.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-black text-gray-800 text-sm">
                            {formatCurrencyWithCommas(Number(deal.amount) || 0, symbol)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold uppercase tracking-tighter">
                              <Calendar size={12} /> {closeDate}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => handleOpenModal(deal)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(deal.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'lost':
        return (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search lost deals..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Deal Name</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Lost Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lostDeals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                        No lost deals. Great job!
                      </td>
                    </tr>
                  ) : (
                    lostDeals.map((deal) => {
                      const closeDate = deal.actual_close_date 
                        ? new Date(deal.actual_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Not set';
                      
                      return (
                        <tr key={deal.id} className="hover:bg-gray-50/50 transition-all group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-black text-xs">
                                {deal.title.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-bold text-gray-900">{deal.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-black text-gray-800 text-sm">
                            {formatCurrencyWithCommas(Number(deal.amount) || 0, symbol)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold uppercase tracking-tighter">
                              <Calendar size={12} /> {closeDate}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => handleOpenModal(deal)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(deal.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'quotes':
        // Quotes are typically proposals in the pipeline - show deals in proposal stage
        const proposalDeals = dealsByStage.find(s => s.stage === 'Proposal')?.deals || [];
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposalDeals.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                No quotes available. Create deals in the Proposal stage to see them here.
              </div>
            ) : (
              proposalDeals.map((deal) => {
                const status = 'Sent'; // You can add a status field to deals if needed
                return (
                  <div key={deal.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-200 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:text-blue-500 transition-all">
                        <FileText size={20} />
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                        {status}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">
                      {deal.deal.contacts?.full_name || deal.deal.companies?.name || 'Quote'}
                    </h4>
                    <p className="text-lg font-bold text-gray-900 mb-4">{deal.name}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <span className="text-lg font-black text-gray-800">{deal.val}</span>
                      <button className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        View <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            <button 
              onClick={() => handleOpenModal(undefined, 'Proposal')}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <Plus size={24} className="text-gray-300 group-hover:text-blue-600" />
              <p className="text-xs font-bold text-gray-400 group-hover:text-blue-600 uppercase">New Quote</p>
            </button>
          </div>
        );

      case 'forecast':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expected Revenue (Q2)</p>
                <p className="text-3xl font-black mt-2 text-gray-900">
                  {formatCurrencyWithCommas(forecastStats.expectedRevenue, symbol)}
                </p>
                <div className="flex items-center gap-2 mt-2 text-green-500 font-bold text-xs">
                  <TrendingUp size={14} /> Based on probability
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pipeline Value</p>
                <p className="text-3xl font-black mt-2 text-gray-900">
                  {formatCurrencyWithCommas(forecastStats.pipelineValue, symbol)}
                </p>
                <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase">
                  {forecastStats.highProbabilityDeals} High Probability Deals
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-l-4 border-l-orange-400">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gap to Goal</p>
                <p className="text-3xl font-black mt-2 text-orange-600">
                  {formatCurrencyWithCommas(forecastStats.gap, symbol)}
                </p>
                <div className="flex items-center gap-2 mt-2 text-gray-400 font-bold text-xs">
                  <AlertCircle size={14} /> {forecastStats.gap > 0 ? 'Needs more closed deals' : 'Goal achieved!'}
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Projected vs Actual Revenue</h4>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Projected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Actual</span>
                  </div>
                </div>
              </div>
              <div className="h-80 w-full" style={{ minWidth: 0, minHeight: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${symbol}${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      cursor={{fill: '#f9fafb'}}
                      formatter={(value: number) => formatCurrencyWithCommas(value, symbol)}
                    />
                    <Bar dataKey="projected" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 sticky top-16 bg-gray-50/90 backdrop-blur-sm z-20 overflow-x-auto no-scrollbar">
        <div className="flex whitespace-nowrap scroll-smooth">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all border-b-2 -mb-[2px] ${
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
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both pb-20">
        {renderTabContent()}
      </div>
      
      {/* Create/Edit Deal Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900">
                {editingDeal ? 'Edit Deal' : 'Create New Deal'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Deal Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g., Q4 Enterprise Deal"
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder="Add details about this deal..."
                />
              </div>
              
              {/* Amount and Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                  >
                    {availableCurrencies.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code} - {curr.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Stage and Probability */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Stage *
                  </label>
                  <select
                    required
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                  >
                    {defaultStages.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Probability: {formData.probability}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
              
              {/* Priority and Expected Close Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    value={formData.expected_close_date}
                    onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              
              {/* Contact and Company */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Contact
                  </label>
                  <select
                    value={formData.contact_id}
                    onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">None</option>
                    {contacts.length === 0 ? (
                      <option value="" disabled>No contacts found. Create contacts in CRM first.</option>
                    ) : (
                      contacts.map(contact => (
                        <option key={contact.id} value={contact.id}>
                          {contact.full_name || contact.email || 'Unnamed Contact'}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Company
                  </label>
                  <select
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">None</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDeal.isPending || updateDeal.isPending}
                  className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save size={16} />
                  {createDeal.isPending || updateDeal.isPending ? 'Saving...' : editingDeal ? 'Update Deal' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deal Detail Drawer */}
      {isDetailOpen && selectedDeal && (
        <div 
          className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex justify-end"
          onClick={() => setIsDetailOpen(false)}
        >
          <div 
            className="w-full max-w-3xl bg-white h-full shadow-2xl border-l border-gray-100 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Deal</p>
                <h2 className="text-2xl font-black text-gray-900">{selectedDeal.title}</h2>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                    {selectedDeal.pipeline_stages?.name || 'Stage'}
                  </span>
                  <span className="px-2 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                    {formatCurrencyWithCommas(Number(selectedDeal.amount) || 0, symbol)}
                  </span>
                  <span className="px-2 py-1 text-xs font-bold rounded-lg bg-gray-50 text-gray-500 border border-gray-200">
                    {selectedDeal.contacts?.full_name || selectedDeal.companies?.name || 'Customer'}
                  </span>
                  <span className="px-2 py-1 text-xs font-bold rounded-lg bg-gray-50 text-gray-500 border border-gray-200">
                    Owner: {selectedDeal.owner_id ? selectedDeal.owner_id.slice(0,6) + '…' : '—'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 border-b border-gray-100">
              <InfoRow label="Value" value={formatCurrencyWithCommas(Number(selectedDeal.amount) || 0, symbol)} />
              <InfoRow label="Stage" value={selectedDeal.pipeline_stages?.name || '—'} />
              <InfoRow label="Status" value={selectedDeal.status || 'open'} />
              <InfoRow label="Expected Close" value={selectedDeal.expected_close_date ? new Date(selectedDeal.expected_close_date).toLocaleDateString() : '—'} />
              <InfoRow label="Customer" value={selectedDeal.contacts?.full_name || selectedDeal.companies?.name || '—'} />
              <InfoRow label="Health" value={getDealHealth(selectedDeal).label} />
            </div>

            <div className="p-6 space-y-4">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Timeline</h3>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-600">
                Stage changed to {selectedDeal.pipeline_stages?.name || 'current stage'} • {formatTimeAgo(selectedDeal.updated_at || selectedDeal.created_at)}
                <br />
                Deal created • {new Date(selectedDeal.created_at).toLocaleString()}
                <br />
                (Add activities/tasks/notes integration here.)
              </div>

              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Notes</h3>
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Notes and files can be attached here in a future iteration.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple info row helper
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-semibold text-gray-900">{value || '—'}</span>
  </div>
);

export default Deals;
