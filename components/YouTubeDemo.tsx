import React, { useState } from 'react'
import { Youtube, Play, ThumbsUp, MessageSquare, Eye, ExternalLink, Loader2 } from 'lucide-react'
import { fetchYouTubeVideos, likeYouTubeVideo, commentOnYouTubeVideo, subscribeToChannel } from '../src/utils/youtube-client'
import { useWorkspace } from '../src/hooks/useWorkspace'

interface YouTubeVideo {
  id: {
    videoId: string
  }
  snippet: {
    title: string
    description: string
    publishedAt: string
    thumbnails: {
      medium: {
        url: string
      }
    }
  }
}

const YouTubeDemo: React.FC = () => {
  const { workspaceId } = useWorkspace()
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [channel, setChannel] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null)
  const [commentText, setCommentText] = useState('')
  const [videoDetails, setVideoDetails] = useState<any>(null)

  useEffect(() => {
    loadYouTubeData()
  }, [])

  const loadYouTubeData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [videosData, channelData] = await Promise.all([
        fetchYouTubeVideosClient(workspaceId, 5),
        fetchYouTubeChannelClient(workspaceId)
      ])
      
      setVideos(videosData.data || [])
      setChannel(channelData.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load YouTube data')
    } finally {
      setLoading(false)
    }
  }

  const handleVideoSelect = async (video: YouTubeVideo) => {
    setSelectedVideo(video)
    setVideoDetails(null)
    
    try {
      const details = await getYouTubeVideoDetailsClient(workspaceId, video.id.videoId)
      setVideoDetails(details.data)
    } catch (err) {
      console.error('Failed to fetch video details:', err)
    }
  }

  const handleLikeVideo = async () => {
    if (!selectedVideo) return
    
    try {
      await likeYouTubeVideoClient(workspaceId, selectedVideo.id.videoId)
      alert('Video liked successfully!')
    } catch (err) {
      alert('Failed to like video: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handlePostComment = async () => {
    if (!selectedVideo || !commentText.trim()) return
    
    try {
      await postYouTubeCommentClient(workspaceId, selectedVideo.id.videoId, commentText)
      alert('Comment posted successfully!')
      setCommentText('')
    } catch (err) {
      alert('Failed to post comment: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading YouTube data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadYouTubeData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">YouTube API Demo</h2>
          <p className="text-gray-600 mt-1">Test YouTube integration features</p>
        </div>
        <button 
          onClick={loadYouTubeData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Channel Info */}
      {channel && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <img 
              src={channel.snippet?.thumbnails?.medium?.url} 
              alt={channel.snippet?.title}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h3 className="text-lg font-semibold">{channel.snippet?.title}</h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {parseInt(channel.statistics?.subscriberCount || '0').toLocaleString()} subscribers
                </span>
                <span className="flex items-center gap-1">
                  <Play className="w-4 h-4" />
                  {parseInt(channel.statistics?.videoCount || '0').toLocaleString()} videos
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {parseInt(channel.statistics?.viewCount || '0').toLocaleString()} views
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div 
            key={video.id.videoId}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleVideoSelect(video)}
          >
            <img 
              src={video.snippet.thumbnails.medium.url}
              alt={video.snippet.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h4 className="font-semibold line-clamp-2">{video.snippet.title}</h4>
              <p className="text-sm text-gray-600 mt-2 line-clamp-3">{video.snippet.description}</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(video.snippet.publishedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Video Actions */}
      {selectedVideo && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Video Actions: {selectedVideo.snippet.title}</h3>
          
          {videoDetails && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {parseInt(videoDetails.statistics?.viewCount || '0').toLocaleString()} views
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  {parseInt(videoDetails.statistics?.likeCount || '0').toLocaleString()} likes
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {parseInt(videoDetails.statistics?.commentCount || '0').toLocaleString()} comments
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex gap-2">
              <button 
                onClick={handleLikeVideo}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                Like Video
              </button>
              <a 
                href={`https://youtube.com/watch?v=${selectedVideo.id.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open on YouTube
              </a>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Post Comment
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Enter your comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={handlePostComment}
                  disabled={!commentText.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="w-4 h-4" />
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default YouTubeDemo
