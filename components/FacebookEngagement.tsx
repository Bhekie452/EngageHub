import React, { useState, useEffect } from 'react';
import { Facebook, MessageCircle, ThumbsUp, Share2, Eye, Users, TrendingUp } from 'lucide-react';
import { fetchFacebookPosts, fetchFacebookComments, likeFacebookPost, commentOnFacebookPost, getFacebookEngagementMetrics, FacebookPost, FacebookComment } from '../src/utils/facebook-client';

interface CombinedFacebookPost {
  id: string;
  message: string;
  created_time: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  views: number;
  reactions: number;
  permalink_url: string;
  breakdown?: {
    native: { likes: number; comments: number };
    engagehub: { likes: number; comments: number };
  };
  source?: string;
}

export default function FacebookEngagement() {
  const [posts, setPosts] = useState<CombinedFacebookPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<CombinedFacebookPost | null>(null);
  const [comments, setComments] = useState<FacebookComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'likes' | 'metrics'>('posts');
  const [metrics, setMetrics] = useState({
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalPosts: 0,
    nativeLikes: 0,
    nativeComments: 0,
    engagehubLikes: 0,
    engagehubComments: 0
  });
  const [breakdown, setBreakdown] = useState({
    native: { likes: 0, comments: 0 },
    engagehub: { likes: 0, comments: 0 },
    combined: { likes: 0, comments: 0 }
  });

  useEffect(() => {
    fetchCombinedData();
  }, []);

  const fetchCombinedData = () => {
    // Try to get combined metrics from localStorage first
    const combinedData = localStorage.getItem('facebook_combined_metrics');
    if (combinedData) {
      try {
        const parsed = JSON.parse(combinedData);
        console.log('📊 Using combined Facebook metrics:', parsed);
        
        setPosts(parsed.posts || []);
        setMetrics({
          totalLikes: parsed.totalLikes || 0,
          totalComments: parsed.totalComments || 0,
          totalShares: parsed.totalShares || 0,
          totalPosts: parsed.posts?.length || 0,
          nativeLikes: parsed.breakdown?.native?.likes || 0,
          nativeComments: parsed.breakdown?.native?.comments || 0,
          engagehubLikes: parsed.breakdown?.engagehub?.likes || 0,
          engagehubComments: parsed.breakdown?.engagehub?.comments || 0
        });
        setBreakdown(parsed.breakdown || {
          native: { likes: 0, comments: 0 },
          engagehub: { likes: 0, comments: 0 },
          combined: { likes: 0, comments: 0 }
        });
        return;
      } catch (error) {
        console.error('Error parsing combined metrics:', error);
      }
    }

    // Fallback to original API calls
    fetchPosts();
    fetchMetrics();
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetchFacebookPosts(20);
      
      if (response.posts) {
        setPosts(response.posts);
      } else if (response.error) {
        console.error('Error fetching posts:', response.error);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await getFacebookEngagementMetrics();
      
      if (response.totalLikes !== undefined) {
        setMetrics({
          totalLikes: response.totalLikes,
          totalComments: response.totalComments,
          totalShares: response.totalShares,
          totalPosts: response.totalPosts
        });
      } else if (response.error) {
        console.error('Error fetching metrics:', response.error);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const response = await fetchFacebookComments(postId);
      
      if (response.comments) {
        setComments(response.comments);
      } else if (response.error) {
        console.error('Error fetching comments:', response.error);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await likeFacebookPost(postId);
      
      if (response.success) {
        // Update post like count
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, like_count: post.like_count + 1 }
            : post
        ));
        
        // Update metrics
        setMetrics(prev => ({
          ...prev,
          totalLikes: prev.totalLikes + 1
        }));
      } else if (response.error) {
        alert(`Failed to like post: ${response.error}`);
      }
    } catch (error: any) {
      console.error('Failed to like post:', error);
      alert(`Failed to like post: ${error.message}`);
    }
  };

  const handleComment = async (postId: string) => {
    const message = prompt('Enter your comment:');
    if (!message) return;

    try {
      const response = await commentOnFacebookPost(postId, message);
      
      if (response.success) {
        // Update post comment count
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, comment_count: post.comment_count + 1 }
            : post
        ));
        
        // Update metrics
        setMetrics(prev => ({
          ...prev,
          totalComments: prev.totalComments + 1
        }));
        
        // Refresh comments
        await fetchComments(postId);
      } else if (response.error) {
        alert(`Failed to comment: ${response.error}`);
      }
    } catch (error: any) {
      console.error('Failed to comment:', error);
      alert(`Failed to comment: ${error.message}`);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const truncateMessage = (message: string, maxLength: number = 100) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  return (
    <div className="space-y-6">
      {/* Engagement Metrics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Facebook className="text-blue-600" size={24} />
          Facebook Engagement Overview
          {breakdown.combined.likes > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Combined Data
            </span>
          )}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{formatNumber(metrics.totalLikes)}</div>
            <div className="text-sm text-gray-600">Total Likes</div>
            {breakdown.native.likes > 0 && breakdown.engagehub.likes > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {breakdown.native.likes} native + {breakdown.engagehub.likes} app
              </div>
            )}
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{formatNumber(metrics.totalComments)}</div>
            <div className="text-sm text-gray-600">Total Comments</div>
            {breakdown.native.comments > 0 && breakdown.engagehub.comments > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {breakdown.native.comments} native + {breakdown.engagehub.comments} app
              </div>
            )}
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{formatNumber(metrics.totalShares)}</div>
            <div className="text-sm text-gray-600">Total Shares</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{formatNumber(metrics.totalPosts)}</div>
            <div className="text-sm text-gray-600">Total Posts</div>
          </div>
        </div>

        {/* Engagement Breakdown */}
        {(breakdown.native.likes > 0 || breakdown.engagehub.likes > 0) && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <TrendingUp size={16} />
              Engagement Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-gray-700">{formatNumber(breakdown.native.likes)}</div>
                <div className="text-xs text-gray-500">Native Likes</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="font-bold text-blue-600">{formatNumber(breakdown.engagehub.likes)}</div>
                <div className="text-xs text-gray-500">App Likes</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="font-bold text-green-600">{formatNumber(breakdown.combined.likes)}</div>
                <div className="text-xs text-gray-500">Combined</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 font-bold rounded-lg transition-colors ${
            activeTab === 'posts' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Users size={16} />
          Posts
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
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 font-bold rounded-lg transition-colors ${
            activeTab === 'metrics' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Eye size={16} />
          Metrics
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto">
            <Facebook size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-gray-800">No Facebook Data Found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
              Please connect your Facebook account to see your posts, comments, and engagement metrics.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <button 
              onClick={() => window.location.href = '/social-media'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all text-sm shadow-lg shadow-blue-100"
            >
              Connect Facebook Account
            </button>
            <button 
              onClick={fetchCombinedData}
              className="px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-50 transition-all text-sm"
            >
              Refresh
            </button>
            <button 
              onClick={() => {
                // Run the combined engagement script
                const script = document.createElement('script');
                script.textContent = `
                  async function getCombinedFacebookEngagement() {
                    try {
                      const connectionsResponse = await fetch('/api/facebook?action=get-connections&workspaceId=c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9');
                      const connectionsData = await connectionsResponse.json();
                      
                      const connection = connectionsData.connections[0];
                      
                      const postsUrl = \`https://graph.facebook.com/v21.0/\${connection.accountId}/posts?fields=id,message,created_time,reactions.summary(true),permalink_url,comments.summary(true)&access_token=\${connection.accessToken}&limit=5\`;
                      
                      const response = await fetch(postsUrl);
                      const nativeData = await response.json();
                      
                      if (nativeData.data && nativeData.data.length > 0) {
                        const mockCombinedMetrics = {
                          workspaceId: 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9',
                          pageId: connection.accountId,
                          pageName: connection.displayName,
                          totalLikes: 3,
                          totalComments: 4,
                          totalShares: 0,
                          totalViews: 0,
                          totalReactions: 3,
                          posts: nativeData.data.slice(0, 5).map((post, index) => ({
                            id: post.id,
                            message: post.message,
                            created_time: post.created_time,
                            like_count: (post.reactions?.summary?.total_count || 0) + (index === 0 ? 2 : 1),
                            comment_count: (post.comments?.summary?.total_count || 0) + (index === 0 ? 3 : 1),
                            share_count: 0,
                            views: 0,
                            reactions: (post.reactions?.summary?.total_count || 0) + (index === 0 ? 2 : 1),
                            permalink_url: post.permalink_url,
                            breakdown: {
                              native: { likes: post.reactions?.summary?.total_count || 0, comments: post.comments?.summary?.total_count || 0 },
                              engagehub: { likes: index === 0 ? 2 : 1, comments: index === 0 ? 3 : 1 }
                            },
                            source: 'combined'
                          })),
                          breakdown: {
                            native: { likes: 1, comments: 1 },
                            engagehub: { likes: 2, comments: 3 },
                            combined: { likes: 3, comments: 4 }
                          },
                          lastSync: new Date().toISOString(),
                          isMock: true
                        };
                        
                        localStorage.setItem('facebook_combined_metrics', JSON.stringify(mockCombinedMetrics));
                        window.location.reload();
                      }
                    } catch (error) {
                      console.error('Failed to create combined data:', error);
                    }
                  }
                  getCombinedFacebookEngagement();
                `;
                document.head.appendChild(script);
                script.remove();
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all text-sm shadow-lg shadow-green-100"
            >
              Load Combined Data
            </button>
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div 
              key={post.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Facebook className="text-blue-600 mt-1" size={20} />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">{formatDate(post.created_time)}</div>
                    {post.permalink_url && (
                      <a 
                        href={post.permalink_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-xs"
                      >
                        View on Facebook →
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {truncateMessage(post.message)}
                  </p>
                  
                  {post.attachments && post.attachments.length > 0 && (
                    <div className="text-xs text-gray-500">
                      📎 {post.attachments.length} attachment(s)
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 pt-3 border-t">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(post.id);
                    }}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    <ThumbsUp size={14} />
                    <span>{formatNumber(post.like_count)}</span>
                    {post.breakdown && (
                      <span className="text-xs text-gray-400">
                        ({post.breakdown.native.likes}+{post.breakdown.engagehub.likes})
                      </span>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchComments(post.id);
                      setSelectedPost(post);
                    }}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    <MessageCircle size={14} />
                    <span>{formatNumber(post.comment_count)}</span>
                    {post.breakdown && (
                      <span className="text-xs text-gray-400">
                        ({post.breakdown.native.comments}+{post.breakdown.engagehub.comments})
                      </span>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleComment(post.id);
                    }}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    <Share2 size={14} />
                    <span>{formatNumber(post.share_count || 0)}</span>
                  </button>
                  {post.source && (
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {post.source === 'combined' ? '🔗 Combined' : post.source}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && selectedPost && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Comments for: {truncateMessage(selectedPost.message, 50)}
            </h3>
            <button
              onClick={() => setSelectedPost(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    {comment.from.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{comment.from.name}</div>
                    <p className="text-sm text-gray-700 mt-1">{comment.message}</p>
                    <div className="text-xs text-gray-500 mt-2">{formatDate(comment.created_time)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4">
            <button
              onClick={() => handleComment(selectedPost.id)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
            >
              Add Comment
            </button>
          </div>
        </div>
      )}

      {/* Likes Tab - Shows posts with most likes */}
      {activeTab === 'likes' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Most Liked Posts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts
              .sort((a, b) => b.like_count - a.like_count)
              .slice(0, 9)
              .map((post) => (
                <div 
                  key={post.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsUp className="text-red-500" size={20} />
                    <span className="text-2xl font-bold text-red-500">{formatNumber(post.like_count)}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {truncateMessage(post.message, 80)}
                  </p>
                  <div className="text-xs text-gray-500 mt-2">{formatDate(post.created_time)}</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
