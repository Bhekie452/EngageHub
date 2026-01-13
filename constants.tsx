
import React from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  PenTool, 
  Share2, 
  Megaphone, 
  Users, 
  UserCircle, 
  Handshake, 
  CheckSquare, 
  Sparkles, 
  BarChart3, 
  FolderOpen, 
  Zap, 
  Plug, 
  Settings 
} from 'lucide-react';
import { MenuSection } from './types';

export const NAVIGATION_ITEMS = [
  { id: MenuSection.Dashboard, icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { id: MenuSection.Inbox, icon: <Inbox size={20} />, label: 'Inbox' },
  { id: MenuSection.Content, icon: <PenTool size={20} />, label: 'Content' },
  { id: MenuSection.SocialMedia, icon: <Share2 size={20} />, label: 'Social Media' },
  { id: MenuSection.Campaigns, icon: <Megaphone size={20} />, label: 'Campaigns' },
  { id: MenuSection.CRM, icon: <Users size={20} />, label: 'CRM' },
  { id: MenuSection.Customers, icon: <UserCircle size={20} />, label: 'Customers' },
  { id: MenuSection.Deals, icon: <Handshake size={20} />, label: 'Deals' },
  { id: MenuSection.Tasks, icon: <CheckSquare size={20} />, label: 'Tasks' },
  { id: MenuSection.AIStudio, icon: <Sparkles size={20} />, label: 'AI Studio' },
  { id: MenuSection.Analytics, icon: <BarChart3 size={20} />, label: 'Analytics' },
  { id: MenuSection.Assets, icon: <FolderOpen size={20} />, label: 'Assets' },
  { id: MenuSection.Automations, icon: <Zap size={20} />, label: 'Automations' },
  { id: MenuSection.Integrations, icon: <Plug size={20} />, label: 'Integrations' },
  { id: MenuSection.Settings, icon: <Settings size={20} />, label: 'Settings' },
];

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
