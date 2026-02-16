// Check current Facebook page for engagement component
console.log('🔍 Checking current Facebook page...\n');

// Check current URL
console.log('📍 Current URL:', window.location.href);
console.log('📄 Path:', window.location.pathname);

// Look for FacebookEngagement component or related content
console.log('\n🔍 Looking for Facebook engagement content...');

// Check for any text that indicates Facebook engagement
const allElements = document.querySelectorAll('*');
let facebookEngagementFound = false;
let noDataFound = false;

for (const el of allElements) {
  const text = el.textContent || '';
  
  if (text.toLowerCase().includes('facebook engagement')) {
    console.log('✅ Found "Facebook Engagement" text');
    facebookEngagementFound = true;
  }
  
  if (text.includes('No Facebook Data Found')) {
    console.log('❌ Found "No Facebook Data Found" text');
    noDataFound = true;
  }
  
  if (text.toLowerCase().includes('engagement overview')) {
    console.log('✅ Found "Engagement Overview" text');
  }
}

// Look for React components or specific class names
const facebookComponents = document.querySelectorAll('[class*="facebook"], [class*="Facebook"]');
console.log('📱 Facebook-related elements:', facebookComponents.length);

const engagementComponents = document.querySelectorAll('[class*="engagement"], [class*="Engagement"]');
console.log('📊 Engagement-related elements:', engagementComponents.length);

// Check if React is available now
console.log('\n⚛️ React check:');
console.log('React available:', typeof React !== 'undefined');

// Try to find the specific component
console.log('\n🎯 Looking for FacebookEngagement component...');

// Check if the component debug logs are running
setTimeout(() => {
  console.log('🕐 Checking for component activity after delay...');
  
  // Look for console logs that would indicate component is running
  console.log('📋 Check console above for these logs:');
  console.log('  - 🔍 fetchCombinedData called');
  console.log('  - 📊 localStorage data: {...}');
  console.log('  - ✅ Combined data loaded successfully');
  
  // If no logs, component might not be mounting
  console.log('\n❓ If no logs above, component might not be mounting');
  
  // Try to manually trigger component logic
  console.log('\n🔧 Manual component test...');
  const combinedData = localStorage.getItem('facebook_combined_metrics');
  
  if (combinedData) {
    try {
      const parsed = JSON.parse(combinedData);
      console.log('✅ Data available for component:', {
        posts: parsed.posts?.length || 0,
        likes: parsed.totalLikes,
        comments: parsed.totalComments
      });
      
      if (parsed.posts && parsed.posts.length > 0) {
        console.log('✅ Component should be displaying this data');
        console.log('❌ If not showing, component has rendering issues');
      }
    } catch (e) {
      console.error('❌ Data parse error:', e);
    }
  } else {
    console.log('❌ No data in localStorage for component');
  }
}, 1000);

// Look for any buttons or tabs on the current page
console.log('\n📑 Current page buttons/tabs:');
const currentTabs = document.querySelectorAll('button, .tab, [role="tab"]');
console.log('Buttons/tabs found:', currentTabs.length);

currentTabs.forEach((tab, index) => {
  const text = tab.textContent?.trim();
  if (text && text.length > 0) {
    console.log(`  ${index + 1}. "${text}"`);
  }
});

// Look specifically for engagement-related tabs
const engagementTabs = Array.from(currentTabs).filter(tab => 
  tab.textContent && tab.textContent.toLowerCase().includes('engagement')
);
console.log('\n📊 Engagement tabs:', engagementTabs.length);

if (engagementTabs.length > 0) {
  console.log('🎯 Found engagement tabs:');
  engagementTabs.forEach((tab, index) => {
    console.log(`  ${index + 1}. "${tab.textContent.trim()}"`);
  });
  
  // Try clicking the first engagement tab
  console.log('\n🔄 Trying to click engagement tab...');
  engagementTabs[0].click();
} else {
  console.log('❌ No engagement tabs found');
}
