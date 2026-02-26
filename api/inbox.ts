import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * INBOX API
 * Unified inbox endpoint that aggregates messages from multiple sources:
 * - messages table (email, sms, whatsapp, chat)
 * - engagement_actions (social comments)
 * - conversations table
 * 
 * Usage:
 * - GET /api/inbox?workspaceId=xxx&category=all
 * - POST /api/inbox (send reply)
 * - PUT /api/inbox (mark as read)
 */

function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const allowedOrigins = [
    'https://engage-hub-ten.vercel.app',
    'https://www.engagehub.co.za',
    'http://localhost:3000',
    'http://localhost:5173'
  ];

  const origin = (req.headers.origin || '').toString();
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const { workspaceId, category } = req.query;
  const method = req.method;

  // Validate environment
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Server configuration error'
    });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // GET - Fetch inbox messages
    if (method === 'GET') {
      if (!workspaceId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: workspaceId'
        });
      }

      const allMessages: any[] = [];

      // 1. Fetch from messages table (email, sms, whatsapp, chat)
      const { data: directMessages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!messagesError && directMessages) {
        directMessages.forEach((msg: any) => {
          allMessages.push({
            id: msg.id,
            sender: msg.sender || 'Unknown',
            text: msg.body || msg.subject || '',
            time: msg.created_at,
            platform: msg.channel || 'email',
            category: msg.channel === 'whatsapp' ? 'whatsapp' : 
                      msg.channel === 'chat' ? 'webchat' : 'email',
            unread: msg.status !== 'read',
            direction: msg.direction,
            conversationId: msg.conversation_id,
            source: 'messages'
          });
        });
      }

      // 2. Fetch from engagement_actions (social comments)
      const { data: socialComments, error: commentsError } = await supabase
        .from('engagement_actions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('action_type', 'comment')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!commentsError && socialComments) {
        socialComments.forEach((action: any) => {
          allMessages.push({
            id: action.id,
            sender: action.platform_user_name || action.platform_user_id || 'Unknown User',
            text: action.action_data?.text || action.action_data?.comment || 'Comment',
            time: action.occurred_at || action.created_at,
            platform: action.platform,
            category: action.platform === 'instagram' || action.platform === 'facebook' ? 'comments' : 'dms',
            unread: !action.synced,
            direction: 'inbound',
            postId: action.post_id,
            platformPostId: action.platform_post_id,
            source: 'engagement'
          });
        });
      }

      // 3. Fetch from conversations table if exists
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('last_message_at', { ascending: false })
        .limit(50);

      if (!convError && conversations) {
        conversations.forEach((conv: any) => {
          allMessages.push({
            id: conv.id,
            sender: conv.subject || 'Unknown',
            text: conv.contact_name || conv.last_message_preview || conv.subject || '',
            time: conv.last_message_at || conv.created_at,
            platform: conv.channel || 'email',
            category: conv.channel || 'email',
            unread: !conv.is_read,
            direction: 'inbound',
            source: 'conversations'
          });
        });
      }

      // Sort all messages by time (newest first)
      allMessages.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      // Filter by category if specified
      let filteredMessages = allMessages;
      if (category && category !== 'all') {
        filteredMessages = allMessages.filter((m: any) => m.category === category);
      }

      return res.status(200).json({
        success: true,
        messages: filteredMessages,
        total: filteredMessages.length
      });
    }

    // POST - Send a reply
    if (method === 'POST') {
      const { messageId, content, platform, source, workspaceId: bodyWorkspaceId, platformPostId } = req.body;
      const wsId = bodyWorkspaceId || workspaceId;

      if (!wsId || !content) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: workspaceId, content'
        });
      }

      // Handle reply based on source
      if (source === 'messages') {
        // Update message status to read
        await supabase
          .from('messages')
          .update({ status: 'read' })
          .eq('id', messageId);

        // Create outbound reply message
        const { data: reply, error: replyError } = await supabase
          .from('messages')
          .insert({
            workspace_id: wsId,
            channel: platform || 'email',
            direction: 'outbound',
            body: content,
            status: 'sent',
            conversation_id: messageId
          })
          .select()
          .single();

        if (replyError) {
          return res.status(500).json({ success: false, error: replyError.message });
        }

        return res.status(201).json({ success: true, message: reply });
      }

      if (source === 'engagement') {
        // Create engagement action for reply (comment response)
        const { data: reply, error: replyError } = await supabase
          .from('engagement_actions')
          .insert({
            workspace_id: wsId,
            action_type: 'comment',
            action_data: { text: content, is_reply: true },
            platform: platform,
            platform_post_id: platformPostId,
            source: 'engagehub'
          })
          .select()
          .single();

        if (replyError) {
          return res.status(500).json({ success: false, error: replyError.message });
        }

        return res.status(201).json({ success: true, message: reply });
      }

      return res.status(400).json({ success: false, error: 'Invalid source' });
    }

    // PUT - Mark as read
    if (method === 'PUT') {
      const { messageId, source, workspaceId: bodyWorkspaceId } = req.body;
      const wsId = bodyWorkspaceId || workspaceId;

      if (!wsId || !messageId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: workspaceId, messageId'
        });
      }

      if (source === 'messages') {
        const { error } = await supabase
          .from('messages')
          .update({ status: 'read' })
          .eq('id', messageId)
          .eq('workspace_id', wsId);

        if (error) {
          return res.status(500).json({ success: false, error: error.message });
        }
      } else if (source === 'engagement') {
        const { error } = await supabase
          .from('engagement_actions')
          .update({ synced: true })
          .eq('id', messageId)
          .eq('workspace_id', wsId);

        if (error) {
          return res.status(500).json({ success: false, error: error.message });
        }
      } else if (source === 'conversations') {
        const { error } = await supabase
          .from('conversations')
          .update({ is_read: true })
          .eq('id', messageId)
          .eq('workspace_id', wsId);

        if (error) {
          return res.status(500).json({ success: false, error: error.message });
        }
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error: any) {
    console.error('[Inbox API] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
