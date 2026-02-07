require('dotenv').config();
const axios = require('axios');

// Facebook OAuth flow helper
async function handleFacebookOAuth() {
  try {
    console.log('🔗 Facebook OAuth Helper');
    console.log('📋 App ID:', process.env.FACEBOOK_APP_ID);
    console.log('🔑 App Secret:', process.env.FACEBOOK_APP_SECRET ? 'Set' : 'Not Set');
    
    // Step 1: Generate OAuth URL
    const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${process.env.FACEBOOK_APP_ID}&` +
      `redirect_uri=https://engage-hub-ten.vercel.app/auth/facebook/callback&` +
      `scope=pages_manage_posts,pages_read_engagement,pages_show_list&` +
      `response_type=code`;
    
    console.log('\n🔗 STEP 1: Complete OAuth Flow');
    console.log('📍 Visit this URL in your browser:');
    console.log(oauthUrl);
    
    console.log('\n📝 STEP 2: After authorization, you will be redirected to:');
    console.log('https://engage-hub-ten.vercel.app/auth/facebook/callback?code=YOUR_CODE');
    
    console.log('\n🔑 STEP 3: Copy the authorization code from the URL');
    
    // Ask for authorization code
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const authCode = await new Promise((resolve) => {
      rl.question('\n📋 Paste the authorization code here: ', (code) => {
        rl.close();
        resolve(code.trim());
      });
    });

    if (!authCode) {
      console.error('❌ No authorization code provided');
      return;
    }

    console.log('\n🔄 STEP 4: Exchange code for access token...');
    
    // Exchange authorization code for access token
    const tokenResponse = await axios.get(
      'https://graph.facebook.com/v19.0/oauth/access_token',
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: 'https://engage-hub-ten.vercel.app/auth/facebook/callback',
          code: authCode
        }
      }
    );

    if (tokenResponse.data.error) {
      console.error('❌ Token exchange failed:', tokenResponse.data.error);
      return;
    }

    const shortLivedToken = tokenResponse.data.access_token;
    console.log('✅ Short-lived token obtained!');
    console.log('📅 Token type:', tokenResponse.data.token_type);
    console.log('⏰ Expires in:', tokenResponse.data.expires_in, 'seconds');

    console.log('\n🔄 STEP 5: Exchange for long-lived token...');
    
    // Exchange short-lived for long-lived token
    const longTermResponse = await axios.get(
      'https://graph.facebook.com/v19.0/oauth/access_token',
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          fb_exchange_token: shortLivedToken
        }
      }
    );

    if (longTermResponse.data.error) {
      console.error('❌ Long-term token exchange failed:', longTermResponse.data.error);
      return;
    }

    const longTermToken = longTermResponse.data.access_token;
    console.log('✅ Long-lived token generated!');
    console.log('📅 Expires in:', longTermResponse.data.expires_in, 'seconds (~', Math.floor(longTermResponse.data.expires_in / 86400), 'days)');
    console.log('🔑 Token length:', longTermToken.length);

    console.log('\n🔄 STEP 6: Fetch Facebook Pages...');
    
    // Get Facebook Pages
    const pagesResponse = await axios.get(
      'https://graph.facebook.com/v19.0/me/accounts',
      {
        params: {
          fields: 'id,name,access_token,instagram_business_account',
          access_token: longTermToken
        }
      }
    );

    const pages = pagesResponse.data.data || [];
    
    console.log('✅ Found', pages.length, 'Facebook Pages:');
    pages.forEach((page, index) => {
      console.log(`  ${index + 1}. ${page.name} (${page.id})`);
      console.log(`     Token: ${page.access_token ? 'Available' : 'Missing'}`);
    });

    console.log('\n📝 UPDATE YOUR .env FILE WITH:');
    console.log('FACEBOOK_LONG_TERM_TOKEN=' + longTermToken);
    
    console.log('\n🚀 Ready to use in your application!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

handleFacebookOAuth();
