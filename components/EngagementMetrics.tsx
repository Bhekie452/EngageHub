import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Eye, Bookmark, Repeat, TrendingUp } from 'lucide-react';

interface EngagementMetricsProps {
  workspaceId: string;
  platformPostId: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'whatsapp';
  showBreakdown?: boolean;
  compact?: boolean;
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

const EngagementMetrics: React.FC<EngagementMetricsProps> = ({
  workspaceId,
  platformPostId,
  platform,
  showBreakdown = false,
  compact = false
}) => {
  const [aggregates, setAggregates] = useState<Aggregates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAggregates();
  }, [workspaceId, platformPostId, platform]);

  const fetchAggregates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/engagement?action=aggregates&workspaceId=${workspaceId}&platformPostId=${platformPostId}&platform=${platform}`
      );
      const data = await response.json();
      if (data.success) {
        setAggregates(data.aggregates);
      } else {
        setError(data.error || 'Failed to fetch engagement metrics');
      }
    } catch (err: any) {
      console.error('[EngagementMetrics] Fetch failed:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const calculateEngagementRate = (): number => {
    if (!aggregates || aggregates.total_views === 0) return 0;
    const totalEngagements =
      aggregates.total_likes + aggregates.total_comments + aggregates.total_shares;
    return (totalEngagements / aggregates.total_views) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-sm">Loading metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Failed to load engagement metrics: {error}
      </div>
    );
  }

  if (!aggregates) return null;

  const engagementRate = calculateEngagementRate();

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm text-gray-600">
        {aggregates.total_likes > 0 && (
          <div className="flex items-center gap-1">
            <Heart size={16} />
            <span>{formatCount(aggregates.total_likes)}</span>
          </div>
        )}
        {aggregates.total_comments > 0 && (
          <div className="flex items-center gap-1">
            <MessageCircle size={16} />
            <span>{formatCount(aggregates.total_comments)}</span>
          </div>
        )}
        {aggregates.total_shares > 0 && (
          <div className="flex items-center gap-1">
            <Share2 size={16} />
            <span>{formatCount(aggregates.total_shares)}</span>
          </div>
        )}
        {aggregates.total_views > 0 && (
          <div className="flex items-center gap-1">
            <Eye size={16} />
            <span>{formatCount(aggregates.total_views)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Engagement Metrics</h3>
        {engagementRate > 0 && (
          <div className="flex items-center gap-2 text-green-600">
            <TrendingUp size={18} />
            <span className="font-semibold">{engagementRate.toFixed(2)}%</span>
            <span className="text-sm text-gray-500">engagement rate</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Likes */}
        {aggregates.total_likes > 0 && (
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={20} className="text-red-500" />
              <span className="text-sm font-medium text-gray-700">Likes</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCount(aggregates.total_likes)}
            </div>
            {showBreakdown && (
              <div className="mt-2 text-xs text-gray-600">
                {aggregates.native_likes} native + {aggregates.engagehub_likes} EngageHub
              </div>
            )}
          </div>
        )}

        {/* Comments */}
        {aggregates.total_comments > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle size={20} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Comments</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCount(aggregates.total_comments)}
            </div>
            {showBreakdown && (
              <div className="mt-2 text-xs text-gray-600">
                {aggregates.native_comments} native + {aggregates.engagehub_comments} EngageHub
              </div>
            )}
          </div>
        )}

        {/* Shares */}
        {aggregates.total_shares > 0 && (
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Share2 size={20} className="text-green-500" />
              <span className="text-sm font-medium text-gray-700">Shares</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCount(aggregates.total_shares)}
            </div>
            {showBreakdown && (
              <div className="mt-2 text-xs text-gray-600">
                {aggregates.native_shares} native + {aggregates.engagehub_shares} EngageHub
              </div>
            )}
          </div>
        )}

        {/* Views */}
        {aggregates.total_views > 0 && (
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye size={20} className="text-purple-500" />
              <span className="text-sm font-medium text-gray-700">Views</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCount(aggregates.total_views)}
            </div>
          </div>
        )}

        {/* Saves (Instagram/TikTok) */}
        {aggregates.total_saves > 0 && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bookmark size={20} className="text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Saves</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCount(aggregates.total_saves)}
            </div>
          </div>
        )}

        {/* Reposts (TikTok/Twitter) */}
        {aggregates.total_reposts > 0 && (
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Repeat size={20} className="text-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Reposts</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCount(aggregates.total_reposts)}
            </div>
          </div>
        )}
      </div>

      {/* Platform indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Platform:</span>
          <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs font-medium">
            {platform}
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-xs">Updates in real-time</span>
        </div>
      </div>
    </div>
  );
};

export default EngagementMetrics;
