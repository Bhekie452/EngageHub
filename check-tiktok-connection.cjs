const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zourlqrkoyugzymxkbgn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXJscXJrb3l1Z3p5bXhrYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTEzNjIsImV4cCI6MjA4Mzc4NzM2Mn0.vm_vt_YV6YBchtC3IsEZ-yPLFpQH90WfJ81yVw7PlWA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTikTokAccounts() {
  console.log('Checking for TikTok accounts in database...\n');
  
  // Get all social accounts where platform is 'tiktok'
  const { data: tiktokAccounts, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('platform', 'tiktok');
  
  if (error) {
    console.error('Error fetching TikTok accounts:', error);
    return;
  }
  
  if (!tiktokAccounts || tiktokAccounts.length === 0) {
    console.log('No TikTok accounts found in the database.');
    return;
  }
  
  console.log(`Found ${tiktokAccounts.length} TikTok account(s):\n`);
  
  tiktokAccounts.forEach((account, index) => {
    console.log(`--- TikTok Account #${index + 1} ---`);
    console.log(`ID: ${account.id}`);
    console.log(`Workspace ID: ${account.workspace_id}`);
    console.log(`Account ID: ${account.account_id}`);
    console.log(`Username: ${account.username || 'N/A'}`);
    console.log(`Display Name: ${account.display_name || 'N/A'}`);
    console.log(`Is Active: ${account.is_active}`);
    console.log(`Connection Status: ${account.connection_status}`);
    console.log(`Token Expires At: ${account.token_expires_at || 'N/A'}`);
    console.log(`Created At: ${account.created_at}`);
    console.log(`Updated At: ${account.updated_at}`);
    console.log('');
  });
  
  // Also check all platforms
  console.log('--- All Social Accounts by Platform ---');
  const { data: allAccounts } = await supabase
    .from('social_accounts')
    .select('platform, count');
  
  if (allAccounts) {
    const counts = {};
    allAccounts.forEach(acc => {
      counts[acc.platform] = (counts[acc.platform] || 0) + 1;
    });
    console.log('Accounts per platform:');
    Object.entries(counts).forEach(([platform, count]) => {
      console.log(`  ${platform}: ${count}`);
    });
  }
}

checkTikTokAccounts().catch(console.error);