// Debug Facebook API 500 Error
console.log('🔍 Debugging Facebook API 500 Error...\n');

console.log('❌ Error Details:');
console.log('Endpoint: GET /api/facebook?action=list-pages');
console.log('Status: 500 Internal Server Error');
console.log('Vercel Error: FUNCTION_INVOCATION_FAILED');
console.log('Deployment ID: cpt1::lsv29-1771157796375-d6c3c2407724');

console.log('\n🔍 Possible Causes:');
console.log('1. Missing environment variables in Vercel deployment');
console.log('2. Supabase connection issues');
console.log('3. Facebook API credentials missing');
console.log('4. Code syntax error in deployed version');
console.log('5. Database connection timeout');

console.log('\n🔧 Debug Steps:');

console.log('\n1️⃣ Check Environment Variables:');
console.log('   - NEXT_PUBLIC_SUPABASE_URL');
console.log('   - SUPABASE_SERVICE_ROLE_KEY');
console.log('   - FACEBOOK_APP_ID');
console.log('   - FACEBOOK_APP_SECRET');

console.log('\n2️⃣ Check handleListPages Function:');
console.log('   - Is it properly exported?');
console.log('   - Are there syntax errors?');
console.log('   - Does it handle errors correctly?');

console.log('\n3️⃣ Check Supabase Connection:');
console.log('   - Database URL accessible?');
console.log('   - Service role key valid?');
console.log('   - Table permissions correct?');

console.log('\n🎯 Quick Fix: Check api/facebook.js');
console.log('Look for:');
console.log('✅ handleListPages function exists');
console.log('✅ Proper error handling');
console.log('✅ Correct imports/exports');
console.log('✅ Environment variables used correctly');

console.log('\n📱 Test in Browser:');
console.log('1. Open: https://engage-hub-ten.vercel.app/api/facebook?action=list-pages');
console.log('2. Check response body for error details');
console.log('3. Look for specific error message');

console.log('\n🔧 If Environment Variables Missing:');
console.log('1. Go to Vercel dashboard');
console.log('2. Project settings → Environment Variables');
console.log('3. Add missing variables');
console.log('4. Redeploy application');

console.log('\n✅ Most Likely Issue:');
console.log('Environment variables not properly set in Vercel deployment!');
