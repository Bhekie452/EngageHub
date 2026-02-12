import React, { useState, useEffect } from 'react';
import { BarChart2, MessageCircle, ThumbsUp, Share2, Eye, Users } from 'lucide-react';
import { likeYouTubeVideoClient, getYouTubeVideoCommentsClient, fetchYouTubeVideosClient } from '../src/utils/youtube-client';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  publishedAt: string;
}

interface Comment {
  id: string;
  author: string;
  text: string;
  publishedAt: string;
}

export default function YouTubeEngagement() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'videos' | 'comments' | 'likes'>('videos');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const workspaceId = localStorage.getItem('current_workspace_id') || '';
      const response = await fetchYouTubeVideosClient(workspaceId, 20);
      
      if (response?.videos) {
        setVideos(response.videos);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (videoId: string) => {
    try {
      const workspaceId = localStorage.getItem('current_workspace_id') || '';
      const response = await getYouTubeVideoCommentsClient(workspaceId, videoId, 50);
      
      if (response?.comments) {
        setComments(response.comments);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleLike = async (videoId: string) => {
    try {
      const workspaceId = localStorage.getItem('current_workspace_id') || '';
      await likeYouTubeVideoClient(workspaceId, videoId);
      
      // Update video like count
      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, likeCount: (parseInt(video.likeCount) + 1).toString() }
          : video
      ));
    } catch (error) {
      console.error('Failed to like video:', error);
    }
  };

  const formatNumber = (num: string) => {
    const count = parseInt(num) || 0;
    return count.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('videos')}
          className={`px-4 py-2 font-bold rounded-lg transition-colors ${
            activeTab === 'videos' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <BarChart2 size={16} />
          Videos
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-2 font-bold rounded-lg transition-colors ${
            activeTab === 'comments' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <MessageCircle size={16} />
          Comments
        </button>
        <button
          onClick={() => setActiveTab('likes')}
          className={`px-4 py-2 font-bold rounded-lg transition-colors ${
            activeTab === 'likes' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ThumbsUp size={16} />
          Likes
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div 
              key={video.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedVideo(video)}
            >
              <div className="aspect-video bg-gray-100 relative">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
                  <Eye size={12} />
                  {formatNumber(video.viewCount)} views
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{video.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <ThumbsUp size={14} />
                    <span>{formatNumber(video.likeCount)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle size={14} />
                    <span>{formatNumber(video.commentCount)}</span>
                  </div>
                  <span>• {formatDate(video.publishedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'comments' && selectedVideo && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Comments for "{selectedVideo.title}"</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 border-b border-gray-100">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{comment.author}</div>
                    <div className="text-sm text-gray-600 mt-1">{comment.text}</div>
                    <div className="text-xs text-gray-400 mt-2">{formatDate(comment.publishedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleLike(selectedVideo.id)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ThumbsUp size={16} />
                Like Video
              </button>
              <button
                onClick={() => setSelectedVideo(null)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Videos
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'likes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos
            .sort((a, b) => parseInt(b.likeCount) - parseInt(a.likeCount))
            .map((video) => (
              <div key={video.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="aspect-video bg-gray-100 relative mb-4">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{video.title}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ThumbsUp size={20} className="text-green-600" />
                    <span className="text-2xl font-bold">{formatNumber(video.likeCount)}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatNumber(video.viewCount)} views • {formatDate(video.publishedAt)}
                  </div>
                </div>
                <button
                  onClick={() => handleLike(video.id)}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ThumbsUp size={16} />
                  Like This Video
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
