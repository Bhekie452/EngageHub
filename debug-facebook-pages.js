// 🔧 DEBUG FACEBOOK PAGES LOADING
// Check what pages are being returned by the API

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugFacebookPages() {
  console.log('🔧 Debugging Facebook pages for workspace: 26caa666-2797-40f9-aa99-399be01d57eb');
  
  try {
    // 1. Get all Facebook connections
    const { data: connections, error: connError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', '26caa666-2797-40f9-aa99-399be01d57eb')
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected');
    
    if (connError) {
      console.error('❌ Error fetching connections:', connError);
      return;
    }
    
    console.log(`\n📊 Found ${connections?.length || 0} Facebook connections:`);
    
    if (connections && connections.length > 0) {
      connections.forEach((conn, index) => {
        console.log(`\n🔹 Connection ${index + 1}:`);
        console.log(`   ID: ${conn.id}`);
        console.log(`   Type: ${conn.account_type}`);
        console.log(`   Name: ${conn.display_name}`);
        console.log(`   Status: ${conn.connection_status}`);
        console.log(`   Has Token: ${conn.access_token ? '✅' : '❌'}`);
        console.log(`   Created: ${conn.created_at}`);
        
        // Check platform_data for pages
        if (conn.platform_data) {
          const platformData = typeof conn.platform_data === 'string' 
            ? JSON.parse(conn.platform_data) 
            : conn.platform_data;
          
          console.log(`   Platform Data Type: ${typeof conn.platform_data}`);
          
          if (platformData.pages) {
            console.log(`   Pages in platform_data: ${platformData.pages?.length || 0}`);
            if (platformData.pages && platformData.pages.length > 0) {
              platformData.pages.forEach((page, pageIdx) => {
                console.log(`     Page ${pageIdx + 1}: ${page.pageName} (${page.pageId})`);
              });
            }
          } else {
            console.log(`   ❌ No pages array in platform_data`);
          }
        } else {
          console.log(`   ❌ No platform_data found`);
        }
      });
    } else {
      console.log('❌ No Facebook connections found');
    }
    
    // 2. Test API call directly
    console.log('\n🌐 Testing API call to /api/facebook?action=simple...');
    
    try {
      const response = await fetch('https://engage-hub-ten.vercel.app/api/facebook?action=simple&workspaceId=26caa666-2797-40f9-aa99-399be01d57eb', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      console.log('\n📋 API Response:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Success: ${data.success}`);
      console.log(`   Connections: ${data.connections?.length || 0}`);
      
      if (data.connections && data.connections.length > 0) {
        console.log('\n📄 Connections returned by API:');
        data.connections.forEach((conn, idx) => {
          console.log(`   ${idx + 1}. ${conn.displayName} (${conn.accountType})`);
          if (conn.pages && conn.pages.length > 0) {
            console.log(`      Pages: ${conn.pages.length}`);
            conn.pages.forEach(page => {
              console.log(`        - ${page.pageName}`);
            });
          } else {
            console.log(`      Pages: None`);
          }
        });
      }
      
    } catch (apiError) {
      console.error('❌ API call failed:', apiError);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

debugFacebookPages();
