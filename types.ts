
export enum MenuSection {
  Dashboard = 'Dashboard',
  Inbox = 'Inbox',
  Content = 'Content',
  SocialMedia = 'Social Media',
  Campaigns = 'Campaigns',
  CRM = 'CRM',
  Customers = 'Customers',
  Deals = 'Deals',
  Tasks = 'Tasks',
  AIStudio = 'AI Studio',
  Analytics = 'Analytics',
  Assets = 'Assets',
  Automations = 'Automations',
  Integrations = 'Integrations',
  Settings = 'Settings'
}

export type CampaignObjective = 'Awareness' | 'Leads' | 'Sales' | 'Engagement' | 'Retention' | 'Internal Ops';
export type CampaignType = 'Marketing' | 'Sales' | 'Customer Communication' | 'Internal / Operations';
export type CampaignStatus = 'Draft' | 'Active' | 'Paused' | 'Completed';
export type ChannelType = 'Social' | 'Email' | 'SMS' | 'WhatsApp' | 'Documents' | 'In-App';

export interface CampaignAutomationRule {
  id: string;
  trigger: string;
  action: string;
  active: boolean;
}

export interface CampaignStep {
  id: string;
  dayOffset: number;
  channel: ChannelType;
  title: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface Campaign {
  id: string;
  name: string;
  objective: CampaignObjective;
  type: CampaignType;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  channels: ChannelType[];
  audience: string;
  progress: number;
  steps: CampaignStep[];
}

export interface Post {
  id: string;
  platform: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published';
  date: string;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  platform: 'email' | 'whatsapp' | 'instagram' | 'linkedin';
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}
