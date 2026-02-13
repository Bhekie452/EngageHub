require('dotenv').config();

async function debugDeployment() {
  console.log('🔍 Testing Deployment Status...\n');

  try {
    // Test the exact same request that's failing
    const testPayload = {
      pageId: "991921717332604",
      pageAccessToken: "EAAd7mnK3tIsBQgZAYbHizHBiNu6QmInxZAtgOG8ZBKKQ1zOO17tMhbBzIZC7hOFKKXdZCmMgRdrZCrnr98MnC0bCU3pdJupsOZBRSNhZCyl6i0mKigqk1Iq1Ncuwpfs4XYzeXvNDNLDvimRmFPN4f9XoGwhZCxkdDC4H4FEDc001FZBgZCfH2kF0hsqeLubyDXwsxow2p5PiaqJ",
      workspaceId: "c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9",
      pageName: "Engagehub Testing Page",
      instagramBusinessAccountId: "17841480561146301"
    };

    console.log('📤 Sending test payload:');
    console.log('   pageId:', testPayload.pageId);
    console.log('   pageAccessToken:', testPayload.pageAccessToken ? 'Present' : 'Missing');
    console.log('   workspaceId:', testPayload.workspaceId);
    console.log('   pageName:', testPayload.pageName);

    const response = await fetch('https://engage-hub-ten.vercel.app/api/facebook?action=connect-page', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Script/1.0'
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();
    console.log('\n📥 Backend Response:');
    console.log('   Status:', response.status);
    console.log('   Error:', data.error);
    console.log('   Details:', data.details);

    if (data.error === 'Missing required fields') {
      console.log('\n❌ STILL MISSING FIELDS - Check backend logic');
      console.log('   Expected: pageId, pageAccessToken, workspaceId');
      console.log('   Received: Check req.body parsing');
    }

  } catch (error) {
    console.error('❌ Debug request failed:', error);
  }
}

debugDeployment();
