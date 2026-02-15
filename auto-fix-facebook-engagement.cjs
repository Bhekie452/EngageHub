// Auto-Fix Facebook Engagement Workspace ID Mismatch
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  'https://bhekie452supabase.vercel.app', // From your logs
  'eyJhbGciOiJIUzI1NiIsInR5cH6cF3Oy4pKJm3qyJ3qyJ3Qy5Kw' // From your logs
);

async function autoFixFacebookEngagement() {
  console.log('🔧 Auto-Fixing Facebook Engagement Workspace ID...\n');
  
  try {
    // Step 1: Get ALL Facebook connections from database
    console.log('📊 Step 1: Fetching all Facebook connections...');
    const { data: allConnections, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching connections:', error);
      return;
    }
    
    if (!allConnections || allConnections.length === 0) {
      console.log('❌ No Facebook connections found in database');
      return;
    }
    
    console.log(`✅ Found ${allConnections.length} Facebook connections`);
    
    // Step 2: Find the workspace ID that has Facebook connections
    console.log('\n🔍 Step 2: Finding workspace with Facebook connections...');
    
    const workspacesWithFacebook = {};
    allConnections.forEach(conn => {
      const wsId = conn.workspace_id;
      if (!workspacesWithFacebook[wsId]) {
        workspacesWithFacebook[wsId] = [];
      }
      workspacesWithFacebook[wsId].push(conn);
    });
    
    const workspaceIds = Object.keys(workspacesWithFacebook);
    console.log('📱 Workspaces with Facebook connections:');
    workspaceIds.forEach((wsId, index) => {
      const conns = workspacesWithFacebook[wsId];
      console.log(`  ${index + 1}. ${wsId} (${conns.length} connections)`);
      conns.forEach((conn, connIndex) => {
        console.log(`     ${connIndex + 1}. ${conn.account_id} (${conn.account_type})`);
      });
    });
    
    // Step 3: Create localStorage fix script
    console.log('\n🔧 Step 3: Creating localStorage fix script...');
    
    const correctWorkspaceId = workspaceIds[0]; // Use first workspace with Facebook
    console.log(`✅ Correct workspace ID: ${correctWorkspaceId}`);
    
    const fixScript = `
// Auto-generated fix for Facebook Engagement
console.log('🔧 Applying Facebook Engagement Fix...');

// Check current workspace
const currentWorkspace = localStorage.getItem("current_workspace_id");
console.log('📱 Current workspace:', currentWorkspace);

// Set to correct workspace
const correctWorkspace = "${correctWorkspaceId}";
console.log('✅ Setting to correct workspace:', correctWorkspace);

// Apply fix
localStorage.setItem("current_workspace_id", correctWorkspace);
console.log('✅ Workspace ID fixed!');

// Verify fix
const newWorkspace = localStorage.getItem("current_workspace_id");
console.log('🔍 Verification - New workspace:', newWorkspace);
console.log('🎯 Match:', newWorkspace === correctWorkspace ? '✅ YES' : '❌ NO');

// Reload page to apply fix
console.log('🔄 Reloading page in 2 seconds...');
setTimeout(() => {
  location.reload();
}, 2000);
    `;
    
    // Step 4: Save fix script to file
    const fs = require('fs');
    fs.writeFileSync('fix-facebook-engagement.js', fixScript);
    
    console.log('\n✅ Auto-fix complete!');
    console.log('📄 Fix script saved to: fix-facebook-engagement.js');
    console.log('\n🎯 How to apply fix:');
    console.log('1. Open your app → Social Media → Facebook → Engagement tab');
    console.log('2. Open browser console (F12)');
    console.log('3. Copy and paste the contents of fix-facebook-engagement.js');
    console.log('4. Or run: node fix-facebook-engagement.js (if in browser console)');
    console.log('\n🔄 After applying fix, page will reload and Facebook Engagement should work!');
    
  } catch (error) {
    console.error('❌ Auto-fix failed:', error.message);
  }
}

// Run auto-fix
autoFixFacebookEngagement();
