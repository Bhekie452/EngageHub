import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { endpoint, workspaceId, ...options } = await req.json()

    if (!workspaceId) {
      return new Response(
        JSON.stringify({ error: 'workspaceId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get YouTube tokens for the workspace
    const { data: youtubeAccount, error: tokenError } = await supabase
      .from('youtube_accounts')
      .select('access_token, refresh_token, token_expires_at')
      .eq('workspace_id', workspaceId)
      .single()

    if (tokenError || !youtubeAccount) {
      return new Response(
        JSON.stringify({ error: 'YouTube account not connected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if token needs refresh
    let accessToken = youtubeAccount.access_token
    const isExpired = new Date(youtubeAccount.token_expires_at) < new Date()
    
    if (isExpired && youtubeAccount.refresh_token) {
      // Refresh the token
      const newTokens = await refreshYouTubeToken(youtubeAccount.refresh_token)
      
      // Update in database
      await supabase
        .from('youtube_accounts')
        .update({
          access_token: newTokens.access_token,
          token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
        })
        .eq('workspace_id', workspaceId)
      
      accessToken = newTokens.access_token
    }

    // Handle different endpoints
    let result
    switch (endpoint) {
      case 'upload-video':
        result = await uploadVideo(accessToken, options)
        break
      case 'videos':
        result = await fetchVideos(accessToken, options.maxResults || 10)
        break
      case 'channel':
        result = await fetchChannel(accessToken)
        break
      case 'comment':
        result = await postComment(accessToken, options.videoId, options.commentText)
        break
      case 'video-details':
        result = await getVideoDetails(accessToken, options.videoId)
        break
      case 'video-comments':
        result = await getVideoComments(accessToken, options.videoId, options.maxResults || 20)
        break
      case 'like-video':
        result = await likeVideo(accessToken, options.videoId)
        break
      case 'unlike-video':
        result = await unlikeVideo(accessToken, options.videoId)
        break
      case 'subscribe':
        result = await subscribeToChannel(accessToken, options.channelId)
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid endpoint' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('YouTube API error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Refresh YouTube access token
async function refreshYouTubeToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('YT_CLIENT_ID')!,
      client_secret: Deno.env.get('YT_CLIENT_SECRET')!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  })
  
  const tokens = await response.json()
  
  if (!response.ok || tokens.error) {
    throw new Error(`Token refresh failed: ${tokens.error || 'Unknown error'}`)
  }
  
  return tokens
}

// Upload video to YouTube
async function uploadVideo(accessToken: string, options: any) {
  const { title, description, mediaUrl, tags = [], privacyStatus = 'private' } = options
  
  try {
    // Step 1: Download the video from mediaUrl
    console.log('Downloading video from:', mediaUrl)
    const videoResponse = await fetch(mediaUrl)
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`)
    }
    
    const videoData = await videoResponse.arrayBuffer()
    const videoBlob = new Blob([videoData])
    
    // Step 2: Upload to YouTube using resumable upload
    console.log('Starting YouTube upload...')
    
    // First, initiate the resumable upload
    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': videoBlob.size.toString(),
          'X-Upload-Content-Type': 'video/*'
        },
        body: JSON.stringify({
          snippet: {
            title: title || 'Uploaded from EngageHub',
            description: description || 'Video uploaded via EngageHub platform',
            tags: tags
          },
          status: {
            privacyStatus: privacyStatus
          }
        })
      }
    )
    
    if (!initResponse.ok) {
      const errorData = await initResponse.json()
      throw new Error(`Failed to initiate upload: ${errorData.error?.message || initResponse.statusText}`)
    }
    
    const uploadUrl = initResponse.headers.get('Location')
    if (!uploadUrl) {
      throw new Error('No upload URL received from YouTube')
    }
    
    // Step 3: Upload the actual video data
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/*',
        'Content-Length': videoBlob.size.toString()
      },
      body: videoBlob
    })
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json()
      throw new Error(`Failed to upload video: ${errorData.error?.message || uploadResponse.statusText}`)
    }
    
    const data = await uploadResponse.json()
    
    console.log('YouTube upload successful:', data)
    
    return {
      success: true,
      videoId: data.id,
      url: `https://youtube.com/watch?v=${data.id}`
    }
  } catch (error) {
    console.error('YouTube upload error:', error)
    throw error
  }
}

// API Functions
async function fetchVideos(accessToken: string, maxResults: number) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=${maxResults}`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  )
  
  if (!response.ok) throw new Error(`Failed to fetch videos: ${response.statusText}`)
  const data = await response.json()
  return data.items || []
}

async function fetchChannel(accessToken: string) {
  const response = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  )
  
  if (!response.ok) throw new Error(`Failed to fetch channel: ${response.statusText}`)
  const data = await response.json()
  return data.items?.[0] || null
}

async function postComment(accessToken: string, videoId: string, commentText: string) {
  const response = await fetch(
    'https://www.googleapis.com/youtube/v3/commentThreads?part=snippet',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        snippet: {
          videoId: videoId,
          topLevelComment: {
            snippet: { textOriginal: commentText }
          }
        }
      })
    }
  )
  
  if (!response.ok) throw new Error(`Failed to post comment: ${response.statusText}`)
  return await response.json()
}

async function getVideoDetails(accessToken: string, videoId: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  )
  
  if (!response.ok) throw new Error(`Failed to get video details: ${response.statusText}`)
  const data = await response.json()
  return data.items?.[0] || null
}

async function getVideoComments(accessToken: string, videoId: string, maxResults: number) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=${maxResults}&order=relevance`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  )
  
  if (!response.ok) throw new Error(`Failed to get video comments: ${response.statusText}`)
  const data = await response.json()
  return data.items || []
}

async function likeVideo(accessToken: string, videoId: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=like`,
    { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` } }
  )
  
  if (!response.ok) throw new Error(`Failed to like video: ${response.statusText}`)
  return { success: true }
}

async function unlikeVideo(accessToken: string, videoId: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=none`,
    { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` } }
  )
  
  if (!response.ok) throw new Error(`Failed to unlike video: ${response.statusText}`)
  return { success: true }
}

async function subscribeToChannel(accessToken: string, channelId: string) {
  const response = await fetch(
    'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        snippet: {
          resourceId: {
            kind: 'youtube#channel',
            channelId: channelId
          }
        }
      })
    }
  )
  
  if (!response.ok) throw new Error(`Failed to subscribe to channel: ${response.statusText}`)
  return await response.json()
}
