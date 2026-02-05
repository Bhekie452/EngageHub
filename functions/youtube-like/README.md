Deployment & testing

This function implements idempotent syncing of a "like" action to YouTube.

Prerequisites
- A Supabase project with a `youtube_accounts` table containing `workspace_id` and `access_token` columns.
- The migration file `db/migrations/create_youtube_sync_logs.sql` should be applied to create `youtube_sync_logs` with a unique index.

Env vars (set for the deployed function):
- `SUPABASE_URL` - your Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` - service role key for server-side DB access
- `INTERNAL_SECRET` - a secret string required in the `x-internal-secret` header to call the function

Request
POST JSON body:
{
  "videoId": "<youtube-video-id>",
  "workspaceId": "<workspace-uuid>",
  "userId": "<user-uuid>",
  "action": "like",
  "metadata": { "actor": "user@example.com" }
}

Behavior
1. Insert a record into `youtube_sync_logs` using the unique index. If a duplicate exists, the function returns 200 with `skipped: true` (idempotent).
2. If insert succeeds, the function looks up `youtube_accounts` for the workspace and attempts to call the YouTube Data API to rate the video as `like` using the stored access token.
3. On success: returns `{ ok: true, synced: true }`.
4. On API failure (e.g. 401): returns a 401 with `