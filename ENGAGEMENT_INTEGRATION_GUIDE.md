# Engagement System Integration Guide

## Components Created

### 1. **EngagementActions.tsx**
Interactive buttons for liking, commenting, sharing with real-time sync to native platforms.

**Features:**
- Like/Unlike with optimistic UI updates
- Comment button (opens modal)
- Share/Repost buttons (platform-specific)
- Save/Bookmark (Instagram, TikTok)
- Real-time updates via Supabase Realtime
- Shows native + EngageHub aggregated counts
- Bi-directional sync (EngageHub → Native platform)

### 2. **CommentsSection.tsx**
Full comments interface with create, read, delete and bidirectional sync.

**Features:**
- Post comments from EngageHub → synced to native platform
- Display native platform comments in EngageHub
- Real-time comment updates
- Source badges (native vs EngageHub)
- Sync status indicators (pending, synced, failed)
- Delete your own comments
- Relative timestamps

### 3. **EngagementMetrics.tsx**
Analytics dashboard showing aggregated engagement metrics.

**Features:**
- Likes, Comments, Shares, Views, Saves, Reposts
- Engagement rate calculation
- Breakdown of native vs EngageHub counts
- Compact mode for cards
- Full mode for analytics pages

---

## Integration Examples

### Example 1: Add to Content Feed Post Card

Update your `ContentCard` component:

```tsx
import EngagementActions from '@/components/EngagementActions';
import EngagementMetrics from '@/components/EngagementMetrics';

export default function ContentCard({ post, workspaceId, userId, userName }) {
  const [showMetrics, setShowMetrics] = useState(false);

  return (
    <div className="border rounded-lg p-4">
      {/* Post content */}
      <div className="mb-4">
        <h3>{post.title}</h3>
        <p>{post.content}</p>
        {post.media && <img src={post.media} alt="" />}
      </div>

      {/* Engagement Actions */}
      <EngagementActions
        workspaceId={workspaceId}
        userId={userId}
        postId={post.id}
        platformPostId={post.facebook_post_id} // or instagram_post_id, etc.
        platform="facebook"
      />

      {/* Toggle detailed metrics */}
      <button
        onClick={() => setShowMetrics(!showMetrics)}
        className="text-sm text-blue-500 mt-2"
      >
        {showMetrics ? 'Hide' : 'Show'} Detailed Metrics
      </button>

      {showMetrics && (
        <div className="mt-4">
          <EngagementMetrics
            workspaceId={workspaceId}
            platformPostId={post.facebook_post_id}
            platform="facebook"
            showBreakdown={true}
          />
        </div>
      )}
    </div>
  );
}
```

### Example 2: Full Post Detail Page

Create a new page `/posts/[id].tsx`:

```tsx
import { useState } from 'react';
import EngagementActions from '@/components/EngagementActions';
import EngagementMetrics from '@/components/EngagementMetrics';
import CommentsSection from '@/components/CommentsSection';

export default function PostDetailPage() {
  const workspaceId = 'your-workspace-id';
  const userId = 'user-id';
  const userName = 'User Name';
  const userAvatar = 'https://...';

  const post = {
    id: 'local-post-id',
    facebook_post_id: '123456789_987654321',
    platform: 'facebook',
    title: 'My Post Title',
    content: 'Post content...',
    media: 'https://...',
    created_at: '2024-01-15T10:00:00Z'
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Post Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
        <p className="text-gray-700 mb-4">{post.content}</p>
        {post.media && (
          <img
            src={post.media}
            alt=""
            className="w-full rounded-lg mb-4"
          />
        )}

        {/* Engagement Actions */}
        <EngagementActions
          workspaceId={workspaceId}
          userId={userId}
          postId={post.id}
          platformPostId={post.facebook_post_id}
          platform={post.platform}
        />
      </div>

      {/* Engagement Metrics */}
      <div className="mb-6">
        <EngagementMetrics
          workspaceId={workspaceId}
          platformPostId={post.facebook_post_id}
          platform={post.platform}
          showBreakdown={true}
        />
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        <CommentsSection
          workspaceId={workspaceId}
          userId={userId}
          userName={userName}
          userAvatar={userAvatar}
          postId={post.id}
          platformPostId={post.facebook_post_id}
          platform={post.platform}
          maxHeight="600px"
        />
      </div>
    </div>
  );
}
```

