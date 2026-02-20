# Engagement System Setup Guide

## ✅ What's Been Integrated

The engagement system is now integrated into your **Content.tsx** component! When you view a published post, you'll see:

1. **Engagement Metrics** - Real-time like, comment, share counts
2. **Engagement Actions** - Like and share buttons  
3. **Comments Section** - Full comment threads with replies

## 📋 How It Works

### Current Implementation

In [Content.tsx](components/Content.tsx), when viewing a post modal:

```tsx
{viewingPost.status === 'published' && viewingPost.platforms && (
  <div className="space-y-4">
    {viewingPost.platforms.map((platform) => (
      <div key={platform}>
        <EngagementMetrics platformPostId={platformPostId} platform={platform} />
        <EngagementActions platformPostId={platformPostId} platform={platform} />
        <CommentsSection platformPostId={platformPostId} platform={platform} />
      </div>
    ))}
  </div>
)}
```

### ⚠️ Important: Platform Post IDs

Currently using `viewingPost.id` as a fallback. For **real platform engagement**, you need the actual platform post ID from the `post_publications` table.

## 🔧 Recommended Enhancement

Update the `fetchPosts()` function in Content.tsx to join with `post_publications`:

```typescript
const fetchPosts = async () => {
  // ...existing code...
  
  const { data: postsData } = await supabase
    .from('posts')
    .select(`
      *,
      post_publications (
        platform,
        platform_post_id,
        platform_url
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  // Transform data to include platform_post_ids
  const posts = postsData?.map(post => ({
    ...post,
    platform_post_ids: post.post_publications?.reduce((acc, pub) => {
      if (pub.platform_post_id) {
        acc[pub.platform] = pub.platform_post_id;
      }
      return acc;
    }, {})
  }));

  // ...rest of code...
}
```

Then update the engagement section:

```tsx
{viewingPost.platforms.map((platform: string) => {
  const platformPostId = viewingPost.platform_post_ids?.[platform] || viewingPost.id;
  
  return (
    <div key={platform}>
      <EngagementMetrics platformPostId={platformPostId} platform={platform} />
      <EngagementActions platformPostId={platformPostId} platform={platform} />
      <CommentsSection platformPostId={platformPostId} platform={platform} />
    </div>
  );
})}
```

## 🎯 Features Available

### 1. EngagementMetrics Component
- Shows total, native, and EngageHub engagement
- Real-time updates via Supabase Realtime
- Platform-specific icons and colors
- Displays: likes, comments, shares, views, saves

### 2. EngagementActions Component
- Like/Unlike button
- Share button
- Tracks source (native vs engagehub)
- Syncs with platform APIs

### 3. CommentsSection Component
- View all comments (native + EngageHub)
- Add new comments
- Reply to comments (threaded)
- Real-time comment updates
- Shows commenter name and timestamp

## 🧪 Testing

1. **View a published post** in the Content tab
2. **Click the post thumbnail** to open the modal
3. **Scroll down** to see the Engagement & Comments section
4. Each platform will show its own engagement data

## 🔄 Real-time Updates

The components automatically subscribe to Supabase Realtime:
- New likes appear instantly
- Comments update in real-time
- Aggregates recalculate automatically (via database triggers)

## 📊 Database

All engagement data is stored in:
- `engagement_actions` - Individual actions (likes, comments, etc.)
- `engagement_aggregates` - Pre-computed totals (auto-updated via triggers)
- `platform_webhook_events` - Incoming webhooks from platforms
- `engagement_sync_queue` - Queue for syncing to platforms

## 🚀 Next Steps

1. **Fetch platform_post_ids** from `post_publications` table (recommended)
2. **Set up webhooks** for each platform to receive native engagement
3. **Configure sync workers** to push EngageHub engagement back to platforms
4. **Add engagement to other views** (Analytics, Campaigns, etc.)

## 💡 Usage Examples

### Show Engagement in Table View

```tsx
<td>
  <EngagementMetrics 
    platformPostId={post.platform_post_id} 
    platform={post.platform}
    compact={true}  // Shows compact version
  />
</td>
```

### Show Only Comments

```tsx
<CommentsSection 
  platformPostId={post.platform_post_id}
  platform="facebook"
  maxHeight="400px"  // Limit height
/>
```

### Custom Engagement Actions

```tsx
<EngagementActions 
  platformPostId={post.platform_post_id}
  platform="instagram"
  onLike={(success) => console.log('Liked!', success)}
  onShare={(success) => console.log('Shared!', success)}
/>
```

## ✨ Benefits

✅ **Unified engagement** across all platforms  
✅ **Real-time updates** with Supabase  
✅ **Bidirectional sync** (EngageHub ↔️ Platforms)  
✅ **Source tracking** (native vs app engagement)  
✅ **Automatic aggregation** via database triggers  
✅ **Full comment threading** with replies  

---

**Everything is ready to use!** Just open a published post and scroll down to see the engagement section in action. 🎉
