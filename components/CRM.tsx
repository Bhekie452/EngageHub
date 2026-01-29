
import React, { useState, useMemo, useEffect } from 'react';
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
  Trash2,
  MessageSquare,
  Video,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  CheckCircle2,
  Share2,
  DollarSign,
  Activity,
  Sparkles,
  TrendingUp,
  ChevronDown,
  Settings,
  MessageCircle,
  StickyNote,
  AlertCircle,
  Megaphone,
  Zap,
  Play,
  Pause,
  BarChart3,
  Pin,
  Lock,
  Eye,
  Star,
  Lightbulb,
  AlertTriangle,
  UserPlus,
  MousePointerClick,
  Heart,
  PhoneCall,
  CheckCircle,
  Circle,
  Trophy,
  XCircle,
  Bot
} from 'lucide-react';
import { useContacts } from '../src/hooks/useContacts';
import { useCompanies } from '../src/hooks/useCompanies';
import { useDeals } from '../src/hooks/useDeals';
import { useTasks } from '../src/hooks/useTasks';
import { useCampaigns } from '../src/hooks/useCampaigns';
import { useActivities } from '../src/hooks/useActivities';
import { useCurrency } from '../src/hooks/useCurrency';
import { useAutomations } from '../src/hooks/useAutomations';
import { useAuth } from '../src/hooks/useAuth';
import { useNotes } from '../src/hooks/useNotes';
import { useTimeline } from '../src/hooks/useTimeline';
import { TimelineEvent } from '../src/services/api/timeline.service';
import { formatCurrency as formatCurrencyLib } from '../src/lib/currency';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../src/lib/supabase';
import { Contact } from '../src/services/api/contacts.service';
import { Company } from '../src/services/api/companies.service';
import CustomerProfile from './CustomerProfile';
import CompanyProfile from './CompanyProfile';
import CRMDashboard from './CRMDashboard';

type CRMTab =
  | 'pipelines'
  | 'deals'
  | 'activities'
  | 'tasks'
  | 'timeline'
  | 'notes'
  | 'automations'
  | 'owners'
  | 'automations'
  | 'analytics';

// Helper to format time ago
function formatTimeAgo(dateString?: string): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

// Map database status to UI status
function mapStatusToUI(status: string, lifecycle_stage?: string): 'Customer' | 'Lead' | 'Prospect' {
  if (status === 'customer' || lifecycle_stage === 'customer') return 'Customer';
  if (status === 'qualified' || lifecycle_stage === 'lead' || lifecycle_stage === 'mql' || lifecycle_stage === 'sql') return 'Lead';
  return 'Prospect';
}


