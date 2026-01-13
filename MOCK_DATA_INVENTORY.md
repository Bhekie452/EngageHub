# Mock Data Inventory & Removal Guide

Quick reference guide for identifying and removing all mock/demo data from EngageHub.

---

## 📍 Mock Data Locations Map

### 1. [Dashboard.tsx](components/Dashboard.tsx)

**Line 16-24: Chart Data**
```typescript
const chartData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 2000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 2390 },
  { name: 'Sun', revenue: 3490 },
];
```
**Replace with:** `useAnalytics({ metric: 'revenue', period: 'week' })`

---

**Line 78-81: Stat Cards**
```typescript
<StatCard title="Total Posts" value="156" change="+14.2%" icon={PenTool} color="bg-blue-500" />
<StatCard title="New Leads" value="24" change="+12%" icon={Users} color="bg-blue-500" />
<StatCard title="Engagement Rate" value="4.8%" change="+2.4%" icon={TrendingUp} color="bg-indigo-500" />
<StatCard title="Response Time" value="1.2h" change="-15%" icon={Clock} color="bg-orange-500" />
```
**Replace with:** `useDashboardMetrics()` hook returning real data

---

**Line 126-130: Pending Tasks**
```typescript
{[
  { id: 1, text: 'Review Q3 Marketing Plan', priority: 'High' },
  { id: 2, text: 'Follow up with lead: SolarTech', priority: 'Medium' },
  { id: 3, text: 'Record tutorial video', priority: 'Low' },
].map(task => (...))}
```
**Replace with:** `useTasks({ status: 'pending', limit: 3 })`

---

**Line 140-143: Scheduled Posts**
```typescript
{[
  { id: 1, platform: 'LinkedIn', time: 'Today, 2:00 PM', content: 'The future of solo-ops...' },
  { id: 2, platform: 'Instagram', time: 'Tomorrow, 10:00 AM', content: 'Launch day countdown!' },
].map(post => (...))}
```
**Replace with:** `usePosts({ status: 'scheduled', limit: 2 })`

---

**Line 169: AI Insights**
```typescript
<p className="text-sm text-indigo-100 mb-6 leading-relaxed">
  "You have 3 leads that haven't been contacted in 48 hours. Reaching out now could increase conversion by 30%."
</p>
```
**Replace with:** `useAIInsights()` hook calling Gemini API

---

**Line 179-182: Messages Requiring Reply**
```typescript
{[
  { name: 'Sarah Miller', text: 'Pricing for the pro plan?', platform: 'WhatsApp' },
  { name: 'Dave Wilson', text: 'Can we move our call?', platform: 'LinkedIn' },
].map((msg, idx) => (...))}
```
**Replace with:** `useMessages({ requiresReply: true, limit: 2 })`

---

**Line 193-196: Recent Leads**
```typescript
{[
  { name: 'TechFlow Inc.', industry: 'SaaS', status: 'Hot' },
  { name: 'Greenery Co.', industry: 'E-commerce', status: 'Warm' },
].map((lead, idx) => (...))}
```
**Replace with:** `useContacts({ type: 'lead', limit: 2, orderBy: 'created_at' })`

---

### 2. [Inbox.tsx](components/Inbox.tsx)

**Line 30-37: Messages Array**
```typescript
const MESSAGES: MessageData[] = [
  { id: '1', sender: 'Sarah Miller', text: 'Hi, I saw your latest post...', platform: 'linkedin', category: 'dms', time: '10m ago', unread: true },
  { id: '2', sender: 'Marcus Chen', text: 'Payment confirmed...', platform: 'email', category: 'email', time: '1h ago', unread: false },
  { id: '3', sender: 'Emma Watson', text: 'Hey! Loved the new video...', platform: 'instagram', category: 'comments', time: '3h ago', unread: true },
  { id: '4', sender: 'WhatsApp Lead', text: 'Is the early bird pricing...', platform: 'whatsapp', category: 'whatsapp', time: '5h ago', unread: false },
  { id: '5', sender: 'Web Guest #402', text: 'Where can I find...', platform: 'webchat', category: 'webchat', time: 'Yesterday', unread: false },
  { id: '6', sender: '+1 (555) 0123', text: 'Missed call...', platform: 'missed', category: 'missed', time: 'Yesterday', unread: true },
  { id: '7', sender: 'Old Client', text: 'Archived project...', platform: 'email', category: 'archived', time: '2 mo ago', unread: false, archived: true },
];
```
**Replace with:** `useMessages()` hook with filters

