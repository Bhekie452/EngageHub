import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Updated for redeploy
console.log('YouTube API function updated with new credentials');

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

    // Fetch YouTube account from database
    const { data: youtubeAccount, error: fetchError } = await supabase
      .from('youtube_accounts')
      .select('access_token, refresh_token, expires_at, channel_id')
      .eq('workspace_id', workspaceId)
      .single();

    if (fetchError || !youtubeAccount) {
      return new Response(
        JSON.stringify({ 
          error: 'YouTube account not found. Please connect your YouTube account first.',
          details: fetchError 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    let accessToken = youtubeAccount.access_token

    // Check if token is expired and refresh if needed
    const now = new Date()
    const expiresAt = new Date(youtubeAccount.expires_at)
    
    if (now >= expiresAt) {
      console.log('Token expired, refreshing...')
      try {
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: Deno.env.get('YT_CLIENT_ID')!,
            client_secret: Deno.env.get('YT_CLIENT_SECRET')!,
            refresh_token: youtubeAccount.refresh_token!,
            grant_type: 'refresh_token'
          })
        })

        if (!refreshResponse.ok) {
          throw new Error('Failed to refresh token')
        }

        const tokens = await refreshResponse.json()
        
        // Update database with new token
        const { error: updateError } = await supabase
          .from('youtube_accounts')
          .update({
            access_token: tokens.access_token,
            expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          })
          .eq('workspace_id', workspaceId)

        if (updateError) {
          console.error('Failed to update token:', updateError)
        }

        accessToken = tokens.access_token
        console.log('Token refreshed successfully')
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to refresh YouTube token. Please reconnect your account.',
            details: refreshError.message 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
    }

    // Handle different endpoints
    let result
    switch (endpoint) {
      case 'debug-check':
        // Debug: Check all YouTube accounts in database
        const { data: allAccounts, error: allError } = await supabase
          .from('youtube_accounts')
          .select('workspace_id, created_at')
          .limit(10);
        
        return new Response(
          JSON.stringify({ 
            message: 'Debug check',
            workspaceId: workspaceId,
            allAccounts: allAccounts,
            error: allError 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      case 'upload-video':
        result = await uploadVideo(accessToken, options)
        if (result && result.url && options.postId) {
             const { error: linkErr } = await supabase.from('posts').update({ link_url: result.url }).eq('id', options.postId);
             if (linkErr) console.error('Failed to save link_url:', linkErr);
             else console.log('Saved link_url for post:', options.postId);
        }
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
        
        // Update database if we have a valid result and postId
        if (result && options.postId) {
          try {
            // Find the social account ID for this workspace and YouTube
            const { data: socialAccount } = await supabase
              .from('social_accounts')
              .select('id')
              .eq('workspace_id', workspaceId)
              .eq('platform', 'youtube')
              .limit(1)
              .single();

            if (socialAccount) {
               const stats = result.statistics || {};
               await supabase.from('post_analytics').upsert({
                 post_id: options.postId,
                 social_account_id: socialAccount.id,
                 platform: 'youtube',
                 likes: Number(stats.likeCount) || 0,
                 comments: Number(stats.commentCount) || 0,
                 views: Number(stats.viewCount) || 0,
                 video_views: Number(stats.viewCount) || 0,
                 updated_at: new Date().toISOString()
               }, { onConflict: 'post_id, social_account_id' });
               console.log('Synced YouTube stats to database for post:', options.postId);
            }
          } catch (syncErr) {
            console.error('Failed to sync stats to DB:', syncErr);
            // Don't fail the request if sync fails
          }
        }
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
      case 'subscriber-list':
        result = await fetchSubscribers(accessToken, options.maxResults || 50)
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
      throw new Error(`Failed to initiate upload: ${initResponse.statusText}`)
    }

    const uploadUrl = initResponse.headers.get('Location')
    if (!uploadUrl) {
      throw new Error('No upload URL received')
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
      throw new Error(`Upload failed: ${uploadResponse.statusText}`)
    }

    const uploadResult = await uploadResponse.json()
    
    return {
      videoId: uploadResult.id,
      url: `https://www.youtube.com/watch?v=${uploadResult.id}`,
      status: uploadResult.status?.privacyStatus || 'private'
    }

  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

// Fetch videos from YouTube channel
async function fetchVideos(accessToken: string, maxResults: number = 10) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&type=video&order=date&mine=true`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch videos: ${response.statusText}`)
  }

  const data = await response.json()
  return data.items || []
}

// Fetch channel details
async function fetchChannel(accessToken: string) {
  const response = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch channel: ${response.statusText}`)
  }

  const data = await response.json()
  return data.items?.[0] || null
}

// Get video details
async function getVideoDetails(accessToken: string, videoId: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get video details: ${response.statusText}`)
  }

  const data = await response.json()
  return data.items?.[0] || null
}

// Get video comments
async function getVideoComments(accessToken: string, videoId: string, maxResults: number = 20) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=${maxResults}&order=relevance`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get video comments: ${response.statusText}`)
  }

  const data = await response.json()
  return data.items || []
}

// Post comment to video
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
          topLevelComment: {
            snippet: {
              videoId: videoId,
              textOriginal: commentText
            }
          }
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to post comment: ${response.statusText}`)
  }

  const data = await response.json()
  return data.snippet || null
}

// Like video
async function likeVideo(accessToken: string, videoId: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=like`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to like video: ${response.statusText}`)
  }

  return { success: true }
}

// Unlike video
async function unlikeVideo(accessToken: string, videoId: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=none`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to unlike video: ${response.statusText}`)
  }

  return { success: true }
}

// Subscribe to channel
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

  if (!response.ok) {
    throw new Error(`Failed to subscribe: ${response.statusText}`)
  }

  const data = await response.json()
  return data.snippet || null
}

// Fetch subscribers
async function fetchSubscribers(accessToken: string, maxResults: number = 50) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=${maxResults}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch subscribers: ${response.statusText}`)
  }

  const data = await response.json()
  return data.items || []
}
