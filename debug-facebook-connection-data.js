// Debug Facebook Connection Data Structure
console.log('🔍 Debugging Facebook Connection Data...\n');

async function debugConnectionData() {
  try {
    console.log('📱 Getting Facebook connections...');
    
    const connectionsResponse = await fetch('/api/facebook?action=get-connections&workspaceId=c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9');
    const connectionsData = await connectionsResponse.json();
    
    console.log('🔍 Full connections response:', JSON.stringify(connectionsData, null, 2));
    
    if (connectionsData.error) {
      console.error('❌ Error:', connectionsData.error);
      return;
    }
    
    if (!connectionsData.connections || connectionsData.connections.length === 0) {
      console.log('❌ No connections found');
      return;
    }
    
    console.log(`✅ Found ${connectionsData.connections.length} connection(s)\n`);
    
    connectionsData.connections.forEach((connection, index) => {
      console.log(`\n📄 Connection ${index + 1}:`);
      console.log('🔍 Full object:', JSON.stringify(connection, null, 2));
      console.log('📋 Available fields:', Object.keys(connection));
      
      // Check for different possible field names
      console.log('🔑 Token fields:');
      console.log('  - connection.token:', connection.token ? 'Present' : 'Missing');
      console.log('  - connection.access_token:', connection.access_token ? 'Present' : 'Missing');
      console.log('  - connection.accessToken:', connection.accessToken ? 'Present' : 'Missing');
      console.log('  - connection.pageAccessToken:', connection.pageAccessToken ? 'Present' : 'Missing');
      
      console.log('📝 Name fields:');
      console.log('  - connection.accountName:', connection.accountName || 'Missing');
      console.log('  - connection.name:', connection.name || 'Missing');
      console.log('  - connection.page_name:', connection.page_name || 'Missing');
      console.log('  - connection.pageName:', connection.pageName || 'Missing');
      
      console.log('🆔 ID fields:');
      console.log('  - connection.accountId:', connection.accountId || 'Missing');
      console.log('  - connection.account_id:', connection.account_id || 'Missing');
      console.log('  - connection.pageId:', connection.pageId || 'Missing');
      console.log('  - connection.page_id:', connection.page_id || 'Missing');
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run debug
debugConnectionData();
