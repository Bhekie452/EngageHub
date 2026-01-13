-- ============================================================================
-- EngageHub Enterprise Database Schema v2.1
-- World-Class Social Media Management & CRM Platform
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE: USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  company_name TEXT,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '500+')),
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  
  -- Dynamic Currency Support (User Preference)
  currency VARCHAR(3) DEFAULT 'USD',
  currency_symbol VARCHAR(5) DEFAULT '$',

  phone TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'paused')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team workspace management
CREATE TABLE workspaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  avatar_url TEXT,
  description TEXT,
  settings JSONB DEFAULT '{}'::jsonb, -- Store workspace-level currency here if needed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE workspace_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
  permissions JSONB DEFAULT '[]'::jsonb,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(workspace_id, user_id)
);

-- ============================================================================
-- CRM: CONTACTS & LEADS
-- ============================================================================

CREATE TABLE contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))) STORED,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  avatar_url TEXT,
  
  company_name TEXT,
  job_title TEXT,
  department TEXT,
  company_size TEXT,
  industry TEXT,
  website TEXT,
  
  address JSONB,
  social_profiles JSONB,
  
  type TEXT DEFAULT 'lead' CHECK (type IN ('lead', 'contact', 'customer', 'partner', 'vendor')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'unqualified', 'customer', 'inactive')),
  lead_source TEXT CHECK (lead_source IN ('website', 'social_media', 'referral', 'paid_ad', 'event', 'cold_outreach', 'organic', 'import', 'other')),
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  lifecycle_stage TEXT DEFAULT 'subscriber' CHECK (lifecycle_stage IN ('subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist', 'other')),
  
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  
  source_campaign_id UUID,
  source_post_id UUID,
  acquisition_channel TEXT,
  
  email_opt_in BOOLEAN DEFAULT FALSE,
  sms_opt_in BOOLEAN DEFAULT FALSE,
  whatsapp_opt_in BOOLEAN DEFAULT FALSE,
  do_not_contact BOOLEAN DEFAULT FALSE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_workspace_email UNIQUE(workspace_id, email)
);

-- ============================================================================
-- CRM: COMPANIES
-- ============================================================================

CREATE TABLE companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  name TEXT NOT NULL,
  legal_name TEXT,
  website TEXT,
  domain TEXT,
  logo_url TEXT,
  
  industry TEXT,
  company_size TEXT,
  annual_revenue DECIMAL(15, 2),
  
  -- Currency for annual revenue
  currency VARCHAR(3) DEFAULT 'USD',
  
  employee_count INTEGER,
  founded_year INTEGER,
  
  address JSONB,
  phone TEXT,
  email TEXT,
  social_profiles JSONB,
  description TEXT,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  lifecycle_stage TEXT DEFAULT 'lead' CHECK (lifecycle_stage IN ('lead', 'opportunity', 'customer', 'partner', 'inactive')),
  account_owner_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE contact_companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  role TEXT, 
  is_primary BOOLEAN DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contact_id, company_id)
);

-- ============================================================================
-- CRM: DEALS & PIPELINE
-- ============================================================================

CREATE TABLE pipelines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  type TEXT DEFAULT 'sales' CHECK (type IN ('sales', 'partnership', 'investment', 'custom')),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE pipeline_stages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  position INTEGER DEFAULT 0,
  is_closed_won BOOLEAN DEFAULT FALSE,
  is_closed_lost BOOLEAN DEFAULT FALSE,
  automation_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE RESTRICT NOT NULL,
  stage_id UUID REFERENCES pipeline_stages(id) ON DELETE RESTRICT NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(15, 2) DEFAULT 0,
  
  -- Currency for deal amount
  currency VARCHAR(3) DEFAULT 'USD', 
  
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  
  source_campaign_id UUID,
  source_post_id UUID,
  source_channel TEXT,
  lead_source TEXT,
  
  expected_close_date DATE,
  actual_close_date DATE,
  first_contact_date DATE,
  last_activity_date DATE,
  
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  lost_reason TEXT,
  lost_reason_details TEXT,
  competitor TEXT,
  
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE deal_stage_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  from_stage_id UUID REFERENCES pipeline_stages(id),
  to_stage_id UUID REFERENCES pipeline_stages(id) NOT NULL,
  moved_by UUID REFERENCES auth.users(id) NOT NULL,
  duration_in_previous_stage INTEGER,
  moved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SOCIAL: ACCOUNTS & PLATFORMS
