import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "@supabase/supabase-js"

serve(async (req) => {
  const getEnv = (k: string) => ((globalThis as any).Deno?.env?.get?.(k) as string | undefined) || ''
  const SUPABASE_URL = getEnv('SUPABASE_URL') || ''
  const SERVICE_ROLE_KEY = getEnv('SERVICE_ROLE_KEY') || ''
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  // Fetch all posts with platform=youtube and a link_url
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, link_url, workspace_id')
    .eq('platforms', '{youtube}')
    .not('link_url', 'is', null)

  if (error) {
    console.error('Failed to fetch YouTube posts:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch posts' }), { status: 500 })
  }

  const results = []
  for (const post of posts || []) {
    try {
      // Call youtube-sync for each post
      const syncUrl = `${SUPABASE_URL.replace('/rest/v1', '')}/functions/v1/youtube-sync`
      const resp = await fetch(syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
        body: JSON.stringify({ videoUrl: post.link_url, postId: post.id, workspaceId: post.workspace_id })
      })
      if (!resp.ok) {
        console.warn(`Sync failed for post ${post.id}:`, await resp.text())
        results.push({ postId: post.id, status: 'failed', error: await resp.text() })
      } else {
        results.push({ postId: post.id, status: 'synced' })
      }
    } catch (e) {
      console.error(`Sync error for post ${post.id}:`, e)
      results.push({ postId: post.id, status: 'error', error: e.message })
    }
  }

  return new Response(JSON.stringify({ synced: results.length, results }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  })
})
