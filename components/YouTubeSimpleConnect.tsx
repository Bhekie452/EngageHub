import React, { useState, useEffect } from 'react'
import { Youtube, CheckCircle2, LogOut } from 'lucide-react'

const YouTubeSimpleConnect: React.FC = () => {
  const WORKSPACE_ID = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9'
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if already connected
    const cachedState = localStorage.getItem(`youtube-connected-${WORKSPACE_ID}`)
    if (cachedState === 'true') {
      setIsConnected(true)
    }
  }, [])

  const handleConnect = () => {
    console.log('Starting YouTube OAuth with workspaceId:', WORKSPACE_ID)
    
    const returnUrl = window.location.href
    const oauthUrl = `https://zourlqrkoyugzymxkbgn.functions.supabase.co/youtube-oauth/start?workspace_id=${WORKSPACE_ID}&return_url=${encodeURIComponent(returnUrl)}`
    
    console.log('OAuth URL:', oauthUrl)
    window.location.href = oauthUrl
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    localStorage.removeItem(`youtube-connected-${WORKSPACE_ID}`)
    console.log('YouTube disconnected')
  }

  const handleForceConnect = () => {
    setIsConnected(true)
    localStorage.setItem(`youtube-connected-${WORKSPACE_ID}`, 'true')
    console.log('Force connected YouTube')
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          title="YouTube Connected"
        >
          <Youtube className="w-4 h-4" />
          <span>Connected</span>
          <CheckCircle2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
          title="Disconnect YouTube account"
        >
          <LogOut className="w-3 h-3" />
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        onClick={handleConnect}
      >
        <Youtube className="w-4 h-4" />
        <span>Connect to YouTube</span>
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

export default YouTubeSimpleConnect
