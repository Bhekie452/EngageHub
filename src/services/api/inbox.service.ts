import { supabase } from '../../lib/supabase';

export interface InboxMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  platform: 'email' | 'whatsapp' | 'instagram' | 'linkedin' | 'webchat' | 'missed' | 'facebook' | 'twitter' | 'youtube' | 'tiktok';
  category: 'all' | 'email' | 'whatsapp' | 'comments' | 'dms' | 'webchat' | 'missed' | 'archived';
  unread: boolean;
  archived?: boolean;
  direction?: 'inbound' | 'outbound';
  source?: 'messages' | 'engagement' | 'conversations';
  platformPostId?: string;
  conversationId?: string;
}

export const inboxService = {
  async getAll(workspaceId: string, category?: string): Promise<InboxMessage[]> {
    try {
      const response = await fetch(
        `/api/inbox?workspaceId=${workspaceId}${category ? `&category=${category}` : ''}`
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch inbox');
      }
      
      return data.messages || [];
    } catch (error) {
      console.error('[InboxService] Error fetching messages:', error);
      // Return empty array on error to allow fallback to mock data
      return [];
    }
  },

  async sendReply(
    workspaceId: string,
    messageId: string,
    content: string,
    platform: string,
    source: string,
    platformPostId?: string
  ): Promise<InboxMessage | null> {
    try {
      const response = await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          messageId,
          content,
          platform,
          source,
          platformPostId
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send reply');
      }
      
      return data.message || null;
    } catch (error) {
      console.error('[InboxService] Error sending reply:', error);
      throw error;
    }
  },

  async markAsRead(
    workspaceId: string,
    messageId: string,
    source: string
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/inbox', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          messageId,
          source
        })
      });
      
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('[InboxService] Error marking as read:', error);
      return false;
    }
  },

  // Helper to format relative time
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mo ago`;
    return `${Math.floor(diffDays / 365)} yr ago`;
  }
};
