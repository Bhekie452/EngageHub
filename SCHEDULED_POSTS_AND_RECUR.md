# Schedule & Recur – Content Posts

## What’s implemented

### Schedule
- **Schedule Post**: Choose “Schedule”, pick a **date** and **time** (e.g. dd/mm/yyyy, 10:00 am). The post is saved with `status: 'scheduled'` and `scheduled_for` set.
- **Validation**: Date and time are required when “Schedule” is selected; the chosen time must be in the future.
- **Processing**: Due posts (`scheduled_for` ≤ now) are published by:
  1. **On visit**: When you open Content and view All / Drafts / Scheduled / Published, the app calls `GET /api/process-scheduled-posts`, then refreshes the list.
  2. **Cron** (Vercel): Every 5 minutes, Vercel Cron calls `/api/process-scheduled-posts` so scheduled posts publish even when no one is on the app.

### Recur
- **Recur**: Check “Recur”, then set **Frequency** (Daily, Weekly, Monthly, Every weekday) and **End date**. The post is saved with `is_recurring: true` and `recurrence_rule` (e.g. `FREQ=WEEKLY;UNTIL=2024-12-31`).
- **Validation**: When Recur is on, end date is required and must be on or after the scheduled date.
- **Processing**: When a scheduled post is published and it’s recurring, the API creates the **next** occurrence (next day/week/month from `scheduled_for`) and inserts a new scheduled post. This repeats until the end date.

## API: Process scheduled posts

- **Endpoint**: `GET` or `POST` `/api/process-scheduled-posts`
- **Behavior**: Loads posts where `status = 'scheduled'` and `scheduled_for <= now`, publishes each to its selected platforms (Facebook, Twitter, LinkedIn, Instagram), sets `status = 'published'` and `published_at`, and for recurring posts creates the next occurrence.
- **Env**: Uses `VITE_SUPABASE_URL` or `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or `VITE_SUPABASE_ANON_KEY`) so the server can read posts and social accounts. For cron, prefer `SUPABASE_SERVICE_ROLE_KEY` so RLS doesn’t block.

## Vercel Cron

In `vercel.json`, a cron runs every 5 minutes:

```json
"crons": [
  { "path": "/api/process-scheduled-posts", "schedule": "*/5 * * * *" }
]
```

Cron is only active on **Vercel Pro** (or team). On Hobby, scheduled posts still run when someone opens Content and the list tabs (the app calls the API on load).
