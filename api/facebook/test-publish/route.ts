import { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'nodejs18.x',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('[test-publish] Testing Facebook post publication...');

    // Get Facebook Pages using stored token
    const FACEBOOK_LONG_TERM_TOKEN = process.env.FACEBOOK_LONG_TERM_TOKEN;

    if (!FACEBOOK_LONG_TERM_TOKEN) {
      return res.status(400).json({ 
        error: 'No Facebook token available',
        details: 'FACEBOOK_LONG_TERM_TOKEN environment variable not set'
      });
    }

    // 1. Get user's Facebook Pages
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?` +
      `fields=id,name,access_token&` +
      `access_token=${FACEBOOK_LONG_TERM_TOKEN}`;

    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      return res.status(400).json({ 
        error: 'Failed to fetch pages',
        details: pagesData.error.message || 'Failed to fetch pages'
      });
    }

    const pages = pagesData.data || [];
    console.log(`[test-publish] Found ${pages.length} Facebook Pages`);

    if (pages.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No Facebook Pages found',
        pages: [],
        testResults: {
          hasPages: false,
          canPost: false
        }
      });
    }

    // 2. Test posting to each page
    const testResults = [];

    for (const page of pages) {
      try {
        console.log(`[test-publish] Testing page: ${page.name} (${page.id})`);

        // Create a test post
        const testPostData = {
          message: `🧪 Test Post from EngageHub API Test - ${new Date().toISOString()}`,
          access_token: page.access_token
        };

        const postResponse = await fetch(
          `https://graph.facebook.com/v21.0/${page.id}/feed`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPostData)
          }
        );

        const postData = await postResponse.json();

        if (postData.error) {
          console.error(`[test-publish] Post failed for page ${page.name}:`, postData.error);
          testResults.push({
            pageId: page.id,
            pageName: page.name,
            success: false,
            error: postData.error.message || 'Unknown error',
            postId: null
          });
        } else {
          console.log(`[test-publish] Post successful for page ${page.name}:`, postData.id);
          testResults.push({
            pageId: page.id,
            pageName: page.name,
            success: true,
            error: null,
            postId: postData.id,
            postUrl: `https://facebook.com/${postData.id}`
          });

          // Clean up - delete the test post immediately
          await fetch(
            `https://graph.facebook.com/v21.0/${postData.id}?access_token=${page.access_token}`,
            { method: 'DELETE' }
          );
        }
      } catch (error: any) {
        console.error(`[test-publish] Error testing page ${page.name}:`, error);
        testResults.push({
          pageId: page.id,
          pageName: page.name,
          success: false,
          error: error.message || 'Test failed',
          postId: null
        });
      }
    }

    // 3. Get recent posts from each page to verify
    const recentPosts = [];
    
    for (const page of pages) {
      try {
        const postsUrl = `https://graph.facebook.com/v21.0/${page.id}/posts?` +
          `fields=id,message,created_time,permalink_url&` +
          `limit=5&` +
          `access_token=${page.access_token}`;

        const postsResponse = await fetch(postsUrl);
        const postsData = await postsResponse.json();

        if (!postsData.error && postsData.data) {
          recentPosts.push({
            pageId: page.id,
            pageName: page.name,
            posts: postsData.data.map((post: any) => ({
              id: post.id,
              message: post.message,
              created_time: post.created_time,
              permalink_url: post.permalink_url
            }))
          });
        }
      } catch (error: any) {
        console.error(`[test-publish] Error fetching posts for page ${page.name}:`, error);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Facebook post publication test completed',
      timestamp: new Date().toISOString(),
      pages: pages.map(p => ({
        id: p.id,
        name: p.name,
        hasAccessToken: !!p.access_token
      })),
      testResults,
      recentPosts,
      summary: {
        totalPages: pages.length,
        successfulTests: testResults.filter(r => r.success).length,
        failedTests: testResults.filter(r => !r.success).length,
        canPostToPages: testResults.some(r => r.success)
      }
    });

  } catch (error: any) {
    console.error('[test-publish] Test failed:', error);
    return res.status(500).json({ 
      error: 'Test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