-- ============================================================================

CREATE TABLE social_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  connected_by UUID REFERENCES auth.users(id) NOT NULL,
  
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'threads')),
  account_type TEXT CHECK (account_type IN ('profile', 'page', 'group', 'business', 'creator')),
  
  account_id TEXT NOT NULL,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  profile_url TEXT,
  
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[],
  
  is_active BOOLEAN DEFAULT TRUE,
  is_primary BOOLEAN DEFAULT FALSE,
  connection_status TEXT DEFAULT 'connected' CHECK (connection_status IN ('connected', 'expired', 'revoked', 'error')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  platform_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(workspace_id, platform, account_id)
);

-- ============================================================================
-- CONTENT: POSTS & SCHEDULING
-- ============================================================================

CREATE TABLE content_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  parent_id UUID REFERENCES content_categories(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'video', 'carousel', 'story', 'reel', 'live')),
  
  platforms TEXT[] NOT NULL,
  social_account_ids UUID[],
  
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'canceled', 'archived')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  publish_immediately BOOLEAN DEFAULT FALSE,
  optimal_time_enabled BOOLEAN DEFAULT FALSE,
  
  media_urls TEXT[],
  media_metadata JSONB DEFAULT '[]'::jsonb,
  
  hashtags TEXT[],
  mentions TEXT[],
  location TEXT,
  location_id TEXT,
  
  link_url TEXT,
  link_shortened_url TEXT,
  utm_parameters JSONB,
  
  category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
  tags TEXT[],
  
  approval_status TEXT DEFAULT 'none' CHECK (approval_status IN ('none', 'pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  recurrence_parent_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_suggestions JSONB DEFAULT '{}'::jsonb,
  auto_publish BOOLEAN DEFAULT FALSE,
  
  notes TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  version INTEGER DEFAULT 1,
  is_latest_version BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE post_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  changed_by UUID REFERENCES auth.users(id) NOT NULL,
  change_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, version)
);

CREATE TABLE post_publications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE NOT NULL,
  
  platform TEXT NOT NULL,
  platform_post_id TEXT,
  platform_url TEXT,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'publishing', 'published', 'failed', 'deleted')),
  published_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  content_override TEXT,
  media_override TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, social_account_id)
);

-- ============================================================================
-- ANALYTICS: POST PERFORMANCE
-- ============================================================================

CREATE TABLE post_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  loves INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  video_views INTEGER DEFAULT 0,
  video_completion_rate DECIMAL(5, 2),
  average_watch_time INTEGER,
  link_clicks INTEGER DEFAULT 0,
  
  engagement_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN reach > 0 THEN ((likes + comments + shares) * 100.0 / reach) ELSE 0 END
  ) STORED,
  
  audience_demographics JSONB DEFAULT '{}'::jsonb,
  hourly_stats JSONB DEFAULT '[]'::jsonb,
  
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, social_account_id)
);

CREATE TABLE analytics_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE NOT NULL,
  metrics JSONB NOT NULL,
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, social_account_id, snapshot_date)
);

-- ============================================================================
-- CAMPAIGNS: MARKETING CAMPAIGNS
-- ============================================================================

CREATE TABLE campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'social' CHECK (type IN ('social', 'email', 'sms', 'whatsapp', 'paid_ads', 'multi_channel')),
  objective TEXT CHECK (objective IN ('awareness', 'engagement', 'traffic', 'leads', 'conversions', 'sales', 'app_installs', 'video_views')),
  
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'archived', 'canceled')),
  start_date DATE,
  end_date DATE,
  
  budget DECIMAL(15, 2),
  
  -- Currency for campaign budget
  budget_currency VARCHAR(3) DEFAULT 'USD',
  
  spent_amount DECIMAL(15, 2) DEFAULT 0,
  
  target_metrics JSONB DEFAULT '{}'::jsonb,
  actual_metrics JSONB DEFAULT '{}'::jsonb,
  target_audience JSONB DEFAULT '{}'::jsonb,
  geographic_targeting TEXT[],
  
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  tracking_pixel_id TEXT,
  
  creative_brief TEXT,
  brand_guidelines TEXT,
  team_members UUID[],
  tags TEXT[],
  color_code TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE campaign_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  position INTEGER DEFAULT 0,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, post_id)
);

