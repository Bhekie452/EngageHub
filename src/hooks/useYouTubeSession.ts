import { useState, useEffect } from 'react'

export function useYouTubeSession() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check sessionStorage and localStorage on mount
    const sessionConnected = sessionStorage.getItem('youtube-connected') === 'true'
    // Also detect workspace-specific localStorage keys like `youtube-connected-<workspaceId>`
    let localConnected = false
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('youtube-connected-')) {
          if (localStorage.getItem(key) === 'true') {
            localConnected = true
            break
          }
        }
      }
    } catch (e) {
      // ignore (some environments may block localStorage access)
    }

    setIsConnected(sessionConnected || localConnected)

    // Listen for storage events so other tabs/components can update state
    const handler = (ev: StorageEvent) => {
      if (!ev.key) return
      if (ev.key === 'youtube-connected' || ev.key.startsWith('youtube-connected-')) {
        const val = ev.newValue === 'true'
        setIsConnected(val)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
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
    // Also clear workspace-specific localStorage flags
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('youtube-connected-')) {
          localStorage.removeItem(key)
        }
      }
    } catch (e) {
      // ignore
    }
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
