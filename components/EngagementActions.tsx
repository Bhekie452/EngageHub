import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Eye, Bookmark, Repeat } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface EngagementActionsProps {
  workspaceId: string;
  userId: string;
  postId?: string;
  platformPostId: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'whatsapp';
  onEngagementChange?: (aggregates: any) => void;
}

interface Aggregates {
  total_likes: number;
  native_likes: number;
  engagehub_likes: number;
  total_comments: number;
  native_comments: number;
  engagehub_comments: number;
  total_shares: number;
  native_shares: number;
  engagehub_shares: number;
  total_views: number;
  total_saves: number;
  total_reposts: number;
}

const EngagementActions: React.FC<EngagementActionsProps> = ({
  workspaceId,
  userId,
  postId,
  platformPostId,
  platform,
  onEngagementChange
}) => {
  const [aggregates, setAggregates] = useState<Aggregates | null>(null);
  const [userActions, setUserActions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch aggregates and user's actions
  useEffect(() => {
    fetchAggregates();
    fetchUserActions();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`engagement:${platformPostId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'engagement_aggregates',
          filter: `platform_post_id=eq.${platformPostId}`
        },
        (payload) => {
          console.log('[EngagementActions] Real-time update:', payload);
          if (payload.new) {
            setAggregates(payload.new as Aggregates);
            onEngagementChange?.(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [platformPostId]);

  const fetchAggregates = async () => {
    try {
      const response = await fetch(
        `/api/engagement?action=aggregates&workspaceId=${workspaceId}&platformPostId=${platformPostId}&platform=${platform}`
      );
      const data = await response.json();
      if (data.success) {
        setAggregates(data.aggregates);
        onEngagementChange?.(data.aggregates);
      }
    } catch (error) {
      console.error('[EngagementActions] Failed to fetch aggregates:', error);
    }
  };

  const fetchUserActions = async () => {
    try {
      const response = await fetch(
        `/api/engagement?action=list&workspaceId=${workspaceId}&platformPostId=${platformPostId}&platform=${platform}`
      );
      const data = await response.json();
      if (data.success) {
        // Track which actions this user has performed
        const actions = new Set<string>();
        data.actions.forEach((action: any) => {
          if (action.user_id === userId && action.source === 'engagehub') {
            actions.add(action.action_type);
          }
        });
        setUserActions(actions);
      }
    } catch (error) {
      console.error('[EngagementActions] Failed to fetch user actions:', error);
    }
  };

  const handleAction = async (actionType: string, actionData?: any) => {
    const hasAction = userActions.has(actionType);

    // Optimistic UI update
    setUserActions((prev) => {
      const next = new Set(prev);
      if (hasAction) {
        next.delete(actionType);
      } else {
        next.add(actionType);
      }
      return next;
    });

    // Optimistically update counts
    if (aggregates) {
      const key = `total_${actionType}s` as keyof Aggregates;
      setAggregates({
        ...aggregates,
        [key]: hasAction ? aggregates[key] - 1 : aggregates[key] + 1
      });
    }

    setLoading(true);

    try {
      if (hasAction) {
        // Unlike/undo action - need to find the engagement_id first
        const listResponse = await fetch(
          `/api/engagement?action=list&workspaceId=${workspaceId}&platformPostId=${platformPostId}&platform=${platform}&actionType=${actionType}`
        );
        const listData = await listResponse.json();
        const userAction = listData.actions.find(
          (a: any) => a.user_id === userId && a.source === 'engagehub'
        );

        if (userAction) {
          const response = await fetch('/api/engagement', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              engagementId: userAction.id,
              workspaceId
            })
          });

          if (!response.ok) {
            throw new Error('Failed to remove action');
          }
        }
      } else {
        // Create new action
        const response = await fetch('/api/engagement?action=create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            userId,
            postId,
            platformPostId,
            platform,
            actionType,
            actionData
          })
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to create action');
        }

        // Update aggregates from response
        if (data.aggregates) {
          setAggregates(data.aggregates);
        }
      }

      // Refresh to get accurate counts
      await fetchAggregates();
      await fetchUserActions();
    } catch (error: any) {
      console.error('[EngagementActions] Action failed:', error);
      // Rollback optimistic update
      setUserActions((prev) => {
        const next = new Set(prev);
        if (hasAction) {
          next.add(actionType);
        } else {
          next.delete(actionType);
        }
        return next;
      });

      // Refresh to get accurate state
      await fetchAggregates();
      await fetchUserActions();

      alert(`Failed to ${actionType}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (!aggregates) {
    return <div className="flex gap-4">Loading engagement...</div>;
  }

  const isLiked = userActions.has('like');
  const hasCommented = userActions.has('comment');
  const hasShared = userActions.has('share');
  const hasSaved = userActions.has('save');

  return (
    <div className="flex items-center gap-6">
      {/* Like Button */}
      <button
        onClick={() => handleAction('like')}
        disabled={loading}
        className={`flex items-center gap-2 transition-colors ${
          isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={`${aggregates.total_likes} likes (${aggregates.native_likes} native + ${aggregates.engagehub_likes} EngageHub)`}
      >
        <Heart
          size={20}
          fill={isLiked ? 'currentColor' : 'none'}
          strokeWidth={isLiked ? 0 : 2}
        />
        <span className="text-sm font-medium">
          {formatCount(aggregates.total_likes)}
        </span>
      </button>

      {/* Comment Button */}
      <button
        onClick={() => {
          // Open comment modal
          alert('Comment modal not implemented yet');
        }}
        disabled={loading}
        className={`flex items-center gap-2 transition-colors ${
          hasCommented ? 'text-blue-500' : 'text-gray-600 hover:text-blue-500'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={`${aggregates.total_comments} comments (${aggregates.native_comments} native + ${aggregates.engagehub_comments} EngageHub)`}
      >
        <MessageCircle size={20} fill={hasCommented ? 'currentColor' : 'none'} />
        <span className="text-sm font-medium">
          {formatCount(aggregates.total_comments)}
        </span>
      </button>

      {/* Share Button */}
      {platform !== 'instagram' && platform !== 'tiktok' && (
        <button
          onClick={() => handleAction('share')}
          disabled={loading}
          className={`flex items-center gap-2 transition-colors ${
            hasShared ? 'text-green-500' : 'text-gray-600 hover:text-green-500'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={`${aggregates.total_shares} shares (${aggregates.native_shares} native + ${aggregates.engagehub_shares} EngageHub)`}
        >
          <Share2 size={20} />
          <span className="text-sm font-medium">
            {formatCount(aggregates.total_shares)}
          </span>
        </button>
      )}

      {/* Save Button (Instagram, TikTok) */}
      {(platform === 'instagram' || platform === 'tiktok') && (
        <button
          onClick={() => handleAction('save')}
          disabled={loading}
          className={`flex items-center gap-2 transition-colors ${
            hasSaved ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-500'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={`${aggregates.total_saves} saves`}
        >
          <Bookmark size={20} fill={hasSaved ? 'currentColor' : 'none'} />
          <span className="text-sm font-medium">
            {formatCount(aggregates.total_saves)}
          </span>
        </button>
      )}

      {/* Repost (TikTok, Twitter) */}
      {(platform === 'tiktok' || platform === 'twitter') && (
        <button
          onClick={() => handleAction('repost')}
          disabled={loading}
          className="flex items-center gap-2 text-gray-600 hover:text-purple-500 transition-colors"
          title={`${aggregates.total_reposts} reposts`}
        >
          <Repeat size={20} />
          <span className="text-sm font-medium">
            {formatCount(aggregates.total_reposts)}
          </span>
        </button>
      )}

      {/* Views */}
      {aggregates.total_views > 0 && (
        <div className="flex items-center gap-2 text-gray-500">
          <Eye size={20} />
          <span className="text-sm font-medium">
            {formatCount(aggregates.total_views)}
          </span>
        </div>
      )}
    </div>
  );
};

export default EngagementActions;
