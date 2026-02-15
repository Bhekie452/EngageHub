/**
 * Facebook API Client Functions
 * Mirrors YouTube client structure for consistency
 */

const workspaceId = localStorage.getItem('current_workspace_id') || '';

export interface FacebookPost {
  id: string;
  message: string;
  created_time: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  attachments?: any[];
  permalink_url?: string;
}

export interface FacebookComment {
  id: string;
  from: {
    name: string;
    id: string;
  };
  message: string;
  created_time: string;
}

/**
 * Fetch Facebook posts from connected pages
 */
export const fetchFacebookPosts = async (limit: number = 20): Promise<{ posts: FacebookPost[]; error?: string }> => {
  try {
    const response = await fetch(`/api/facebook?action=get-posts&workspaceId=${workspaceId}&limit=${limit}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch Facebook posts');
    }
    
    return data;
  } catch (error: any) {
    console.error('Failed to fetch Facebook posts:', error);
    return { posts: [], error: error.message };
  }
};

/**
 * Fetch comments for a specific Facebook post
 */
export const fetchFacebookComments = async (postId: string, limit: number = 50): Promise<{ comments: FacebookComment[]; error?: string }> => {
  try {
    const response = await fetch(`/api/facebook?action=get-comments&postId=${postId}&limit=${limit}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch Facebook comments');
    }
    
    return data;
  } catch (error: any) {
    console.error('Failed to fetch Facebook comments:', error);
    return { comments: [], error: error.message };
  }
};

/**
 * Like a Facebook post
 */
export const likeFacebookPost = async (postId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch('/api/facebook?action=like-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, workspaceId })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to like Facebook post');
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to like Facebook post:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Comment on a Facebook post
 */
export const commentOnFacebookPost = async (postId: string, message: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch('/api/facebook?action=comment-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, message, workspaceId })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to comment on Facebook post');
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to comment on Facebook post:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get Facebook engagement metrics (likes, comments, shares)
 */
export const getFacebookEngagementMetrics = async (): Promise<{ 
  totalLikes: number; 
  totalComments: number; 
  totalShares: number; 
  totalPosts: number;
  error?: string 
}> => {
  try {
    const response = await fetch(`/api/facebook?action=get-engagement-metrics&workspaceId=${workspaceId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch Facebook metrics');
    }
    
    return data;
  } catch (error: any) {
    console.error('Failed to fetch Facebook metrics:', error);
    return { totalLikes: 0, totalComments: 0, totalShares: 0, totalPosts: 0, error: error.message };
  }
};
