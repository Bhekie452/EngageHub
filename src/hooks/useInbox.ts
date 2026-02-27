import { useState, useEffect, useCallback } from 'react';
import { inboxService, InboxMessage } from '../services/api/inbox.service';

export function useInbox(workspaceId: string | null) {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async (category?: string) => {
    if (!workspaceId) {
      // no workspace yet – just clear messages
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await inboxService.getAll(workspaceId, category);
      setMessages(data || []);
    } catch (err) {
      console.error('[useInbox] Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendReply = async (
    messageId: string,
    content: string,
    platform: string,
    source: string,
    platformPostId?: string
  ) => {
    if (!workspaceId) return;

    try {
      await inboxService.sendReply(workspaceId, messageId, content, platform, source, platformPostId);
      // Refresh messages after sending
      await fetchMessages();
    } catch (err) {
      console.error('[useInbox] Error sending reply:', err);
      throw err;
    }
  };

  const markAsRead = async (messageId: string, source: string) => {
    if (!workspaceId) return;

    try {
      await inboxService.markAsRead(workspaceId, messageId, source);
      // Update local state
      setMessages(prev => 
        prev.map(m => m.id === messageId ? { ...m, unread: false } : m)
      );
    } catch (err) {
      console.error('[useInbox] Error marking as read:', err);
    }
  };

  return {
    messages,
    loading,
    error,
    refresh: fetchMessages,
    sendReply,
    markAsRead
  };
}


