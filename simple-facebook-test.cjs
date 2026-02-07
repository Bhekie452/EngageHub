require('dotenv').config();
const axios = require('axios');

async function testFacebookToken() {
  try {
    console.log('Testing Facebook long-term token...');
    console.log('FACEBOOK_LONG_TERM_TOKEN exists:', !!process.env.FACEBOOK_LONG_TERM_TOKEN);
    
    if (!process.env.FACEBOOK_LONG_TERM_TOKEN) {
      console.error('❌ FACEBOOK_LONG_TERM_TOKEN not found in .env');
      return;
    }

    // Test token with Facebook Graph API
    const response = await axios.get(
      'https://graph.facebook.com/v21.0/me/accounts',
      {
        params: {
          fields: 'id,name,access_token,instagram_business_account',
          access_token: process.env.FACEBOOK_LONG_TERM_TOKEN
        }
      }
    );

    const pages = response.data.data || [];
    
    console.log('✅ Success! Found pages:');
    console.log(pages);
    
    // Test posting to first page
    if (pages.length > 0) {
      const firstPage = pages[0];
      console.log(`✅ First page: ${firstPage.name} (${firstPage.id})`);
      console.log(`✅ Page access token: ${firstPage.access_token ? 'Available' : 'Missing'}`);
      
      // Test posting to the page
      try {
        const postResponse = await axios.post(
          `https://graph.facebook.com/v21.0/${firstPage.id}/feed`,
          {
            message: 'Test post from ERP system',
            access_token: firstPage.access_token
          }
        );
        console.log('✅ Test post successful:', postResponse.data);
      } catch (postError) {
        console.error('❌ Test post failed:', postError.response?.data || postError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testFacebookToken();
