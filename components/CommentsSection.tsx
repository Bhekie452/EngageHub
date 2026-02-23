import React, { useState, useEffect } from 'react';
import { Send, Trash2, MoreVertical } from 'lucide-react';
import { supabase } from '../src/lib/supabase';

interface Comment {
  id: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  comment_text: string;
  source: 'native' | 'engagehub' | 'youtube' | 'instagram' | 'twitter' | 'tiktok' | 'linkedin' | 'facebook';
  platform_object_id?: string;
  external_id?: string;
  author_name?: string;
  author_avatar?: string;
  like_count?: number;
  synced_at?: string;
  created_at: string;
  sync_status?: 'pending' | 'synced' | 'failed';
}

interface CommentsSectionProps {
  workspaceId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  postId?: string;
  platformPostId: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'whatsapp';
  maxHeight?: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  workspaceId,
  userId,
  userName,
  userAvatar,
  postId,
  platformPostId,
  platform,
  maxHeight = '400px'
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();

    // Subscribe to real-time comment updates
    const subscription = supabase
      .channel(`comments:${platformPostId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'engagement_actions',
          filter: `platform_post_id=eq.${platformPostId}`
        },
        (payload) => {
          console.log('[CommentsSection] Real-time update:', payload);
          if (payload.eventType === 'INSERT' && payload.new.action_type === 'comment') {
            // Add new comment
            setComments((prev) => [mapEngagementToComment(payload.new), ...prev]);
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted comment
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE' && payload.new.action_type === 'comment') {
            // Update existing comment (e.g., sync status change)
            setComments((prev) =>
              prev.map((c) => (c.id === payload.new.id ? mapEngagementToComment(payload.new) : c))
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [platformPostId]);

  const mapEngagementToComment = (engagement: any): Comment => ({
    id: engagement.id,
    user_id: engagement.user_id,
    user_name: engagement.action_data?.user_name || engagement.author_name || 'Unknown User',
    user_avatar: engagement.action_data?.user_avatar || engagement.author_avatar,
    comment_text: engagement.action_data?.comment_text || engagement.content || '',
    source: engagement.source || 'engagehub',
    platform_object_id: engagement.platform_object_id,
    external_id: engagement.external_id,
    like_count: engagement.like_count,
    synced_at: engagement.synced_at,
    created_at: engagement.created_at,
    sync_status: engagement.platform_object_id
      ? 'synced'
      : engagement.source === 'engagehub'
      ? 'pending'
      : undefined
  });

  const fetchComments = async () => {
    setLoading(true);
    try {
      // For YouTube, sync comments from YouTube API first
      if (platform === 'youtube' && postId) {
        try {
          // Get YouTube OAuth token from localStorage or session
          const youtubeToken = localStorage.getItem('youtube_access_token');
          if (youtubeToken) {
            // Use external_video_id from post if available, otherwise use platformPostId
            const videoId = platformPostId;
            if (videoId) {
              // Call sync function - pass the video ID as platformPostId
              await supabase.functions.invoke('sync-youtube-comments', {
                body: {
                  videoId: videoId,
                  postId: postId,
                  accessToken: youtubeToken,
                  workspaceId: workspaceId,
                  userId: userId
                }
              });
            }
          }
        } catch (syncError) {
          console.error('[CommentsSection] YouTube sync failed:', syncError);
          // Continue to fetch comments even if sync fails
        }
      }

      // For Facebook, sync comments and likes from Facebook Graph API
      if (platform === 'facebook' && postId && platformPostId) {
        try {
          // Get Facebook pages with access tokens
          const fbPagesData = localStorage.getItem('facebook_pages');
          if (fbPagesData) {
            const fbPages = JSON.parse(fbPagesData);
            // Use the first page's access token (could be enhanced to match the post's page)
            const fbPage = fbPages[0];
            if (fbPage?.access_token) {
              await supabase.functions.invoke('sync-facebook-engagement', {
                body: {
                  postId: postId,
                  platformPostId: platformPostId,
                  workspaceId: workspaceId,
                  userId: userId,
                  pageId: fbPage.id,
                  accessToken: fbPage.access_token
                }
              });
            }
          }
        } catch (syncError) {
          console.error('[CommentsSection] Facebook sync failed:', syncError);
          // Continue to fetch comments even if sync fails
        }
      }

      const response = await fetch(
        `/api/app?action=engagement&method=list&workspaceId=${workspaceId}&platformPostId=${platformPostId}&platform=${platform}&actionType=comment`
      );
      const data = await response.json();
      if (data.success) {
        const commentsList = data.actions.map(mapEngagementToComment);
        // Sort: newest first
        commentsList.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setComments(commentsList);
      }
    } catch (error) {
      console.error('[CommentsSection] Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/app?action=engagement&method=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
          postId,
          platformPostId,
          platform,
          actionType: 'comment',
          actionData: {
            comment_text: commentText.trim(),
            user_name: userName,
            user_avatar: userAvatar
          }
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to post comment');
      }

      // Clear input
      setCommentText('');

      // Real-time subscription will add the comment to the list
      // But just in case, manually add it
      if (data.engagement) {
        setComments((prev) => [mapEngagementToComment(data.engagement), ...prev]);
      }
    } catch (error: any) {
      console.error('[CommentsSection] Failed to submit comment:', error);
      alert(`Failed to post comment: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!confirm('Delete this comment?')) return;

    // Optimistically remove from UI
    setComments((prev) => prev.filter((c) => c.id !== comment.id));

    try {
      const response = await fetch('/api/app?action=engagement', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagementId: comment.id,
          workspaceId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }
    } catch (error: any) {
      console.error('[CommentsSection] Failed to delete comment:', error);
      alert(`Failed to delete comment: ${error.message}`);
      // Rollback - refresh comments
      await fetchComments();
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Comment Input */}
      <form onSubmit={handleSubmitComment} className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={!commentText.trim() || submitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="flex flex-col gap-3" style={{ maxHeight, overflowY: 'auto' }}>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3 pb-3 border-b border-gray-100">
              <div className="flex-shrink-0">
                {comment.user_avatar ? (
                  <img
                    src={comment.user_avatar}
                    alt={comment.user_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-sm font-semibold">
                    {comment.user_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{comment.user_name}</span>
                    <div className="flex items-center gap-2">
                      {/* Source badge */}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          comment.source === 'native' || comment.source === 'youtube' || comment.source === 'instagram' || comment.source === 'twitter' || comment.source === 'tiktok' || comment.source === 'linkedin' || comment.source === 'facebook'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                        title={
                          comment.source === 'native' || comment.source === 'youtube' || comment.source === 'instagram' || comment.source === 'twitter' || comment.source === 'tiktok' || comment.source === 'linkedin' || comment.source === 'facebook'
                            ? `From ${comment.source === 'native' ? platform : comment.source}`
                            : 'From EngageHub'
                        }
                      >
                        {comment.source === 'native' ? platform : comment.source === 'engagehub' ? 'EngageHub' : comment.source}
                      </span>
                      {/* Sync status */}
                      {comment.source === 'engagehub' && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            comment.sync_status === 'synced'
                              ? 'bg-green-100 text-green-700'
                              : comment.sync_status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {comment.sync_status === 'synced'
                            ? '✓ Synced'
                            : comment.sync_status === 'failed'
                            ? '✗ Failed'
                            : '⏳ Pending'}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-800">{comment.comment_text}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 px-4">
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(comment.created_at)}
                  </span>
                  {comment.user_id === userId && comment.source === 'engagehub' && (
                    <button
                      onClick={() => handleDeleteComment(comment)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
