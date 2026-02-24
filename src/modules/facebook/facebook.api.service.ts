/**
 * Facebook Graph API Service
 * Handles all direct communication with Facebook Graph API
 * Does NOT touch database - only API calls
 */

import { 
  FacebookMetrics, 
  FacebookComment, 
  FacebookPost,
  FacebookCommentsResponse,
  FacebookPagePostsResponse
} from './facebook.types';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class FacebookApiService {
  constructor(private accessToken: string) {}

  /**
   * Get post metrics (reactions, comments, shares)
   */
  async getPostMetrics(postId: string): Promise<FacebookMetrics> {
    const fields = [
      'reactions.summary(true)',
      'comments.summary(true)',
      'shares',
      'reaction_type'
    ].join(',');

    const url = `${GRAPH_BASE_URL}/${postId}?fields=${fields}&access_token=${this.accessToken}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('[FacebookApi] getPostMetrics error:', error);
        throw new Error(error.error?.message || 'Failed to fetch post metrics');
      }

      const data = await response.json();

      return {
        reactions: data.reactions?.summary?.total_count ?? 0,
        comments: data.comments?.summary?.total_count ?? 0,
        shares: data.shares?.count ?? 0
      };
    } catch (error) {
      console.error('[FacebookApi] Failed to get post metrics:', error);
      throw error;
    }
  }

  /**
   * Get comments for a post
   */
  async getPostComments(postId: string, limit: number = 100): Promise<FacebookComment[]> {
    const fields = 'id,message,created_time,from,parent';
    const url = `${GRAPH_BASE_URL}/${postId}/comments?fields=${fields}&limit=${limit}&access_token=${this.accessToken}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('[FacebookApi] getPostComments error:', error);
        throw new Error(error.error?.message || 'Failed to fetch comments');
      }

      const data: FacebookCommentsResponse = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[FacebookApi] Failed to get post comments:', error);
      throw error;
    }
  }

  /**
   * Get reactions for a post
   */
  async getPostReactions(postId: string, limit: number = 100): Promise<any[]> {
    const fields = 'id,name,type';
    const url = `${GRAPH_BASE_URL}/${postId}/reactions?fields=${fields}&limit=${limit}&access_token=${this.accessToken}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('[FacebookApi] getPostReactions error:', error);
        throw new Error(error.error?.message || 'Failed to fetch reactions');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[FacebookApi] Failed to get post reactions:', error);
      throw error;
    }
  }

  /**
   * Get page posts (for initial import)
   */
  async getPagePosts(pageId: string, limit: number = 25): Promise<FacebookPost[]> {
    const fields = 'id,message,created_time,permalink_url';
    const url = `${GRAPH_BASE_URL}/${pageId}/posts?fields=${fields}&limit=${limit}&access_token=${this.accessToken}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('[FacebookApi] getPagePosts error:', error);
        throw new Error(error.error?.message || 'Failed to fetch page posts');
      }

      const data: FacebookPagePostsResponse = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[FacebookApi] Failed to get page posts:', error);
      throw error;
    }
  }

  /**
   * Get a single post by ID
   */
  async getPost(postId: string): Promise<FacebookPost | null> {
    const fields = 'id,message,created_time,permalink_url';
    const url = `${GRAPH_BASE_URL}/${postId}?fields=${fields}&access_token=${this.accessToken}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        if (error.error?.code === 100) {
          // Post not found or not accessible
          return null;
        }
        console.error('[FacebookApi] getPost error:', error);
        throw new Error(error.error?.message || 'Failed to fetch post');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[FacebookApi] Failed to get post:', error);
      return null;
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    payload: string, 
    signature: string, 
    appSecret: string
  ): boolean {
    // Facebook sends X-Hub-Signature-256 header with SHA256 signature
    const expectedSignature = 'sha256=' + 
      require('crypto')
        .createHmac('sha256', appSecret)
        .update(payload)
        .digest('hex');
    
    return signature === expectedSignature;
  }
}

export default FacebookApiService;
