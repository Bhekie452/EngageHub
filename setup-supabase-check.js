#!/usr/bin/env node

import { readFileSync } from 'fs';
import { createClient } from "@supabase/supabase-js";

console.log('🔧 Supabase Facebook Connection Checker Setup');
console.log('==========================================\n');

// Try to read from .env file
let SUPABASE_URL = '';
let SUPABASE_SERVICE_ROLE_KEY = '';

try {
  const envContent = readFileSync('.env', 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    if (line.startsWith('SUPABASE_URL=')) {
      SUPABASE_URL = line.split('=')[1];
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      SUPABASE_SERVICE_ROLE_KEY = line.split('=')[1];
    }
  });
} catch (err) {
  console.log('📄 .env file not found or unreadable\n');
}

console.log('📋 Current Configuration:');
console.log(`   SUPABASE_URL: ${SUPABASE_URL ? '✅ Found' : '❌ Missing'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✅ Found' : '❌ Missing'}\n`);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log('🔧 To fix this, add these to your .env file:\n');
  console.log('SUPABASE_URL=https://your-project-ref.supabase.co');
  console.log('SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\n');
  console.log('💡 Get these from your Supabase Project Settings > API\n');
  process.exit(1);
}

console.log('✅ Configuration looks good! Running check...\n');

// Test the connection
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('social_accounts')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase Connection Error:', error.message);
      console.error('💡 Check your credentials and permissions\n');
      process.exit(1);
    }

    console.log('✅ Supabase connection successful!\n');
    
    // Now run the actual check
    const workspaceId = "26caa666-2797-40f9-aa99-399be01d57eb";
    
    const { data: facebookData, error: facebookError } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("platform", "facebook")
      .eq("workspace_id", workspaceId);

    if (facebookError) {
      console.error("❌ Facebook Query Error:", facebookError);
      process.exit(1);
    }

    if (!facebookData || facebookData.length === 0) {
      console.log("📄 No Facebook connections found for workspace:", workspaceId);
      console.log("💡 Try connecting Facebook first, then check again");
      return;
    }

    console.log(`✅ Found ${facebookData.length} Facebook connection(s):`);
    facebookData.forEach((row, index) => {
      console.log(`\n📄 Connection ${index + 1}:`);
      console.log(`   Type: ${row.account_type} (${row.display_name})`);
      console.log(`   Status: ${row.connection_status}`);
      console.log(`   Token: ${row.access_token ? row.access_token.substring(0, 20) + '...' : 'None'}`);
      
      if (row.platform_data?.pages) {
        console.log(`   Pages: ${row.platform_data.pages.length}`);
        row.platform_data.pages.forEach(page => {
          console.log(`     - ${page.pageName} (Instagram: ${page.hasInstagram ? '✅' : '❌'})`);
        });
      }
    });

  } catch (err) {
    console.error('❌ Unexpected Error:', err);
    process.exit(1);
  }
}

testConnection();
