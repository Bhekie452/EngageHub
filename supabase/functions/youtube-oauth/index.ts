import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "@supabase/supabase-js"

serve(async (req) => {
  const url = new URL(req.url)
  const pathname = url.pathname
  const getEnv = (k: string) => ((globalThis as any).Deno?.env?.get?.(k) as string | undefined) || ''
  const CLIENT_ID = getEnv('YT_CLIENT_ID') || ''
  const CLIENT_SECRET = getEnv('YT_CLIENT_SECRET') || ''
  const REDIRECT_URI = getEnv('YT_REDIRECT_URI') || 'https://zourlqrkoyugzymxkbgn.functions.supabase.co/youtube-oauth/callback'
  const SUPABASE_URL = getEnv('SUPABASE_URL') || ''
  const SUPABASE_SERVICE_ROLE_KEY = getEnv('SERVICE_ROLE_KEY') || ''

  // Handle /start - redirect to Google OAuth
  if (pathname.includes("/start")) {
    const returnUrl = url.searchParams.get('returnUrl') || ''
    const workspaceId = url.searchParams.get('workspaceId') || ''
    const statePayload = btoa(JSON.stringify({ returnUrl, workspaceId }))

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl',
      access_type: 'offline',
      prompt: 'consent',
      state: statePayload,
    })
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    return new Response(null, {
      status: 302,
      headers: { Location: googleAuthUrl }
    })
  }

  // Handle /callback - exchange code for tokens
  if (pathname.includes("/callback")) {
    const code = url.searchParams.get("code")
    const { state } = Object.fromEntries(url.searchParams)
    let workspaceId = ''
    let returnUrl = ''
    try {
      const parsed = JSON.parse(atob(state || ''))
      workspaceId = parsed.workspaceId
      returnUrl = parsed.returnUrl
      console.log('OAuth callback - workspaceId:', workspaceId)
      console.log('OAuth callback - returnUrl:', returnUrl)
    } catch {
      return new Response('Invalid state parameter', { status: 400 })
    }

    if (!workspaceId) {
      console.log('Missing workspaceId in callback')
      return new Response('Missing workspaceId', { status: 400 })
    }

    // Create or verify workspace exists
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    console.log('Checking workspace with ID:', workspaceId)
    console.log('Workspace ID type:', typeof workspaceId)
    console.log('Workspace ID length:', workspaceId?.length)
    
    // For now, let's just create the workspace with the provided ID without checking first
    // This will help us debug if the issue is with the workspace lookup or creation
    try {
      const { data: newWorkspace, error: createError } = await supabase
        .from('workspaces')
        .upsert({
          id: workspaceId,
          name: 'YouTube Integration Workspace',
          slug: `yt-${workspaceId.slice(0, 8)}`,
          owner_id: null
        }, {
          onConflict: 'id'
        })
        .select('id, name, owner_id')
        .single()
      
      console.log('Upsert workspace result:', { data: newWorkspace, error: createError })
      
      if (createError) {
        console.error('Failed to upsert workspace:', createError)
        return new Response(`Failed to create workspace: ${createError.message}`, { status: 400 })
      }
      
      if (!newWorkspace) {
        console.error('No workspace after upsert')
        return new Response('Failed to create or verify workspace', { status: 400 })
      }
      
      console.log('Workspace ready:', newWorkspace)
      
    } catch (error) {
      console.error('Exception during workspace creation:', error)
      return new Response(`Exception during workspace creation: ${error.message}`, { status: 500 })
    }

    if (!code) {
      return new Response("No authorization code provided", { status: 400 })
    }

    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code"
        })
      })

      const tokens = await tokenResponse.json()

      if (!tokenResponse.ok || tokens.error) {
        return new Response(JSON.stringify({ error: tokens.error || 'token_exchange_failed' }), { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        })
      }

      // Persist tokens for later API calls
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && workspaceId) {
        const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        let channelId: string | null = null
        try {
          const chRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=id&mine=true', {
            headers: { Authorization: `Bearer ${String(tokens.access_token || '')}` },
          })
          if (chRes.ok) {
            const chJson = await chRes.json()
            channelId = chJson?.items?.[0]?.id || null
          }
        } catch { /* ignore */ }

        console.log('Storing tokens for workspaceId:', workspaceId)
        const { data, error } = await sb
          .from('youtube_accounts')
          .upsert({
            workspace_id: workspaceId,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
            channel_id: null, // TODO: fetch channel if needed
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'workspace_id'
          })
        console.log('Upsert result:', { data, error })
        if (error) {
          console.error('Failed to store YouTube tokens:', error)
          return new Response(JSON.stringify({ error: 'Failed to store tokens', details: error.message }), { status: 500 })
        }
      }

      // TODO: Store tokens in Supabase securely (youtube_accounts table)
      const target = returnUrl || 'https://engage-hub-ten.vercel.app'
      const redir = new URL(target)
      redir.searchParams.set('youtube_oauth', 'success')
      return new Response(null, { status: 302, headers: { Location: redir.toString() } })
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }
  }

  return new Response("YouTube OAuth Handler - Use /start to begin", { status: 200 })
})