---

### 3. [Content.tsx](components/Content.tsx)

**Line 56: Pre-selected Platforms**
```typescript
const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'instagram']);
```
**Replace with:** Empty array, load from user's connected accounts

**Line 127: Character Limit**
```typescript
<span className="text-xs font-medium text-gray-400">{postContent.length}/2,200</span>
```
**Keep:** This is a business rule, not mock data

---

### 4. [SocialMedia.tsx](components/SocialMedia.tsx)

**Line 52-60: Connected Accounts**
```typescript
{[
  { name: 'Instagram', handle: '@engagehub_creations', connected: true, icon: <Instagram className="text-pink-600" /> },
  { name: 'LinkedIn Profile', handle: 'John Doe', connected: true, icon: <Linkedin className="text-blue-700" /> },
  { name: 'LinkedIn Page', handle: 'Doe Consulting', connected: true, icon: <Linkedin className="text-blue-600" /> },
  { name: 'X (Twitter)', handle: '@engagehub', connected: true, icon: <Twitter className="text-sky-500" /> },
  { name: 'TikTok', handle: '@engagehub_official', connected: true, icon: <Music className="text-black" /> },
  { name: 'YouTube', handle: 'Engagehub Tutorials', connected: false, icon: <Youtube className="text-red-600" /> },
  { name: 'Facebook Page', handle: 'Engagehub Community', connected: false, icon: <Facebook className="text-blue-600" /> },
  { name: 'Pinterest', handle: 'Engagehub Design', connected: false, icon: <Pin className="text-red-700" /> },
  { name: 'Google Business', handle: 'Engagehub HQ', connected: false, icon: <Store className="text-blue-500" /> },
].map((account, idx) => (...))}
```
**Replace with:** `useSocialAccounts()` hook

---

**Line 98-103: Posting Schedule**
```typescript
{[
  { time: 'Today, 4:00 PM', platform: 'Instagram', content: 'Exciting news! Our summer...', status: 'scheduled' },
  { time: 'Tomorrow, 9:00 AM', platform: 'LinkedIn', content: 'Reflecting on 3 years...', status: 'scheduled' },
  { time: 'Friday, 12:00 PM', platform: 'X (Twitter)', content: 'Thread: Why minimalism...', status: 'scheduled' },
  { time: 'Saturday, 10:00 AM', platform: 'TikTok', content: 'Behind the scenes...', status: 'draft' },
].map((item, idx) => (...))}
```
**Replace with:** `usePosts({ status: ['scheduled', 'draft'] })`

---

**Line 111-135: Engagement Metrics**
```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Likes</p>
    <p className="text-2xl font-bold mt-1 text-gray-900">12,402</p>
    <div className="flex items-center gap-1 mt-1">
      <span className="text-[10px] text-green-500 font-bold">+14%</span>
      <span className="text-[10px] text-gray-400 font-medium">vs last month</span>
    </div>
  </div>
  <!-- Similar for Shares and Profile Visits -->
</div>
```
**Replace with:** `useSocialAnalytics({ period: 'month' })`

---

### 5. [Campaigns.tsx](components/Campaigns.tsx)

