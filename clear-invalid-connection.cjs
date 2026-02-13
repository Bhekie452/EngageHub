const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function clearInvalidConnection() {
  console.log('🗑️ Clearing Invalid Facebook Connection...\n');

  try {
    // Find the invalid connection
    const { data: profileConnections, error: profileError } = await supabase
      .from('social_accounts')
      .select('id, access_token, created_at')
      .eq('platform', 'facebook')
      .eq('account_type', 'profile')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error('❌ Error fetching connections:', profileError);
      return;
    }

    if (!profileConnections || profileConnections.length === 0) {
      console.log('ℹ️ No Facebook connections found to clear');
      return;
    }

    console.log(`📊 Found ${profileConnections.length} Facebook connection(s):`);
    profileConnections.forEach((conn, index) => {
      console.log(`\n${index + 1}. Connection:`);
      console.log(`   ID: ${conn.id}`);
      console.log(`   Token: ${conn.access_token.substring(0, 20)}...`);
      console.log(`   Token Type: ${conn.access_token.substring(0, 4)}`);
      console.log(`   Created: ${conn.created_at}`);
    });

    // Delete all Facebook connections to start fresh
    console.log('\n🗑️ Deleting all Facebook connections...');
    
    const { error: deleteError } = await supabase
      .from('social_accounts')
      .delete()
      .eq('platform', 'facebook');

    if (deleteError) {
      console.error('❌ Error deleting connections:', deleteError);
      return;
    }

    console.log('✅ Successfully deleted all Facebook connections');

    // Verify deletion
    const { data: remainingConnections, error: verifyError } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('platform', 'facebook');

    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError);
      return;
    }

    console.log(`📊 Remaining Facebook connections: ${remainingConnections?.length || 0}`);

    console.log('\n🎯 Next Steps:');
    console.log('1. ✅ Invalid connections cleared');
    console.log('2. 🔄 User needs to re-authenticate');
    console.log('3. 🌐 Use production app credentials');
    console.log('4. 📱 OAuth flow will generate correct tokens');
    console.log('5. ✅ Page selection will work');

    console.log('\n🚀 Ready for Fresh Authentication:');
    console.log('   Visit: https://engage-hub-ten.vercel.app/#social');
    console.log('   Click: "Connect Facebook"');
    console.log('   Complete: OAuth flow with correct app');
    console.log('   Result: Valid EAAC/EAAD tokens + page access');

  } catch (error) {
    console.error('❌ Error clearing connections:', error);
  }
}

// Run the cleanup
clearInvalidConnection();
