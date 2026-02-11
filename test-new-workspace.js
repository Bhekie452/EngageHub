// 🧪 TEST WITH NEW WORKSPACE ID
// This bypasses any existing OAuth state conflicts

import { randomUUID } from 'crypto';

// Generate new workspace ID
const newWorkspaceId = randomUUID();

console.log('🆕 New Workspace ID:', newWorkspaceId);
console.log('');
console.log('📋 To test with new workspace:');
console.log('1. In your app, set this as workspace ID');
console.log('2. Connect to Facebook');
console.log('3. Check results with:');
console.log(`   node setup-supabase-check.js --workspace ${newWorkspaceId}`);
console.log('');
console.log('💡 This bypasses any existing OAuth conflicts!');