**Line 47-77: Initial Campaigns**
```typescript
const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    name: 'New Product Launch 2025',
    objective: 'Sales',
    type: 'Marketing',
    status: 'Active',
    startDate: '2025-01-20',
    endDate: '2025-02-15',
    channels: ['Social', 'Email', 'SMS', 'Documents'],
    audience: 'VIP Segment',
    progress: 45,
    steps: [
      { id: 's1', dayOffset: 0, channel: 'Social', title: 'Launch Announcement Post', status: 'sent' },
      { id: 's2', dayOffset: 2, channel: 'Email', title: 'Early Access Invite', status: 'sent' },
      { id: 's3', dayOffset: 5, channel: 'SMS', title: 'Last Chance Reminder', status: 'pending' },
      { id: 's4', dayOffset: 7, channel: 'Documents', title: 'Wholesale Proposal PDF', status: 'pending' },
    ]
  },
  {
    id: 'c2',
    name: 'Customer Retention Warmup',
    objective: 'Retention',
    type: 'Customer Communication',
    status: 'Active',
    startDate: '2025-02-01',
    endDate: '2025-02-28',
    channels: ['Email', 'WhatsApp'],
    audience: 'Churn Risk',
    progress: 12,
    steps: [
      { id: 's5', dayOffset: 0, channel: 'Email', title: 'We Miss You Note', status: 'sent' },
      { id: 's6', dayOffset: 3, channel: 'WhatsApp', title: 'Exclusive Discount Link', status: 'pending' },
    ]
  }
];
```
**Replace with:** `useCampaigns()` hook

---

**Line 140-143: Campaign Stats**
```typescript
{ label: 'Total Reach', value: '12.4k', icon: <Globe size={20} />, color: 'bg-blue-50 text-blue-600' },
{ label: 'Conversion', value: '8.2%', icon: <Target size={20} />, color: 'bg-green-50 text-green-600' },
{ label: 'Cost per Lead', value: '$1.42', icon: <DollarSign size={20} />, color: 'bg-orange-50 text-orange-600' },
{ label: 'Pipeline Value', value: '$24.5k', icon: <Activity size={20} />, color: 'bg-indigo-50 text-indigo-600' }
```
**Replace with:** `useCampaignAnalytics(campaignId)`

---

### 6. [CRM.tsx](components/CRM.tsx)

**Line 36-41: Initial Contacts**
```typescript
const INITIAL_CONTACTS: Contact[] = [
  { id: '1', name: 'Sarah Miller', email: 'sarah@techflow.io', status: 'Customer', company: 'TechFlow Inc.', lastContact: '2 days ago', color: 'indigo' },
  { id: '2', name: 'Marcus Chen', email: 'm.chen@designhub.com', status: 'Lead', company: 'Design Hub', lastContact: '5h ago', color: 'orange' },
  { id: '3', name: 'Emma Watson', email: 'emma@creative.co', status: 'Prospect', company: 'Creative Co.', lastContact: '1 week ago', color: 'blue' },
  { id: '4', name: 'David Lee', email: 'd.lee@startup.net', status: 'Customer', company: 'Startup.net', lastContact: 'Yesterday', color: 'indigo' },
];
```
**Replace with:** `useContacts()` hook

---

### 7. [Customers.tsx](components/Customers.tsx)

**Line 43-49: Initial Customers**
```typescript
const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Sarah Miller', email: 'sarah@techflow.io', status: 'active', lifetimeValue: '$4,500', lastActive: '2h ago', segments: ['Premium', 'Beta Tester'], avatarColor: 'bg-indigo-100 text-indigo-600' },
  { id: '2', name: 'Marcus Chen', email: 'm.chen@designhub.com', status: 'prospect', lifetimeValue: '$0', lastActive: '5h ago', segments: ['Lead', 'Agency'], avatarColor: 'bg-orange-100 text-orange-600' },
  { id: '3', name: 'Emma Watson', email: 'emma@creative.co', status: 'active', lifetimeValue: '$1,200', lastActive: '1 day ago', segments: ['Standard'], avatarColor: 'bg-blue-100 text-blue-600' },
  { id: '4', name: 'David Lee', email: 'd.lee@startup.net', status: 'past', lifetimeValue: '$800', lastActive: '2 mo ago', segments: ['Churn Risk'], avatarColor: 'bg-gray-100 text-gray-600' },
  { id: '5', name: 'Sophie Turner', email: 'sophie@retail.com', status: 'active', lifetimeValue: '$12,000', lastActive: '10m ago', segments: ['VIP', 'Enterprise'], avatarColor: 'bg-emerald-100 text-emerald-600' },
];
```
**Replace with:** `useCustomers()` hook

---

### 8. [Tasks.tsx](components/Tasks.tsx)