### Example 3: Analytics Dashboard

Show aggregated metrics across all posts:

```tsx
import { useEffect, useState } from 'react';
import EngagementMetrics from '@/components/EngagementMetrics';

export default function AnalyticsDashboard() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Fetch all posts from your database
    fetchPosts().then(setPosts);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <div key={post.id}>
            <h3 className="font-semibold mb-2">{post.title}</h3>
            <EngagementMetrics
              workspaceId={post.workspace_id}
              platformPostId={post.platform_post_id}
              platform={post.platform}
              showBreakdown={false}
              compact={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 4: Simple Card View with Compact Metrics

```tsx
import EngagementMetrics from '@/components/EngagementMetrics';

export default function PostCard({ post }) {
  return (
    <div className="border rounded p-4">
      <h4 className="font-semibold mb-2">{post.title}</h4>
      <p className="text-sm text-gray-600 mb-3">{post.excerpt}</p>

      {/* Compact metrics - just icons and counts */}
      <EngagementMetrics
        workspaceId={post.workspace_id}
        platformPostId={post.platform_post_id}
        platform={post.platform}
        compact={true}
      />
    </div>
  );
}
```

---

## Database Setup

Before using these components, you must run the SQL script:

```sql
-- Run this in Supabase SQL Editor
-- See: create_engagement_tables.sql
```

This creates:
- `engagement_actions` - Individual engagement events
- `engagement_aggregates` - Auto-computed totals
- `platform_webhook_events` - Webhook audit log
- `engagement_sync_queue` - Queue for syncing to native platforms

---

## API Deployment

Deploy the engagement API:

```bash
git add api/engagement.ts
git commit -m "Add engagement API endpoint"
git push origin main
```

The API will be available at `/api/engagement` with these actions:
- `POST ?action=create` - Create engagement
- `GET ?action=list` - List engagements
- `GET ?action=aggregates` - Get totals
- `DELETE` - Remove engagement

---

## Real-time Setup

Enable Supabase Realtime for the tables:

1. Go to Supabase Dashboard → Database → Replication
2. Enable replication for:
   - `engagement_actions`
   - `engagement_aggregates`

This allows the components to receive instant updates when engagement happens.

---

## Platform-Specific Notes

### Facebook
- Supports: likes, comments, shares
- Requires `pages_read_engagement` and `pages_manage_engagement` scopes
- Comments sync via Graph API

### Instagram
- Supports: likes, comments, saves
- No native shares (Instagram doesn't support public sharing)
- Requires `instagram_basic`, `instagram_manage_comments` scopes

### TikTok
- Supports: likes, comments, shares, saves, reposts
- Requires `video.list`, `comment.list.manage` scopes
- Comments require video creator permissions

### YouTube
- Supports: likes, comments, shares, views
- Requires `youtube.readonly`, `youtube.force-ssl` scopes
- Comments via YouTube Data API v3

### Twitter (X)
- Supports: likes, retweets, replies, views
- Requires Twitter API v2 with OAuth 2.0
- Rate limits apply

### LinkedIn
- Supports: likes, comments, shares
- Requires `r_organization_social`, `w_organization_social` scopes
- Comments limited to organization pages

### WhatsApp
- Limited engagement (mostly views, replies)
- Business API only
- Primarily for customer service use case

---

## Testing the Integration

1. **Create some test engagement:**
```bash
curl -X POST http://localhost:3000/api/engagement?action=create \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "your-workspace-id",
    "userId": "user-id",
    "platformPostId": "123_456",
    "platform": "facebook",
    "actionType": "like"
  }'
```

2. **Fetch aggregates:**
```bash
curl "http://localhost:3000/api/engagement?action=aggregates&workspaceId=xxx&platformPostId=123_456&platform=facebook"
```

3. **Check real-time updates:**
- Open two browser tabs
- Like a post in one tab
- See the count update instantly in the other tab

---

## Next Steps

1. ✅ Database schema created
2. ✅ API endpoint created
3. ✅ Frontend components created
4. ⏳ Deploy API to production
5. ⏳ Run SQL script in Supabase
6. ⏳ Enable Realtime on tables
7. ⏳ Implement platform-specific webhook handlers
8. ⏳ Create sync worker for EngageHub → Native platform
9. ⏳ Add to existing post views

See `ENGAGEMENT_SYNC_PLAN.md` for the complete implementation roadmap.
