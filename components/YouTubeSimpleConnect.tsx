import React, { useState, useEffect } from 'react'
import { Youtube, CheckCircle2, LogOut } from 'lucide-react'
import { useWorkspace } from '../src/hooks/useWorkspace'
import { useYouTubeSession } from '../src/hooks/useYouTubeSession'

const YouTubeSimpleConnect: React.FC = () => {
  const { workspaceId } = useWorkspace()
  const FALLBACK_WORKSPACE_ID = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9'
  const currentWorkspaceId = workspaceId || FALLBACK_WORKSPACE_ID
  const { isConnected, connect, disconnect, forceConnect } = useYouTubeSession()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if already connected
    if (currentWorkspaceId) {
      // logic handled by useYouTubeSession now, but we can keep local checks if needed
      // or just rely on the hook.
      // The hook handles listening to storage changes.
    }
  }, [currentWorkspaceId])

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const youtubeOAuth = urlParams.get('youtube_oauth')

    if (youtubeOAuth === 'success') {
      console.log('YouTube OAuth successful - updating connection state')
      // Set connection state
      if (currentWorkspaceId) {
        localStorage.setItem(`youtube-connected-${currentWorkspaceId}`, 'true')
        // Force update the hook's state via storage event dispatch if needed, 
        // but the hook listens to storage events.
        // We might need to manually trigger it if it's in the same window.
        window.dispatchEvent(new StorageEvent('storage', {
          key: `youtube-connected-${currentWorkspaceId}`,
          newValue: 'true'
        }))
      }
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname)
      // Show success message
      alert('YouTube account connected successfully!')
    } else if (youtubeOAuth === 'error') {
      alert('Failed to connect YouTube account. Please try again.')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [currentWorkspaceId])

  const handleConnect = () => {
    if (!currentWorkspaceId) {
      console.error('No workspace ID available')
      alert('Workspace not available. Please refresh the page.')
      return
    }

    console.log('Starting YouTube OAuth with workspaceId:', currentWorkspaceId)
    connect(currentWorkspaceId)
  }

  const handleDisconnect = () => {
    disconnect()
    if (currentWorkspaceId) {
      localStorage.removeItem(`youtube-connected-${currentWorkspaceId}`)
      window.dispatchEvent(new StorageEvent('storage', {
        key: `youtube-connected-${currentWorkspaceId}`,
        newValue: null
      }))
    }
    console.log('YouTube disconnected')
  }

  const handleForceConnect = () => {
    forceConnect()
    if (currentWorkspaceId) {
      localStorage.setItem(`youtube-connected-${currentWorkspaceId}`, 'true')
      window.dispatchEvent(new StorageEvent('storage', {
        key: `youtube-connected-${currentWorkspaceId}`,
        newValue: 'true'
      }))
    }
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
