import { useState, useEffect } from 'react'

const WORKSPACE_ID = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9'
const STORAGE_KEY = `youtube-connected-${WORKSPACE_ID}`

export function useYouTubeConnectionSimple() {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage on mount
    const cachedState = localStorage.getItem(STORAGE_KEY)
    setIsConnected(cachedState === 'true')
    setLoading(false)
  }, [])

  const connect = () => {
    const returnUrl = window.location.href
    const oauthUrl = `https://zourlqrkoyugzymxkbgn.functions.supabase.co/youtube-oauth/start?workspace_id=${WORKSPACE_ID}&return_url=${encodeURIComponent(returnUrl)}`
    window.location.href = oauthUrl
  }

  const disconnect = () => {
    setIsConnected(false)
    localStorage.removeItem(STORAGE_KEY)
  }

  const forceConnect = () => {
    setIsConnected(true)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  return {
    isConnected,
    loading,
    connect,
    disconnect,
    forceConnect
  }
}