-- (Backfill references)
ALTER TABLE contacts ADD CONSTRAINT fk_contacts_campaign FOREIGN KEY (source_campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE contacts ADD CONSTRAINT fk_contacts_post FOREIGN KEY (source_post_id) REFERENCES posts(id) ON DELETE SET NULL;

ALTER TABLE deals ADD CONSTRAINT fk_deals_campaign FOREIGN KEY (source_campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE deals ADD CONSTRAINT fk_deals_post FOREIGN KEY (source_post_id) REFERENCES posts(id) ON DELETE SET NULL;

-- ============================================================================
-- ATTRIBUTION: CAMPAIGN CONVERSIONS & ROI
-- ============================================================================

CREATE TABLE campaign_conversions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE SET NULL,
  
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('page_view', 'signup', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'purchase', 'custom')),
  conversion_value DECIMAL(15, 2) DEFAULT 0,
  
  -- Currency for conversion value
  currency VARCHAR(3) DEFAULT 'USD',
  
  attribution_type TEXT DEFAULT 'last_touch' CHECK (attribution_type IN ('first_touch', 'last_touch', 'linear', 'time_decay', 'position_based')),
  attribution_weight DECIMAL(5, 4) DEFAULT 1.0,
  
  referrer_url TEXT,
  landing_page_url TEXT,
  utm_parameters JSONB,
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE attribution_touchpoints (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  
  touchpoint_type TEXT NOT NULL CHECK (touchpoint_type IN ('ad_impression', 'ad_click', 'organic_view', 'email_open', 'email_click', 'website_visit', 'form_submit', 'content_download')),
  touchpoint_source TEXT,
  
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MESSAGING: INBOX & CONVERSATIONS
-- ============================================================================

CREATE TABLE conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'facebook_messenger', 'instagram_dm', 'twitter_dm', 'live_chat', 'phone')),
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE SET NULL,
  
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed', 'spam')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  subject TEXT,
  first_message_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  
  sender_type TEXT NOT NULL CHECK (sender_type IN ('contact', 'user', 'system', 'bot')),
  sender_id UUID, 
  
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'html', 'image', 'video', 'audio', 'file', 'location')),
  attachments JSONB DEFAULT '[]'::jsonb,
  
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'sending', 'sent', 'delivered', 'read', 'failed')),
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  intent TEXT,
  automated_response BOOLEAN DEFAULT FALSE,
  
  external_id TEXT,
  thread_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CONTENT: TEMPLATES & LIBRARY
-- ============================================================================

CREATE TABLE content_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
  
  content TEXT NOT NULL,
  media_urls TEXT[],
  
  platforms TEXT[],
  content_type TEXT,
  
  tags TEXT[],
  is_public BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE media_library (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, 
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'audio', 'document', 'other')),
  
  width INTEGER,
  height INTEGER,
  duration INTEGER, 
  thumbnail_url TEXT,
  
  folder_path TEXT,
  tags TEXT[],
  alt_text TEXT,
  
  used_in_posts UUID[],
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AUTOMATION: WORKFLOWS & RULES
-- ============================================================================

CREATE TABLE workflows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'post_published', 'post_scheduled', 'engagement_threshold', 
    'new_follower', 'new_mention', 'new_message', 'new_lead', 
    'deal_stage_changed', 'form_submitted', 'time_based', 'webhook'
  )),
  trigger_config JSONB NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'draft', 'archived')),
  
  last_run_at TIMESTAMP WITH TIME ZONE,
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE workflow_executions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE NOT NULL,
  
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'canceled')),
  
  trigger_data JSONB,
  execution_log JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER
);

-- ============================================================================
-- TASKS & PROJECT MANAGEMENT
-- ============================================================================

CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed', 'archived')),
  
  start_date DATE,
  due_date DATE,
  
  owner_id UUID REFERENCES auth.users(id),
  team_members UUID[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES auth.users(id),
  
  tags TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SECURITY: RLS POLICIES & TRIGGERS
-- ============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, currency, currency_symbol)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'USD',
    '$'
  );
  
  -- Create default workspace
  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Workspace'), 
    regexp_replace(lower(COALESCE(NEW.raw_user_meta_data->>'company_name', 'my-workspace')), '[^a-z0-9]', '-', 'g') || '-' || substring(NEW.id::text from 1 for 4),
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Users can access their own data via workspaces)
-- Note: Simplified for quick start, production should check workspace_members
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Workspaces: Owners can do everything
CREATE POLICY "Users can view workspaces they own" ON workspaces FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Users can update workspaces they own" ON workspaces FOR UPDATE USING (owner_id = auth.uid());

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
