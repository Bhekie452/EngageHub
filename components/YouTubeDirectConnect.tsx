import React, { useState, useEffect } from 'react'
import { Youtube, CheckCircle2, LogOut } from 'lucide-react'

const YouTubeDirectConnect: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check connection on mount
  useEffect(() => {
    const connected = sessionStorage.getItem('youtube-connected') === 'true'
    setIsConnected(connected)
  }, [])

  const handleConnect = () => {
    setLoading(true)
    console.log('Starting YouTube OAuth...')
    
    const WORKSPACE_ID = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9'
    const returnUrl = window.location.href
    const oauthUrl = `https://zourlqrkoyugzymxkbgn.functions.supabase.co/youtube-oauth/start?workspace_id=${WORKSPACE_ID}&return_url=${encodeURIComponent(returnUrl)}`
    
    // Save connection state before redirect
    sessionStorage.setItem('youtube-connected', 'true')
    setIsConnected(true)
    
    console.log('OAuth URL:', oauthUrl)
    window.location.href = oauthUrl
  }

  const handleDisconnect = () => {
    sessionStorage.removeItem('youtube-connected')
    setIsConnected(false)
    console.log('YouTube disconnected')
  }

  const handleForceConnect = () => {
    sessionStorage.setItem('youtube-connected', 'true')
    setIsConnected(true)
    console.log('Force connected YouTube')
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        Connecting...
      </div>
    )
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">
          <Youtube className="w-3 h-3" />
          <span className="text-xs font-medium">Connected</span>
          <CheckCircle2 className="w-3 h-3" />
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-red-600 hover:text-red-700 underline"
          title="Disconnect YouTube"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        onClick={handleConnect}
      >
        <Youtube className="w-3 h-3" />
        <span>Connect YouTube</span>
      </button>
      <button
        className="text-xs text-green-600 underline"
        onClick={handleForceConnect}
      >
        Force Connect
      </button>
    </div>
  )
}

export default YouTubeDirectConnect
