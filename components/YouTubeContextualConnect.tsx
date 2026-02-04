import React, { useState, useEffect } from 'react'
import { Youtube, ExternalLink, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { checkYouTubeConnectionStatus } from '../src/utils/youtube-client'
import { useWorkspace } from '../src/hooks/useWorkspace'

interface YouTubeContextualConnectProps {
  onConnect?: () => void
  onSkip?: () => void
  context: 'analytics' | 'create-post' | 'general'
  compact?: boolean
  showSkip?: boolean
}

export function YouTubeContextualConnect({ 
  onConnect, 
  onSkip,
  context,
  compact = false,
  showSkip = true 
}: YouTubeContextualConnectProps) {
  const { workspaceId, loading: workspaceLoading } = useWorkspace()
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (workspaceId) {
      checkConnection()
    }
  }, [workspaceId])

  const checkConnection = async () => {
    if (!workspaceId) return
    
    try {
      const status = await checkYouTubeConnectionStatus(workspaceId)
      setIsConnected(status.connected)
      
      // Show prompt if not connected and this is the first check
      if (!status.connected && !compact) {
        setShowPrompt(true)
      }
    } catch (error) {
      console.error('Error checking YouTube connection:', error)
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = () => {
    if (!workspaceId) {
      alert('Workspace not available. Please try again.')
      return
    }
    
    console.log('Starting YouTube OAuth with workspaceId:', workspaceId)
    console.log('User ID:', workspaceId)
    
    const returnUrl = window.location.href
    const oauthUrl = `https://zourlqrkoyugzymxkbgn.functions.supabase.co/youtube-oauth/start?workspaceId=${workspaceId}&returnUrl=${encodeURIComponent(returnUrl)}`
    
    console.log('OAuth URL:', oauthUrl)
    
    window.location.href = oauthUrl
    onConnect?.()
  }

  const getContextMessage = () => {
    switch (context) {
      case 'analytics':
        return {
          title: 'Connect YouTube for Analytics',
          description: 'View your YouTube channel performance, video insights, and engagement metrics.',
          action: 'Connect to View Analytics'
        }
      case 'create-post':
        return {
          title: 'Connect YouTube to Post Content',
          description: 'Schedule and publish videos directly to your YouTube channel.',
          action: 'Connect to Post Videos'
        }
      default:
        return {
          title: 'Connect YouTube Account',
          description: 'Access YouTube features and manage your channel content.',
          action: 'Connect YouTube'
        }
    }
  }

  if (workspaceLoading || loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        Checking YouTube connection...
      </div>
    )
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="w-4 h-4" />
        <span>YouTube Connected</span>
      </div>
    )
  }

  const message = getContextMessage()

  if (compact) {
    return (
      <button
        onClick={handleConnect}
        className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
      >
        <Youtube className="w-3 h-3" />
        Connect YouTube
      </button>
    )
  }

  if (!showPrompt) {
    return (
      <button
        onClick={() => setShowPrompt(true)}
        className="flex items-center gap-2 px-3 py-1.5 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
      >
        <Youtube className="w-3 h-3" />
        Connect YouTube
      </button>
    )
  }

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Youtube className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">{message.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{message.description}</p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleConnect}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {message.action}
              </button>
              {showSkip && (
                <button
                  onClick={() => {
                    setShowPrompt(false)
                    onSkip?.()
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Maybe Later
                </button>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Hook for checking YouTube connection status
export function useYouTubeConnection() {
  const { workspaceId } = useWorkspace()
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkConnection()
  }, [workspaceId])

  const checkConnection = async () => {
    if (!workspaceId) {
      setLoading(false)
      return
    }
    
    try {
      const status = await checkYouTubeConnectionStatus(workspaceId)
      setIsConnected(status.connected)
    } catch (error) {
      console.error('Error checking YouTube connection:', error)
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }

  return { isConnected, loading, refetch: checkConnection }
}

// Higher-order component that wraps content with YouTube connection check
export function withYouTubeConnection<P extends object>(
  Component: React.ComponentType<P>,
  options: { context: 'analytics' | 'create-post' | 'general'; compact?: boolean }
) {
  return function YouTubeConnectedComponent(props: P) {
    const { isConnected, loading } = useYouTubeConnection()

    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )
    }

    if (!isConnected) {
      return (
        <YouTubeContextualConnect
          context={options.context}
          compact={options.compact}
        />
      )
    }

    return <Component {...props} />
  }
}
