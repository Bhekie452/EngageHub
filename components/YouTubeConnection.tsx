import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || 'https://zourlqrkoyugzymxkbgn.supabase.co',
  process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXJxcXJrb3l1Z3p5bXhrYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0ODE1MDAsImV4cCI6MjA1MjA1NzUwMH0.YMIWzqzG_hxI_3xuJcIqKQfZdYVQh6R9cLgZdYVQh6R'
)

interface YouTubeConnectionProps {
  workspaceId: string
}

export function YouTubeConnectionStatus({ workspaceId }: YouTubeConnectionProps) {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [channelInfo, setChannelInfo] = useState<any>(null)

  useEffect(() => {
    checkConnection()
  }, [workspaceId])

  const checkConnection = async () => {
    const { data, error } = await supabase
      .from('youtube_accounts')
      .select('id, channel_id, updated_at')
      .eq('workspace_id', workspaceId)
      .single()

    if (data) {
      setConnected(true)
      setChannelInfo(data)
    }
    setLoading(false)
  }

  const handleConnectYouTube = () => {
    const returnUrl = window.location.href
    const oauthUrl = `https://zourlqrkoyugzymxkbgn.functions.supabase.co/youtube-oauth/start?workspaceId=${workspaceId}&returnUrl=${encodeURIComponent(returnUrl)}` 
    window.location.href = oauthUrl
  }

  async function handleDisconnect() {
    const { error } = await supabase
      .from('youtube_accounts')
      .delete()
      .eq('workspace_id', workspaceId)

    if (!error) {
      setConnected(false)
      setChannelInfo(null)
      alert('YouTube account disconnected')
    }
  }

  if (loading) return (
    <div className="flex items-center gap-2">
      <RefreshCw className="w-4 h-4 animate-spin" />
      <span className="text-sm text-gray-500">Loading...</span>
    </div>
  )

  return (
    <div className="flex items-center justify-between">
      {connected ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">YouTube Connected</span>
          </div>
          {channelInfo?.channel_id && (
            <span className="text-xs text-gray-500">
              Channel ID: {channelInfo.channel_id}
            </span>
          )}
          <button 
            onClick={handleDisconnect}
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button 
          onClick={handleConnectYouTube}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all"
        >
          <ExternalLink className="w-3 h-3" />
          Connect YouTube
        </button>
      )}
    </div>
  )
}

// Hook to handle OAuth callback
export function useYouTubeOAuthCallback() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const youtubeOAuth = urlParams.get('youtube_oauth')
    
    if (youtubeOAuth === 'success') {
      // Show success message
      alert('YouTube account connected successfully!')
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // You could also trigger a refresh or update state here
      window.location.reload()
    } else if (youtubeOAuth === 'error') {
      alert('Failed to connect YouTube account. Please try again.')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])
}
