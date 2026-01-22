-- Backfill customers to ensure workspace_id is set for rows owned by each user
-- This allows RLS policies to return all of the user's customers.

UPDATE public.customers c
SET workspace_id = w.id
FROM public.workspaces w
WHERE c.workspace_id IS NULL
  AND w.owner_id = c.user_id;

