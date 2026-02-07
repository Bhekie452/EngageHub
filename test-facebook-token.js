import { getPageTokens } from './src/lib/facebook.js';
import { config } from 'dotenv';

// Load environment variables
config();

async function testFacebookToken() {
  try {
    console.log('Testing Facebook long-term token...');
    console.log('FACEBOOK_LONG_TERM_TOKEN:', process.env.FACEBOOK_LONG_TERM_TOKEN ? 'Set' : 'Not set');
    
    // This will use your long-term token from .env
    const pages = await getPageTokens();
    
    console.log('✅ Success! Found pages:');
    console.log(pages);
    
    // Test posting to first page
    if (pages && pages.length > 0) {
      const firstPage = pages[0];
      console.log(`✅ First page: ${firstPage.name} (${firstPage.id})`);
      console.log(`✅ Page access token: ${firstPage.access_token ? 'Available' : 'Missing'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFacebookToken();
