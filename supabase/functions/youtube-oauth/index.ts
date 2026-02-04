import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "@supabase/supabase-js"

serve(async (req) => {
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const pathname = url.pathname
  const getEnv = (k: string) => ((globalThis as any).Deno?.env?.get?.(k) as string | undefined) || ''
  const CLIENT_ID = getEnv('YT_CLIENT_ID') || ''
  const CLIENT_SECRET = getEnv('YT_CLIENT_SECRET') || ''
  const REDIRECT_URI = getEnv('YT_REDIRECT_URI') || 'https://zourlqrkoyugzymxkbgn.functions.supabase.co/youtube-oauth/callback'
  const SUPABASE_URL = getEnv('SUPABASE_URL') || ''
  const SUPABASE_SERVICE_ROLE_KEY = getEnv('SERVICE_ROLE_KEY') || ''

  console.log('=== YouTube OAuth Function Called ===')
  console.log('Method:', req.method)
  console.log('Path:', pathname)
  console.log('Environment check:', {
    hasClientId: !!CLIENT_ID,
    hasClientSecret: !!CLIENT_SECRET,
    hasSupabaseUrl: !!SUPABASE_URL,
    hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY
  })

  // Test endpoint for debugging database issues
  if (pathname.includes("/test-db")) {
    try {
      const testWorkspaceId = 'test-workspace-' + Date.now()
      console.log('Testing database insertion with workspace:', testWorkspaceId)
      
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      
      // Test workspace creation
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          id: testWorkspaceId,
          name: 'Test Workspace',
          slug: `test-${testWorkspaceId.slice(0, 8)}`,
          owner_id: null
        })
        .select('id')
        .single()
      
      console.log('Workspace test result:', { data: workspaceData, error: workspaceError })
      
      if (workspaceError) {
        return new Response(JSON.stringify({ 
          error: 'Workspace creation failed', 
          details: workspaceError 
        }), { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      // Test youtube_accounts insertion
      const { data: youtubeData, error: youtubeError } = await supabase
        .from('youtube_accounts')
        .insert({
          workspace_id: testWorkspaceId,
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          channel_id: 'test-channel',
          updated_at: new Date().toISOString()
        })
        .select('id, workspace_id, channel_id')
        .single()
      
      console.log('YouTube accounts test result:', { data: youtubeData, error: youtubeError })
      
      return new Response(JSON.stringify({ 
        success: true,
        workspace: workspaceData,
        youtubeAccount: youtubeData,
        errors: {
          workspace: workspaceError,
          youtube: youtubeError
        }
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    } catch (error) {
      console.error('Test DB error:', error)
      return new Response(JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }
  if (pathname.includes("/health")) {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: {
        hasClientId: !!CLIENT_ID,
        hasClientSecret: !!CLIENT_SECRET,
        hasSupabaseUrl: !!SUPABASE_URL,
        hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY
      }
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

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

    // Try to check if workspace exists first
    try {
      const { data: existingWorkspace, error: checkError } = await supabase
        .from('workspaces')
        .select('id, name, owner_id')
        .eq('id', workspaceId)
        .single()

      console.log('Existing workspace check:', { data: existingWorkspace, error: checkError })

      if (existingWorkspace && !checkError) {
        console.log('Workspace already exists:', existingWorkspace)
      } else {
        // Create workspace without owner_id since we don't have user info in OAuth flow
        console.log('Creating new workspace for YouTube integration...')
        
        const { data: newWorkspace, error: createError } = await supabase
          .from('workspaces')
          .insert({
            id: workspaceId,
            name: 'YouTube Integration Workspace',
            slug: `yt-${workspaceId.slice(0, 8)}`,
            // Skip owner_id for now - it will be set when user properly authenticates
          })
          .select('id, name, owner_id')
          .single()

        console.log('New workspace creation result:', { data: newWorkspace, error: createError })

        if (createError) {
          console.error('Failed to create workspace:', createError)
          // Don't fail the OAuth flow if workspace creation fails
          console.log('Continuing with OAuth flow despite workspace creation issue...')
        } else {
          console.log('Workspace created successfully:', newWorkspace)
        }
      }
    } catch (workspaceError) {
      console.error('Workspace check/create error:', workspaceError)
      // Don't fail the OAuth flow
      console.log('Continuing with OAuth flow despite workspace issue...')
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
        console.log('Storing YouTube tokens in database...')
        const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        let channelId: string | null = null
        try {
          // Get channel ID from YouTube
          const chRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=id&mine=true', {
            headers: { Authorization: `Bearer ${String(tokens.access_token || '')}` },
          })
          if (chRes.ok) {
            const chData = await chRes.json()
            channelId = chData.items?.[0]?.id || null
            console.log('Fetched YouTube channel ID:', channelId)
          }
        } catch (channelError) {
          console.warn('Failed to fetch channel ID:', channelError)
        }

        // Store tokens in database
        const { data: insertData, error: insertError } = await sb
          .from('youtube_accounts')
          .upsert({
            workspace_id: workspaceId,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || null,
            token_expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
            channel_id: channelId,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'workspace_id'
          })
          .select('id, workspace_id, channel_id, updated_at')
          .single()

        console.log('Database insert result:', { data: insertData, error: insertError })

        if (insertError) {
          console.error('Failed to store YouTube tokens:', insertError)
          return new Response(`Failed to store YouTube tokens: ${insertError.message}`, { status: 500 })
        }

        if (!insertData) {
          console.error('No data returned from database insert')
          return new Response('Failed to store YouTube tokens: No data returned', { status: 500 })
        }

        console.log('YouTube tokens stored successfully:', insertData)
      }

      // TODO: Store tokens in Supabase securely (youtube_accounts table)
      const target = returnUrl || 'https://engage-hub-ten.vercel.app'
      const redir = new URL(target)
      redir.searchParams.set('youtube_oauth', 'success')
      return new Response(null, { status: 302, headers: { Location: redir.toString() } })
    } catch (error) {
      console.error('=== YouTube OAuth Error ===')
      console.error('Error:', error)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      return new Response(JSON.stringify({ 
        error: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString()
      }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }
  }

  return new Response("YouTube OAuth Handler - Use /start to begin", { status: 200 })
})