import React, { useState, useEffect } from 'react'
import { Youtube, LogOut, CheckCircle2 } from 'lucide-react'
import { checkYouTubeConnectionStatus, disconnectYouTubeAccount } from '../src/utils/youtube-client'

interface YouTubeContextualConnectProps {
  onConnect?: () => void
  onSkip?: () => void
  context: 'analytics' | 'create-post' | 'general'
  compact?: boolean
  showSkip?: boolean
}

const YouTubeContextualConnect: React.FC<YouTubeContextualConnectProps> = ({
  context,
  compact = false,
}: YouTubeContextualConnectProps) => {
  const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9'
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)

  const checkConnection = async () => {
    if (!workspaceId) return
    try {
      const status = await checkYouTubeConnectionStatus(workspaceId)
      if (status && typeof status.connected === 'boolean') {
        setIsConnected(status.connected)
        localStorage.setItem(`youtube-connected-${workspaceId}`, status.connected.toString())
      }
    } catch (error) {
      console.error('Error checking YouTube connection:', error)
      const cached = localStorage.getItem(`youtube-connected-${workspaceId}`)
      setIsConnected(cached === 'true')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (workspaceId) {
      const cached = localStorage.getItem(`youtube-connected-${workspaceId}`)
      if (cached !== null) {
        setIsConnected(cached === 'true')
        setLoading(false)
      }
      checkConnection()
    }
  }, [workspaceId])

  const handleConnect = () => {
    if (!workspaceId) return
    const returnUrl = window.location.href
    const oauthUrl = `https://zourlqrkoyugzymxkbgn.functions.supabase.co/youtube-oauth/start?workspace_id=${workspaceId}&return_url=${encodeURIComponent(returnUrl)}`
    window.location.href = oauthUrl
  }

  const handleDisconnect = async () => {
    if (!workspaceId || disconnecting) return
    try {
      setDisconnecting(true)
      await disconnectYouTubeAccount(workspaceId)
      setIsConnected(false)
      localStorage.removeItem(`youtube-connected-${workspaceId}`)
      // Force refresh on parent if possible, but at least update local state
      window.dispatchEvent(new Event('youtubeDisconnected'))
    } catch (error) {
      console.error('Error disconnecting YouTube:', error)
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) return null

  if (isConnected) {
    if (compact) {
      return (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-green-100 shadow-sm w-fit">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Disconnect YouTube"
          >
            <LogOut size={16} />
          </button>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-100 text-sm font-bold">
          <CheckCircle2 size={16} />
          YouTube Linked
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="text-xs text-gray-400 hover:text-red-600 font-medium"
        >
          {disconnecting ? 'Disconnecting...' : 'Disconnect account'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-1.5 text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 px-5 py-2.5 rounded-xl uppercase tracking-wider shadow-lg shadow-blue-200/50 transition-all ml-auto"
    >
      CONNECT
    </button>
  )
}

export default YouTubeContextualConnect
