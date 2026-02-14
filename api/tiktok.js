require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ------------------------------------------------------------------
//  TikTok Webhook Handler
// ------------------------------------------------------------------
async function handleTikTokWebhook(req, res) {
  console.log('🎵 TikTok webhook received:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  // Verify webhook signature
  const signature = req.headers['x-tiktok-signature'];
  const timestamp = req.headers['x-tiktok-timestamp'];
  
  if (!signature || !timestamp) {
    console.warn('⚠️ Missing TikTok webhook headers');
    return res.status(400).json({ error: 'Missing required headers' });
  }

  // Create expected signature
  const bodyString = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', process.env.TIKTOK_WEBHOOK_SECRET)
    .update(`${timestamp}.${bodyString}`)
    .digest('hex');

  // Verify authenticity
  if (signature !== expectedSignature) {
    console.error('❌ Invalid TikTok webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log('✅ TikTok webhook signature verified');

  try {
    const { event, data, timestamp } = req.body;
    const workspaceId = req.body.workspace_id || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

    console.log('📋 TikTok event:', event);
    console.log('📊 Event data:', data);

    // Handle different event types
    switch (event) {
      case 'video.upload':
        await handleVideoUpload(data, workspaceId);
        break;
        
      case 'video.status':
        await handleVideoStatusUpdate(data, workspaceId);
        break;
        
      case 'comment.create':
        await handleCommentCreate(data, workspaceId);
        break;
        
      case 'follower.update':
        await handleFollowerUpdate(data, workspaceId);
        break;
        
      default:
        console.log('❓ Unknown TikTok event:', event);
    }

    // Always respond with 200 OK
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      event: event,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ TikTok webhook error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error.message 
    });
  }
}

// ------------------------------------------------------------------
//  Event Handlers
// ------------------------------------------------------------------
async function handleVideoUpload(data, workspaceId) {
  console.log('📹 TikTok video uploaded:', data.video_id);
  
  try {
    // Save video to database
    const { error } = await supabase
      .from('tiktok_videos')
      .upsert({
        workspace_id: workspaceId,
        video_id: data.video_id,
        title: data.title,
        description: data.description,
        duration: data.duration,
        view_count: data.view_count || 0,
        like_count: data.like_count || 0,
        comment_count: data.comment_count || 0,
        share_count: data.share_count || 0,
        thumbnail_url: data.thumbnail_url,
        video_url: data.video_url,
        hashtags: data.hashtags || [],
        privacy_level: data.privacy_level,
        is_duet: data.is_duet || false,
        is_stitch: data.is_stitch || false,
        create_time: data.create_time,
        platform: 'tiktok',
        status: 'uploaded'
      }, { 
        onConflict: 'workspace_id,video_id' 
      });

    if (error) {
      console.error('❌ Failed to save TikTok video:', error);
    } else {
      console.log('✅ TikTok video saved to database');
      
      // Trigger notification or processing if needed
      // You could add logic here to automatically publish to other platforms
    }

  } catch (err) {
    console.error('❌ Error handling video upload:', err);
  }
}

async function handleVideoStatusUpdate(data, workspaceId) {
  console.log('📊 TikTok video status update:', data.video_id, '->', data.status);
  
  try {
    const { error } = await supabase
      .from('tiktok_videos')
      .update({ 
        status: data.status,
        view_count: data.view_count,
        like_count: data.like_count,
        comment_count: data.comment_count,
        share_count: data.share_count,
        updated_time: data.updated_time,
        rejection_reason: data.rejection_reason
      })
      .eq('video_id', data.video_id)
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('❌ Failed to update video status:', error);
    } else {
      console.log('✅ TikTok video status updated');
    }

  } catch (err) {
    console.error('❌ Error handling status update:', err);
  }
}

async function handleCommentCreate(data, workspaceId) {
  console.log('💬 TikTok comment created:', data.comment_id);
  
  try {
    const { error } = await supabase
      .from('tiktok_comments')
      .insert({
        workspace_id: workspaceId,
        comment_id: data.comment_id,
        video_id: data.video_id,
        user_id: data.user_id,
        username: data.username,
        profile_picture: data.profile_picture,
        comment_text: data.comment_text,
        like_count: data.like_count || 0,
        create_time: data.create_time,
        platform: 'tiktok'
      });

    if (error) {
      console.error('❌ Failed to save TikTok comment:', error);
    } else {
      console.log('✅ TikTok comment saved');
    }

  } catch (err) {
    console.error('❌ Error handling comment:', err);
  }
}

async function handleFollowerUpdate(data, workspaceId) {
  console.log('👥 TikTok follower update:', data.username, '->', data.follower_count);
  
  try {
    const { error } = await supabase
      .from('tiktok_accounts')
      .upsert({
        workspace_id: workspaceId,
        user_id: data.user_id,
        username: data.username,
        follower_count: data.follower_count,
        following_count: data.following_count,
        video_count: data.video_count,
        like_count_total: data.like_count_total,
        change_type: data.change_type,
        updated_time: data.updated_time,
        platform: 'tiktok'
      }, { 
        onConflict: 'workspace_id,user_id' 
      });

    if (error) {
      console.error('❌ Failed to update follower count:', error);
    } else {
      console.log('✅ TikTok follower data updated');
    }

  } catch (err) {
    console.error('❌ Error handling follower update:', err);
  }
}

// ------------------------------------------------------------------
//  Exports
// ------------------------------------------------------------------
module.exports = {
  handleTikTokWebhook,
  handleVideoUpload,
  handleVideoStatusUpdate,
  handleCommentCreate,
  handleFollowerUpdate
};
