import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zourlqrkoyugzymxkbgn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
)

// Server-side function to get YouTube client access token
export async function getYouTubeClient(workspaceId: string) {
  const { data, error } = await supabase
    .from('youtube_accounts')
    .select('access_token, refresh_token, token_expires_at')
    .eq('workspace_id', workspaceId)
    .single()

  if (error || !data) {
    throw new Error('YouTube account not connected')
  }

  // Check if token is expired and refresh if needed
  const isExpired = new Date(data.token_expires_at) < new Date()
  
  if (isExpired && data.refresh_token) {
    // Refresh the token
    const newTokens = await refreshYouTubeToken(data.refresh_token)
    
    // Update in database
    await supabase
      .from('youtube_accounts')
      .update({
        access_token: newTokens.access_token,
        token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
      })
      .eq('workspace_id', workspaceId)
    
    return newTokens.access_token
  }

  return data.access_token
}

// Refresh YouTube access token
async function refreshYouTubeToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YT_CLIENT_ID!,
      client_secret: process.env.YT_CLIENT_SECRET!,
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

// Fetch user's YouTube videos
export async function fetchYouTubeVideos(workspaceId: string, maxResults: number = 10) {
  const accessToken = await getYouTubeClient(workspaceId)
  
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=${maxResults}`,
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

// Fetch user's YouTube channel info
export async function fetchYouTubeChannel(workspaceId: string) {
  const accessToken = await getYouTubeClient(workspaceId)
  
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

// Post a comment on a YouTube video
export async function postYouTubeComment(
  workspaceId: string, 
  videoId: string, 
  commentText: string
) {
  const accessToken = await getYouTubeClient(workspaceId)
  
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
            snippet: {
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
  
  return await response.json()
}

// Get video details
export async function getYouTubeVideoDetails(workspaceId: string, videoId: string) {
  const accessToken = await getYouTubeClient(workspaceId)
  
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
export async function getYouTubeVideoComments(workspaceId: string, videoId: string, maxResults: number = 20) {
  const accessToken = await getYouTubeClient(workspaceId)
  
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

// Like a video
export async function likeYouTubeVideo(workspaceId: string, videoId: string) {
  const accessToken = await getYouTubeClient(workspaceId)
  
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

// Unlike a video
export async function unlikeYouTubeVideo(workspaceId: string, videoId: string) {
  const accessToken = await getYouTubeClient(workspaceId)
  
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

// Subscribe to a channel
export async function subscribeToChannel(workspaceId: string, channelId: string) {
  const accessToken = await getYouTubeClient(workspaceId)
  
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
    throw new Error(`Failed to subscribe to channel: ${response.statusText}`)
  }
  
  return await response.json()
}
