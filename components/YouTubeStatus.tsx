import React from 'react'
import { Youtube, CheckCircle2, LogOut } from 'lucide-react'
import { useYouTubeConnectionSimple } from '../src/hooks/useYouTubeConnectionSimple'

const YouTubeStatus: React.FC = () => {
  const { isConnected, disconnect } = useYouTubeConnectionSimple()

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">
          <Youtube className="w-3 h-3" />
          <span className="text-xs font-medium">Connected</span>
          <CheckCircle2 className="w-3 h-3" />
        </div>
        <button
          onClick={disconnect}
          className="text-xs text-red-600 hover:text-red-700 underline"
          title="Disconnect YouTube"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <Youtube className="w-3 h-3" />
      <span>Not Connected</span>
    </div>
  )
}

export default YouTubeStatus
