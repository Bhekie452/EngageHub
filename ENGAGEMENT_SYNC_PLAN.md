# 🔁 BIDIRECTIONAL ENGAGEMENT SYNC - IMPLEMENTATION PLAN

## 📋 Overview
Implement full bidirectional engagement sync for all EngageHub-supported platforms: Facebook, Instagram, Twitter, LinkedIn, YouTube, TikTok, WhatsApp.

## 🎯 Core Requirements
1. **Native → EngageHub**: Capture engagement on native platforms and sync to EngageHub DB
2. **EngageHub → Native**: Push engagement actions from EngageHub to native platforms
3. **Aggregation**: Display `total = native + engagehub` for all metrics
4. **Source Tracking**: Track whether each action came from native platform or EngageHub
5. **Real-time Updates**: Use webhooks where available, polling otherwise

---

## 📊 Database Schema (Created)
- ✅ `engagement_actions` - Stores individual engagement events
- ✅ `engagement_aggregates` - Pre-computed totals for performance
- ✅ `platform_webhook_events` - Audit log of webhook events
- ✅ `engagement_sync_queue` - Queue for syncing EngageHub actions to native platforms

---

## 🔧 IMPLEMENTATION PHASES

### PHASE 1: Core Infrastructure ⚙️

#### 1.1 Backend API Endpoints
**File:** `api/engagement.ts`
- [ ] `POST /api/engagement` - Create engagement action (like, comment, share, etc.)
- [ ] `GET /api/engagement?post_id=X` - Get engagement for a post
- [ ] `GET /api/engagement/aggregates?post_id=X` - Get aggregated counts
- [ ] `DELETE /api/engagement/:id` - Remove engagement (unlike, delete comment)

#### 1.2 Sync Worker
**File:** `api/engagement-sync-worker.ts`
- [ ] Process `engagement_sync_queue` table
- [ ] Push EngageHub actions to native platforms via APIs
- [ ] Retry logic with exponential backoff
- [ ] Update sync status

#### 1.3 Webhook Handlers
**Files:** `api/webhooks/[platform].ts`
- [ ] `/api/webhooks/facebook` - Handle Facebook webhooks
- [ ] `/api/webhooks/instagram` - Handle Instagram webhooks  
- [ ] `/api/webhooks/youtube` - Handle YouTube webhooks
- [ ] `/api/webhooks/tiktok` - Handle TikTok webhooks
- [ ] Validate webhook signatures
- [ ] Parse events and create `engagement_actions`

---

### PHASE 2: Platform-Specific Implementation 🌐

#### 2.1 Facebook
**Engagement Types:** Likes, Comments, Shares, Views

**Native → EngageHub:**
- [ ] Set up Facebook webhook subscriptions (feed, mention, comments)
- [ ] Parse webhook events and save to `engagement_actions`
- [ ] OR: Poll Graph API `/posts/{id}/likes`, `/posts/{id}/comments`

**EngageHub → Native:**
- [ ] Like: `POST /posts/{id}/likes`
- [ ] Comment: `POST /posts/{id}/comments`
- [ ] Unlike: `DELETE /posts/{id}/likes`
- [ ] Delete comment: `DELETE /comments/{id}`

---

#### 2.2 Instagram
**Engagement Types:** Likes, Comments, Saves

**Native → EngageHub:**
- [ ] Use Instagram Graph API webhooks (comments, mentions)
- [ ] Poll `/media/{id}/comments` for new comments
- [ ] Poll `/media/{id}` for likes (in insights field)

