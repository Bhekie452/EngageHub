// Facebook Graph API Types for EngageHub Sync System

export interface FacebookPost {
  id: string; // Format: {page_id}_{post_id}
  message?: string;
  created_time: string;
  permalink_url?: string;
}

export interface FacebookComment {
  id: string;
  message: string;
  created_time: string;
  from: {
    id: string;
    name: string;
  };
  parent?: {
    id: string;
  };
}

export interface FacebookReaction {
  id: string;
  name: string;
  type: 'LIKE' | 'LOVE' | 'WOW' | 'HAHA' | 'SAD' | 'ANGRY' | 'THANKFUL' | 'PRIDE';
}

export interface FacebookMetrics {
  reactions: number;
  comments: number;
  shares: number;
  reactions_detail?: {
    LIKE: number;
    LOVE: number;
    WOW: number;
    HAHA: number;
    SAD: number;
    ANGRY: number;
  };
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

export interface FacebookWebhookEntry {
  id: string; // page_id
  time: number;
  changes: Array<{
    field: string;
    value: {
      post_id?: string;
      comment_id?: string;
      message?: string;
      from?: {
        id: string;
        name: string;
      };
      created_time?: string;
    };
  }>;
}

// Database types
export interface FacebookEngagementRecord {
  id?: string;
  workspace_id: string;
  post_id: string;
  platform: 'facebook';
  type: 'comment' | 'reaction' | 'share';
  social_id: string;
  social_user_id?: string;
  username?: string;
  message?: string;
  parent_id?: string;
  reaction_type?: string;
  created_at: string;
  synced_at?: string;
}

export interface FacebookPostMetricsRecord {
  id?: string;
  post_id: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  last_updated?: string;
}

// API Response types
export interface FacebookSyncResult {
  success: boolean;
  postId: string;
  metrics?: FacebookMetrics;
  newComments: number;
  newReactions: number;
  errors?: string[];
}

export interface FacebookPagePostsResponse {
  data: FacebookPost[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface FacebookCommentsResponse {
  data: FacebookComment[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}