// Get color based on contact
function getContactColor(contact: Contact): string {
  const colors = ['indigo', 'blue', 'orange', 'emerald', 'purple', 'pink'];
  const hash = contact.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

const CRM: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CRMTab>('pipelines');
  const [searchQuery, setSearchQuery] = useState('');
  const { contacts: dbContacts, isLoading, error, createContact, updateContact, deleteContact } = useContacts();
  const { companies: dbCompanies, isLoading: isLoadingCompanies, error: companiesError, createCompany, updateCompany, deleteCompany } = useCompanies();
  const { deals, wonDeals, createDeal, updateDeal, deleteDeal } = useDeals();
  const { tasks, createTask, updateTask, deleteTask, isLoading: isLoadingTasks } = useTasks();
  const { campaigns } = useCampaigns();
  const { activities: savedActivities, createActivity, updateActivity, deleteActivity } = useActivities();
  const { symbol } = useCurrency();
  const { user } = useAuth();
  const { automations, isLoading: isLoadingAutomations, createAutomation, updateAutomation, deleteAutomation, toggleAutomation } = useAutomations();
  const { notes, isLoading: isLoadingNotes, createNote, updateNote, deleteNote } = useNotes();
  const queryClient = useQueryClient();
  const { events: timelineEvents, groupedEvents, isLoading: isLoadingTimeline, error: timelineError, refetch: refetchTimeline } = useTimeline();

  // Force timeline refresh when contacts change (new customer created)
  useEffect(() => {
    // Refetch timeline immediately when contacts count changes
    if (dbContacts.length > 0 && refetchTimeline) {
      refetchTimeline();
    }
  }, [dbContacts.length, refetchTimeline]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<string>('all');

  // Automation form state
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<any>(null);
  const [automationFormData, setAutomationFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'deal_stage_changed' as any,
    trigger_config: {} as any,
    conditions: [] as any[],
    actions: [] as any[],
    is_active: true,
  });

  // Format currency using user's preference
  const formatCurrency = (value: number) => formatCurrencyLib(value, symbol);

  const ownerStats = useMemo(() => {
    type OwnerEntry = {
      id: string;
      dealsOpen: number;
      dealsWon: number;
      pipelineValue: number;
      wonValue: number;
      tasksOpen: number;
      tasksCompleted: number;
      activities: number;
      customers: number;
      leads: number;
    };

    const getLabel = (ownerId: string) => {
      if (ownerId === 'Unassigned') return 'Unassigned';
      if (ownerId === user?.id) {
        return user.user_metadata?.full_name || user.email || 'You';
      }
      return ownerId.slice(0, 8);
    };

    const ensure = (map: Map<string, OwnerEntry>, ownerId: string) => {
      if (!map.has(ownerId)) {
        map.set(ownerId, {
          id: ownerId,
          dealsOpen: 0,
          dealsWon: 0,
          pipelineValue: 0,
          wonValue: 0,
          tasksOpen: 0,
          tasksCompleted: 0,
          activities: 0,
          customers: 0,
          leads: 0,
        });
      }
      return map.get(ownerId)!;
    };

    const map = new Map<string, OwnerEntry>();

    const normalize = (val?: string | null) => val || 'Unassigned';

    deals.forEach((deal) => {
      const ownerId = normalize(deal.owner_id);
      const entry = ensure(map, ownerId);
      entry.pipelineValue += Number(deal.amount) || 0;
      if (deal.status === 'won') {
        entry.dealsWon += 1;
        entry.wonValue += Number(deal.amount) || 0;
      } else {
        entry.dealsOpen += 1;
      }
    });

    tasks.forEach((task) => {
      const ownerId = normalize(task.assigned_to);
      const entry = ensure(map, ownerId);
      if (task.status === 'done') {
        entry.tasksCompleted += 1;
      } else {
        entry.tasksOpen += 1;
      }
    });

    savedActivities.forEach((activity) => {
      const ownerId = normalize((activity as any).owner_id || activity.created_by);
      const entry = ensure(map, ownerId);
      entry.activities += 1;
    });

    dbContacts.forEach((contact) => {
      const ownerId = normalize((contact as any).owner_id || contact.created_by);
      const entry = ensure(map, ownerId);
      entry.customers += 1;
    });

    return Array.from(map.values()).map((entry) => ({
      ...entry,
      label: getLabel(entry.id),
    }));
  }, [deals, tasks, savedActivities, dbContacts, user]);

  // Timeline filtering
  const filteredTimelineEvents = useMemo(() => {
    if (timelineFilter === 'all') return timelineEvents;
    return timelineEvents.filter(event => {
      if (timelineFilter === 'activities') return event.event_type.includes('activity') || event.event_type.includes('call') || event.event_type.includes('meeting');
      if (timelineFilter === 'messages') return event.event_type.includes('message');
      if (timelineFilter === 'deals') return event.event_type.includes('deal');
      if (timelineFilter === 'tasks') return event.event_type.includes('task');
      if (timelineFilter === 'campaigns') return event.event_type.includes('campaign');
      if (timelineFilter === 'notes') return event.event_type === 'note_added';
      if (timelineFilter === 'customers') return event.event_type === 'customer_created' || event.event_type === 'lead_source_detected';
      return true;
    });
  }, [timelineEvents, timelineFilter]);

  const filteredGroupedTimelineEvents = useMemo(() => {
    const filtered = filteredTimelineEvents;
    const grouped: Record<string, TimelineEvent[]> = {};

    filtered.forEach(event => {
      const eventDate = new Date(event.timestamp);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      let dateLabel: string;
      const eventTime = eventDateOnly.getTime();
      const todayTime = today.getTime();
      const yesterdayTime = yesterday.getTime();

      if (eventTime === todayTime) {
        dateLabel = 'Today';
      } else if (eventTime === yesterdayTime) {
        dateLabel = 'Yesterday';
      } else if (eventDate >= lastWeek) {
        dateLabel = 'Last Week';
      } else {
        dateLabel = eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }

      if (!grouped[dateLabel]) {
        grouped[dateLabel] = [];
      }
      grouped[dateLabel].push(event);
    });

    // Sort events within each group by timestamp (newest first)
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });

    return grouped;
  }, [filteredTimelineEvents]);


  // Activity form state
  const [activityNote, setActivityNote] = useState('');

  // Notes form state
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'objection' | 'preference' | 'insight' | 'warning' | 'manager'>('general');
  const [noteVisibility, setNoteVisibility] = useState<'team' | 'private' | 'manager'>('team');
  const [isNotePinned, setIsNotePinned] = useState(false);
  const [isNoteImportant, setIsNoteImportant] = useState(false);
  const [noteAttachTo, setNoteAttachTo] = useState<{ type: 'contact' | 'deal' | 'activity' | 'task' | null; id: string | null }>({ type: null, id: null });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [notesFilter, setNotesFilter] = useState<string>('all');

  // Activity filter state
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');
  const [activityOwnerFilter, setActivityOwnerFilter] = useState<string>('all');
  const [activityCustomerFilter, setActivityCustomerFilter] = useState<string>('all');
  const [activityDealFilter, setActivityDealFilter] = useState<string>('all');
  const [activityStatusFilter, setActivityStatusFilter] = useState<string>('all');
  const [activityStartDate, setActivityStartDate] = useState<string>('');
  const [activityEndDate, setActivityEndDate] = useState<string>('');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityFormData, setActivityFormData] = useState({
    activity_type: 'call' as any,
    title: '',
    content: '',
    contact_id: '',
    deal_id: '',
    activity_date: new Date().toISOString().split('T')[0],
    status: 'scheduled' as 'scheduled' | 'completed' | 'missed' | 'cancelled',
    outcome: '',
    duration: '',
  });

  // Task form state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    due_date: '',
    due_time: '',
    assigned_to: '',
    contact_id: '',
    deal_id: '',
    reminder_time: '',
  });
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Deal management state
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [dealDetailTab, setDealDetailTab] = useState<'timeline' | 'activities' | 'tasks' | 'notes' | 'files'>('timeline');
  const [dealStageFilter, setDealStageFilter] = useState<string>('all');
  const [dealOwnerFilter, setDealOwnerFilter] = useState<string>('all');
  const [dealStatusFilter, setDealStatusFilter] = useState<string>('all');
  const [dealSearchQuery, setDealSearchQuery] = useState<string>('');
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [dealFormData, setDealFormData] = useState({
    title: '',
    description: '',
    amount: '',
    contact_id: '',
    company_id: '',
    stage_id: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    expected_close_date: '',
    probability: 50,
    lead_source: '',
  });

  // Pre-selected stage when opening "New Deal" from pipeline column "+"
  const [newDealPreSelectedStageName, setNewDealPreSelectedStageName] = useState<string | null>(null);

  // Pipeline view state
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('sales');
  const [isPipelineSettingsOpen, setIsPipelineSettingsOpen] = useState(false);
  const [openPipelineFilter, setOpenPipelineFilter] = useState<'owner' | 'date' | 'value' | 'source' | 'status' | 'tags' | null>(null);
  const [pipelineFilterOwner, setPipelineFilterOwner] = useState<string>('all');
  const [pipelineFilterDate, setPipelineFilterDate] = useState<string>('all');
  const [pipelineFilterValue, setPipelineFilterValue] = useState<string>('all');
  const [pipelineFilterSource, setPipelineFilterSource] = useState<string>('all');
  const [pipelineFilterStatus, setPipelineFilterStatus] = useState<string>('all');
  const [pipelineFilterTags, setPipelineFilterTags] = useState<string>('all');
  const [isPipelineDropdownOpen, setIsPipelineDropdownOpen] = useState(false);

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Filter by type
    if (notesFilter !== 'all') {
      filtered = filtered.filter(note => note.note_type === notesFilter);
    }

    // Sort: pinned first, then by date (newest first)
    return filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [notes, notesFilter]);

  // Create lookup maps for activities
  const contactNameById = useMemo(() => {
    const map = new Map<string, string>();
    dbContacts.forEach(contact => {
      map.set(contact.id, contact.full_name || contact.email || 'Unknown');
    });
    return map;
  }, [dbContacts]);

  const companyNameById = useMemo(() => {
    const map = new Map<string, string>();
    dbCompanies.forEach(company => {
      map.set(company.id, company.name);
    });
    return map;
  }, [dbCompanies]);

  const dealTitleById = useMemo(() => {
    const map = new Map<string, string>();
    deals?.forEach(deal => {
      map.set(deal.id, deal.title);
    });
    return map;
  }, [deals]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return savedActivities.filter(activity => {
      if (activityTypeFilter !== 'all' && activity.activity_type !== activityTypeFilter) return false;
      if (activityStatusFilter !== 'all' && activity.status !== activityStatusFilter) return false;
      if (activityStartDate) {
        if (new Date(activity.activity_date) < new Date(activityStartDate)) return false;
      }
      if (activityEndDate) {
        if (new Date(activity.activity_date) > new Date(activityEndDate)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime());
  }, [
    savedActivities,
    activityTypeFilter,
    activityStatusFilter,
    activityStartDate,
    activityEndDate,
  ]);

  // Filter and categorize tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks || [];

    // Status filter
    if (taskStatusFilter !== 'all') {
      if (taskStatusFilter === 'overdue') {
        const now = new Date();
        filtered = filtered.filter(t => {
          if (!t.due_date || t.status === 'done' || t.status === 'cancelled') return false;
          return new Date(t.due_date) < now;
        });
      } else if (taskStatusFilter === 'due_today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filtered = filtered.filter(t => {
          if (!t.due_date || t.status === 'done' || t.status === 'cancelled') return false;
          const dueDate = new Date(t.due_date);
          return dueDate >= today && dueDate < tomorrow;
        });
      } else {
        filtered = filtered.filter(t => t.status === taskStatusFilter);
      }
    }

    // Priority filter
    if (taskPriorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === taskPriorityFilter);
    }

    // Owner filter
    if (taskFilter !== 'all') {
      if (taskFilter === 'my_tasks') {
        filtered = filtered.filter(t => t.assigned_to === user?.id);
      } else if (taskFilter === 'unassigned') {
        filtered = filtered.filter(t => !t.assigned_to);
      }
    }

    // Sort: overdue first, then due today, then by due date, then by priority
    return filtered.sort((a, b) => {
      const now = new Date();
      const aDue = a.due_date ? new Date(a.due_date) : null;
      const bDue = b.due_date ? new Date(b.due_date) : null;

      // Overdue tasks first
      if (aDue && aDue < now && a.status !== 'done' && a.status !== 'cancelled') {
        if (!bDue || bDue >= now || b.status === 'done' || b.status === 'cancelled') return -1;
      }
      if (bDue && bDue < now && b.status !== 'done' && b.status !== 'cancelled') {
        if (!aDue || aDue >= now || a.status === 'done' || a.status === 'cancelled') return 1;
      }

      // Then by due date
      if (aDue && bDue) {
        return aDue.getTime() - bDue.getTime();
      }
      if (aDue) return -1;
      if (bDue) return 1;

      // Then by priority
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
      return aPriority - bPriority;
    });
  }, [tasks, taskStatusFilter, taskPriorityFilter, taskFilter, user?.id]);

  // Task stats
  const taskStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const overdue = (tasks || []).filter(t => {
      if (!t.due_date || t.status === 'done' || t.status === 'cancelled') return false;
      return new Date(t.due_date) < now;
    }).length;

    const dueToday = (tasks || []).filter(t => {
      if (!t.due_date || t.status === 'done' || t.status === 'cancelled') return false;
      const dueDate = new Date(t.due_date);
      return dueDate >= today && dueDate < tomorrow;
    }).length;

    const pending = (tasks || []).filter(t => t.status === 'todo' || t.status === 'in-progress').length;
    const completed = (tasks || []).filter(t => t.status === 'done').length;

    return { overdue, dueToday, pending, completed };
  }, [tasks]);

  // Deal filtering and related data (moved from switch case)
  const filteredDeals = useMemo(() => {
    let filtered = deals || [];

    // Search filter
    if (dealSearchQuery) {
      filtered = filtered.filter(deal =>
        deal.title.toLowerCase().includes(dealSearchQuery.toLowerCase()) ||
        deal.contacts?.full_name?.toLowerCase().includes(dealSearchQuery.toLowerCase()) ||
        deal.contacts?.company_name?.toLowerCase().includes(dealSearchQuery.toLowerCase())
      );
    }

    // Stage filter
    if (dealStageFilter !== 'all') {
      filtered = filtered.filter(deal => deal.pipeline_stages?.name === dealStageFilter);
    }

    // Status filter
    if (dealStatusFilter !== 'all') {
      filtered = filtered.filter(deal => deal.status === dealStatusFilter);
    }

    // Owner filter
    if (dealOwnerFilter !== 'all') {
      if (dealOwnerFilter === 'my_deals') {
        filtered = filtered.filter(deal => deal.owner_id === user?.id);
      }
    }

    // Sort by updated date (most recent first)
    return filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [deals, dealSearchQuery, dealStageFilter, dealStatusFilter, dealOwnerFilter, user]);

  // Get unique stages for filter
  const availableStages = useMemo(() => {
    const stages = new Set<string>();
    deals?.forEach(deal => {
      if (deal.pipeline_stages?.name) {
        stages.add(deal.pipeline_stages.name);
      }
    });
    return Array.from(stages);
  }, [deals]);

  // Get selected deal
  const selectedDeal = useMemo(() => {
    return selectedDealId ? deals?.find(d => d.id === selectedDealId) : null;
  }, [deals, selectedDealId]);

  // Get deal timeline events
  const dealTimelineEvents = useMemo(() => {
    if (!selectedDealId) return [];
    return timelineEvents.filter(event => event.deal_id === selectedDealId);
  }, [timelineEvents, selectedDealId]);

  // Get deal activities
  const dealActivities = useMemo(() => {
    if (!selectedDealId) return [];
    return savedActivities.filter(activity => activity.deal_id === selectedDealId);
  }, [savedActivities, selectedDealId]);

  // Get deal tasks
  const dealTasks = useMemo(() => {
    if (!selectedDealId) return [];
    return tasks.filter(task => (task as any).deal_id === selectedDealId);
  }, [tasks, selectedDealId]);

  // Get deal notes
  const dealNotes = useMemo(() => {
    if (!selectedDealId) return [];
    return notes.filter(note => (note as any).deal_id === selectedDealId);
  }, [notes, selectedDealId]);

  // Handle activity submission
  const handleLogActivity = async () => {
    if (!activityNote.trim()) {
      alert('Please enter a note or activity');
      return;
    }

    try {
      await createActivity.mutateAsync({
        activity_type: 'note',
        title: activityNote.trim().substring(0, 100),
        content: activityNote.trim(),
        activity_date: new Date().toISOString(),
      });
      setActivityNote(''); // Clear form after successful save
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Failed to save activity. Please try again.');
    }
  };

  // Modal & Form States for Contacts
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    status: 'new' as Contact['status'],
    company_name: ''
  });

  // Modal & Form States for Companies
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    legal_name: '',
    website: '',
    email: '',
    phone: '',
    industry: '',
    company_size: '',
    description: '',
    lifecycle_stage: 'lead' as Company['lifecycle_stage'],
  });

  // Transform database contacts to UI format
  const contacts = useMemo(() => {
    return dbContacts.map(contact => ({
      id: contact.id,
      name: contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed',
      email: contact.email || '',
      status: mapStatusToUI(contact.status, contact.lifecycle_stage),
      company: contact.company_name || '',
      lastContact: formatTimeAgo(contact.last_contacted_at || contact.last_activity_at),
      color: getContactColor(contact),
      dbContact: contact, // Keep reference to original
    }));
  }, [dbContacts]);

  const tabs: { id: CRMTab; label: string; icon: React.ReactNode }[] = [
    { id: 'pipelines', label: 'Pipelines', icon: <Trello size={16} /> },
    { id: 'deals', label: 'Deals', icon: <DollarSign size={16} /> },
    { id: 'activities', label: 'Activities', icon: <Activity size={16} /> },
    { id: 'tasks', label: 'Tasks & follow-ups', icon: <CheckCircle2 size={16} /> },
    { id: 'timeline', label: 'Timeline', icon: <History size={16} /> },
    { id: 'notes', label: 'Notes', icon: <FileText size={16} /> },
    { id: 'automations', label: 'Automations', icon: <Zap size={16} /> },
    { id: 'owners', label: 'Owners', icon: <Users size={16} /> },
    { id: 'analytics', label: 'CRM Analytics', icon: <TrendingUp size={16} /> },
  ];

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);

  // Unified Communication History - All interactions across all channels
  const allInteractions = useMemo(() => {
    const interactions: Array<{
      id: string;
      type: 'email' | 'call' | 'message' | 'social' | 'meeting' | 'deal' | 'task' | 'campaign';
      platform?: string;
      contact?: string;
      company?: string;
      subject?: string;
      content?: string;
      value?: number;
      timestamp: string;
      icon: React.ReactNode;
      color: string;
    }> = [];

    // Add mock interactions for now (would be from database)
    interactions.push(
      {
        id: '1',
        type: 'email',
        contact: 'Sarah Johnson',
        subject: 'Q3 Project Proposal',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        icon: <Mail size={14} />,
        color: 'blue'
      },
      {
        id: '2',
        type: 'call',
        contact: 'Michael Chen',
        content: 'Discussed pricing options',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        icon: <Phone size={14} />,
        color: 'green'
      },
      {
        id: '3',
        type: 'social',
        platform: 'Instagram',
        contact: '@johndoe',
        content: 'Commented on latest post',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        icon: <Instagram size={14} />,
        color: 'pink'
      },
      {
        id: '4',
        type: 'message',
        platform: 'WhatsApp',
        contact: 'Emma Wilson',
        content: 'Inquiry about services',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        icon: <MessageSquare size={14} />,
        color: 'green'
      },
      {
        id: '5',
        type: 'deal',
        contact: 'TechCorp Inc',
        value: 45000,
        content: 'Deal moved to Won stage',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        icon: <DollarSign size={14} />,
        color: 'purple'
      }
    );

    // Sort by timestamp (newest first)
    return interactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  // Combine all activities: notes, deals, tasks, campaigns
  const allActivities = useMemo(() => {
    const activities: Array<{
      id: string;
      type: 'note' | 'deal' | 'task' | 'campaign' | 'call' | 'email' | 'message' | 'social' | 'meeting';
      title: string;
      content?: string;
      contact?: string;
      value?: number;
      status?: string;
      dueDate?: string;
      timestamp: string;
      icon: React.ReactNode;
      color: string;
    }> = [];

    // Add deals
    deals?.slice(0, 3).forEach(deal => {
      activities.push({
        id: `deal-${deal.id}`,
        type: 'deal',
        title: deal.title,
        value: deal.amount,
        status: deal.status,
        timestamp: deal.updated_at || deal.created_at,
        icon: <DollarSign size={14} />,
        color: 'purple'
      });
    });

    // Add tasks
    tasks?.slice(0, 3).forEach(task => {
      activities.push({
        id: `task-${task.id}`,
        type: 'task',
        title: task.title,
        status: task.status,
        dueDate: task.due_date,
        timestamp: task.updated_at || task.created_at,
        icon: <CheckCircle2 size={14} />,
        color: 'blue'
      });
    });

    // Add campaign participation
    campaigns?.slice(0, 2).forEach(campaign => {
      activities.push({
        id: `campaign-${campaign.id}`,
        type: 'campaign',
        title: campaign.name,
        content: `Campaign ${campaign.status || 'active'}`,
        timestamp: campaign.updated_at || campaign.created_at,
        icon: <Share2 size={14} />,
        color: 'orange'
      });
    });

    // Add saved activities from database
    savedActivities?.forEach(activity => {
      const getIcon = (type: string) => {
        switch (type) {
          case 'call': return <Phone size={14} />;
          case 'email': return <Mail size={14} />;
          case 'note': return <FileText size={14} />;
          case 'meeting': return <Calendar size={14} />;
          case 'deal': return <DollarSign size={14} />;
          case 'task': return <CheckCircle2 size={14} />;
          case 'campaign': return <Share2 size={14} />;
          case 'message': return <MessageSquare size={14} />;
          case 'social': return <Instagram size={14} />;
          default: return <FileText size={14} />;
        }
      };

      const getColor = (type: string) => {
        switch (type) {
          case 'call': return 'green';
          case 'email': return 'blue';
          case 'note': return 'gray';
          case 'meeting': return 'purple';
          case 'deal': return 'purple';
          case 'task': return 'blue';
          case 'campaign': return 'orange';
          case 'message': return 'green';
          case 'social': return 'pink';
          default: return 'gray';
        }
      };

      activities.push({
        id: activity.id,
        type: activity.activity_type as 'note' | 'deal' | 'task' | 'campaign' | 'call' | 'email',
        title: activity.title || activity.content?.substring(0, 50) || 'Activity',
        content: activity.content,
        timestamp: activity.activity_date || activity.created_at,
        icon: getIcon(activity.activity_type),
        color: getColor(activity.activity_type)
      });
    });

    // Add mock notes/activities for demo (if no saved activities)
    if (savedActivities.length === 0) {
      activities.push(
        {
          id: 'note-1',
          type: 'call',
          title: 'Call with Sarah',
          content: 'Discussed Q3 project scope. Follow-up needed.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: <Phone size={14} />,
          color: 'green'
        },
        {
          id: 'note-2',
          type: 'email',
          title: 'Email sent',
          content: 'Proposal sent to Skyline Real Estate',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          icon: <Mail size={14} />,
          color: 'blue'
        },
        {
          id: 'note-3',
          type: 'note',
          title: 'Internal Note',
          content: 'Customer prefers WhatsApp communication',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          icon: <FileText size={14} />,
          color: 'gray'
        }
      );
    }

    // Sort by timestamp (newest first)
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [deals, tasks, campaigns, savedActivities]);

  // Pipeline-filtered deals (search + pipeline filters)
  const pipelineFilteredDeals = useMemo(() => {
    let list = deals ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          (d.title || '').toLowerCase().includes(q) ||
          (d.contacts?.full_name || '').toLowerCase().includes(q) ||
          (d.contacts?.company_name || '').toLowerCase().includes(q) ||
          (d.companies?.name || '').toLowerCase().includes(q)
      );
    }
    if (pipelineFilterOwner !== 'all') {
      list = list.filter((d) => (d as any).owner_id === pipelineFilterOwner);
    }
    if (pipelineFilterDate !== 'all') {
      const now = new Date();
      if (pipelineFilterDate === 'this_week') {
        const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0);
        list = list.filter((d) => d.expected_close_date && new Date(d.expected_close_date) >= start);
      } else if (pipelineFilterDate === 'this_month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        list = list.filter((d) => d.expected_close_date && new Date(d.expected_close_date) >= start);
      } else if (pipelineFilterDate === 'this_quarter') {
        const start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        list = list.filter((d) => d.expected_close_date && new Date(d.expected_close_date) >= start);
      }
    }
    if (pipelineFilterValue !== 'all') {
      if (pipelineFilterValue === 'under_1k') list = list.filter((d) => (Number(d.amount) || 0) < 1000);
      else if (pipelineFilterValue === '1k_10k') list = list.filter((d) => { const a = Number(d.amount) || 0; return a >= 1000 && a < 10000; });
      else if (pipelineFilterValue === '10k_plus') list = list.filter((d) => (Number(d.amount) || 0) >= 10000);
    }
    if (pipelineFilterSource !== 'all') {
      list = list.filter((d) => ((d as any).lead_source || '') === pipelineFilterSource);
    }
    if (pipelineFilterStatus !== 'all') {
      list = list.filter((d) => (d.status || 'open') === pipelineFilterStatus);
    }
    return list;
  }, [deals, searchQuery, pipelineFilterOwner, pipelineFilterDate, pipelineFilterValue, pipelineFilterSource, pipelineFilterStatus, user?.id]);

  // Pipeline data - ALWAYS show all 7 stages (uses filtered deals for pipeline view)
  const dealColumns = useMemo(() => {
    const stageOrder = ['Lead', 'Contacted', 'Engaged', 'Proposal', 'Negotiation', 'Won', 'Lost'];
    const columns = new Map<string, typeof deals>();

    pipelineFilteredDeals.forEach((deal) => {
      const stageName = deal.pipeline_stages?.name || 'Unassigned';
      if (!columns.has(stageName)) {
        columns.set(stageName, []);
      }
      columns.get(stageName)!.push(deal);
    });

    return stageOrder.map((name) => ({
      name,
      deals: columns.get(name) || []
    }));
  }, [pipelineFilteredDeals]);

  const pipelineTotals = useMemo(() => {
    const totalDeals = pipelineFilteredDeals.length;
    const totalValue = pipelineFilteredDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const weighted = pipelineFilteredDeals.reduce((sum, d) => {
      const probability = d.probability ?? d.pipeline_stages?.probability ?? 0;
      return sum + (Number(d.amount) || 0) * (probability / 100);
    }, 0);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const wonThisMonth = (wonDeals || []).reduce((sum, d) => {
      const closeDate = d.actual_close_date ? new Date(d.actual_close_date) : null;
      if (closeDate && closeDate >= startOfMonth) {
        return sum + (Number(d.amount) || 0);
      }
      return sum;
    }, 0);
    return { totalDeals, totalValue, weighted, wonThisMonth };
  }, [pipelineFilteredDeals, wonDeals]);

  const filteredCompanies = useMemo(() => {
    return dbCompanies.filter(company =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.email && company.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (company.industry && company.industry.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [dbCompanies, searchQuery]);

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({ first_name: '', last_name: '', email: '', status: 'new', company_name: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (contact: typeof contacts[0]) => {
    const dbContact = contact.dbContact;
    setEditingContact(dbContact);
    setFormData({
      first_name: dbContact.first_name || '',
      last_name: dbContact.last_name || '',
      email: dbContact.email || '',
      status: dbContact.status,
      company_name: dbContact.company_name || ''
    });
    setIsModalOpen(true);
  };

  // Company handlers
  const openAddCompanyModal = () => {
    setEditingCompany(null);
    setCompanyFormData({
      name: '',
      legal_name: '',
      website: '',
      email: '',
      phone: '',
      industry: '',
      company_size: '',
      description: '',
      lifecycle_stage: 'lead',
    });
    setIsCompanyModalOpen(true);
  };

  const openEditCompanyModal = (company: Company) => {
    setEditingCompany(company);
    setCompanyFormData({
      name: company.name || '',
      legal_name: company.legal_name || '',
      website: company.website || '',
      email: company.email || '',
      phone: company.phone || '',
      industry: company.industry || '',
      company_size: company.company_size || '',
      description: company.description || '',
      lifecycle_stage: company.lifecycle_stage || 'lead',
    });
    setIsCompanyModalOpen(true);
  };

  // Deal modal handlers (used by both Pipelines and Deals tabs)
  const openAddDealModal = (stageName?: string) => {
    setNewDealPreSelectedStageName(stageName ?? null);
    setEditingDeal(null);
    setDealFormData({
      title: '',
      description: '',
      amount: '',
      contact_id: '',
      company_id: '',
      stage_id: '',
      priority: 'medium',
      expected_close_date: '',
      probability: 50,
      lead_source: '',
    });
    setIsDealModalOpen(true);
  };

  const openEditDealModal = (deal: any) => {
    setNewDealPreSelectedStageName(null);
    setEditingDeal(deal);
    setDealFormData({
      title: deal.title,
      description: deal.description || '',
      amount: String(deal.amount || ''),
      contact_id: deal.contact_id || '',
      company_id: deal.company_id || '',
      stage_id: deal.stage_id || '',
      priority: deal.priority || 'medium',
      expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date).toISOString().split('T')[0] : '',
      probability: deal.probability || 50,
      lead_source: deal.lead_source || '',
    });
    setIsDealModalOpen(true);
  };

  const handleSaveDeal = async () => {
    if (!dealFormData.title.trim() || !dealFormData.amount) return;

    try {
      const dealData: any = {
        title: dealFormData.title,
        description: dealFormData.description,
        amount: Number(dealFormData.amount),
        contact_id: dealFormData.contact_id || null,
        company_id: dealFormData.company_id || null,
        priority: dealFormData.priority,
        expected_close_date: dealFormData.expected_close_date || null,
        probability: dealFormData.probability,
        lead_source: dealFormData.lead_source || null,
        status: 'open',
      };

      if (editingDeal) {
        await updateDeal.mutateAsync({ id: editingDeal.id, updates: dealData });
      } else {
        const stageNameToUse = newDealPreSelectedStageName || 'Lead';
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('owner_id', authUser.id)
            .single();

          if (workspace) {
            const { data: pipeline } = await supabase
              .from('pipelines')
              .select('id')
              .eq('workspace_id', workspace.id)
              .eq('is_default', true)
              .single();

            if (pipeline) {
              const { data: stageRow } = await supabase
                .from('pipeline_stages')
                .select('id')
                .eq('pipeline_id', pipeline.id)
                .eq('name', stageNameToUse)
                .single();

              if (stageRow) {
                dealData.pipeline_id = pipeline.id;
                dealData.stage_id = stageRow.id;
              } else {
                const { data: firstStage } = await supabase
                  .from('pipeline_stages')
                  .select('id')
                  .eq('pipeline_id', pipeline.id)
                  .order('position', { ascending: true })
                  .limit(1)
                  .single();

                if (firstStage) {
                  dealData.pipeline_id = pipeline.id;
                  dealData.stage_id = firstStage.id;
                }
              }
            }
          }
        }
        if (!dealData.stage_id && deals && deals.length > 0) {
          dealData.pipeline_id = deals[0].pipeline_id;
          const { data: leadStage } = await supabase
            .from('pipeline_stages')
            .select('id')
            .eq('pipeline_id', deals[0].pipeline_id)
            .eq('name', 'Lead')
            .single();
          if (leadStage) dealData.stage_id = leadStage.id;
        }

        await createDeal.mutateAsync(dealData as any);
      }

      setIsDealModalOpen(false);
      setEditingDeal(null);
      setNewDealPreSelectedStageName(null);
    } catch (error) {
      console.error('Error saving deal:', error);
      alert('Failed to save deal. Please try again.');
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await deleteCompany.mutateAsync(id);
      } catch (err) {
        console.error('Error deleting company:', err);
        alert('Failed to delete company. Please try again.');
      }
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await updateCompany.mutateAsync({
          id: editingCompany.id,
          updates: companyFormData,
        });
      } else {
        await createCompany.mutateAsync({
          name: companyFormData.name,
          legal_name: companyFormData.legal_name || undefined,
          website: companyFormData.website || undefined,
          email: companyFormData.email || undefined,
          phone: companyFormData.phone || undefined,
          industry: companyFormData.industry || undefined,
          company_size: companyFormData.company_size || undefined,
          description: companyFormData.description || undefined,
          lifecycle_stage: companyFormData.lifecycle_stage,
        });
      }
      setIsCompanyModalOpen(false);
    } catch (err: any) {
      console.error('Error saving company:', err);
      const errorMessage = err?.message || err?.error?.message || 'Unknown error occurred';
      alert(`Failed to save company: ${errorMessage}\n\nPlease check:\n1. You have a workspace set up\n2. All required fields are filled`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact.mutateAsync(id);
      } catch (err) {
        console.error('Error deleting contact:', err);
        alert('Failed to delete contact. Please try again.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await updateContact.mutateAsync({
          id: editingContact.id,
          updates: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            status: formData.status,
            company_name: formData.company_name,
          }
        });
      } else {
        await createContact.mutateAsync({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          status: formData.status,
          company_name: formData.company_name,
          type: 'contact',
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving contact:', err);
      // Show more detailed error message
      const errorMessage = err?.message || err?.error?.message || 'Unknown error occurred';
      alert(`Failed to save contact: ${errorMessage}\n\nPlease check:\n1. You have a workspace set up\n2. The email is not already in use\n3. All required fields are filled`);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'contacts':
        if (selectedContactId) {
          return (
            <CustomerProfile
              customerId={selectedContactId}
              onBack={() => setSelectedContactId(null)}
            />
          );
        }
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
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading contacts...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-red-400">
                        Error loading contacts. Please refresh the page.
                      </td>
                    </tr>
                  ) : filteredContacts.length > 0 ? (
                    filteredContacts.map((contact) => (
                      <tr
                        key={contact.id}
                        onClick={() => setSelectedContactId(contact.dbContact.id)}
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all group cursor-pointer"
                      >
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
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${contact.status === 'Customer' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' :
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
                              onClick={(e) => { e.stopPropagation(); openEditModal(contact); }}
                              className="p-2 text-gray-400 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(contact.id); }}
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
          <div className="space-y-6">
            {/* Pipeline Header with Controls */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 relative">
                  <div className="relative">
                    <button
                      onClick={() => setIsPipelineDropdownOpen(!isPipelineDropdownOpen)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                    >
                      Pipeline: Sales Pipeline
                      <ChevronDown size={16} />
                    </button>
                    {isPipelineDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg z-50 min-w-[200px]">
                        <button onClick={() => { setSelectedPipelineId('sales'); setIsPipelineDropdownOpen(false); }} className="w-full px-4 py-2 text-left text-sm font-bold text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700">Sales Pipeline</button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => openAddDealModal()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all"
                  >
                    <Plus size={16} /> New Deal
                  </button>
                  <button
                    onClick={() => setIsPipelineSettingsOpen(true)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <Settings size={18} />
                  </button>
                </div>
              </div>

              {/* Pipeline Summary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Total Deals</p>
                  <p className="text-lg font-black text-gray-900 dark:text-slate-100">{pipelineTotals.totalDeals}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Expected Revenue</p>
                  <p className="text-lg font-black text-gray-900 dark:text-slate-100">{formatCurrency(pipelineTotals.totalValue)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Weighted Forecast</p>
                  <p className="text-lg font-black text-gray-900 dark:text-slate-100">{formatCurrency(pipelineTotals.weighted)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Won This Month</p>
                  <p className="text-lg font-black text-green-600 dark:text-green-400">{formatCurrency(pipelineTotals.wonThisMonth)}</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-4">
              <div className="flex flex-wrap gap-2 relative">
                {/* Owner */}
                <div className="relative">
                  <button onClick={() => setOpenPipelineFilter(openPipelineFilter === 'owner' ? null : 'owner')} className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                    <Filter size={12} className="inline mr-1" /> Owner: {pipelineFilterOwner === 'all' ? 'All' : 'Me'}
                  </button>
                  {openPipelineFilter === 'owner' && (
                    <div className="absolute top-full left-0 mt-1 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[140px]">
                      <button onClick={() => { setPipelineFilterOwner('all'); setOpenPipelineFilter(null); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">All</button>
                      <button onClick={() => { setPipelineFilterOwner(user?.id || 'all'); setOpenPipelineFilter(null); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">Me</button>
                    </div>
                  )}
                </div>
                {/* Date */}
                <div className="relative">
                  <button onClick={() => setOpenPipelineFilter(openPipelineFilter === 'date' ? null : 'date')} className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                    Date: {pipelineFilterDate === 'all' ? 'All Time' : pipelineFilterDate === 'this_week' ? 'This Week' : pipelineFilterDate === 'this_month' ? 'This Month' : 'This Quarter'}
                  </button>
                  {openPipelineFilter === 'date' && (
                    <div className="absolute top-full left-0 mt-1 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[160px]">
                      <button onClick={() => { setPipelineFilterDate('all'); setOpenPipelineFilter(null); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">All Time</button>
                      <button onClick={() => { setPipelineFilterDate('this_week'); setOpenPipelineFilter(null); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">This Week</button>
                      <button onClick={() => { setPipelineFilterDate('this_month'); setOpenPipelineFilter(null); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">This Month</button>
                      <button onClick={() => { setPipelineFilterDate('this_quarter'); setOpenPipelineFilter(null); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">This Quarter</button>
                    </div>
                  )}
                </div>
                {/* Value */}
                <div className="relative">
                  <button onClick={() => setOpenPipelineFilter(openPipelineFilter === 'value' ? null : 'value')} className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                    Value: {pipelineFilterValue === 'all' ? 'All' : pipelineFilterValue === 'under_1k' ? 'Under 1k' : pipelineFilterValue === '1k_10k' ? '1k–10k' : '10k+'}
                  </button>
                  {openPipelineFilter === 'value' && (
                    <div className="absolute top-full left-0 mt-1 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[140px]">
                      <button onClick={() => { setPipelineFilterValue('all'); setOpenPipelineFilter(null); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">All</button>
                      <button onClick={() => { setPipelineFilterValue('under_1k'); setOpenPipelineFilter(null); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">Under 1k</button>
                      <button onClick={() => { setPipelineFilterValue('1k_10k'); setOpenPipelineFilter(null); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">1k–10k</button>
                      <button onClick={() => { setPipelineFilterValue('10k_plus'); setOpenPipelineFilter(null); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">10k+</button>
                    </div>
                  )}
                </div>
                {/* Source */}
                <div className="relative">
                  <button onClick={() => setOpenPipelineFilter(openPipelineFilter === 'source' ? null : 'source')} className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                    Source: {pipelineFilterSource === 'all' ? 'All' : pipelineFilterSource}
                  </button>
                  {openPipelineFilter === 'source' && (
                    <div className="absolute top-full left-0 mt-1 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[160px] max-h-48 overflow-y-auto">
                      <button onClick={() => { setPipelineFilterSource('all'); setOpenPipelineFilter(null); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">All</button>
                      {Array.from(new Set((deals ?? []).map((d) => d.lead_source).filter((x): x is string => Boolean(x)))).map((src) => (
                        <button key={src} onClick={() => { setPipelineFilterSource(src); setOpenPipelineFilter(null); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">{src}</button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Status */}
                <div className="relative">
                  <button onClick={() => setOpenPipelineFilter(openPipelineFilter === 'status' ? null : 'status')} className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                    Status: {pipelineFilterStatus === 'all' ? 'All' : pipelineFilterStatus}
                  </button>
                  {openPipelineFilter === 'status' && (
                    <div className="absolute top-full left-0 mt-1 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[140px]">
                      <button onClick={() => { setPipelineFilterStatus('all'); setOpenPipelineFilter(null); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">All</button>
                      <button onClick={() => { setPipelineFilterStatus('open'); setOpenPipelineFilter(null); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">Open</button>
                      <button onClick={() => { setPipelineFilterStatus('won'); setOpenPipelineFilter(null); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">Won</button>
                      <button onClick={() => { setPipelineFilterStatus('lost'); setOpenPipelineFilter(null); }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">Lost</button>
                    </div>
                  )}
                </div>
                {/* Tags */}
                <div className="relative">
                  <button onClick={() => setOpenPipelineFilter(openPipelineFilter === 'tags' ? null : 'tags')} className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                    Tags: All
                  </button>
                  {openPipelineFilter === 'tags' && (
                    <div className="absolute top-full left-0 mt-1 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[120px]">
                      <button onClick={() => setOpenPipelineFilter(null)} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700">All</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kanban Board - All 7 stages visible in grid */}
            <div className="grid grid-cols-7 gap-3 pb-6">
              {dealColumns.map((col) => {
                const columnTotal = col.deals?.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) || 0;
                return (
                  <div key={col.name} className="flex flex-col gap-4">
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-2 py-2 bg-white dark:bg-slate-900 border-b-2 border-gray-200 dark:border-slate-700 rounded-t-xl">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-gray-800 dark:text-slate-200 uppercase tracking-widest truncate">{col.name}</h4>
                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{col.deals.length} • {formatCurrency(columnTotal)}</p>
                      </div>
                      <button
                        onClick={() => openAddDealModal(col.name)}
                        className="p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-all flex-shrink-0"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Column Content */}
                    <div className="bg-gray-50 dark:bg-slate-800/30 rounded-b-xl p-2 min-h-[500px] flex flex-col gap-2 border border-gray-100 dark:border-slate-800 border-t-0">
                      {col.deals.length === 0 ? (
                        <div className="text-center text-xs text-gray-400 py-12 italic">No deals in this stage</div>
                      ) : (
                        col.deals.map((deal) => {
                          const contactName = deal.contacts?.full_name || deal.contacts?.company_name || 'Unassigned';
                          const priorityColors: Record<string, string> = {
                            urgent: 'bg-red-50 text-red-600 dark:bg-red-900/20',
                            high: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20',
                            medium: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20',
                            low: 'bg-gray-50 text-gray-600 dark:bg-gray-800'
                          };
                          const priorityColor = priorityColors[deal.priority || 'medium'] || priorityColors.medium;

                          const hasOverdueTask = false;
                          const hasNotes = false;
                          const hasMessages = false;
                          const hasCampaign = false;

                          return (
                            <div
                              key={deal.id}
                              className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all group cursor-pointer"
                              onClick={() => setSelectedDealId(deal.id)}
                            >
                              {/* Deal Title & Customer */}
                              <div className="mb-2">
                                <p className="text-xs font-black text-gray-900 dark:text-slate-100 line-clamp-2 mb-1">{deal.title}</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{formatCurrency(Number(deal.amount) || 0)}</p>
                                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">{contactName}</p>
                              </div>

                              {/* Priority Badge */}
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${priorityColor}`}>
                                  {deal.priority || 'medium'}
                                </span>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                  {hasMessages && <MessageCircle size={10} className="text-blue-500" />}
                                  {hasNotes && <StickyNote size={10} className="text-yellow-500" />}
                                  {hasOverdueTask && <AlertCircle size={10} className="text-red-500" />}
                                  {hasCampaign && <Megaphone size={10} className="text-purple-500" />}
                                </div>
                              </div>

                              {/* Close Date */}
                              <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-slate-400">
                                <Calendar size={10} />
                                <span className="truncate">{deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Not set'}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'deals':
        // Get deal health
        const getDealHealth = (deal: any) => {
          const lastActivity = new Date(deal.updated_at || deal.created_at);
          const now = new Date();
          const diffDays = (now.getTime() - lastActivity.getTime()) / 86400000;

          if (diffDays <= 2) return { label: '🟢 Healthy', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' };
          if (diffDays <= 5) return { label: '🟡 Risk', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' };
          return { label: '🔴 Critical', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' };
        };

        // Calculate deal age
        const getDealAge = (deal: any) => {
          const created = new Date(deal.created_at);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - created.getTime()) / 86400000);
          if (diffDays === 0) return 'Today';
          if (diffDays === 1) return '1 day';
          return `${diffDays} days`;
        };


        const handleMarkWon = async (dealId: string) => {
          try {
            await updateDeal.mutateAsync({
              id: dealId,
              updates: {
                status: 'won',
                actual_close_date: new Date().toISOString().split('T')[0],
              },
            });
          } catch (error) {
            console.error('Error marking deal as won:', error);
            alert('Failed to update deal. Please try again.');
          }
        };

        const handleMarkLost = async (dealId: string, reason: string) => {
          try {
            await updateDeal.mutateAsync({
              id: dealId,
              updates: {
                status: 'lost',
                actual_close_date: new Date().toISOString().split('T')[0],
                notes: reason, // Store loss reason in notes for now
              },
            });
          } catch (error) {
            console.error('Error marking deal as lost:', error);
            alert('Failed to update deal. Please try again.');
          }
        };

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-1">💰 Deals</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">One deal = one possible sale</p>
                </div>
                <button
                  onClick={openAddDealModal}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all"
                >
                  <Plus size={16} /> New Deal
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search deals..."
                    value={dealSearchQuery}
                    onChange={(e) => setDealSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                  />
                </div>
                <select
                  value={dealStageFilter}
                  onChange={(e) => setDealStageFilter(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                >
                  <option value="all">All Stages</option>
                  {availableStages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
                <select
                  value={dealStatusFilter}
                  onChange={(e) => setDealStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                  <option value="abandoned">Abandoned</option>
                </select>
                <select
                  value={dealOwnerFilter}
                  onChange={(e) => setDealOwnerFilter(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                >
                  <option value="all">All Owners</option>
                  <option value="my_deals">My Deals</option>
                </select>
                <button
                  onClick={() => {
                    setDealSearchQuery('');
                    setDealStageFilter('all');
                    setDealStatusFilter('all');
                    setDealOwnerFilter('all');
                  }}
                  className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Deals Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                      <th className="px-6 py-4">Deal Name</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Stage</th>
                      <th className="px-6 py-4">Value</th>
                      <th className="px-6 py-4">Owner</th>
                      <th className="px-6 py-4">Age</th>
                      <th className="px-6 py-4">Health</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {filteredDeals.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-20 text-center text-gray-400">
                          <DollarSign size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                          <p className="text-gray-500 dark:text-slate-400">No deals found. Create your first deal to get started.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredDeals.map((deal) => {
                        const health = getDealHealth(deal);
                        const customerName = deal.contacts?.full_name || deal.contacts?.company_name || deal.companies?.name || 'Unassigned';
                        const stageName = deal.pipeline_stages?.name || 'Unassigned';
                        const ownerName = user?.email?.split('@')[0] || 'You';

                        return (
                          <tr
                            key={deal.id}
                            onClick={() => setSelectedDealId(deal.id)}
                            className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all group cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{deal.title}</p>
                                {deal.description && (
                                  <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">{deal.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">{customerName}</td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                {stageName}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{formatCurrency(Number(deal.amount) || 0)}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">{deal.probability || 0}% prob</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">{ownerName}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">{getDealAge(deal)}</td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${health.color}`}>
                                {health.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDealModal(deal);
                                  }}
                                  className="p-2 text-gray-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
                                </button>
                                {deal.status === 'open' && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('Mark this deal as won?')) {
                                          handleMarkWon(deal.id);
                                        }
                                      }}
                                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                                      title="Mark as Won"
                                    >
                                      <CheckCircle size={14} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const reason = prompt('Loss reason:');
                                        if (reason) {
                                          handleMarkLost(deal.id, reason);
                                        }
                                      }}
                                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                                      title="Mark as Lost"
                                    >
                                      <XCircle size={14} />
                                    </button>
                                  </>
                                )}
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

          </div>
        );

      case 'activities':
        const getActivityIcon = (type: string) => {
          switch (type) {
            case 'call': return '📞';
            case 'email': return '✉';
            case 'message': return '💬';
            case 'meeting': return '🤝';
            case 'follow-up': return '📝';
            case 'demo': return '🎯';
            case 'task': return '📎';
            default: return '•';
          }
        };

        const getActivityTypeLabel = (type: string) => {
          const labels: Record<string, string> = {
            call: 'Call',
            email: 'Email',
            message: 'Message',
            meeting: 'Meeting',
            'follow-up': 'Follow-up',
            demo: 'Demo',
            task: 'Task',
          };
          return labels[type] || type;
        };

        const openAddActivityModal = () => {
          setSelectedActivityId(null);
          setActivityFormData({
            activity_type: 'call',
            title: '',
            content: '',
            contact_id: '',
            deal_id: '',
            activity_date: new Date().toISOString().split('T')[0],
            status: 'scheduled',
            outcome: '',
            duration: '',
          });
          setIsActivityModalOpen(true);
        };

        const openEditActivityModal = (activity: any) => {
          setSelectedActivityId(activity.id);
          setActivityFormData({
            activity_type: activity.activity_type,
            title: activity.title || '',
            content: activity.content || '',
            contact_id: activity.contact_id || '',
            deal_id: activity.deal_id || '',
            activity_date: activity.activity_date ? new Date(activity.activity_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: (activity.status || 'scheduled') as any,
            outcome: activity.metadata?.outcome || '',
            duration: activity.metadata?.duration || '',
          });
          setIsActivityModalOpen(true);
        };

        const handleSaveActivity = async () => {
          try {
            const activityData: any = {
              activity_type: activityFormData.activity_type,
              title: activityFormData.title,
              content: activityFormData.content,
              activity_date: new Date(activityFormData.activity_date).toISOString(),
              status: activityFormData.status,
              contact_id: activityFormData.contact_id || null,
              deal_id: activityFormData.deal_id || null,
              metadata: {
                outcome: activityFormData.outcome,
                duration: activityFormData.duration,
              },
            };

            if (selectedActivityId) {
              await updateActivity.mutateAsync({
                id: selectedActivityId,
                updates: activityData,
              });
            } else {
              await createActivity.mutateAsync(activityData);
            }
            setIsActivityModalOpen(false);
          } catch (error) {
            console.error('Error saving activity:', error);
            alert('Failed to save activity. Please try again.');
          }
        };

        const selectedActivity = selectedActivityId
          ? savedActivities.find(a => a.id === selectedActivityId)
          : null;

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-1">⚙️ CRM Activities</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Action log of your entire business</p>
                </div>
                <button
                  onClick={openAddActivityModal}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all"
                >
                  <Plus size={16} /> New Activity
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <select
                  value={activityTypeFilter}
                  onChange={(e) => setActivityTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="call">📞 Call</option>
                  <option value="email">✉ Email</option>
                  <option value="message">💬 Message</option>
                  <option value="meeting">🤝 Meeting</option>
                  <option value="follow-up">📝 Follow-up</option>
                  <option value="demo">🎯 Demo</option>
                  <option value="task">📎 Task</option>
                </select>
                <select
                  value={activityStatusFilter}
                  onChange={(e) => setActivityStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Done</option>
                  <option value="missed">Missed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <input
                  type="date"
                  value={activityStartDate}
                  onChange={(e) => setActivityStartDate(e.target.value)}
                  placeholder="Start Date"
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                />
                <input
                  type="date"
                  value={activityEndDate}
                  onChange={(e) => setActivityEndDate(e.target.value)}
                  placeholder="End Date"
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                />
                <button
                  onClick={() => {
                    setActivityTypeFilter('all');
                    setActivityStatusFilter('all');
                    setActivityStartDate('');
                    setActivityEndDate('');
                  }}
                  className="px-3 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Activities Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Deal</th>
                      <th className="px-6 py-4">Owner</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {filteredActivities.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center text-gray-400">
                          <Activity size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                          <p className="text-gray-500 dark:text-slate-400">No activities found. Create your first activity.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredActivities.map((activity) => {
                        const customerName = activity.contact_id
                          ? contactNameById.get(activity.contact_id) || 'Unknown'
                          : activity.company_id
                            ? companyNameById.get(activity.company_id) || 'Unknown'
                            : '-';
                        const dealTitle = activity.deal_id
                          ? dealTitleById.get(activity.deal_id) || 'Unknown'
                          : '-';
                        const ownerName = user?.email?.split('@')[0] || 'You';

                        return (
                          <tr
                            key={activity.id}
                            onClick={() => setSelectedActivityId(activity.id)}
                            className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all group cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
                                {getActivityIcon(activity.activity_type)} {getActivityTypeLabel(activity.activity_type)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300 font-medium">
                              {customerName}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300 font-medium">
                              {dealTitle}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300 font-medium">
                              {ownerName}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                              {formatTimeAgo(activity.activity_date)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${activity.status === 'completed'
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/20'
                                  : activity.status === 'scheduled'
                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-900/20'
                                }`}>
                                {activity.status || 'scheduled'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditActivityModal(activity);
                                  }}
                                  className="p-2 text-gray-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete this activity?')) {
                                      deleteActivity.mutateAsync(activity.id);
                                    }
                                  }}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
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

            {/* Activity Detail Drawer */}
            {selectedActivity && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-6 flex items-center justify-between z-10">
                    <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">Activity Details</h3>
                    <button
                      onClick={() => setSelectedActivityId(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Activity Type</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-slate-100">
                          {getActivityIcon(selectedActivity.activity_type)} {getActivityTypeLabel(selectedActivity.activity_type)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Status</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-slate-100 capitalize">
                          {selectedActivity.status || 'scheduled'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Customer</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                          {selectedActivity.contact_id
                            ? contactNameById.get(selectedActivity.contact_id) || 'Unknown'
                            : selectedActivity.company_id
                              ? companyNameById.get(selectedActivity.company_id) || 'Unknown'
                              : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Deal</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                          {selectedActivity.deal_id
                            ? dealTitleById.get(selectedActivity.deal_id) || 'Unknown'
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Owner</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                          {user?.email?.split('@')[0] || 'You'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Date</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                          {new Date(selectedActivity.activity_date).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedActivity.metadata?.duration && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Duration</p>
                          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                            {selectedActivity.metadata.duration}
                          </p>
                        </div>
                      )}
                      {selectedActivity.metadata?.outcome && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Outcome</p>
                          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                            {selectedActivity.metadata.outcome}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedActivity.content && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">Notes</p>
                        <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                          {selectedActivity.content}
                        </p>
                      </div>
                    )}

                    {selectedActivity.metadata?.next_action && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">Next Step</p>
                        <p className="text-sm text-gray-700 dark:text-slate-300">
                          {selectedActivity.metadata.next_action}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Activity Form Modal */}
            {isActivityModalOpen && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-6 flex items-center justify-between z-10">
                    <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                      {selectedActivityId ? 'Edit Activity' : 'Create Activity'}
                    </h3>
                    <button
                      onClick={() => setIsActivityModalOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Activity Type *</label>
                      <select
                        value={activityFormData.activity_type}
                        onChange={(e) => setActivityFormData({ ...activityFormData, activity_type: e.target.value as any })}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                      >
                        <option value="call">📞 Call</option>
                        <option value="email">✉ Email</option>
                        <option value="message">💬 Message</option>
                        <option value="meeting">🤝 Meeting</option>
                        <option value="follow-up">📝 Follow-up</option>
                        <option value="demo">🎯 Demo</option>
                        <option value="task">📎 Task</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Title</label>
                      <input
                        type="text"
                        value={activityFormData.title}
                        onChange={(e) => setActivityFormData({ ...activityFormData, title: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                        placeholder="Activity title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Customer</label>
                      <select
                        value={activityFormData.contact_id}
                        onChange={(e) => setActivityFormData({ ...activityFormData, contact_id: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                      >
                        <option value="">Select Customer...</option>
                        {dbContacts.map(contact => (
                          <option key={contact.id} value={contact.id}>
                            {contact.full_name || contact.email || 'Unnamed'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Deal (Optional)</label>
                      <select
                        value={activityFormData.deal_id}
                        onChange={(e) => setActivityFormData({ ...activityFormData, deal_id: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                      >
                        <option value="">Select Deal...</option>
                        {deals?.map(deal => (
                          <option key={deal.id} value={deal.id}>
                            {deal.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Date & Time *</label>
                        <input
                          type="date"
                          value={activityFormData.activity_date}
                          onChange={(e) => setActivityFormData({ ...activityFormData, activity_date: e.target.value })}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Status *</label>
                        <select
                          value={activityFormData.status}
                          onChange={(e) => setActivityFormData({ ...activityFormData, status: e.target.value as any })}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="missed">Missed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {activityFormData.status === 'completed' && (
                      <>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Outcome *</label>
                          <select
                            value={activityFormData.outcome}
                            onChange={(e) => setActivityFormData({ ...activityFormData, outcome: e.target.value })}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                          >
                            <option value="">Select Outcome...</option>
                            <option value="Interested">Interested</option>
                            <option value="No answer">No answer</option>
                            <option value="Not now">Not now</option>
                            <option value="Requested proposal">Requested proposal</option>
                            <option value="Call back later">Call back later</option>
                            <option value="Not interested">Not interested</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Duration</label>
                          <input
                            type="text"
                            value={activityFormData.duration}
                            onChange={(e) => setActivityFormData({ ...activityFormData, duration: e.target.value })}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                            placeholder="e.g., 8 minutes"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Notes</label>
                      <textarea
                        value={activityFormData.content}
                        onChange={(e) => setActivityFormData({ ...activityFormData, content: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                        rows={4}
                        placeholder="Add notes about this activity..."
                      />
                    </div>
                  </div>

                  <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-6 flex items-center justify-end gap-3">
                    <button
                      onClick={() => setIsActivityModalOpen(false)}
                      className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveActivity}
                      disabled={!activityFormData.activity_type || !activityFormData.activity_date || (activityFormData.status === 'completed' && !activityFormData.outcome)}
                      className="px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {selectedActivityId ? 'Update' : 'Create'} Activity
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'owners':
        const totalOwners = ownerStats.filter(o => o.id !== 'Unassigned').length;
        const unassigned = ownerStats.find(o => o.id === 'Unassigned');
        const totalPipeline = ownerStats.reduce((sum, o) => sum + o.pipelineValue, 0);
        const totalTasksOpen = ownerStats.reduce((sum, o) => sum + o.tasksOpen, 0);

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4">
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Active Owners</p>
                <p className="text-3xl font-black text-gray-900 dark:text-slate-100">{totalOwners}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">People accountable right now</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/50 p-4">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">Unassigned risk</p>
                <p className="text-3xl font-black text-amber-600 dark:text-amber-400">
                  {(unassigned?.dealsOpen || 0) + (unassigned?.tasksOpen || 0) + (unassigned?.customers || 0)}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Items with no owner</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4">
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Pipeline value</p>
                <p className="text-3xl font-black text-gray-900 dark:text-slate-100">{formatCurrency(totalPipeline)}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Tied to accountable owners</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4">
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Tasks open</p>
                <p className="text-3xl font-black text-gray-900 dark:text-slate-100">{totalTasksOpen}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Owners who must act now</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-slate-100">Owner accountability board</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">One primary owner per record. No shared responsibility.</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                    <Play size={14} /> Auto-assign
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all">
                    <Users size={14} /> Assign owner
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-slate-800">
                      <th className="px-4 py-3">Owner</th>
                      <th className="px-4 py-3">Customers</th>
                      <th className="px-4 py-3">Deals (open / won)</th>
                      <th className="px-4 py-3">Pipeline</th>
                      <th className="px-4 py-3">Tasks (open / done)</th>
                      <th className="px-4 py-3">Activities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {ownerStats.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-gray-400 italic">No owner data yet.</td>
                      </tr>
                    ) : (
                      [...ownerStats].sort((a, b) => b.pipelineValue - a.pipelineValue).map((owner) => (
                        <tr key={owner.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-gray-700 dark:text-slate-200">
                                {owner.label.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{owner.label}</p>
                                <p className="text-[11px] text-gray-500 dark:text-slate-400">Primary owner</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900 dark:text-slate-100">{owner.customers}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{owner.dealsOpen}</p>
                            <p className="text-[11px] text-green-600 dark:text-green-400 font-bold">{owner.dealsWon} won</p>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900 dark:text-slate-100">{formatCurrency(owner.pipelineValue)}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{owner.tasksOpen} open</p>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400">{owner.tasksCompleted} done</p>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900 dark:text-slate-100">{owner.activities}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'tasks':

        const openAddTaskModal = () => {
          setEditingTask(null);
          setTaskFormData({
            title: '',
            description: '',
            priority: 'medium',
            due_date: '',
            due_time: '',
            assigned_to: user?.id || '',
            contact_id: '',
            deal_id: '',
            reminder_time: '',
          });
          setIsTaskModalOpen(true);
        };

        const openEditTaskModal = (task: any) => {
          setEditingTask(task);
          const dueDate = task.due_date ? new Date(task.due_date) : null;
          setTaskFormData({
            title: task.title,
            description: task.description || '',
            priority: task.priority || 'medium',
            due_date: dueDate ? dueDate.toISOString().split('T')[0] : '',
            due_time: dueDate ? dueDate.toTimeString().slice(0, 5) : '',
            assigned_to: task.assigned_to || user?.id || '',
            contact_id: task.contact_id || '',
            deal_id: task.deal_id || '',
            reminder_time: task.reminder_time || '',
          });
          setIsTaskModalOpen(true);
        };

        const handleSaveTask = async () => {
          if (!taskFormData.title.trim()) return;

          try {
            const dueDateTime = taskFormData.due_date && taskFormData.due_time
              ? new Date(`${taskFormData.due_date}T${taskFormData.due_time}`).toISOString()
              : taskFormData.due_date
                ? new Date(`${taskFormData.due_date}T12:00`).toISOString()
                : null;

            const taskData: any = {
              title: taskFormData.title,
              description: taskFormData.description,
              priority: taskFormData.priority,
              due_date: dueDateTime,
              assigned_to: taskFormData.assigned_to || user?.id,
              status: 'todo',
              reminder_time: taskFormData.reminder_time || null,
            };

            if (taskFormData.contact_id) taskData.contact_id = taskFormData.contact_id;
            if (taskFormData.deal_id) taskData.deal_id = taskFormData.deal_id;

            if (editingTask) {
              await updateTask.mutateAsync({ id: editingTask.id, updates: taskData });
            } else {
              await createTask.mutateAsync(taskData);
            }

            setIsTaskModalOpen(false);
            setEditingTask(null);
          } catch (error) {
            console.error('Error saving task:', error);
            alert('Failed to save task. Please try again.');
          }
        };

        const handleCompleteTask = async (task: any, outcome: string) => {
          try {
            await updateTask.mutateAsync({
              id: task.id,
              updates: {
                status: 'done',
                outcome: outcome,
              },
            });
          } catch (error) {
            console.error('Error completing task:', error);
            alert('Failed to complete task. Please try again.');
          }
        };

        const handleDeleteTask = async (id: string) => {
          if (confirm('Are you sure you want to delete this task?')) {
            try {
              await deleteTask.mutateAsync(id);
            } catch (error) {
              console.error('Error deleting task:', error);
              alert('Failed to delete task. Please try again.');
            }
          }
        };

        const getTaskStatusBadge = (task: any) => {
          const now = new Date();
          const dueDate = task.due_date ? new Date(task.due_date) : null;

          if (task.status === 'done') {
            return { label: '✅ Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' };
          }
          if (task.status === 'cancelled') {
            return { label: '❌ Cancelled', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400' };
          }
          if (dueDate && dueDate < now) {
            return { label: '🔴 Overdue', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' };
          }
          if (dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (dueDate >= today && dueDate < tomorrow) {
              return { label: '🟡 Due Today', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' };
            }
          }
          return { label: '🟢 Pending', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' };
        };

        const getPriorityColor = (priority: string) => {
          const colors: Record<string, string> = {
            urgent: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
            high: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
            medium: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
            low: 'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
          };
          return colors[priority] || colors.medium;
        };

        return (
          <div className="space-y-6">
            {/* Header & Stats */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-1">⏰ Tasks & Follow-ups</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">What must I do next — and when?</p>
                </div>
                <button
                  onClick={openAddTaskModal}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all"
                >
                  <Plus size={16} /> New Task
                </button>
              </div>

              {/* Task Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Overdue</span>
                    <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-2xl font-black text-red-900 dark:text-red-100">{taskStats.overdue}</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest">Due Today</span>
                    <Clock size={16} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <p className="text-2xl font-black text-yellow-900 dark:text-yellow-100">{taskStats.dueToday}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Pending</span>
                    <Circle size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-2xl font-black text-blue-900 dark:text-blue-100">{taskStats.pending}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Completed</span>
                    <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-2xl font-black text-green-900 dark:text-green-100">{taskStats.completed}</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-4">
              <div className="flex flex-wrap gap-2">
                <select
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                >
                  <option value="all">All Tasks</option>
                  <option value="my_tasks">My Tasks</option>
                  <option value="unassigned">Unassigned</option>
                </select>
                <select
                  value={taskStatusFilter}
                  onChange={(e) => setTaskStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="overdue">🔴 Overdue</option>
                  <option value="due_today">🟡 Due Today</option>
                  <option value="todo">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={taskPriorityFilter}
                  onChange={(e) => setTaskPriorityFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">🔴 Urgent</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">⚪ Low</option>
                </select>
              </div>
            </div>

            {/* Tasks Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-slate-800">
                      <th className="px-6 py-4">Task</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Deal</th>
                      <th className="px-6 py-4">Owner</th>
                      <th className="px-6 py-4">Due</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {isLoadingTasks ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center text-gray-400">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Loading tasks...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center text-gray-400">
                          <CheckCircle2 size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                          <p>No tasks found. Create your first task to get started.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((task) => {
                        const statusBadge = getTaskStatusBadge(task);
                        const dueDate = task.due_date ? new Date(task.due_date) : null;
                        const customerName = task.contacts?.full_name || task.contacts?.company_name || '—';
                        const dealTitle = task.deals?.title || '—';
                        const ownerName = task.assigned_to_profile?.full_name || task.assigned_to_profile?.email || 'Unassigned';

                        return (
                          <tr
                            key={task.id}
                            className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${task.priority === 'urgent' ? 'bg-red-500' :
                                    task.priority === 'high' ? 'bg-orange-500' :
                                      task.priority === 'medium' ? 'bg-yellow-500' :
                                        'bg-gray-400'
                                  }`}></div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{task.title}</p>
                                  {task.description && (
                                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">{task.description}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">{customerName}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">{dealTitle}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-slate-300">
                                  {ownerName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm text-gray-600 dark:text-slate-400">{ownerName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {dueDate ? (
                                <div>
                                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100">
                                    {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">No due date</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${statusBadge.color}`}>
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                {task.status !== 'done' && (
                                  <button
                                    onClick={() => {
                                      const outcome = prompt('Task outcome (e.g., Interested, No answer, Reschedule):');
                                      if (outcome) handleCompleteTask(task, outcome);
                                    }}
                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                                    title="Complete"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => openEditTaskModal(task)}
                                  className="p-2 text-gray-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
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

            {/* Task Modal */}
            {isTaskModalOpen && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-6 flex items-center justify-between z-10">
                    <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                      {editingTask ? 'Edit Task' : 'Create Task'}
                    </h3>
                    <button
                      onClick={() => setIsTaskModalOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">
                        Task Title *
                      </label>
                      <input
                        type="text"
                        value={taskFormData.title}
                        onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                        placeholder="e.g., Follow up call"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Description</label>
                      <textarea
                        value={taskFormData.description}
                        onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                        rows={3}
                        placeholder="Task details..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Priority *</label>
                        <select
                          value={taskFormData.priority}
                          onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value as any })}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                        >
                          <option value="low">⚪ Low</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="high">🟠 High</option>
                          <option value="urgent">🔴 Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Assign To *</label>
                        <select
                          value={taskFormData.assigned_to}
                          onChange={(e) => setTaskFormData({ ...taskFormData, assigned_to: e.target.value })}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                        >
                          <option value={user?.id}>{user?.user_metadata?.full_name || user?.email || 'Me'}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Due Date</label>
                        <input
                          type="date"
                          value={taskFormData.due_date}
                          onChange={(e) => setTaskFormData({ ...taskFormData, due_date: e.target.value })}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Due Time</label>
                        <input
                          type="time"
                          value={taskFormData.due_time}
                          onChange={(e) => setTaskFormData({ ...taskFormData, due_time: e.target.value })}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Link to Customer</label>
                        <select
                          value={taskFormData.contact_id}
                          onChange={(e) => setTaskFormData({ ...taskFormData, contact_id: e.target.value })}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                        >
                          <option value="">None</option>
                          {dbContacts.map(contact => (
                            <option key={contact.id} value={contact.id}>
                              {contact.full_name || contact.email || 'Unnamed'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Link to Deal</label>
                        <select
                          value={taskFormData.deal_id}
                          onChange={(e) => setTaskFormData({ ...taskFormData, deal_id: e.target.value })}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                        >
                          <option value="">None</option>
                          {deals?.map(deal => (
                            <option key={deal.id} value={deal.id}>
                              {deal.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-6 flex items-center justify-end gap-3">
                    <button
                      onClick={() => setIsTaskModalOpen(false)}
                      className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveTask}
                      disabled={!taskFormData.title.trim() || createTask.isPending}
                      className="px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {createTask.isPending ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'notes':
        const handleSaveNote = async () => {
          if (!noteContent.trim()) return;

          try {
            const noteData: any = {
              content: noteContent,
              note_type: noteType,
              visibility: noteVisibility,
              is_pinned: isNotePinned,
              is_important: isNoteImportant,
            };

            // Attach to entity if selected - always include these fields (null if not attached)
            noteData.contact_id = noteAttachTo.type === 'contact' && noteAttachTo.id ? noteAttachTo.id : null;
            noteData.deal_id = noteAttachTo.type === 'deal' && noteAttachTo.id ? noteAttachTo.id : null;
            noteData.activity_id = noteAttachTo.type === 'activity' && noteAttachTo.id ? noteAttachTo.id : null;
            noteData.task_id = noteAttachTo.type === 'task' && noteAttachTo.id ? noteAttachTo.id : null;

            if (editingNoteId) {
              await updateNote.mutateAsync({ id: editingNoteId, updates: noteData });
              setEditingNoteId(null);
            } else {
              await createNote.mutateAsync(noteData);
            }

            // Reset form
            setNoteContent('');
            setNoteType('general');
            setNoteVisibility('team');
            setIsNotePinned(false);
            setIsNoteImportant(false);
            setNoteAttachTo({ type: null, id: null });
          } catch (error) {
            console.error('Error saving note:', error);
            alert('Failed to save note. Please try again.');
          }
        };

        const handleEditNote = (note: any) => {
          setEditingNoteId(note.id);
          setNoteContent(note.content);
          setNoteType(note.note_type);
          setNoteVisibility(note.visibility);
          setIsNotePinned(note.is_pinned);
          setIsNoteImportant(note.is_important);
          if (note.contact_id) {
            setNoteAttachTo({ type: 'contact', id: note.contact_id });
          } else if (note.deal_id) {
            setNoteAttachTo({ type: 'deal', id: note.deal_id });
          } else if (note.activity_id) {
            setNoteAttachTo({ type: 'activity', id: note.activity_id });
          } else if (note.task_id) {
            setNoteAttachTo({ type: 'task', id: note.task_id });
          }
        };

        const handleDeleteNote = async (id: string) => {
          if (confirm('Are you sure you want to delete this note?')) {
            try {
              await deleteNote.mutateAsync(id);
            } catch (error) {
              console.error('Error deleting note:', error);
              alert('Failed to delete note. Please try again.');
            }
          }
        };

        const getNoteTypeIcon = (type: string) => {
          switch (type) {
            case 'objection': return <AlertTriangle size={14} className="text-orange-500" />;
            case 'preference': return <Star size={14} className="text-blue-500" />;
            case 'insight': return <Lightbulb size={14} className="text-yellow-500" />;
            case 'warning': return <AlertTriangle size={14} className="text-red-500" />;
            case 'manager': return <Users size={14} className="text-purple-500" />;
            default: return <FileText size={14} className="text-gray-500" />;
          }
        };

        const getVisibilityIcon = (visibility: string) => {
          switch (visibility) {
            case 'private': return <Lock size={12} className="text-gray-500" />;
            case 'manager': return <Eye size={12} className="text-purple-500" />;
            default: return <Users size={12} className="text-blue-500" />;
          }
        };

        return (
          <div className="space-y-6">
            {/* Add Note Panel */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="text-lg font-black text-gray-900 dark:text-slate-100 mb-4">📝 Add Internal Note</h3>
              <div className="space-y-4">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your note here..."
                  className="w-full h-32 p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none resize-none dark:text-slate-200 focus:ring-4 focus:ring-brand-500/20 transition-all"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Note Type */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">Note Type</label>
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as any)}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                    >
                      <option value="general">General</option>
                      <option value="objection">Objection</option>
                      <option value="preference">Preference</option>
                      <option value="insight">Insight</option>
                      <option value="warning">Warning</option>
                      <option value="manager">Manager Note</option>
                    </select>
                  </div>

                  {/* Visibility */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">Visibility</label>
                    <select
                      value={noteVisibility}
                      onChange={(e) => setNoteVisibility(e.target.value as any)}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                    >
                      <option value="team">👥 Team visible</option>
                      <option value="private">🔒 Private (only me)</option>
                      <option value="manager">👔 Manager only</option>
                    </select>
                  </div>
                </div>

                {/* Attach To */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">Attach To (Optional)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <select
                      value={noteAttachTo.type || ''}
                      onChange={(e) => {
                        const type = e.target.value as any;
                        setNoteAttachTo({ type: type || null, id: null });
                      }}
                      className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                    >
                      <option value="">None</option>
                      <option value="contact">Customer</option>
                      <option value="deal">Deal</option>
                      <option value="activity">Activity</option>
                      <option value="task">Task</option>
                    </select>
                    {noteAttachTo.type === 'contact' && (
                      <select
                        value={noteAttachTo.id || ''}
                        onChange={(e) => setNoteAttachTo({ ...noteAttachTo, id: e.target.value || null })}
                        className="col-span-1 md:col-span-3 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                      >
                        <option value="">Select Customer...</option>
                        {dbContacts.map(contact => (
                          <option key={contact.id} value={contact.id}>
                            {contact.full_name || contact.email || 'Unnamed'}
                          </option>
                        ))}
                      </select>
                    )}
                    {noteAttachTo.type === 'deal' && (
                      <select
                        value={noteAttachTo.id || ''}
                        onChange={(e) => setNoteAttachTo({ ...noteAttachTo, id: e.target.value || null })}
                        className="col-span-1 md:col-span-3 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                      >
                        <option value="">Select Deal...</option>
                        {deals?.map(deal => (
                          <option key={deal.id} value={deal.id}>
                            {deal.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Options */}
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNotePinned}
                      onChange={(e) => setIsNotePinned(e.target.checked)}
                      className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-1">
                      <Pin size={14} /> Pin note
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNoteImportant}
                      onChange={(e) => setIsNoteImportant(e.target.checked)}
                      className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-1">
                      <Star size={14} /> Mark as important
                    </span>
                  </label>
                </div>

                {editingNoteId && (
                  <button
                    onClick={() => {
                      setEditingNoteId(null);
                      setNoteContent('');
                      setNoteType('general');
                      setNoteVisibility('team');
                      setIsNotePinned(false);
                      setIsNoteImportant(false);
                      setNoteAttachTo({ type: null, id: null });
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-slate-300"
                  >
                    Cancel editing
                  </button>
                )}

                <button
                  onClick={handleSaveNote}
                  disabled={!noteContent.trim() || createNote.isPending}
                  className="w-full px-6 py-3 bg-brand-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createNote.isPending ? 'Saving...' : editingNoteId ? 'Update Note' : 'Save Note'}
                </button>
              </div>
            </div>

            {/* Notes List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 dark:text-slate-100">Notes Timeline</h3>
                <select
                  value={notesFilter}
                  onChange={(e) => setNotesFilter(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="general">General</option>
                  <option value="objection">Objection</option>
                  <option value="preference">Preference</option>
                  <option value="insight">Insight</option>
                  <option value="warning">Warning</option>
                  <option value="manager">Manager Note</option>
                </select>
              </div>
              <div className="p-6">
                {isLoadingNotes ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400 dark:text-slate-500">Loading notes...</p>
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                    <p className="text-gray-400 dark:text-slate-500">No notes yet. Create your first note above.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredNotes.map((note) => {
                      const attachedTo = note.contact_id
                        ? `Customer: ${dbContacts.find(c => c.id === note.contact_id)?.full_name || 'Unknown'}`
                        : note.deal_id
                          ? `Deal: ${deals?.find(d => d.id === note.deal_id)?.title || 'Unknown'}`
                          : note.activity_id
                            ? 'Activity'
                            : note.task_id
                              ? `Task: ${tasks?.find(t => t.id === note.task_id)?.title || 'Unknown'}`
                              : null;

                      return (
                        <div
                          key={note.id}
                          className={`bg-gray-50 dark:bg-slate-800/50 rounded-xl border p-4 transition-all ${note.is_pinned
                              ? 'border-brand-300 dark:border-brand-700 bg-brand-50/30 dark:bg-brand-900/10'
                              : 'border-gray-200 dark:border-slate-700'
                            } ${note.is_important ? 'ring-2 ring-yellow-300 dark:ring-yellow-700' : ''}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              {note.is_pinned && <Pin size={14} className="text-brand-600 dark:text-brand-400" />}
                              {getNoteTypeIcon(note.note_type)}
                              <span className="text-sm font-bold text-gray-900 dark:text-slate-100">📝 Internal Note</span>
                              {note.is_important && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                            </div>
                            <div className="flex items-center gap-2">
                              {getVisibilityIcon(note.visibility)}
                              <button
                                onClick={() => handleEditNote(note)}
                                className="p-1 text-gray-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all"
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-slate-300 mb-2 whitespace-pre-wrap">{note.content}</p>
                          {attachedTo && (
                            <p className="text-xs text-brand-600 dark:text-brand-400 mb-2 font-medium">
                              📎 {attachedTo}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                            <span>— {note.created_by_profile?.full_name || note.created_by_profile?.email || 'Unknown'}</span>
                            <span>·</span>
                            <span>{formatTimeAgo(note.created_at)}</span>
                            {note.visibility !== 'team' && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  {getVisibilityIcon(note.visibility)}
                                  {note.visibility === 'private' ? 'Private' : 'Manager only'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'companies':
        if (selectedCompanyId) {
          return (
            <CompanyProfile
              companyId={selectedCompanyId}
              onBack={() => setSelectedCompanyId(null)}
            />
          );
        }
        return (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30 dark:bg-slate-800/20">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search companies..."
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
                  onClick={openAddCompanyModal}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all"
                >
                  <Plus size={16} /> Add Company
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-slate-800">
                    <th className="px-6 py-4">Company Name</th>
                    <th className="px-6 py-4">Industry</th>
                    <th className="px-6 py-4">Size</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {isLoadingCompanies ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading companies...</span>
                        </div>
                      </td>
                    </tr>
                  ) : companiesError ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-red-400">
                        Error loading companies. Please refresh the page.
                      </td>
                    </tr>
                  ) : filteredCompanies.length > 0 ? (
                    filteredCompanies.map((company) => (
                      <tr
                        key={company.id}
                        onClick={() => setSelectedCompanyId(company.id)}
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-black text-xs">
                              {company.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{company.name}</p>
                              {company.legal_name && (
                                <p className="text-[10px] text-gray-400 font-medium">{company.legal_name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400 font-medium">
                          {company.industry || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400 font-medium">
                          {company.company_size || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${company.lifecycle_stage === 'customer' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' :
                              company.lifecycle_stage === 'opportunity' ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' :
                                'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            }`}>
                            {company.lifecycle_stage || 'lead'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400 font-medium">
                          {company.email || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditCompanyModal(company); }}
                              className="p-2 text-gray-400 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteCompany(company.id); }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic">
                        No companies found. Create your first company to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'history':

        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-slate-100">Communication History</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Unified timeline of all customer interactions</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all">
                    <Filter size={16} className="inline mr-2" />
                    Filter
                  </button>
                </div>
              </div>

              <div className="relative space-y-4">
                <div className="absolute left-4 top-2 bottom-0 w-px bg-gray-100 dark:bg-slate-800"></div>
                {allInteractions.map((interaction) => {
                  const getColorClasses = (color: string) => {
                    const colors: Record<string, string> = {
                      blue: 'bg-blue-500 border-blue-500 text-blue-600',
                      green: 'bg-green-500 border-green-500 text-green-600',
                      pink: 'bg-pink-500 border-pink-500 text-pink-600',
                      purple: 'bg-purple-500 border-purple-500 text-purple-600',
                      orange: 'bg-orange-500 border-orange-500 text-orange-600'
                    };
                    return colors[color] || 'bg-gray-500 border-gray-500 text-gray-600';
                  };

                  return (
                    <div key={interaction.id} className="relative pl-10">
                      <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 ${getColorClasses(interaction.color)} z-10`}></div>
                      <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getColorClasses(interaction.color)} bg-opacity-10`}>
                              {interaction.icon}
                              {interaction.platform || interaction.type}
                            </span>
                            {interaction.contact && (
                              <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{interaction.contact}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{formatTimeAgo(interaction.timestamp)}</span>
                        </div>
                        {interaction.subject && (
                          <p className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-1">{interaction.subject}</p>
                        )}
                        {interaction.content && (
                          <p className="text-sm text-gray-600 dark:text-slate-400">{interaction.content}</p>
                        )}
                        {interaction.value && (
                          <p className="text-sm font-black text-purple-600 dark:text-purple-400 mt-1">Value: {formatCurrency(interaction.value)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'timeline':
        const getEventIcon = (eventType: string) => {
          const iconMap: Record<string, React.ReactNode> = {
            customer_created: <UserPlus size={16} className="text-blue-600" />,
            lead_source_detected: <Target size={16} className="text-purple-600" />,
            campaign_viewed: <Eye size={16} className="text-indigo-600" />,
            campaign_clicked: <MousePointerClick size={16} className="text-indigo-600" />,
            social_like: <Heart size={16} className="text-pink-600" />,
            social_comment: <MessageCircle size={16} className="text-blue-600" />,
            message_sent: <Mail size={16} className="text-blue-600" />,
            message_received: <MessageSquare size={16} className="text-green-600" />,
            call_logged: <Phone size={16} className="text-green-600" />,
            call_completed: <PhoneCall size={16} className="text-green-600" />,
            meeting_held: <Video size={16} className="text-purple-600" />,
            task_created: <Circle size={16} className="text-orange-600" />,
            task_completed: <CheckCircle size={16} className="text-green-600" />,
            deal_created: <DollarSign size={16} className="text-purple-600" />,
            deal_stage_changed: <ArrowUpRight size={16} className="text-blue-600" />,
            deal_won: <Trophy size={16} className="text-green-600" />,
            deal_lost: <XCircle size={16} className="text-red-600" />,
            note_added: <StickyNote size={16} className="text-yellow-600" />,
            automation_triggered: <Zap size={16} className="text-purple-600" />,
            ai_suggestion_used: <Bot size={16} className="text-indigo-600" />,
            activity_completed: <Activity size={16} className="text-blue-600" />,
          };
          return iconMap[eventType] || <Circle size={16} className="text-gray-600" />;
        };

        const getEventColor = (eventType: string) => {
          const colorMap: Record<string, string> = {
            customer_created: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
            lead_source_detected: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300',
            campaign_viewed: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300',
            campaign_clicked: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300',
            social_like: 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-300',
            social_comment: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
            message_sent: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
            message_received: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
            call_logged: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
            call_completed: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
            meeting_held: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300',
            task_created: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300',
            task_completed: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
            deal_created: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300',
            deal_stage_changed: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
            deal_won: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
            deal_lost: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
            note_added: 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
            automation_triggered: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300',
            ai_suggestion_used: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300',
            activity_completed: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
          };
          return colorMap[eventType] || 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-300';
        };

        const formatEventTime = (timestamp: string) => {
          const date = new Date(timestamp);
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);

          if (diffMins < 1) return 'Just now';
          if (diffMins < 60) return `${diffMins}m ago`;
          if (diffHours < 24) return `${diffHours}h ago`;
          return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        };


        const getDateLabelColor = (label: string) => {
          if (label === 'Today') return 'text-green-600 dark:text-green-400';
          if (label === 'Yesterday') return 'text-yellow-600 dark:text-yellow-400';
          if (label === 'Last Week') return 'text-blue-600 dark:text-blue-400';
          return 'text-gray-600 dark:text-gray-400';
        };

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-1">🧠 CRM Timeline</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">The complete story of everything that happened — from first contact until now</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 mt-4">
                {['all', 'customers', 'activities', 'messages', 'deals', 'tasks', 'campaigns', 'notes'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimelineFilter(filter)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${timelineFilter === filter
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                        : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline */}
            {isLoadingTimeline ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-12 text-center">
                <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 dark:text-slate-500">Loading timeline...</p>
              </div>
            ) : filteredTimelineEvents.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-12 text-center">
                <History size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                <p className="text-gray-400 dark:text-slate-500 mb-2">No timeline events yet</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">Start creating activities, deals, and tasks to see your timeline</p>
                {timelineEvents.length > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Debug: {timelineEvents.length} events exist but are filtered out. Filter: {timelineFilter}
                    </p>
                  </div>
                )}
              </div>
            ) : Object.keys(filteredGroupedTimelineEvents).length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-12 text-center">
                <History size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                <p className="text-gray-400 dark:text-slate-500 mb-2">Events exist but grouping failed</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Filtered events: {filteredTimelineEvents.length}, Grouped keys: {Object.keys(filteredGroupedTimelineEvents).length}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(filteredGroupedTimelineEvents).map(([dateLabel, events]: [string, TimelineEvent[]]) => (
                  <div key={dateLabel} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    {/* Date Header */}
                    <div className={`px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${dateLabel === 'Today' ? 'bg-green-500' :
                            dateLabel === 'Yesterday' ? 'bg-yellow-500' :
                              dateLabel === 'Last Week' ? 'bg-blue-500' :
                                'bg-gray-400'
                          }`}></div>
                        <h3 className={`text-sm font-black uppercase tracking-widest ${getDateLabelColor(dateLabel)}`}>
                          {dateLabel}
                        </h3>
                        <span className="text-xs text-gray-400 dark:text-slate-500">({events.length} events)</span>
                      </div>
                    </div>

                    {/* Events */}
                    <div className="p-6">
                      <div className="relative space-y-4">
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-slate-800"></div>
                        {events.map((event, index) => (
                          <div key={event.id} className="relative pl-10">
                            {/* Timeline Dot */}
                            <div className={`absolute left-2 top-1.5 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 z-10 ${event.event_type.includes('won') ? 'border-green-500' :
                                event.event_type.includes('lost') ? 'border-red-500' :
                                  event.event_type.includes('completed') ? 'border-green-500' :
                                    'border-blue-500'
                              }`}>
                              <div className="absolute inset-0 flex items-center justify-center">
                                {getEventIcon(event.event_type)}
                              </div>
                            </div>

                            {/* Event Card */}
                            <div className={`p-4 rounded-xl border ${getEventColor(event.event_type)}`}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {getEventIcon(event.event_type)}
                                    <h4 className="text-sm font-black text-gray-900 dark:text-slate-100">{event.title}</h4>
                                  </div>
                                  {event.summary && (
                                    <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">{event.summary}</p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-slate-400">
                                    {event.owner_name && (
                                      <span className="flex items-center gap-1">
                                        <Users size={12} /> Owner: {event.owner_name}
                                      </span>
                                    )}
                                    {event.contact_name && (
                                      <span className="flex items-center gap-1">
                                        <UserPlus size={12} /> {event.contact_name}
                                      </span>
                                    )}
                                    {event.deal_title && (
                                      <span className="flex items-center gap-1">
                                        <DollarSign size={12} /> Deal: {event.deal_title}
                                      </span>
                                    )}
                                    {event.platform && (
                                      <span className="flex items-center gap-1">
                                        <MessageSquare size={12} /> {event.platform}
                                      </span>
                                    )}
                                  </div>
                                  {event.value && (
                                    <p className="text-sm font-black text-purple-600 dark:text-purple-400 mt-2">
                                      Value: {formatCurrency(event.value)}
                                    </p>
                                  )}
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase whitespace-nowrap ml-4">
                                  {formatEventTime(event.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'analytics':
        return (
          <CRMDashboard />
        );

      case 'automations':
        const openAddAutomationModal = () => {
          setEditingAutomation(null);
          setAutomationFormData({
            name: '',
            description: '',
            trigger_type: 'deal_stage_changed',
            trigger_config: {},
            conditions: [],
            actions: [],
            is_active: true,
          });
          setIsAutomationModalOpen(true);
        };

        const openEditAutomationModal = (automation: any) => {
          setEditingAutomation(automation);
          setAutomationFormData({
            name: automation.name,
            description: automation.description || '',
            trigger_type: automation.trigger_type,
            trigger_config: automation.trigger_config || {},
            conditions: automation.conditions || [],
            actions: automation.actions || [],
            is_active: automation.is_active,
          });
          setIsAutomationModalOpen(true);
        };

        const handleSaveAutomation = async () => {
          try {
            if (editingAutomation) {
              await updateAutomation.mutateAsync({
                id: editingAutomation.id,
                updates: automationFormData,
              });
            } else {
              await createAutomation.mutateAsync(automationFormData);
            }
            setIsAutomationModalOpen(false);
          } catch (error) {
            console.error('Error saving automation:', error);
            alert('Failed to save automation. Please try again.');
          }
        };

        const handleDeleteAutomation = async (id: string) => {
          if (confirm('Are you sure you want to delete this automation?')) {
            try {
              await deleteAutomation.mutateAsync(id);
            } catch (error) {
              console.error('Error deleting automation:', error);
              alert('Failed to delete automation. Please try again.');
            }
          }
        };

        const handleToggleAutomation = async (id: string, isActive: boolean) => {
          try {
            await toggleAutomation.mutateAsync({ id, isActive });
          } catch (error) {
            console.error('Error toggling automation:', error);
            alert('Failed to toggle automation. Please try again.');
          }
        };

        const getTriggerLabel = (trigger: string) => {
          const labels: Record<string, string> = {
            deal_stage_changed: 'Deal Stage Changed',
            activity_completed: 'Activity Completed',
            task_overdue: 'Task Overdue',
            task_created: 'Task Created',
            message_received: 'Message Received',
            campaign_clicked: 'Campaign Clicked',
            time_elapsed: 'Time Elapsed',
            record_created: 'Record Created',
            record_updated: 'Record Updated',
            status_changed: 'Status Changed',
          };
          return labels[trigger] || trigger;
        };

        const getActionLabel = (action: string) => {
          const labels: Record<string, string> = {
            create_task: 'Create Task',
            assign_owner: 'Assign Owner',
            send_notification: 'Send Notification',
            update_field: 'Update Field',
            move_stage: 'Move Stage',
            add_tag: 'Add Tag',
            create_deal: 'Create Deal',
            send_email: 'Send Email',
            alert_manager: 'Alert Manager',
            log_timeline: 'Log Timeline',
          };
          return labels[action] || action;
        };

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-1">⚙️ CRM Automations</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Turn your CRM from record keeping into a revenue engine</p>
                </div>
                <button
                  onClick={openAddAutomationModal}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all"
                >
                  <Plus size={16} /> New Automation
                </button>
              </div>

              {/* Automation Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Total Rules</span>
                    <Zap size={16} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-2xl font-black text-purple-900 dark:text-purple-100">{automations.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Active</span>
                    <Play size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-2xl font-black text-green-900 dark:text-green-100">
                    {automations.filter(a => a.is_active).length}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Total Runs</span>
                    <BarChart3 size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-2xl font-black text-blue-900 dark:text-blue-100">
                    {automations.reduce((sum, a) => sum + (a.total_runs || 0), 0)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Success Rate</span>
                    <TrendingUp size={16} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-2xl font-black text-orange-900 dark:text-orange-100">
                    {automations.length > 0
                      ? Math.round(
                        (automations.reduce((sum, a) => sum + (a.successful_runs || 0), 0) /
                          automations.reduce((sum, a) => sum + (a.total_runs || 0), 1)) *
                        100
                      )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>

            {/* Automation Rules List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                <h3 className="text-lg font-black text-gray-900 dark:text-slate-100">Automation Rules</h3>
              </div>
              <div className="p-6">
                {isLoadingAutomations ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400 dark:text-slate-500">Loading automations...</p>
                  </div>
                ) : automations.length === 0 ? (
                  <div className="text-center py-12">
                    <Zap size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                    <p className="text-gray-400 dark:text-slate-500 mb-4">No automations yet. Create your first automation rule.</p>
                    <button
                      onClick={openAddAutomationModal}
                      className="px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-all"
                    >
                      Create Automation
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {automations.map((automation) => (
                      <div
                        key={automation.id}
                        className="bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 p-5 hover:border-brand-300 dark:hover:border-brand-700 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-base font-black text-gray-900 dark:text-slate-100">{automation.name}</h4>
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${automation.is_active
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/20'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-900/20'
                                  }`}
                              >
                                {automation.is_active ? 'Active' : 'Paused'}
                              </span>
                            </div>
                            {automation.description && (
                              <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">{automation.description}</p>
                            )}

                            {/* Automation Flow Display */}
                            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 mb-3 border border-gray-200 dark:border-slate-700">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-gray-400 uppercase">WHEN:</span>
                                  <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
                                    {getTriggerLabel(automation.trigger_type)}
                                  </span>
                                </div>
                                {automation.conditions && automation.conditions.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">IF:</span>
                                    <span className="text-sm text-gray-700 dark:text-slate-300">
                                      {automation.conditions.map((c: any, i: number) => (
                                        <span key={i}>
                                          {c.field} {c.operator} {c.value}
                                          {i < automation.conditions.length - 1 && ' AND '}
                                        </span>
                                      ))}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-gray-400 uppercase">THEN:</span>
                                  <div className="flex flex-wrap gap-2">
                                    {automation.actions.map((action: any, i: number) => (
                                      <span
                                        key={i}
                                        className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2 py-1 rounded"
                                      >
                                        {getActionLabel(action.type)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
                              <span>Runs: {automation.total_runs || 0}</span>
                              <span>•</span>
                              <span>Success: {automation.successful_runs || 0}</span>
                              {automation.last_run_at && (
                                <>
                                  <span>•</span>
                                  <span>Last run: {new Date(automation.last_run_at).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleToggleAutomation(automation.id, !automation.is_active)}
                              className={`p-2 rounded-lg transition-all ${automation.is_active
                                  ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                  : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                }`}
                              title={automation.is_active ? 'Pause' : 'Activate'}
                            >
                              {automation.is_active ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                            <button
                              onClick={() => openEditAutomationModal(automation)}
                              className="p-2 text-gray-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteAutomation(automation.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Automation Builder Modal */}
            {isAutomationModalOpen && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-6 flex items-center justify-between z-10">
                    <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                      {editingAutomation ? 'Edit Automation' : 'Create Automation'}
                    </h3>
                    <button
                      onClick={() => setIsAutomationModalOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">
                        Automation Name *
                      </label>
                      <input
                        type="text"
                        value={automationFormData.name}
                        onChange={(e) => setAutomationFormData({ ...automationFormData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                        placeholder="e.g., Proposal Follow-up"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Description</label>
                      <textarea
                        value={automationFormData.description}
                        onChange={(e) => setAutomationFormData({ ...automationFormData, description: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                        rows={2}
                        placeholder="Describe what this automation does..."
                      />
                    </div>

                    {/* Trigger */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">WHEN (Trigger) *</label>
                      <select
                        value={automationFormData.trigger_type}
                        onChange={(e) =>
                          setAutomationFormData({
                            ...automationFormData,
                            trigger_type: e.target.value as any,
                            trigger_config: {},
                          })
                        }
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                      >
                        <option value="deal_stage_changed">Deal Stage Changed</option>
                        <option value="activity_completed">Activity Completed</option>
                        <option value="task_overdue">Task Overdue</option>
                        <option value="task_created">Task Created</option>
                        <option value="message_received">Message Received</option>
                        <option value="campaign_clicked">Campaign Clicked</option>
                        <option value="time_elapsed">Time Elapsed</option>
                        <option value="record_created">Record Created</option>
                        <option value="record_updated">Record Updated</option>
                        <option value="status_changed">Status Changed</option>
                      </select>
                    </div>

                    {/* Trigger Config */}
                    {automationFormData.trigger_type === 'deal_stage_changed' && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Stage Name</label>
                        <input
                          type="text"
                          value={automationFormData.trigger_config.stage_name || ''}
                          onChange={(e) =>
                            setAutomationFormData({
                              ...automationFormData,
                              trigger_config: { ...automationFormData.trigger_config, stage_name: e.target.value },
                            })
                          }
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                          placeholder="e.g., Proposal"
                        />
                      </div>
                    )}

                    {automationFormData.trigger_type === 'time_elapsed' && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Days</label>
                        <input
                          type="number"
                          value={automationFormData.trigger_config.days || ''}
                          onChange={(e) =>
                            setAutomationFormData({
                              ...automationFormData,
                              trigger_config: { ...automationFormData.trigger_config, days: parseInt(e.target.value) || 0 },
                            })
                          }
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                          placeholder="e.g., 2"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">THEN (Actions) *</label>
                      <div className="space-y-3">
                        {automationFormData.actions.map((action, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-3">
                              <select
                                value={action.type}
                                onChange={(e) => {
                                  const newActions = [...automationFormData.actions];
                                  newActions[index] = { ...action, type: e.target.value as any, config: {} };
                                  setAutomationFormData({ ...automationFormData, actions: newActions });
                                }}
                                className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                              >
                                <option value="create_task">Create Task</option>
                                <option value="assign_owner">Assign Owner</option>
                                <option value="send_notification">Send Notification</option>
                                <option value="update_field">Update Field</option>
                                <option value="move_stage">Move Stage</option>
                                <option value="add_tag">Add Tag</option>
                                <option value="create_deal">Create Deal</option>
                                <option value="send_email">Send Email</option>
                                <option value="alert_manager">Alert Manager</option>
                                <option value="log_timeline">Log Timeline</option>
                              </select>
                              <button
                                onClick={() => {
                                  const newActions = automationFormData.actions.filter((_, i) => i !== index);
                                  setAutomationFormData({ ...automationFormData, actions: newActions });
                                }}
                                className="ml-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            {action.type === 'create_task' && (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={action.config.task_title || ''}
                                  onChange={(e) => {
                                    const newActions = [...automationFormData.actions];
                                    newActions[index].config = { ...action.config, task_title: e.target.value };
                                    setAutomationFormData({ ...automationFormData, actions: newActions });
                                  }}
                                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                                  placeholder="Task title"
                                />
                                <input
                                  type="number"
                                  value={action.config.task_due_days || ''}
                                  onChange={(e) => {
                                    const newActions = [...automationFormData.actions];
                                    newActions[index].config = { ...action.config, task_due_days: parseInt(e.target.value) || 0 };
                                    setAutomationFormData({ ...automationFormData, actions: newActions });
                                  }}
                                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                                  placeholder="Due in (days)"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setAutomationFormData({
                              ...automationFormData,
                              actions: [
                                ...automationFormData.actions,
                                { type: 'create_task', config: {} },
                              ],
                            });
                          }}
                          className="w-full px-4 py-2 text-sm font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-all"
                        >
                          <Plus size={16} className="inline mr-2" /> Add Action
                        </button>
                      </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-slate-100">Active</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Enable this automation rule</p>
                      </div>
                      <button
                        onClick={() =>
                          setAutomationFormData({ ...automationFormData, is_active: !automationFormData.is_active })
                        }
                        className={`relative w-12 h-6 rounded-full transition-all ${automationFormData.is_active ? 'bg-brand-600' : 'bg-gray-300 dark:bg-slate-600'
                          }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${automationFormData.is_active ? 'translate-x-6' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-6 flex items-center justify-end gap-3">
                    <button
                      onClick={() => setIsAutomationModalOpen(false)}
                      className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAutomation}
                      disabled={!automationFormData.name || automationFormData.actions.length === 0}
                      className="px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {editingAutomation ? 'Update' : 'Create'} Automation
                    </button>
                  </div>
                </div>
              </div>
            )}
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
              className={`flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all border-b-2 -mb-[2px] ${activeTab === tab.id
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

      {/* Deal Detail Drawer (shared by Pipelines and Deals) */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-end p-0">
          <div className="bg-white dark:bg-slate-900 w-full md:w-[800px] lg:w-[900px] h-full md:h-[90vh] flex flex-col shadow-xl">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-6 flex items-center justify-between z-10">
              <div className="flex-1">
                <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 mb-1">{selectedDeal.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {selectedDeal.contacts?.full_name || selectedDeal.contacts?.company_name || selectedDeal.companies?.name || 'No customer'}
                </p>
              </div>
              <button onClick={() => setSelectedDealId(null)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Value</p>
                  <p className="text-lg font-black text-gray-900 dark:text-slate-100">{formatCurrency(Number(selectedDeal.amount) || 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Stage</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{selectedDeal.pipeline_stages?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Probability</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{selectedDeal.probability || 0}%</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Expected Close</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100">
                    {selectedDeal.expected_close_date ? new Date(selectedDeal.expected_close_date).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
              </div>
            </div>
            <div className="border-b border-gray-200 dark:border-slate-800 flex gap-1 px-6 bg-white dark:bg-slate-900">
              {(['timeline', 'activities', 'tasks', 'notes', 'files'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDealDetailTab(tab)}
                  className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${dealDetailTab === tab ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {dealDetailTab === 'timeline' && (
                <div className="space-y-4">
                  {dealTimelineEvents.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <History size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                      <p>No timeline events for this deal yet</p>
                    </div>
                  ) : (
                    <div className="relative space-y-4">
                      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-slate-800"></div>
                      {dealTimelineEvents.map((event) => (
                        <div key={event.id} className="relative pl-10">
                          <div className="absolute left-2 top-1.5 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 border-blue-500 z-10"></div>
                          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">{event.title}</h4>
                              <span className="text-xs text-gray-400">{formatTimeAgo(event.timestamp)}</span>
                            </div>
                            {event.summary && <p className="text-sm text-gray-600 dark:text-slate-400">{event.summary}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {dealDetailTab === 'activities' && (
                <div className="space-y-4">
                  {dealActivities.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Activity size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                      <p>No activities for this deal yet</p>
                    </div>
                  ) : (
                    dealActivities.map((activity) => (
                      <div key={activity.id} className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">{activity.title || activity.activity_type}</h4>
                          <span className="text-xs text-gray-400">{formatTimeAgo(activity.activity_date)}</span>
                        </div>
                        {activity.content && <p className="text-sm text-gray-600 dark:text-slate-400">{activity.content}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}
              {dealDetailTab === 'tasks' && (
                <div className="space-y-4">
                  {dealTasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <CheckCircle2 size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                      <p>No tasks for this deal yet</p>
                    </div>
                  ) : (
                    dealTasks.map((task) => (
                      <div key={task.id} className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">{task.title}</h4>
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${task.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{task.status}</span>
                        </div>
                        {task.due_date && <p className="text-xs text-gray-500 dark:text-slate-400">Due: {new Date(task.due_date).toLocaleDateString()}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}
              {dealDetailTab === 'notes' && (
                <div className="space-y-4">
                  {dealNotes.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <FileText size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                      <p>No notes for this deal yet</p>
                    </div>
                  ) : (
                    dealNotes.map((note) => (
                      <div key={note.id} className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                        <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">{formatTimeAgo(note.created_at)}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
              {dealDetailTab === 'files' && (
                <div className="text-center py-12 text-gray-400">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                  <p>File attachments coming soon</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deal Form Modal (shared by Pipelines and Deals) */}
      {isDealModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-6 flex items-center justify-between z-10">
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                {editingDeal ? 'Edit Deal' : 'Create Deal'}
                {newDealPreSelectedStageName ? ` (${newDealPreSelectedStageName})` : ''}
              </h3>
              <button onClick={() => { setIsDealModalOpen(false); setNewDealPreSelectedStageName(null); }} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Deal Name *</label>
                <input
                  type="text"
                  value={dealFormData.title}
                  onChange={(e) => setDealFormData({ ...dealFormData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                  placeholder="e.g., Website Package"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Description</label>
                <textarea
                  value={dealFormData.description}
                  onChange={(e) => setDealFormData({ ...dealFormData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                  rows={3}
                  placeholder="Deal description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Value *</label>
                  <input
                    type="number"
                    value={dealFormData.amount}
                    onChange={(e) => setDealFormData({ ...dealFormData, amount: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Probability (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={dealFormData.probability}
                    onChange={(e) => setDealFormData({ ...dealFormData, probability: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Customer</label>
                <select
                  value={dealFormData.contact_id}
                  onChange={(e) => setDealFormData({ ...dealFormData, contact_id: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                >
                  <option value="">Select Customer...</option>
                  {dbContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>{contact.full_name || contact.email || 'Unnamed'}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Priority</label>
                  <select
                    value={dealFormData.priority}
                    onChange={(e) => setDealFormData({ ...dealFormData, priority: e.target.value as any })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                  >
                    <option value="low">⚪ Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🟠 High</option>
                    <option value="urgent">🔴 Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Expected Close Date</label>
                  <input
                    type="date"
                    value={dealFormData.expected_close_date}
                    onChange={(e) => setDealFormData({ ...dealFormData, expected_close_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/20 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-6 flex items-center justify-end gap-3">
              <button onClick={() => { setIsDealModalOpen(false); setNewDealPreSelectedStageName(null); }} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all">
                Cancel
              </button>
              <button
                onClick={handleSaveDeal}
                disabled={!dealFormData.title.trim() || !dealFormData.amount || createDeal.isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {createDeal.isPending ? 'Saving...' : editingDeal ? 'Update Deal' : 'Create Deal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Settings Modal */}
      {isPipelineSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">Pipeline settings</h3>
              <button onClick={() => setIsPipelineSettingsOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">Rename this pipeline or manage stages. Changes are saved to your workspace.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Pipeline name</label>
                <input type="text" defaultValue="Sales Pipeline" className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm" readOnly />
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">Stage order: Lead → Contacted → Engaged → Proposal → Negotiation → Won / Lost</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setIsPipelineSettingsOpen(false)} className="px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100 appearance-none"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="unqualified">Unqualified</option>
                    <option value="customer">Customer</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={e => setFormData({ ...formData, company_name: e.target.value })}
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
                  disabled={createContact.isPending || updateContact.isPending}
                  className="flex-[2] py-3 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 shadow-xl shadow-brand-500/20 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={18} />
                  {createContact.isPending || updateContact.isPending
                    ? 'Saving...'
                    : editingContact
                      ? 'Update Contact'
                      : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Company Modal */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 tracking-tight">
                {editingCompany ? 'Edit Company' : 'Add New Company'}
              </h3>
              <button onClick={() => setIsCompanyModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCompanySubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company Name *</label>
                <input
                  required
                  type="text"
                  value={companyFormData.name}
                  onChange={e => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                  placeholder="e.g. Acme Corporation"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Legal Name</label>
                  <input
                    type="text"
                    value={companyFormData.legal_name}
                    onChange={e => setCompanyFormData({ ...companyFormData, legal_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                    placeholder="Legal entity name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Website</label>
                  <input
                    type="url"
                    value={companyFormData.website}
                    onChange={e => setCompanyFormData({ ...companyFormData, website: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                  <input
                    type="email"
                    value={companyFormData.email}
                    onChange={e => setCompanyFormData({ ...companyFormData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</label>
                  <input
                    type="tel"
                    value={companyFormData.phone}
                    onChange={e => setCompanyFormData({ ...companyFormData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Industry</label>
                  <input
                    type="text"
                    value={companyFormData.industry}
                    onChange={e => setCompanyFormData({ ...companyFormData, industry: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100"
                    placeholder="e.g. Technology, Healthcare"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company Size</label>
                  <select
                    value={companyFormData.company_size}
                    onChange={e => setCompanyFormData({ ...companyFormData, company_size: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100 appearance-none"
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</label>
                <select
                  value={companyFormData.lifecycle_stage}
                  onChange={e => setCompanyFormData({ ...companyFormData, lifecycle_stage: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100 appearance-none"
                >
                  <option value="lead">Lead</option>
                  <option value="opportunity">Opportunity</option>
                  <option value="customer">Customer</option>
                  <option value="partner">Partner</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                <textarea
                  value={companyFormData.description}
                  onChange={e => setCompanyFormData({ ...companyFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-brand-500/20 transition-all outline-none text-sm font-medium dark:text-slate-100 resize-none"
                  placeholder="Company description..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCompany.isPending || updateCompany.isPending}
                  className="flex-[2] py-3 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 shadow-xl shadow-brand-500/20 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={18} />
                  {createCompany.isPending || updateCompany.isPending
                    ? 'Saving...'
                    : editingCompany
                      ? 'Update Company'
                      : 'Create Company'}
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
