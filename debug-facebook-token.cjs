require('dotenv').config();
const axios = require('axios');

async function debugFacebookToken() {
  try {
    console.log('Debugging Facebook token...');
    console.log('Token length:', process.env.FACEBOOK_LONG_TERM_TOKEN ? process.env.FACEBOOK_LONG_TERM_TOKEN.length : 0);
    
    if (!process.env.FACEBOOK_LONG_TERM_TOKEN) {
      console.error('❌ FACEBOOK_LONG_TERM_TOKEN not found');
      return;
    }

    // Debug token with Facebook API
    const response = await axios.get(
      `https://graph.facebook.com/debug_token`,
      {
        params: {
          input_token: process.env.FACEBOOK_LONG_TERM_TOKEN,
          access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
        }
      }
    );

    const result = response.data.data;
    console.log('✅ Token debug result:');
    console.log('App ID:', result.app_id);
    console.log('Valid:', result.is_valid);
    console.log('Expires at:', result.expires_at);
    console.log('Scopes:', result.scopes);
    
    if (!result.is_valid) {
      console.error('❌ Token is INVALID or EXPIRED');
      console.error('Error:', result.error);
    } else {
      console.log('✅ Token is VALID');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugFacebookToken();