**Line 32-38: Tasks Array**
```typescript
const TASKS: TaskItem[] = [
  { id: '1', title: 'Review Q3 Marketing Strategy', dueDate: 'Today', priority: 'high', completed: false, category: 'Strategy' },
  { id: '2', title: 'Schedule Instagram Posts for July', dueDate: 'Today', priority: 'medium', completed: false, category: 'Content' },
  { id: '3', title: 'Follow up with lead: SolarTech', dueDate: 'Yesterday', priority: 'high', completed: false, category: 'Sales' },
  { id: '4', title: 'Update LinkedIn profile header', dueDate: 'Jun 30', priority: 'low', completed: false, category: 'Personal Brand' },
  { id: '5', title: 'Weekly Newsletter Blast', dueDate: 'Every Friday', priority: 'medium', completed: false, category: 'Marketing', recurring: true },
  { id: '6', title: 'Monthly Revenue Audit', dueDate: 'Jun 1', priority: 'high', completed: true, category: 'Finance' },
];
```
**Replace with:** `useTasks()` hook

---

### 9. [constants.tsx](constants.tsx)

**Line 20-32: Navigation Items**
```typescript
export const NAVIGATION_ITEMS = [
  { id: MenuSection.Dashboard, icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { id: MenuSection.Inbox, icon: <Inbox size={20} />, label: 'Inbox' },
  // ... etc
];
```
**Keep:** This is configuration, not mock data

---

**Line 35-45: Social Platforms**
```typescript
export const SOCIAL_PLATFORMS = [
  'Facebook Pages', 
  'Instagram', 
  'LinkedIn (Profiles + Pages)', 
  'X (Twitter)', 
  'TikTok', 
  'YouTube', 
  'Pinterest', 
  'Google Business Profile'
];
```
**Keep:** This is a reference list for available platforms

---

## 🔧 Replacement Strategy

### Pattern to Follow:

**BEFORE (Mock Data):**
```typescript
const Dashboard = () => {
  const tasks = [
    { id: 1, title: 'Task 1' },
    { id: 2, title: 'Task 2' }
  ];
  
  return (
    <div>
      {tasks.map(task => <TaskCard key={task.id} task={task} />)}
    </div>
  );
};
```

**AFTER (Real Data):**
```typescript
const Dashboard = () => {
  const { data: tasks, isLoading, error } = useTasks({ 
    status: 'pending', 
    limit: 3 
  });
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!tasks || tasks.length === 0) return <EmptyState message="No tasks" />;
  
  return (
    <div>
      {tasks.map(task => <TaskCard key={task.id} task={task} />)}
    </div>
  );
};
```

---

## 📊 Mock Data Summary

| Component | Mock Data Items | Lines | Priority |
|-----------|-----------------|-------|----------|
| Dashboard | 7 sections | 16-196 | HIGH |
| Inbox | 1 array (7 msgs) | 30-37 | HIGH |
| Content | 1 state | 56 | MEDIUM |
| SocialMedia | 3 sections | 52-135 | HIGH |
| Campaigns | 2 campaigns + stats | 47-143 | HIGH |
| CRM | 4 contacts | 36-41 | HIGH |
| Customers | 5 customers | 43-49 | HIGH |
| Tasks | 6 tasks | 32-38 | HIGH |

**Total Mock Data Locations: 8 files, ~30 distinct mock data points**

---

## ✅ Removal Order (Recommended)

1. **Phase 1:** Tasks (simplest CRUD)
2. **Phase 2:** CRM/Customers (similar structure)
3. **Phase 3:** Messages/Inbox (real-time considerations)
4. **Phase 4:** Content/Posts (file uploads)
5. **Phase 5:** Social Media (OAuth integrations)
6. **Phase 6:** Campaigns (complex multi-step)
7. **Phase 7:** Dashboard (aggregates all others)

---

## 🎯 Quick Win: Start with Tasks

**Easiest to replace:** Tasks component has simple CRUD operations with no dependencies.

**Steps:**
1. Create `useTasks()` hook
2. Replace `TASKS` constant with hook
3. Add loading/error states
4. Test CRUD operations
5. ✅ First component production-ready!

---

**Last Updated:** January 8, 2026  
**Next Action:** Begin Phase 1 - Data Layer Implementation
