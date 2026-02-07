const axios = require('axios');

// Your Facebook App Configuration
const APP_ID = "2106228116796555";
const APP_SECRET = "d58f457dcae02d787fccb2f0b37ce9fe";

async function generateLongTermToken() {
  try {
    console.log('🔄 Facebook Token Generator');
    console.log('📋 App ID:', APP_ID);
    console.log('🔑 App Secret:', APP_SECRET ? 'Set' : 'NOT SET');
    
    if (!APP_SECRET || APP_SECRET === 'YOUR_FACEBOOK_APP_SECRET_HERE') {
      console.error('❌ Please update APP_SECRET in this script with your actual Facebook app secret');
      console.log('📍 Get it from: https://developers.facebook.com/apps/2106228116796555/settings/basic/');
      return;
    }

    console.log('\n📝 STEP 1: Get short-lived token from Facebook Graph API Explorer');
    console.log('📍 Go to: https://developers.facebook.com/tools/explorer/');
    console.log('🔧 Select these permissions: pages_show_list, pages_manage_posts');
    console.log('📋 Copy the generated token (starts with "EAA...")');
    
    // Ask for short-lived token
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const shortLivedToken = await new Promise((resolve) => {
      rl.question('\n🔑 Paste your short-lived token here: ', (token) => {
        rl.close();
        resolve(token.trim());
      });
    });

    if (!shortLivedToken) {
      console.error('❌ No token provided');
      return;
    }

    console.log('\n🔄 STEP 2: Exchange for long-lived token...');
    
    // Exchange short-lived for long-lived token
    const exchangeResponse = await axios.get(
      'https://graph.facebook.com/v19.0/oauth/access_token',
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: APP_ID,
          client_secret: APP_SECRET,
          fb_exchange_token: shortLivedToken
        }
      }
    );

    if (exchangeResponse.data.error) {
      console.error('❌ Exchange failed:', exchangeResponse.data.error);
      return;
    }

    const longTermToken = exchangeResponse.data.access_token;
    const expiresIn = exchangeResponse.data.expires_in;
    
    console.log('✅ SUCCESS! Long-lived token generated:');
    console.log('📅 Expires in:', expiresIn, 'seconds (~', Math.floor(expiresIn / 86400), 'days)');
    console.log('🔑 Token length:', longTermToken.length);
    
    console.log('\n🔄 STEP 3: Fetch Facebook Pages...');
    
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

generateLongTermToken();
