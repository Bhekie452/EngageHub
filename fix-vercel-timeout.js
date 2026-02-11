// 🔧 FIX VERCEL TIMEOUT ISSUE
// Optimize Facebook API to avoid Vercel 10-second timeout

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOptimizedFlow() {
  console.log('🚀 Testing optimized Facebook flow...');
  
  try {
    // 1. Quick database check first (fast)
    console.log('📊 Step 1: Quick database check...');
    const { data: existingConnections, error: checkError } = await supabase
      .from('social_accounts')
      .select('workspace_id, account_type, display_name')
      .eq('workspace_id', 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9')
      .eq('platform', 'facebook')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Database check failed:', checkError);
      return;
    }
    
    if (existingConnections && existingConnections.length > 0) {
      console.log('✅ Found existing connections:');
      existingConnections.forEach(conn => {
        console.log(`   - ${conn.display_name} (${conn.account_type})`);
      });
      console.log('\n💡 SOLUTION: Use existing connections instead of new OAuth!');
      return;
    }
    
    // 2. If no connections, do fast OAuth
    console.log('\n🔄 Step 2: No connections found, need OAuth...');
    
    // 3. Test with timeout handling
    console.log('\n⏱️ Step 3: Testing API with timeout handling...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log('⏰ Request timeout - aborting...');
    }, 8000); // 8 second timeout
    
    try {
      const response = await fetch('https://engage-hub-ten.vercel.app/api/facebook?action=simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        'X-Timeout-Test': 'true'
        },
        body: JSON.stringify({
          workspaceId: 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9',
          test: true
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log('✅ API Response received:', {
        success: data.success,
        pages: data.pages?.length || 0,
        responseTime: Date.now() - startTime
      });
      
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.error('⏰ Request timed out after 8 seconds');
      } else {
        console.error('❌ Request failed:', err.message);
      }
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testOptimizedFlow();
