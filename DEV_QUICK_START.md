# 🚀 Developer Quick Start Guide

**Get from mock data to production in the fastest way possible.**

---

## ⚡ TL;DR - The Fastest Path

1. **Choose Backend:** Supabase (5 min setup) ✅ RECOMMENDED
2. **Install Dependencies:** `npm install @tanstack/react-query @supabase/supabase-js zustand` (1 min)
3. **Create First Hook:** Start with Tasks (30 min)
4. **Replace First Component:** Tasks.tsx (1 hour)
5. **Repeat:** For other 7 components
6. **Deploy:** Vercel (10 min)

**Total MVP Time:** ~2 weeks for solo dev, 1 week for small team

---

## 🎯 Day 1: Setup & First Victory

### Hour 1: Environment Setup

**1. Create Supabase Account**
```bash
# Go to https://supabase.com
# Click "New Project"
# Name: engagehub-dev
# Database Password: [save this!]
# Region: [closest to you]
```

**2. Create Database Tables**
```sql
-- In Supabase SQL Editor, paste this:

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Run this (click "Run")
```

**3. Install Dependencies**
```bash
cd engagehub-unified-business-command

# Core dependencies
npm install @supabase/supabase-js @tanstack/react-query zustand axios

# Forms & validation
npm install react-hook-form zod @hookform/resolvers

# Dev dependencies
npm install -D @types/node
```

**4. Create Environment File**
```bash
# Create .env.local file
cat > .env.local << EOL
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-key-here
EOL
```

Get your Supabase keys from: Project Settings → API

---

### Hour 2: Setup React Query

**1. Create Query Client**

Create `src/lib/queryClient.ts`:
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

**2. Update index.tsx**

```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

// Wrap your app
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

**3. Create Supabase Client**

Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

### Hour 3: Create First API Service

Create `src/services/api/tasks.service.ts`:
```typescript
import { supabase } from '../../lib/supabase';

export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  completed: boolean;
  created_at: string;
}

