import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Handler for getting post engagement metrics
const handleGetPostEngagement = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // This is currently a mock/placeholder in the catch-all
    return res.status(200).json({ status: 'success', message: 'Engagement metrics fetched (mock)' });
  } catch (error) {
    console.error('Error getting post engagement:', error);
    return res.status(500).json({ error: 'Failed to get post engagement' });
  }
};

// Handler for processing scheduled posts
const handleProcessScheduledPosts = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    return res.status(200).json({ status: 'success', message: 'Scheduled posts processing triggered' });
  } catch (error) {
    console.error('Error processing scheduled posts:', error);
    return res.status(500).json({ error: 'Failed to process scheduled posts' });
  }
};

// Handler for publishing campaigns
const handlePublishCampaign = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    return res.status(200).json({ status: 'success', message: 'Campaign publishing triggered' });
  } catch (error) {
    console.error('Error publishing campaign:', error);
    return res.status(500).json({ error: 'Failed to publish campaign' });
  }
};

// Handler for publishing individual posts (The core logic for the reported issue)
const handlePublishPost = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      expected: 'POST',
      received: req.method
    });
  }

  try {
    const { content, platforms, mediaUrls, workspaceId, accountTokens, postId } = req.body || {};
    
    console.log('[publish-post] Request received:', { platforms, content, workspaceId });
    
    if (!platforms || !Array.isArray(platforms)) {
      return res.status(400).json({ error: 'Missing platforms' });
    }

    const results: any = {};
    const successPlatforms: string[] = [];
    const failedPlatforms: any[] = [];

    for (const platform of platforms) {
      const plat = platform.toLowerCase();
      
      try {
        if (plat === 'youtube') {
          console.log('[publish-post] Publishing to YouTube via Edge Function');
          const workspaceIdToUse = workspaceId || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
          
          const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/youtube-api`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              endpoint: 'upload-video',
              workspaceId: workspaceIdToUse,
              title: content?.substring(0, 100) || 'Video from EngageHub',
              description: content || 'Video uploaded via EngageHub platform',
              mediaUrl: mediaUrls?.[0] || '', 
              tags: ['EngageHub', 'Social Media'],
              privacyStatus: 'public'
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `YouTube Edge Function failed with status ${response.status}`);
          }

          const result = await response.json();
          results.youtube = { status: 'published', videoId: result.videoId, url: result.url };
          successPlatforms.push('youtube');
        } 
        else if (plat === 'facebook' || plat === 'instagram') {
          // Check if we have tokens from request or environment
          let token = accountTokens?.[plat]?.access_token || process.env.FACEBOOK_LONG_TERM_TOKEN;
          let accountId = accountTokens?.[plat]?.account_id;

          if (!token) {
            throw new Error(`No ${plat} token available`);
          }

          if (plat === 'facebook') {
            // If we have a specific page token and ID from client, use it
            const targetId = accountId || 'me'; // Default to 'me' if not provided
            const postUrl = `https://graph.facebook.com/v21.0/${targetId}/feed`;
            
            const postResponse = await fetch(postUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: content,
                access_token: token,
                ...(mediaUrls?.[0] && { link: mediaUrls[0] })
              })
            });
            
            const postResult = await postResponse.json();
            if (postResult.error) throw new Error(postResult.error.message);
            
            // 🔥 CRITICAL: Save Facebook post ID to post_publications for engagement sync
            try {
              // Get the social_account_id from the tokens or look it up
              let socialAccountId = accountTokens?.facebook?.id || accountTokens?.facebook?.social_account_id;
              
              // If we don't have social_account_id, try to find it
              if (!socialAccountId && accountId) {
                const { data: accountData } = await supabase
                  .from('social_accounts')
                  .select('id')
                  .eq('account_id', accountId)
                  .eq('platform', 'facebook')
                  .maybeSingle();
                if (accountData) socialAccountId = accountData.id;
              }
              
              if (socialAccountId && postId) {
                // Insert or update the post_publications record
                const { error: pubError } = await supabase
                  .from('post_publications')
                  .upsert({
                    post_id: postId,
                    social_account_id: socialAccountId,
                    platform: 'facebook',
                    platform_post_id: postResult.id,
                    platform_url: `https://facebook.com/${postResult.id}`,
                    status: 'published',
                    published_at: new Date().toISOString()
                  }, { onConflict: 'post_id,social_account_id' });
                
                if (pubError) {
                  console.error('[publish-post] Failed to save to post_publications:', pubError);
                } else {
                  console.log('[publish-post] Saved Facebook post to post_publications:', postResult.id);
                }
              }
            } catch (pubSaveError) {
              console.error('[publish-post] Error saving post_publications:', pubSaveError);
              // Don't fail the publish if this fails
            }
            
            results.facebook = { status: 'published', postId: postResult.id };
            successPlatforms.push('facebook');
            
            // Trigger Facebook engagement sync in background
            if (workspaceId && postId) {
              try {
                // Get the FB access token for this account
                const fbToken = accountTokens?.facebook?.access_token || process.env.FACEBOOK_LONG_TERM_TOKEN;
                if (fbToken) {
                  // Call the sync-facebook-engagement function in background
                  fetch(`${process.env.SUPABASE_URL}/functions/v1/sync-facebook-engagement`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
                    },
                    body: JSON.stringify({
                      workspaceId,
                      postId,
                      platformPostId: postResult.id,
                      accessToken: fbToken
                    })
                  }).catch(err => console.log('[publish-post] Background sync triggered:', err.message));
                }
              } catch (syncErr) {
                console.log('[publish-post] Failed to trigger sync:', syncErr);
              }
            }
          } else {
            // Instagram logic (simplified redirect/proxy)
            // If accountId missing, try to derive it from a linked Facebook Page (common case when Instagram is connected via Facebook)
            if (!accountId) {
              try {
                const fbPageId = accountTokens?.facebook?.account_id || accountTokens?.page?.account_id;
                if (fbPageId) {
                  const pageLookup = await fetch(`https://graph.facebook.com/v21.0/${fbPageId}?fields=instagram_business_account&access_token=${token}`);
                  const pageData = await pageLookup.json().catch(() => ({}));
                  if (pageData && pageData.instagram_business_account && pageData.instagram_business_account.id) {
                    accountId = pageData.instagram_business_account.id;
                    console.log('[publish-post] Derived Instagram Business Account ID from Facebook Page:', accountId);
                  }
                }
              } catch (deriveErr) {
                console.warn('Could not derive Instagram Business Account ID from Facebook Page:', deriveErr?.message || deriveErr);
              }
            }

            if (!accountId) {
              try {
                const accountsRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${token}`);
                const accountsData = await accountsRes.json().catch(() => ({}));
                const pages = accountsData?.data || [];
                const pageWithIg = pages.find((p: any) => p?.instagram_business_account?.id);
                if (pageWithIg?.instagram_business_account?.id) {
                  accountId = pageWithIg.instagram_business_account.id;
                  if (pageWithIg.access_token) {
                    token = pageWithIg.access_token;
                  }
                  console.log('[publish-post] Derived Instagram Business Account ID from /me/accounts:', accountId);
                }
              } catch (deriveErr) {
                console.warn('Could not derive Instagram Business Account ID from /me/accounts:', deriveErr?.message || deriveErr);
              }
            }

            if (!accountId) throw new Error('Instagram requires a Business Account ID');
            
            // Check if media URLs are provided
            if (!mediaUrls || mediaUrls.length === 0) {
              throw new Error('Media ID is not available. Instagram requires media (image/video) to be uploaded first.');
            }
            
            // Use the first media URL
            const mediaUrl = mediaUrls[0];
            console.log('📸 Instagram media URL from utils.ts:', mediaUrl);
            
            // Step 1: Create media container
            const containerUrl = `https://graph.facebook.com/v21.0/${accountId}/media`;
            const containerRes = await fetch(containerUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image_url: mediaUrl,
                caption: content,
                access_token: token
              })
            });
            
            const containerData = await containerRes.json();
            console.log('📸 Instagram media container response from utils.ts:', containerData);
            
            if (containerData.error) throw new Error(containerData.error.message);
            if (!containerData.id) throw new Error('Media ID is not available. Instagram media container was created but no media ID was returned.');
            
            // Step 2: Publish
            const publishUrl = `https://graph.facebook.com/v21.0/${accountId}/media_publish`;
            const publishRes = await fetch(publishUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                creation_id: containerData.id,
                access_token: token
              })
            });
            
            const publishData = await publishRes.json();
            console.log('📸 Instagram publish response from utils.ts:', publishData);
            if (publishData.error) throw new Error(publishData.error.message);
            if (!publishData.id) throw new Error('Media ID is not available. Instagram media was published but no post ID was returned.');
            
            results.instagram = { status: 'published', postId: publishData.id };
            successPlatforms.push('instagram');
          }
        }
        else if (plat === 'tiktok') {
          // TikTok video publishing via Content Posting API
          let token = accountTokens?.[plat]?.access_token;
          
          if (!token) {
            throw new Error('No TikTok token available. Please connect your TikTok account.');
          }
          
          // TikTok requires video URL for direct publishing
          const videoUrl = mediaUrls?.find((url) => /\.(mp4|webm|mov)$/i.test(url) || url.includes('video'));
          if (!videoUrl) {
            throw new Error('TikTok requires a video file. Please upload a video to publish to TikTok.');
          }
          
          console.log('[publish-post] Publishing to TikTok with video:', videoUrl);
          
          // TikTok Content Posting API v2
          const tiktokPublishUrl = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
          const tiktokPublishStatusUrl = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/';
          const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
          const checkTikTokPublishStatus = async (publishId: string, attempts = 3) => {
            let lastStatus = 'UNKNOWN';
            let lastMessage = '';
            for (let i = 0; i < attempts; i++) {
              const statusRes = await fetch(tiktokPublishStatusUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ publish_id: publishId })
              });

              const statusData = await statusRes.json().catch(() => ({}));
              const statusErrorCode = statusData?.error?.code || statusData?.data?.error?.code;
              if (statusErrorCode && statusErrorCode !== 'ok') {
                return {
                  status: 'FAILED',
                  message: statusData?.error?.message || statusData?.data?.error?.message || 'TikTok status check failed'
                };
              }

              lastStatus = statusData?.data?.status || 'UNKNOWN';
              lastMessage = statusData?.data?.fail_reason || statusData?.data?.error?.message || '';

              if (lastStatus === 'PUBLISH_COMPLETE') {
                return { status: lastStatus, message: lastMessage };
              }

              if (/FAIL|REJECT|DENY|ERROR/i.test(lastStatus)) {
                return { status: 'FAILED', message: lastMessage || lastStatus };
              }

              if (i < attempts - 1) {
                await wait(1500);
              }
            }

            return { status: lastStatus, message: lastMessage };
          };
          const tiktokPayload = {
            post_info: {
              title: content?.substring(0, 150) || 'Video from EngageHub',
              privacy_level: 'SELF_ONLY', // Sandbox mode requires private. User can change on TikTok after posting.
              disable_duet: false,
              disable_comment: false,
              disable_stitch: false,
              video_cover_timestamp_ms: 1000
            },
            source_info: {
              source: 'PULL_FROM_URL',
              video_url: videoUrl
            }
          };
          
          const tiktokRes = await fetch(tiktokPublishUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(tiktokPayload)
          });
          
          const tiktokData = await tiktokRes.json();
          console.log('[publish-post] TikTok publish response:', tiktokData);

          const tiktokErrorCode = tiktokData.error?.code || tiktokData.data?.error?.code || '';
          const tiktokErrorMsg = tiktokData.error?.message || tiktokData.data?.error?.message || '';
          const isError = tiktokErrorCode && tiktokErrorCode !== 'ok';
          const isUrlOwnershipError = /url ownership|pull_from_url|verified domains/i.test(tiktokErrorMsg);

          if (isError && isUrlOwnershipError) {
            console.log('[publish-post] TikTok URL ownership failure detected. Retrying via FILE_UPLOAD fallback...');

            // Download media server-side and upload directly to TikTok to bypass URL ownership requirements.
            const mediaResp = await fetch(videoUrl);
            if (!mediaResp.ok) {
              throw new Error(`TikTok FILE_UPLOAD fallback failed: could not download video (${mediaResp.status})`);
            }
            const mediaBuffer = Buffer.from(await mediaResp.arrayBuffer());
            const videoSize = mediaBuffer.length;

            // Guard to avoid oversized in-memory uploads in serverless runtime.
            const MAX_FILE_UPLOAD_BYTES = 200 * 1024 * 1024; // ~200MB
            if (videoSize <= 0 || videoSize > MAX_FILE_UPLOAD_BYTES) {
              throw new Error('TikTok upload failed: video is too large for fallback upload. Use a smaller video or configure TikTok verified URL domains.');
            }

            const MIN_CHUNK = 5 * 1024 * 1024;
            const MAX_CHUNK = 64 * 1024 * 1024;
            let chunkSize = videoSize;
            let totalChunkCount = 1;

            // TikTok chunk rules:
            // - <5MB => whole upload (single chunk)
            // - >64MB => multi-chunk, chunk_size between 5MB and 64MB
            // - total_chunk_count uses floor(video_size / chunk_size)
            if (videoSize > MAX_CHUNK) {
              chunkSize = MAX_CHUNK;
              totalChunkCount = Math.floor(videoSize / chunkSize);
              if (totalChunkCount < 1) totalChunkCount = 1;
            } else if (videoSize >= MIN_CHUNK) {
              chunkSize = videoSize;
              totalChunkCount = 1;
            }

            const buildInitPayload = (size: number, cSize: number, chunkCount: number) => ({
              post_info: {
                title: content?.substring(0, 150) || 'Video from EngageHub',
                privacy_level: 'SELF_ONLY', // Sandbox mode requires private
                disable_duet: false,
                disable_comment: false,
                disable_stitch: false,
                video_cover_timestamp_ms: 1000
              },
              source_info: {
                source: 'FILE_UPLOAD',
                video_size: size,
                chunk_size: cSize,
                total_chunk_count: chunkCount
              }
            });

            const initUploadRequest = async (size: number, cSize: number, chunkCount: number) => {
              const initUploadRes = await fetch(tiktokPublishUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(buildInitPayload(size, cSize, chunkCount))
              });
              return initUploadRes.json();
            };

            let initUploadData = await initUploadRequest(videoSize, chunkSize, totalChunkCount);
            console.log('[publish-post] TikTok FILE_UPLOAD init response:', initUploadData);

            // TikTok always includes error object - check code !== 'ok' for actual errors
            const initErrorCode = initUploadData.error?.code || initUploadData.data?.error?.code;
            if (initErrorCode && initErrorCode !== 'ok') {
              const initErr = initUploadData.error?.message || initUploadData.data?.error?.message || 'TikTok FILE_UPLOAD init failed';
              throw new Error(initErr);
            }

            const uploadUrl = initUploadData.data?.upload_url;
            const publishId = initUploadData.data?.publish_id;
            if (!uploadUrl || !publishId) {
              throw new Error('TikTok FILE_UPLOAD init did not return upload_url/publish_id.');
            }

            for (let chunkIndex = 0; chunkIndex < totalChunkCount; chunkIndex++) {
              const start = chunkIndex * chunkSize;
              const end = chunkIndex === totalChunkCount - 1
                ? videoSize
                : Math.min(start + chunkSize, videoSize);
              const chunk = mediaBuffer.subarray(start, end);

              const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'video/mp4',
                  'Content-Length': String(chunk.length),
                  'Content-Range': `bytes ${start}-${end - 1}/${videoSize}`
                },
                body: chunk
              });

              if (!uploadRes.ok) {
                const uploadErrText = await uploadRes.text().catch(() => '');
                throw new Error(`TikTok FILE_UPLOAD transfer failed on chunk ${chunkIndex + 1}/${totalChunkCount} (${uploadRes.status}): ${uploadErrText || 'unknown upload error'}`);
              }
            }

            const statusCheck = await checkTikTokPublishStatus(publishId);
            if (statusCheck.status === 'FAILED') {
              throw new Error(`TikTok publish failed after upload: ${statusCheck.message || 'unknown failure'}`);
            }

            if (statusCheck.status === 'PUBLISH_COMPLETE') {
              results.tiktok = { status: 'published', postId: publishId };
            } else {
              results.tiktok = { status: 'processing', postId: publishId, detail: statusCheck.status };
            }
            successPlatforms.push('tiktok');
            continue;
          }

          if (isError) {
            throw new Error(tiktokErrorMsg || 'TikTok publish failed');
          }
          
          const publishId = tiktokData.data?.publish_id;
          if (!publishId) {
            throw new Error('TikTok did not return a publish ID. Your video may still be processing. Note: TikTok only allows video posts, not images or text.');
          }

          const statusCheck = await checkTikTokPublishStatus(publishId);
          if (statusCheck.status === 'FAILED') {
            throw new Error(`TikTok publish failed after init: ${statusCheck.message || 'unknown failure'}`);
          }

          if (statusCheck.status === 'PUBLISH_COMPLETE') {
            results.tiktok = { status: 'published', postId: publishId };
          } else {
            results.tiktok = { status: 'processing', postId: publishId, detail: statusCheck.status };
          }
          successPlatforms.push('tiktok');
        }
        else {
          // Other platforms (Twitter, LinkedIn, etc.) - mock for now
          results[plat] = { status: 'published', postId: `${plat}-mock-id` };
          successPlatforms.push(plat);
        }
      } catch (platError: any) {
        console.error(`Error publishing to ${plat}:`, platError);
        results[plat] = { status: 'error', error: platError.message };
        failedPlatforms.push({ platform: plat, error: platError.message });
      }
    }

    // Build platformPostIds for frontend to save to post_publications
    const platformPostIds: Record<string, string> = {};
    for (const [platform, result] of Object.entries(results)) {
      if (result && typeof result === 'object' && 'postId' in result && typeof (result as any).postId === 'string') {
        platformPostIds[platform] = (result as any).postId;
      }
    }

    return res.status(200).json({
      success: successPlatforms.length > 0,
      platforms: results,
      platformPostIds, // Frontend expects this format
      failed: failedPlatforms
    });

  } catch (error) {
    console.error('[publish-post] Fatal error:', error);
    return res.status(500).json({ error: 'Publish failed' });
  }
};

// Main handler for utility endpoints
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle both query string and path-based endpoint resolution
  // If endpoint is an array (from path-based catch-all), take the first element
  // If it's a string (from query param), use it directly
  let { endpoint } = req.query;
  if (Array.isArray(endpoint)) {
    endpoint = endpoint[0];
  }

  console.log('[utils] Request:', {
    method: req.method,
    endpoint,
    query: req.query
  });

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint parameter' });
  }

  try {
    switch (endpoint) {
      case 'post-engagement':
        return await handleGetPostEngagement(req, res);
      case 'process-scheduled-posts':
        return await handleProcessScheduledPosts(req, res);
      case 'publish-campaign':
        return await handlePublishCampaign(req, res);
      case 'publish-post':
        return await handlePublishPost(req, res);
      default:
        return res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error(`Error in utils API (${endpoint}):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