**EngageHub → Native:**
- [ ] Comment: `POST /media/{id}/comments`
- [ ] Delete comment: `DELETE /comments/{id}`
- [ ] Like: POST /{media-id}/likes`
- [ ] Unlike: `DELETE /{media-id}/likes`

---

#### 2.3 Twitter/X
**Engagement Types:** Likes, Retweets, Replies, Views

**Native → EngageHub:**
- [ ] Use Twitter API v2 webhooks (tweet engagement events)
- [ ] OR: Poll `/tweets/:id/liking_users`, `/tweets/:id/retweeted_by`

**EngageHub → Native:**
- [ ] Like: `POST /tweets/:id/like`
- [ ] Unlike: `POST /tweets/:id/unlike`
- [ ] Retweet: `POST /tweets/:id/retweet`
- [ ] Reply: `POST /tweets` with `reply` field

---

#### 2.4 LinkedIn
**Engagement Types:** Likes, Comments, Shares

**Native → EngageHub:**
- [ ] Poll LinkedIn API `/socialActions/{shareUrn}/likes`
- [ ] Poll `/socialActions/{shareUrn}/comments`

**EngageHub → Native:**
- [ ] Like: `POST /socialActions/{shareUrn}/likes`
- [ ] Comment: `POST /socialActions/{shareUrn}/comments`
- [ ] Share: `POST /shares`

---

#### 2.5 YouTube
**Engagement Types:** Likes, Comments, Dislikes, Views

**Native → EngageHub:**
- [ ] Use YouTube Data API v3
- [ ] Poll `/videos?part=statistics` for likes/views
- [ ] Poll `/commentThreads?videoId={id}` for comments
- [ ] Use YouTube PubSubHubbub webhooks (optional)

**EngageHub → Native:**
- [ ] Like: `POST /videos/rate` with `rating=like`
- [ ] Dislike: `POST /videos/rate` with `rating=dislike`
- [ ] Comment: `POST /commentThreads`
- [ ] Reply: `POST /comments`

---

#### 2.6 TikTok
**Engagement Types:** Likes, Comments, Shares, Views

**Native → EngageHub:**
- [ ] Use TikTok Webhooks API (video.comment.create, video.like)
- [ ] OR: Poll TikTok Open API `/video/comment/list/`, `/video/like/list/`

**EngageHub → Native:**
- [ ] Like: `POST /video/like/` (TikTok Open API)
- [ ] Comment: `POST /video/comment/publish/`

---

#### 2.7 WhatsApp Business
**Engagement Types:** Messages, Reactions

**Native → EngageHub:**
- [ ] Use WhatsApp Business API webhooks (messages, reactions)
- [ ] Parse webhook events for message reactions

**EngageHub → Native:**
- [ ] Send message: `POST /messages`
- [ ] React: `POST /messages` with `reaction` payload

---

### PHASE 3: Frontend Components 🎨

#### 3.1 Engagement Display Component
**File:** `components/EngagementMetrics.tsx`
- [ ] Display aggregated counts (likes, comments, shares, etc.)
- [ ] Show breakdown: native vs EngageHub
- [ ] Real-time updates via Supabase realtime
- [ ] Platform-specific icons and styling

#### 3.2 Engagement Action Buttons
**File:** `components/EngagementActions.tsx`
- [ ] Like button (heart icon)
- [ ] Comment button (opens comment modal)
- [ ] Share button
- [ ] Platform-specific actions (save for Instagram, retweet for Twitter)
- [ ] Optimistic UI updates
- [ ] Error handling and rollback

#### 3.3 Comments Section
**File:** `components/CommentsSection.tsx`
- [ ] List all comments (native + EngageHub)
- [ ] Show comment source badge
- [ ] Reply functionality
- [ ] Delete own comments
- [ ] Real-time comment updates

#### 3.4 Post Metrics Modal
**File:** `components/PostMetricsModal.tsx`
- [ ] Detailed engagement breakdown
- [ ] List of users who liked/shared
- [ ] Engagement timeline
- [ ] Export engagement data

---

### PHASE 4: Real-time Sync & Polling 🔄

#### 4.1 Supabase Realtime
- [ ] Subscribe to `engagement_actions` table changes
- [ ] Subscribe to `engagement_aggregates` table changes
- [ ] Update UI in real-time when new engagement arrives

#### 4.2 Polling Service
**File:** `services/engagement-poller.ts`
- [ ] Background service to poll platforms without webhooks
- [ ] Configurable poll intervals per platform
- [ ] Rate limiting to respect API quotas
- [ ] Batch processing for efficiency

#### 4.3 Webhook Verification
- [ ] Verify Facebook webhook signatures
- [ ] Verify TikTok webhook signatures
- [ ] Verify YouTube PubSubHubbub
- [ ] Log all webhook events for debugging

---

## 🚀 DEPLOYMENT CHECKLIST

### Platform Configuration
- [ ] Facebook: Set up App webhooks for feed, comments, mentions
- [ ] Instagram: Configure webhooks for comments
- [ ] Twitter: Register webhook URL and subscribe to events
- [ ] TikTok: Set up TikTok Developer webhooks
- [ ] YouTube: Subscribe to PubSubHubbub (optional)
- [ ] LinkedIn: (Uses polling only)
- [ ] WhatsApp: Configure Business API webhooks

### Environment Variables
```env
# Webhook Secrets
FACEBOOK_WEBHOOK_SECRET=xxx
INSTAGRAM_WEBHOOK_SECRET=xxx
TWITTER_WEBHOOK_SECRET=xxx
TIKTOK_WEBHOOK_SECRET=xxx
YOUTUBE_PUBSUB_SECRET=xxx
WHATSAPP_WEBHOOK_SECRET=xxx

# Sync Worker Settings
ENGAGEMENT_SYNC_INTERVAL=60000 # 1 minute
ENGAGEMENT_POLL_INTERVAL=300000 # 5 minutes
```

### Supabase Setup
1. Run `create_engagement_tables.sql` in Supabase SQL Editor
2. Enable Realtime for `engagement_actions` and `engagement_aggregates`
3. Set up scheduled job for sync worker (via pg_cron or external cron)

---

## 📈 TESTING STRATEGY

### Unit Tests
- [ ] Test engagement action creation
- [ ] Test aggregation logic
- [ ] Test webhook signature verification
- [ ] Test API endpoint authorization

### Integration Tests
- [ ] Test full bidirectional sync flow
- [ ] Test webhook event processing
- [ ] Test duplicate detection
- [ ] Test sync queue processing

### Platform-Specific Tests
- [ ] Test each platform's API endpoints
- [ ] Verify webhook payloads match expected schema
- [ ] Test rate limiting and error handling

---

## 🎯 SUCCESS METRICS

1. **Sync Accuracy:** 99.9% of native engagement synced within 60 seconds
2. **EngageHub → Native Success Rate:** >95% of actions pushed successfully
3. **Real-time Updates:** Engagement updates visible in UI within 5 seconds
4. **Zero Data Loss:** All failed syncs queued and retried
5. **Performance:** Aggregates load in <200ms

---

## 📚 RESOURCES

### Platform API Documentation
- Facebook Graph API: https://developers.facebook.com/docs/graph-api
- Instagram Graph API: https://developers.facebook.com/docs/instagram-api
- Twitter API v2: https://developer.twitter.com/en/docs/twitter-api
- LinkedIn API: https://learn.microsoft.com/en-us/linkedin/
- YouTube Data API: https://developers.google.com/youtube/v3
- TikTok Open API: https://developers.tiktok.com/doc/
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp

### Webhook Setup Guides
- Facebook: https://developers.facebook.com/docs/graph-api/webhooks
- TikTok: https://developers.tiktok.com/doc/webhooks-overview
- YouTube PubSubHubbub: https://developers.google.com/youtube/v3/guides/push_notifications
