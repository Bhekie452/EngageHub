import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://zourlqrkoyugzymxkbgn.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXJxcXJrb3l1Z3p5bXhrYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0ODE1MDAsImV4cCI6MjA1MjA1NzUwMH0.YMIWzqzG_hxI_3xuJcIqKQfZdYVQh6R9cLgZdYVQh6R'
)

// Client-side function to call YouTube API via Supabase Edge Function
export async function callYouTubeAPI(endpoint: string, workspaceId: string, options?: Record<string, any>) {
  try {
    const { data, error } = await supabase.functions.invoke('youtube-api', {
      body: { 
        endpoint, 
        workspaceId, 
        ...options 
      }
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('YouTube API call failed:', error)
    throw error
  }
}

// Fetch YouTube videos
export async function fetchYouTubeVideosClient(workspaceId: string, maxResults: number = 10) {
  return callYouTubeAPI('videos', workspaceId, { maxResults })
}

// Fetch YouTube channel info
export async function fetchYouTubeChannelClient(workspaceId: string) {
  return callYouTubeAPI('channel', workspaceId)
}

// Post a comment
export async function postYouTubeCommentClient(workspaceId: string, videoId: string, commentText: string) {
  return callYouTubeAPI('comment', workspaceId, { videoId, commentText })
}

// Get video details
export async function getYouTubeVideoDetailsClient(workspaceId: string, videoId: string) {
  return callYouTubeAPI('video-details', workspaceId, { videoId })
}

// Get video comments
export async function getYouTubeVideoCommentsClient(workspaceId: string, videoId: string, maxResults: number = 20) {
  return callYouTubeAPI('video-comments', workspaceId, { videoId, maxResults })
}

// Like a video
export async function likeYouTubeVideoClient(workspaceId: string, videoId: string) {
  return callYouTubeAPI('like-video', workspaceId, { videoId })
}

// Unlike a video
export async function unlikeYouTubeVideoClient(workspaceId: string, videoId: string) {
  return callYouTubeAPI('unlike-video', workspaceId, { videoId })
}

// Subscribe to a channel
export async function subscribeToChannelClient(workspaceId: string, channelId: string) {
  return callYouTubeAPI('subscribe', workspaceId, { channelId })
}

// Check YouTube connection status
export async function checkYouTubeConnectionStatus(workspaceId: string) {
  try {
    const { data, error } = await supabase
      .from('youtube_accounts')
      .select('id, channel_id, updated_at')
      .eq('workspace_id', workspaceId)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found error is ok
      throw error
    }

    return {
      connected: !!data,
      channelInfo: data
    }
  } catch (error) {
    console.error('Error checking YouTube connection:', error)
    return {
      connected: false,
      channelInfo: null
    }
  }
}

// Disconnect YouTube account
export async function disconnectYouTubeAccount(workspaceId: string) {
  try {
    const { error } = await supabase
      .from('youtube_accounts')
      .delete()
      .eq('workspace_id', workspaceId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error disconnecting YouTube:', error)
    throw error
  }
}
