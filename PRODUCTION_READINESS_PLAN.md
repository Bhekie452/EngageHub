# EngageHub - Production Readiness Plan
## Removing Mock/Demo Data & Making the App Production-Ready

**Project:** EngageHub - Unified Business Command  
**Date:** January 8, 2026  
**Status:** Planning Phase  

---

## Executive Summary

This document outlines the comprehensive plan to transform EngageHub from a demo/prototype application with hardcoded mock data into a production-ready application with real data management, proper state management, backend integration, and user authentication.

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Architecture Overview](#2-architecture-overview)
3. [Phase 1: Data Layer Implementation](#3-phase-1-data-layer-implementation)
4. [Phase 2: Backend Integration](#4-phase-2-backend-integration)
5. [Phase 3: Authentication & Authorization](#5-phase-3-authentication--authorization)
6. [Phase 4: State Management](#6-phase-4-state-management)
7. [Phase 5: API Integration](#7-phase-5-api-integration)
8. [Phase 6: Testing & Quality Assurance](#8-phase-6-testing--quality-assurance)
9. [Phase 7: Production Deployment](#9-phase-7-production-deployment)
10. [Timeline & Dependencies](#10-timeline--dependencies)

---

## 1. Current State Assessment

### 1.1 Mock Data Locations

#### Dashboard Component (`components/Dashboard.tsx`)
**Mock Data Found:**
- `chartData` (lines 16-24): Revenue chart mock data
  ```typescript
  const chartData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    // ... 7 days of mock revenue
  ];
  ```
- **Hardcoded metrics:**
  - Total Posts: "156" (+14.2%)
  - New Leads: "24" (+12%)
  - Engagement Rate: "4.8%" (+2.4%)
  - Response Time: "1.2h" (-15%)
- **Pending Tasks** (lines 126-130): 3 hardcoded tasks
- **Scheduled Posts** (lines 140-143): 2 hardcoded posts
- **AI Insights** (line 169): Hardcoded AI suggestion text
- **Messages Requiring Reply** (lines 179-182): 2 hardcoded messages
- **Recent Leads** (lines 193-196): 2 hardcoded leads

#### Inbox Component (`components/Inbox.tsx`)
**Mock Data Found:**
- `MESSAGES` constant (lines 30-37): Array of 7 mock messages
  - Contains: id, sender, text, time, platform, category, unread status
  - Platforms: LinkedIn, Email, Instagram, WhatsApp, WebChat, Missed Calls

#### Content Component (`components/Content.tsx`)
**Mock Data Found:**
- Platform selection state (line 56): Pre-selected Facebook & Instagram
- Character limit: 2,200 characters (line 127)
- **All Posts View** (likely contains more mock data in lines 200+)

#### SocialMedia Component (`components/SocialMedia.tsx`)
**Mock Data Found:**
- **Connected Accounts** (lines 52-60): 9 hardcoded social media accounts
  - Instagram (@engagehub_creations)
  - LinkedIn Profile & Page
  - Twitter/X (@engagehub)
  - TikTok, YouTube, Facebook, Pinterest, Google Business
- **Posting Schedule** (lines 98-103): 4 hardcoded scheduled posts
- **Engagement Metrics** (lines 111-135):
  - Total Likes: 12,402 (+14%)
  - Total Shares: 842 (+3%)
  - Profile Visits: 3,200 (-2%)

#### Campaigns Component (`components/Campaigns.tsx`)
**Mock Data Found:**
- `INITIAL_CAMPAIGNS` constant (lines 47-77): 2 complete campaign objects
  - "New Product Launch 2025"
  - "Customer Retention Warmup"
  - Each with steps, channels, audiences, progress tracking
- **Campaign Overview Stats** (lines 140-143):
  - Total Reach: 12.4k
  - Conversion: 8.2%
  - Cost per Lead: $1.42
  - Pipeline Value: $24.5k

#### CRM Component (`components/CRM.tsx`)
**Mock Data Found:**
- `INITIAL_CONTACTS` constant (lines 36-41): 4 hardcoded contacts
  - Sarah Miller (TechFlow Inc.)
  - Marcus Chen (Design Hub)
  - Emma Watson (Creative Co.)
  - David Lee (Startup.net)

#### Customers Component (`components/Customers.tsx`)
**Mock Data Found:**
- `INITIAL_CUSTOMERS` constant (lines 43-49): 5 hardcoded customers
  - Each with lifetime value, segments, last active time
  - Total LTV ranges from $0 to $12,000

#### Tasks Component (`components/Tasks.tsx`)
**Mock Data Found:**
- `TASKS` constant (lines 32-38): 6 hardcoded tasks
  - Various categories: Strategy, Content, Sales, Personal Brand, Marketing, Finance
  - Includes recurring tasks

### 1.2 Hard Dependencies
- **Gemini AI Service** (`services/geminiService.ts`): Already using environment variable for API key ✅
- **Recharts**: For data visualization (will need real data)
- **Lucide React**: Icons (production-ready) ✅

### 1.3 Missing Production Features
- ❌ Database/Backend integration
- ❌ User authentication & authorization
- ❌ API endpoints for CRUD operations
- ❌ State management (Redux/Zustand/Context API)
- ❌ Error handling & loading states
- ❌ Form validation
- ❌ Data persistence
- ❌ Real-time updates (WebSocket/polling)
- ❌ File upload handling
- ❌ Search functionality
- ❌ Pagination
- ❌ Filtering & sorting
- ❌ Export capabilities
- ❌ Notification system
- ❌ Audit logs
- ❌ Multi-tenancy support

---

## 2. Architecture Overview

### 2.1 Proposed Tech Stack

#### Frontend (Current - Keep)
- **React 19.2.3** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **Lucide React** for icons
- **Recharts** for analytics visualization

#### Frontend (Add)
- **React Query / TanStack Query** for server state management
- **Zustand** or **Redux Toolkit** for client state management
- **React Hook Form** for form handling
- **Zod** for validation
- **Axios** for HTTP requests

#### Backend Options
**Option A: Serverless (Recommended for MVP)**
- **Supabase**: PostgreSQL + Auth + Real-time + Storage
- **Vercel Functions**: API endpoints
- **Vercel Edge Config**: Feature flags

**Option B: Traditional Backend**
- **Node.js + Express** or **Fastify**
- **PostgreSQL** for relational data
- **Redis** for caching
- **AWS S3** for file storage

**Option C: Firebase (Quick Start)**
- **Firestore** for NoSQL database
- **Firebase Auth**
- **Firebase Storage**
- **Firebase Functions**

### 2.2 Database Schema (Proposed)

```sql
-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Social Media Accounts
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'instagram', 'linkedin', 'twitter', etc.
  account_name VARCHAR(255),
  handle VARCHAR(255),
  is_connected BOOLEAN DEFAULT false,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Content/Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'scheduled', 'published', 'failed'
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  platforms JSONB, -- Array of platform IDs
  media_urls JSONB, -- Array of media file URLs
  analytics JSONB, -- likes, shares, comments, reach
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  objective VARCHAR(50), -- 'Awareness', 'Leads', 'Sales', etc.
  type VARCHAR(50), -- 'Marketing', 'Sales', 'Customer Communication'
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
  start_date DATE,
  end_date DATE,
  channels JSONB, -- Array of channel types
  audience_segment VARCHAR(255),
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaign Steps
CREATE TABLE campaign_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  day_offset INTEGER NOT NULL,
  channel VARCHAR(50),
  title VARCHAR(255),
  content TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  executed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CRM Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  status VARCHAR(50) DEFAULT 'prospect', -- 'customer', 'lead', 'prospect'
  last_contact_at TIMESTAMP,
  notes TEXT,
  tags JSONB,
  custom_fields JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'prospect', 'past'
  lifetime_value DECIMAL(10, 2) DEFAULT 0,
  segments JSONB, -- Array of segment names
  last_active_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  category VARCHAR(100),
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inbox Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_name VARCHAR(255),
  sender_handle VARCHAR(255),
  platform VARCHAR(50), -- 'email', 'whatsapp', 'instagram', 'linkedin', etc.
  category VARCHAR(50), -- 'email', 'whatsapp', 'comments', 'dms', 'webchat', 'missed'
  content TEXT,
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  received_at TIMESTAMP DEFAULT NOW(),
  replied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics/Metrics
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL, -- 'revenue', 'leads', 'engagement', 'posts', etc.
  metric_value DECIMAL(10, 2),
  date DATE NOT NULL,
  metadata JSONB, -- Additional context
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assets/Media Library
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50), -- 'image', 'video', 'document'
  file_size BIGINT,
  file_url TEXT NOT NULL,
  tags JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Settings
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme_mode VARCHAR(20) DEFAULT 'light', -- 'light', 'dark', 'system'
  primary_color VARCHAR(7) DEFAULT '#2563EB',
  sidebar_color VARCHAR(7) DEFAULT '#ffffff',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 3. Phase 1: Data Layer Implementation

### 3.1 Create Type Definitions
**File:** `src/types/database.types.ts`

Define comprehensive TypeScript interfaces for all database entities:
- User
- SocialAccount
- Post
- Campaign
- CampaignStep
- Contact
- Customer
- Task
- Message
- AnalyticsSnapshot
- Asset
- UserSettings

### 3.2 Create API Service Layer
**Directory:** `src/services/api/`

Create service modules:
- `auth.service.ts` - Authentication operations
- `posts.service.ts` - Content management
- `campaigns.service.ts` - Campaign CRUD
- `crm.service.ts` - Contacts & leads
- `customers.service.ts` - Customer management
- `tasks.service.ts` - Task operations
- `messages.service.ts` - Inbox operations
- `analytics.service.ts` - Metrics & reporting
- `socialAccounts.service.ts` - Social media integrations
- `assets.service.ts` - File management

### 3.3 Create Data Hooks
**Directory:** `src/hooks/`

Create custom React hooks using React Query:
- `useAuth.ts`
- `usePosts.ts`
- `useCampaigns.ts`
- `useContacts.ts`
- `useCustomers.ts`
- `useTasks.ts`
- `useMessages.ts`
- `useAnalytics.ts`
- `useSocialAccounts.ts`

---

## 4. Phase 2: Backend Integration

### 4.1 Choose & Setup Backend (Recommendation: Supabase)

**Why Supabase:**
- PostgreSQL-based (SQL database with JSONB support)
- Built-in authentication
- Real-time subscriptions
- Row-level security (RLS)
- Storage for media files
- Auto-generated REST & GraphQL APIs
- Free tier for development
- Easy migration to self-hosted

**Setup Steps:**
1. Create Supabase project
2. Run database migrations with schema above
3. Configure Row-Level Security policies
4. Set up authentication providers (Email, OAuth)
5. Configure storage buckets for assets
6. Generate TypeScript types from schema

### 4.2 Alternative: Build Custom Backend

**If choosing custom backend:**

**Directory Structure:**
```
server/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── env.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── posts.routes.ts
│   │   ├── campaigns.routes.ts
│   │   ├── crm.routes.ts
│   │   ├── customers.routes.ts
│   │   ├── tasks.routes.ts
│   │   ├── messages.routes.ts
│   │   └── analytics.routes.ts
│   ├── controllers/
│   ├── models/
│   ├── services/
│   └── index.ts
├── prisma/
│   └── schema.prisma
├── package.json
└── tsconfig.json
```

**API Endpoints Required:**

```
Authentication:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh

Posts:
GET    /api/posts
GET    /api/posts/:id
POST   /api/posts
PUT    /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/schedule
POST   /api/posts/:id/publish

Campaigns:
GET    /api/campaigns
GET    /api/campaigns/:id
POST   /api/campaigns
PUT    /api/campaigns/:id
DELETE /api/campaigns/:id
GET    /api/campaigns/:id/steps
POST   /api/campaigns/:id/steps
PUT    /api/campaigns/:id/steps/:stepId

CRM:
GET    /api/contacts
GET    /api/contacts/:id
POST   /api/contacts
PUT    /api/contacts/:id
DELETE /api/contacts/:id

Customers:
GET    /api/customers
GET    /api/customers/:id
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id
GET    /api/customers/:id/timeline

Tasks:
GET    /api/tasks
GET    /api/tasks/:id
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/:id/complete

Messages:
GET    /api/messages
GET    /api/messages/:id
POST   /api/messages/:id/reply
PATCH  /api/messages/:id/read
PATCH  /api/messages/:id/archive

Analytics:
GET    /api/analytics/dashboard
GET    /api/analytics/revenue
GET    /api/analytics/engagement
GET    /api/analytics/posts

Social Accounts:
GET    /api/social-accounts
POST   /api/social-accounts/connect
DELETE /api/social-accounts/:id
POST   /api/social-accounts/:id/refresh

Assets:
GET    /api/assets
POST   /api/assets/upload
DELETE /api/assets/:id
```

---

## 5. Phase 3: Authentication & Authorization

### 5.1 Implement Authentication Flow

**Components to Create:**
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/contexts/AuthContext.tsx`

**Features:**
- Email/password authentication
- OAuth providers (Google, LinkedIn, Microsoft)
- JWT token management
- Refresh token rotation
- Session persistence
- Auto-logout on token expiry

### 5.2 Update App.tsx

**Modifications needed:**
1. Wrap app with AuthProvider
2. Add login/register routing
3. Protect all routes except auth pages
4. Add user profile dropdown in header
5. Implement logout functionality

### 5.3 Row-Level Security (If using Supabase)

**Example RLS Policies:**
```sql
-- Users can only read their own data
CREATE POLICY "Users can view own data" ON posts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own data
CREATE POLICY "Users can insert own data" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own data
CREATE POLICY "Users can update own data" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own data
CREATE POLICY "Users can delete own data" ON posts
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 6. Phase 4: State Management

### 6.1 Install Dependencies

```bash
npm install @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers
```

### 6.2 Setup React Query

**File:** `src/lib/queryClient.ts`
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

**Update:** `main.tsx` or `index.tsx`
```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

### 6.3 Setup Zustand for UI State

**File:** `src/stores/uiStore.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isSidebarCollapsed: boolean;
  themeMode: 'light' | 'dark' | 'system';
  primaryColor: string;
  sidebarColor: string;
  toggleSidebar: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  setPrimaryColor: (color: string) => void;
  setSidebarColor: (color: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      themeMode: 'light',
      primaryColor: '#2563EB',
      sidebarColor: '#ffffff',
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setPrimaryColor: (color) => set({ primaryColor: color }),
      setSidebarColor: (color) => set({ sidebarColor: color }),
    }),
    {
      name: 'engagehub-ui-settings',
    }
  )
);
```

---

## 7. Phase 5: API Integration

### 7.1 Remove All Mock Data

**Dashboard.tsx:**
- Replace `chartData` with `useAnalytics()` hook
- Replace hardcoded metrics with API data
- Replace hardcoded tasks with `useTasks()` hook
- Replace hardcoded posts with `usePosts()` hook
- Replace hardcoded messages with `useMessages()` hook
- Replace hardcoded leads with `useContacts()` hook

**Inbox.tsx:**
- Replace `MESSAGES` constant with `useMessages()` hook
- Implement real-time message updates
- Add reply functionality
- Add archive/delete functionality

**Content.tsx:**
- Replace platform state with `useSocialAccounts()` hook
- Implement form submission with `usePosts()` mutation
- Add image upload functionality
- Add AI content generation with Gemini API

**SocialMedia.tsx:**
- Replace hardcoded accounts with `useSocialAccounts()` hook
- Implement OAuth connection flow
- Replace hardcoded schedule with real data
- Replace hardcoded engagement metrics with analytics

**Campaigns.tsx:**
- Replace `INITIAL_CAMPAIGNS` with `useCampaigns()` hook
- Implement campaign creation form
- Add step management
- Connect analytics

**CRM.tsx:**
- Replace `INITIAL_CONTACTS` with `useContacts()` hook
- Implement CRUD operations
- Add search/filter functionality

**Customers.tsx:**
- Replace `INITIAL_CUSTOMERS` with `useCustomers()` hook
- Implement customer management
- Add segmentation

**Tasks.tsx:**
- Replace `TASKS` constant with `useTasks()` hook
- Implement task creation/completion
- Add recurring task logic

### 7.2 Add Loading & Error States

**Example Pattern:**
```typescript
const { data: posts, isLoading, error } = usePosts();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!posts || posts.length === 0) return <EmptyState />;
```

**Create Shared Components:**
- `src/components/common/LoadingSpinner.tsx`
- `src/components/common/ErrorMessage.tsx`
- `src/components/common/EmptyState.tsx`

### 7.3 Implement Optimistic Updates

**Example for task completion:**
```typescript
const { mutate: completeTask } = useCompleteTask({
  onMutate: async (taskId) => {
    await queryClient.cancelQueries(['tasks']);
    const previous = queryClient.getQueryData(['tasks']);
    queryClient.setQueryData(['tasks'], (old) => 
      old.map(task => task.id === taskId ? { ...task, completed: true } : task)
    );
    return { previous };
  },
  onError: (err, taskId, context) => {
    queryClient.setQueryData(['tasks'], context.previous);
  },
});
```

---

## 8. Phase 6: Testing & Quality Assurance

### 8.1 Unit Testing

**Install:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Test Coverage Goals:**
- Utility functions: 100%
- Custom hooks: 90%
- Components: 80%
- Integration tests: Key user flows

### 8.2 E2E Testing

**Install:**
```bash
npm install -D playwright @playwright/test
```

**Test Scenarios:**
- User registration & login
- Creating a post and scheduling it
- Adding a new contact
- Creating a campaign
- Completing a task

### 8.3 Performance Testing

**Metrics to Monitor:**
- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Time to Interactive < 3.5s
- Cumulative Layout Shift < 0.1

### 8.4 Security Audit

**Checklist:**
- [ ] Environment variables properly secured
- [ ] API keys not exposed in frontend
- [ ] CSRF protection enabled
- [ ] Rate limiting implemented
- [ ] Input sanitization
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention
- [ ] CORS properly configured
- [ ] HTTPS enforced in production
- [ ] Secure headers configured

---

## 9. Phase 7: Production Deployment

### 9.1 Environment Configuration

**Files to Create:**
- `.env.development`
- `.env.production`
- `.env.example`

**Environment Variables:**
```env
# App
VITE_APP_NAME=EngageHub
VITE_APP_URL=https://engagehub.com

# API
VITE_API_URL=https://api.engagehub.com
VITE_API_TIMEOUT=30000

# Supabase (or your backend)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# Gemini AI
VITE_GEMINI_API_KEY=xxx

# Social Media OAuth
VITE_FACEBOOK_APP_ID=xxx
VITE_LINKEDIN_CLIENT_ID=xxx
VITE_TWITTER_CLIENT_ID=xxx
VITE_INSTAGRAM_CLIENT_ID=xxx

# Analytics
VITE_GA_TRACKING_ID=xxx
VITE_SENTRY_DSN=xxx

# Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_CAMPAIGNS=true
```

### 9.2 Build Optimization

**Update `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts'],
          'ui-vendor': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts'],
  },
});
```

### 9.3 CI/CD Pipeline

**GitHub Actions Example** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 9.4 Deployment Platforms

**Recommended: Vercel**
- Automatic HTTPS
- Edge functions for API
- Preview deployments
- Analytics built-in
- Free tier available

**Alternative: Netlify**
- Similar features to Vercel
- Better for static sites
- Form handling built-in

**Alternative: AWS Amplify**
- Full AWS integration
- More control
- Requires more configuration

### 9.5 Database Migration Strategy

**Zero-Downtime Migration Steps:**
1. Create new tables alongside old ones
2. Dual-write to both old and new tables
3. Backfill historical data
4. Switch reads to new tables
5. Stop writes to old tables
6. Verify data consistency
7. Drop old tables

### 9.6 Monitoring & Logging

**Services to Integrate:**
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Google Analytics**: User analytics
- **Datadog** or **New Relic**: Application performance monitoring

---

## 10. Timeline & Dependencies

### 10.1 Estimated Timeline

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| **Phase 1** | Data Layer Implementation | 1 week | None |
| **Phase 2** | Backend Integration | 2 weeks | Phase 1 |
| **Phase 3** | Authentication & Authorization | 1 week | Phase 2 |
| **Phase 4** | State Management | 1 week | Phase 1 |
| **Phase 5** | API Integration & Mock Removal | 3 weeks | Phases 2, 3, 4 |
| **Phase 6** | Testing & QA | 2 weeks | Phase 5 |
| **Phase 7** | Production Deployment | 1 week | Phase 6 |
| **TOTAL** | | **11 weeks** | |

### 10.2 Critical Path

```
Phase 1 → Phase 2 → Phase 3 → Phase 5 → Phase 6 → Phase 7
              ↓
          Phase 4 ────────────────────────↑
```

### 10.3 Parallel Work Opportunities

- **Phase 4** (State Management) can run parallel to **Phase 2** (Backend)
- Frontend component refactoring can start after Phase 1
- Testing strategy can be developed during Phase 3

### 10.4 Risk Mitigation

**High-Risk Areas:**
1. **Social Media OAuth Integration**: Complex, platform-specific
   - *Mitigation*: Start with 1-2 platforms, expand gradually
   
2. **Data Migration**: Potential data loss
   - *Mitigation*: Comprehensive backup strategy, staged rollout
   
3. **Real-time Features**: Performance issues
   - *Mitigation*: Implement polling first, upgrade to WebSockets later
   
4. **Third-party API Limits**: Rate limiting, costs
   - *Mitigation*: Implement caching, request queuing, monitoring

---

## 11. Success Criteria

### 11.1 Functional Requirements
- ✅ All mock data replaced with real database queries
- ✅ User authentication working
- ✅ CRUD operations for all entities
- ✅ Social media account connections
- ✅ Post scheduling and publishing
- ✅ Campaign management
- ✅ CRM functionality
- ✅ Task management
- ✅ Unified inbox

### 11.2 Non-Functional Requirements
- ✅ Page load time < 3 seconds
- ✅ 99.9% uptime
- ✅ API response time < 500ms (p95)
- ✅ Mobile responsive
- ✅ Accessibility (WCAG 2.1 AA)
- ✅ SEO optimized
- ✅ Zero data loss
- ✅ Secure by design

### 11.3 Business Metrics
- ✅ User can complete full workflow end-to-end
- ✅ Data persists across sessions
- ✅ Multi-user support
- ✅ Scalable to 10,000+ users
- ✅ Production-ready documentation
- ✅ Monitoring and alerting in place

---

## 12. Post-Launch Roadmap

### 12.1 Immediate Post-Launch (Week 1-2)
- Monitor error rates
- Fix critical bugs
- Optimize slow queries
- Gather user feedback

### 12.2 Short-term (Month 1-3)
- Add missing features from original mockups
- Implement user-requested features
- Performance optimization
- Enhanced analytics

### 12.3 Long-term (Month 4-12)
- Advanced AI features
- Mobile app development
- Advanced automation workflows
- Team collaboration features
- White-label options

---

## 13. Resource Requirements

### 13.1 Team Composition
- **1 Backend Developer**: API development, database design
- **1 Frontend Developer**: React components, state management
- **1 Full-Stack Developer**: Integration, DevOps
- **1 QA Engineer**: Testing, quality assurance
- **1 Product Manager**: Coordination, requirements

### 13.2 Estimated Costs

| Item | Monthly Cost | Annual Cost |
|------|-------------|-------------|
| Supabase (Pro) | $25 | $300 |
| Vercel (Pro) | $20 | $240 |
| CDN/Storage | $10 | $120 |
| Monitoring (Sentry) | $26 | $312 |
| Domain & SSL | $2 | $24 |
| Email Service | $10 | $120 |
| **Total** | **$93** | **$1,116** |

*Note: Costs scale with usage. Above is for ~1,000 users.*

---

## 14. Conclusion

This plan provides a comprehensive roadmap to transform EngageHub from a demo application with mock data into a production-ready SaaS platform. The phased approach ensures systematic progress while minimizing risk.

**Key Success Factors:**
1. Start with solid data architecture (Phase 1-2)
2. Implement authentication early (Phase 3)
3. Systematic removal of mock data (Phase 5)
4. Comprehensive testing (Phase 6)
5. Careful production deployment (Phase 7)

**Next Steps:**
1. Review and approve this plan
2. Set up project management tools (Jira, Linear, etc.)
3. Provision development environments
4. Begin Phase 1: Data Layer Implementation

---

## Appendix A: Mock Data Removal Checklist

### Dashboard
- [ ] Remove `chartData` constant
- [ ] Remove hardcoded stat values
- [ ] Remove hardcoded tasks array
- [ ] Remove hardcoded posts array
- [ ] Remove hardcoded AI insight text
- [ ] Remove hardcoded messages array
- [ ] Remove hardcoded leads array
- [ ] Connect to analytics API
- [ ] Connect to tasks API
- [ ] Connect to posts API
- [ ] Connect to messages API
- [ ] Connect to CRM API

### Inbox
- [ ] Remove `MESSAGES` constant
- [ ] Implement `useMessages()` hook
- [ ] Add message loading state
- [ ] Add error handling
- [ ] Implement mark as read
- [ ] Implement archive
- [ ] Implement delete
- [ ] Implement reply
- [ ] Add real-time updates

### Content
- [ ] Remove hardcoded platform selection
- [ ] Connect to `useSocialAccounts()`
- [ ] Implement post creation mutation
- [ ] Add form validation
- [ ] Implement image upload
- [ ] Implement scheduling logic
- [ ] Add AI content generation
- [ ] Connect to posts list API

### SocialMedia
- [ ] Remove hardcoded accounts array
- [ ] Connect to `useSocialAccounts()`
- [ ] Implement OAuth flow
- [ ] Remove hardcoded schedule items
- [ ] Connect to posts schedule API
- [ ] Remove hardcoded engagement metrics
- [ ] Connect to analytics API
- [ ] Add account connection UI

### Campaigns
- [ ] Remove `INITIAL_CAMPAIGNS` constant
- [ ] Implement `useCampaigns()` hook
- [ ] Remove hardcoded stats
- [ ] Connect to campaign analytics
- [ ] Implement campaign creation form
- [ ] Implement step management
- [ ] Add campaign activation logic

### CRM
- [ ] Remove `INITIAL_CONTACTS` constant
- [ ] Implement `useContacts()` hook
- [ ] Implement contact creation
- [ ] Implement contact editing
- [ ] Implement contact deletion
- [ ] Add search functionality
- [ ] Add filter functionality
- [ ] Add pagination

### Customers
- [ ] Remove `INITIAL_CUSTOMERS` constant
- [ ] Implement `useCustomers()` hook
- [ ] Implement customer CRUD
- [ ] Add segmentation logic
- [ ] Connect to LTV calculations
- [ ] Add timeline view

### Tasks
- [ ] Remove `TASKS` constant
- [ ] Implement `useTasks()` hook
- [ ] Implement task creation
- [ ] Implement task completion
- [ ] Implement task editing
- [ ] Implement task deletion
- [ ] Add recurring task logic
- [ ] Add filtering by status

---

## Appendix B: API Contract Examples

### Example: Get Posts
```
GET /api/posts?status=scheduled&limit=20&offset=0

Response:
{
  "data": [
    {
      "id": "uuid",
      "content": "Post content...",
      "status": "scheduled",
      "scheduled_at": "2026-01-10T14:00:00Z",
      "platforms": ["instagram", "linkedin"],
      "media_urls": ["https://..."],
      "created_at": "2026-01-08T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 20,
    "offset": 0
  }
}
```

### Example: Create Post
```
POST /api/posts

Body:
{
  "content": "Exciting news about...",
  "platforms": ["instagram", "facebook"],
  "media_urls": ["https://..."],
  "scheduled_at": "2026-01-15T10:00:00Z"
}

Response:
{
  "data": {
    "id": "new-uuid",
    "content": "Exciting news about...",
    "status": "scheduled",
    "scheduled_at": "2026-01-15T10:00:00Z",
    "platforms": ["instagram", "facebook"],
    "created_at": "2026-01-08T10:00:00Z"
  }
}
```

---

**Document Version:** 1.0  
**Last Updated:** January 8, 2026  
**Author:** EngageHub Development Team  
**Status:** Ready for Review & Approval
