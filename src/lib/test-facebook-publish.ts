/**
 * Test Facebook Post Publication
 * Verifies if posts can be published to connected Facebook Pages
 */

export const testFacebookPublish = async (): Promise<any> => {
  try {
    console.log('🧪 Testing Facebook post publication...');
    
    const response = await fetch('/api/facebook/test-publish');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Test failed');
    }

    console.log('✅ Facebook publish test completed:', data);
    return data;

  } catch (error: any) {
    console.error('❌ Facebook publish test failed:', error);
    throw error;
  }
};

/**
 * Quick test - just check if we can post to Facebook
 */
export const quickFacebookTest = async (): Promise<boolean> => {
  try {
    console.log('⚡ Quick Facebook test...');
    
    const response = await fetch('/api/facebook-auth?action=simple');
    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('❌ Facebook connection test failed:', data.error);
      return false;
    }

    const hasPages = data.pages && data.pages.length > 0;
    console.log(`✅ Facebook connection: ${hasPages ? 'CONNECTED' : 'NO PAGES'}`);
    
    if (hasPages) {
      console.log(`📄 Found ${data.pages.length} Facebook Pages:`);
      data.pages.forEach((page: any) => {
        console.log(`  - ${page.name} (${page.id})`);
      });
    }

    return hasPages;

  } catch (error: any) {
    console.error('❌ Quick Facebook test failed:', error);
    return false;
  }
};
