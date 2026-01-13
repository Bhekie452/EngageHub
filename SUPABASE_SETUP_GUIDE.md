# 🚀 Supabase Setup Guide for EngageHub

This guide will walk you through setting up Supabase as the backend for EngageHub.

---

## ✅ Prerequisites

- ✅ Installed dependencies: `@supabase/supabase-js`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`
- ⏳ Supabase account (create at https://supabase.com)
- ⏳ Project created in Supabase

---

## 📋 Step-by-Step Setup

### **Step 1: Create Supabase Project**

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in project details:
   - **Project Name:** `engagehub` (or your choice)
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Start with Free tier
5. Click **"Create new project"**
6. Wait 2-3 minutes for setup to complete

---

### **Step 2: Get API Credentials**

1. Once project is ready, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xyzcompany.supabase.co`)
   - **anon/public key** (long JWT token starting with `eyJhbGc...`)

3. Open `.env.local` in your project root
4. Replace the placeholder values:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

### **Step 3: Run Database Schema**

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open `supabase-schema.sql` file from your project
4. Copy **ALL** content from that file
5. Paste into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. Wait for success message: ✅ "Success. No rows returned"

This creates:
- ✅ 12 database tables
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Triggers for auto-updating timestamps
- ✅ Function to create user profiles automatically

---

### **Step 4: Verify Database Setup**

1. Click **Table Editor** (left sidebar)
2. You should see all these tables:
   - `profiles`
   - `tasks`
   - `customers`
   - `deals`
   - `messages`
   - `posts`
   - `post_analytics`
   - `campaigns`
   - `campaign_content`
   - `social_accounts`
   - `templates`
   - `automation_rules`

---

### **Step 5: Enable Email Authentication**

1. Go to **Authentication** → **Providers**
2. Find **Email** provider
3. Toggle it **ON** (if not already)
4. Configure email settings:
   - **Enable email confirmations:** ON (recommended)
   - **Secure email change:** ON (recommended)
5. Click **Save**

Optional: Configure other providers (Google, Facebook, etc.) later

---

### **Step 6: Configure Storage (for profile avatars)**

**Note:** The storage bucket and policies are now included in the `supabase-schema.sql` file and will be created automatically when you run the schema. No manual setup needed!

However, if you need to create it manually:

1. Go to **Storage** (left sidebar)
2. Click **"Create a new bucket"**
3. Bucket details:
   - **Name:** `avatars`
   - **Public bucket:** ON (so profile pictures are viewable)
4. Click **Create bucket**

The following policies are already included in the schema:
- ✅ Users can upload their own avatar
- ✅ Users can update their own avatar  
- ✅ Users can delete their own avatar
- ✅ Avatars are publicly accessible for viewing

---

### **Step 7: Test the Connection**

1. Restart your Vite dev server:
   ```bash
   npm run dev
   ```

2. Check browser console - you should see NO errors about Supabase

3. The app is now connected to Supabase! 🎉

---

## 🔐 Security Notes

### **Important: Never commit `.env.local`**

The `.env.local` file is already in `.gitignore`. This keeps your API keys safe.

### **ANON Key is Safe to Expose**

The `anon` key is designed to be public (used in browser). Security comes from:
- Row Level Security (RLS) policies
- User authentication
- Database-level permissions

---

## 🧪 Testing with Sample Data (Optional)

Once you have a user account created, you can add sample data:

1. Go to **SQL Editor**
2. Create a new query
3. Get your user ID first:
   ```sql
   SELECT id, email FROM auth.users;
   ```
4. Copy your user ID (UUID)
5. Run sample data inserts (replace `'your-user-id'`):
   ```sql
   INSERT INTO tasks (user_id, title, description, status, priority, due_date) 
   VALUES
   ('your-actual-uuid-here', 'Test Task', 'This is a test', 'todo', 'high', NOW() + INTERVAL '3 days');
   
   INSERT INTO customers (user_id, name, email, company, status) 
   VALUES
   ('your-actual-uuid-here', 'John Doe', 'john@example.com', 'Acme Corp', 'active');
   ```

---

## 📊 Monitoring & Analytics

### View Database Activity
1. Go to **Database** → **Query Performance**
2. Monitor slow queries and optimize as needed

### View API Usage
1. Go to **Settings** → **Usage**
2. Monitor:
   - Database size
   - Bandwidth
   - API requests

### View Authentication Stats
1. Go to **Authentication** → **Users**
2. See all registered users
3. Manually create test users here

---

## 🚨 Troubleshooting

### Error: "Missing Supabase environment variables"
- Check `.env.local` file exists
- Verify variable names: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart dev server after adding env variables

### Error: "Failed to fetch" or CORS errors
- Verify your Supabase URL is correct
- Check if project is fully initialized (wait 2-3 min after creation)
- Clear browser cache

### Error: "new row violates row-level security policy"
- Make sure RLS policies were created (Step 3)
- Verify user is authenticated
- Check policy conditions match your use case

### Database connection issues
- Check **Settings** → **Database** → **Connection Info**
- Verify database is not paused (happens on free tier if inactive)
- Check Supabase status page: https://status.supabase.com

---

## 📚 Next Steps

Now that Supabase is set up:

1. ✅ Create authentication components (Login/Register)
2. ✅ Create API service files in `src/services/api/`
3. ✅ Create React Query hooks in `src/hooks/`
4. ✅ Replace mock data in components with real API calls
5. ✅ Test user signup/login flow
6. ✅ Test CRUD operations

Refer to:
- `IMPLEMENTATION_CHECKLIST.md` for task-by-task guide
- `PRODUCTION_READINESS_PLAN.md` for full architecture details
- `MOCK_DATA_INVENTORY.md` for mock data locations

---

## 🎯 Success Checklist

- [ ] Supabase project created
- [ ] API credentials added to `.env.local`
- [ ] Database schema executed successfully
- [ ] All 12 tables visible in Table Editor
- [ ] Email auth enabled
- [ ] Storage bucket created
- [ ] Dev server running without errors
- [ ] No console errors about Supabase

---

## 🆘 Getting Help

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Discord:** https://discord.supabase.com
- **GitHub Issues:** https://github.com/supabase/supabase/issues

---

**Status:** 🎉 Supabase is ready! You can now start building authentication and replacing mock data.
