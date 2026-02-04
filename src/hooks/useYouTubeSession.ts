import { useState, useEffect } from 'react'

export function useYouTubeSession() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check sessionStorage on mount
    const connected = sessionStorage.getItem('youtube-connected') === 'true'
    setIsConnected(connected)
  }, [])

  const connect = () => {
    const WORKSPACE_ID = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9'
    const returnUrl = window.location.href
    const oauthUrl = `https://zourlqrkoyugzymxkbgn.functions.supabase.co/youtube-oauth/start?workspace_id=${WORKSPACE_ID}&return_url=${encodeURIComponent(returnUrl)}`
    
    // Set connected state immediately
    sessionStorage.setItem('youtube-connected', 'true')
    setIsConnected(true)
    
    window.location.href = oauthUrl
  }

  const disconnect = () => {
    sessionStorage.removeItem('youtube-connected')
    setIsConnected(false)
  }

  const forceConnect = () => {
    sessionStorage.setItem('youtube-connected', 'true')
    setIsConnected(true)
  }

  return {
    isConnected,
    connect,
    disconnect,
    forceConnect
  }
}
