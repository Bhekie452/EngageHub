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

// Mock messages for fallback when no real data
function getMockMessages(): InboxMessage[] {
  return [
    { id: '1', sender: 'Sarah Miller', text: 'Hi, I saw your latest post on LinkedIn. Do you offer consulting for small teams?', platform: 'linkedin', category: 'dms', time: new Date(Date.now() - 10 * 60000).toISOString(), unread: true, source: 'engagement' },
    { id: '2', sender: 'Marcus Chen', text: 'Payment confirmed for the Q3 audit. Looking forward to the results!', platform: 'email', category: 'email', time: new Date(Date.now() - 60 * 60000).toISOString(), unread: false, source: 'messages' },
    { id: '3', sender: 'Emma Watson', text: 'Hey! Loved the new video. Would love to collab on a reel soon.', platform: 'instagram', category: 'comments', time: new Date(Date.now() - 3 * 60 * 60000).toISOString(), unread: true, source: 'engagement' },
    { id: '4', sender: 'WhatsApp Lead', text: 'Is the early bird pricing still available for the course?', platform: 'whatsapp', category: 'whatsapp', time: new Date(Date.now() - 5 * 60 * 60000).toISOString(), unread: false, source: 'messages' },
    { id: '5', sender: 'Web Guest #402', text: 'Where can I find your pricing page?', platform: 'webchat', category: 'webchat', time: new Date(Date.now() - 24 * 60 * 60000).toISOString(), unread: false, source: 'messages' },
    { id: '6', sender: '+1 (555) 0123', text: 'Missed call from unknown number', platform: 'missed', category: 'missed', time: new Date(Date.now() - 24 * 60 * 60000).toISOString(), unread: true, source: 'messages' },
  ];
}