export const tasksApi = {
  // Get all tasks
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create task
  async create(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update task
  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete task
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Toggle completion
  async toggleComplete(id: string, completed: boolean): Promise<Task> {
    return this.update(id, { completed, status: completed ? 'completed' : 'pending' });
  },
};
```

---

### Hour 4: Create First React Hook

Create `src/hooks/useTasks.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, Task } from '../services/api/tasks.service';

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll(),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (task: Omit<Task, 'id' | 'created_at'>) => tasksApi.create(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => 
      tasksApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => 
      tasksApi.toggleComplete(id, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

---

### Hour 5-8: Replace Tasks.tsx

**BEFORE (Lines to remove):**
```typescript
const TASKS: TaskItem[] = [
  { id: '1', title: 'Review Q3 Marketing Strategy', ... },
  // ... mock data
];
```

**AFTER (Replace with):**
```typescript
import { useTasks, useCreateTask, useToggleTask, useDeleteTask } from '../hooks/useTasks';

const Tasks: React.FC = () => {
  const { data: tasks, isLoading, error } = useTasks();
  const toggleTask = useToggleTask();
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-600">Error loading tasks: {error.message}</p>
      </div>
    );
  }
  
  // Empty state
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No tasks yet. Create your first task!</p>
      </div>
    );
  }
  
  // Render tasks
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task.id} className="bg-white p-4 rounded-xl border">
          <button 
            onClick={() => toggleTask.mutate({ 
              id: task.id, 
              completed: !task.completed 
            })}
            className="..."
          >
            {/* Task UI */}
          </button>
        </div>
      ))}
    </div>
  );
};
```

---

## 🎉 Day 1 Victory!

You now have:
- ✅ Supabase database
- ✅ React Query setup
- ✅ First API service
- ✅ First custom hook
- ✅ Tasks component using REAL data!

**Test it:**
1. `npm run dev`
2. Open app
3. Tasks are now saved to database!
4. Refresh page → data persists! 🎊

---

## 📅 Day 2-5: Repeat for Other Components

### Day 2: CRM & Customers

**1. Create database tables:**
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  company VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  contact_id UUID REFERENCES contacts(id),
  status VARCHAR(20),
  lifetime_value DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**2. Create services:**
- `src/services/api/crm.service.ts`
- `src/services/api/customers.service.ts`

**3. Create hooks:**
- `src/hooks/useContacts.ts`
- `src/hooks/useCustomers.ts`

**4. Update components:**
- [CRM.tsx](components/CRM.tsx)
- [Customers.tsx](components/Customers.tsx)

---

### Day 3: Content & Posts

**1. Database table:**
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  scheduled_at TIMESTAMP,
  platforms JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**2. Files to create:**
- `src/services/api/posts.service.ts`
- `src/hooks/usePosts.ts`

**3. Update:**
- [Content.tsx](components/Content.tsx)
- [Dashboard.tsx](components/Dashboard.tsx) (scheduled posts section)

---

### Day 4: Messages & Inbox

**1. Database:**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  sender_name VARCHAR(255),
  platform VARCHAR(50),
  content TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**2. Files:**
- `src/services/api/messages.service.ts`
- `src/hooks/useMessages.ts`

**3. Update:**
- [Inbox.tsx](components/Inbox.tsx)

---

### Day 5: Campaigns

**1. Database:**
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE campaign_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  title VARCHAR(255),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**2. Files:**
- `src/services/api/campaigns.service.ts`
- `src/hooks/useCampaigns.ts`

**3. Update:**
- [Campaigns.tsx](components/Campaigns.tsx)

---

## 🔐 Week 2: Authentication

### Setup Supabase Auth

**1. Enable Email Auth in Supabase:**
- Go to Authentication → Settings
- Enable Email provider

**2. Create Auth Context**

Create `src/contexts/AuthContext.tsx`:
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**3. Create Login Component**

Create `src/components/auth/LoginForm.tsx`:
```typescript
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full px-4 py-2 border rounded-lg"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full px-4 py-2 border rounded-lg"
      />
      {error && <p className="text-red-600">{error}</p>}
      <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg">
        Sign In
      </button>
    </form>
  );
}
```

**4. Update App.tsx**

```typescript
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <LoginForm />;
  
  return <App />; // Your main app
}

function AppWithAuth() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default AppWithAuth;
```

---

## 🚀 Deployment (15 minutes)

### Deploy to Vercel

**1. Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/engagehub.git
git push -u origin main
```

**2. Deploy on Vercel:**
- Go to https://vercel.com
- Click "New Project"
- Import your GitHub repo
- Add environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_GEMINI_API_KEY`
- Click "Deploy"

**3. Done!** 🎉
Your app is live at `https://your-app.vercel.app`

---

## 🎯 Success Checklist

After 2 weeks, you should have:

- ✅ Supabase database configured
- ✅ React Query setup
- ✅ All mock data removed
- ✅ 8 components using real data
- ✅ Authentication working
- ✅ Data persisting across sessions
- ✅ Deployed to production
- ✅ Users can sign up and use the app!

---

## 🆘 Common Issues & Solutions

### "Error: Invalid API key"
**Solution:** Check `.env.local` has correct Supabase keys

### "Cannot read property of undefined"
**Solution:** Add loading/error states to your component

### "Data not updating"
**Solution:** Make sure you're calling `invalidateQueries` after mutations

### "CORS error"
**Solution:** Check Supabase project URL is correct

---

## 📚 Reference

- **Detailed Plan:** [PRODUCTION_READINESS_PLAN.md](PRODUCTION_READINESS_PLAN.md)
- **Full Checklist:** [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)
- **Mock Data Map:** [MOCK_DATA_INVENTORY.md](MOCK_DATA_INVENTORY.md)
- **Supabase Docs:** https://supabase.com/docs
- **React Query Docs:** https://tanstack.com/query/latest

---

**Pro Tip:** Start with Tasks, it's the simplest. Once you get that working, the pattern repeats for all other components!

**Last Updated:** January 8, 2026  
**Status:** Ready to code!
