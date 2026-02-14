# TikTok Webhook Payload Examples

## Video Upload Event
```json
{
  "event": "video.upload",
  "timestamp": "2024-02-14T10:30:00Z",
  "data": {
    "video_id": "v12345678901234567890",
    "title": "My TikTok Video",
    "description": "Check out my new video!",
    "duration": 30,
    "view_count": 0,
    "like_count": 0,
    "comment_count": 0,
    "share_count": 0,
    "create_time": "2024-02-14T10:30:00Z",
    "thumbnail_url": "https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-123456/abcd1234",
    "video_url": "https://v16-web.tiktokcdn.com/1234567890.mp4",
    "hashtags": ["#fyp", "#viral", "#tiktok"],
    "privacy_level": "public",
    "is_duet": false,
    "is_stitch": false
  }
}
```

## Video Status Update Event
```json
{
  "event": "video.status",
  "timestamp": "2024-02-14T10:35:00Z",
  "data": {
    "video_id": "v12345678901234567890",
    "status": "processing", // processing, published, failed, removed
    "previous_status": "processing",
    "view_count": 150,
    "like_count": 25,
    "comment_count": 8,
    "share_count": 3,
    "updated_time": "2024-02-14T10:35:00Z",
    "rejection_reason": null // Only present if status is "failed"
  }
}
```

## Comment Event
```json
{
  "event": "comment.create",
  "timestamp": "2024-02-14T10:45:00Z",
  "data": {
    "comment_id": "c12345678901234567890",
    "video_id": "v12345678901234567890",
    "user_id": "u12345678901234567890",
    "username": "user123",
    "profile_picture": "https://p16-sign-va.tiktokcdn.com/img/user123~c5_100x100.jpeg",
    "comment_text": "Great video! 🔥",
    "create_time": "2024-02-14T10:45:00Z",
    "like_count": 5
  }
}
```

## Follower Update Event
```json
{
  "event": "follower.update",
  "timestamp": "2024-02-14T11:00:00Z",
  "data": {
    "user_id": "u12345678901234567890",
    "username": "user123",
    "follower_count": 1000,
    "following_count": 500,
    "video_count": 25,
    "like_count_total": 5000,
    "previous_follower_count": 999,
    "change_type": "increase", // increase, decrease
    "updated_time": "2024-02-14T11:00:00Z"
  }
}
```

## Authentication Header
TikTok sends webhook requests with:
- **X-TikTok-Signature**: HMAC-SHA256 signature
- **X-TikTok-Timestamp**: Request timestamp
- **Content-Type**: application/json

## Security Verification
Always verify webhook authenticity:
```js
const crypto = require('crypto');
const signature = req.headers['x-tiktok-signature'];
const timestamp = req.headers['x-tiktok-timestamp'];
const body = JSON.stringify(req.body);

const expectedSignature = crypto
  .createHmac('sha256', process.env.TIKTOK_WEBHOOK_SECRET)
  .update(`${timestamp}.${body}`)
  .digest('hex');

if (signature !== expectedSignature) {
  return res.status(401).send('Invalid signature');
}
```
