/**
 * Facebook API Test Script
 * Run with: node test-facebook-api.js
 */

import https from 'https';
import http from 'http';

// Test configuration
const config = {
    baseUrl: 'https://engage-hub-ten.vercel.app',
    workspaceId: 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9',
    redirectUri: 'https://engage-hub-ten.vercel.app/auth/facebook/callback'
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.request(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: parsed
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

// Test functions
async function testDiagnostics() {
    console.log('\n🧪 Testing API Diagnostics...');
    
    try {
        const url = `${config.baseUrl}/api/facebook?action=diagnostics`;
        const response = await makeRequest(url);
        
        console.log('✅ Diagnostics Response:');
        console.log(`   Status: ${response.statusCode}`);
        console.log('   Data:', JSON.stringify(response.data, null, 2));
        
        return response;
    } catch (error) {
        console.log('❌ Diagnostics Error:', error.message);
        return null;
    }
}

async function testTokenExchange() {
    console.log('\n🧪 Testing Token Exchange...');
    
    try {
        const url = `${config.baseUrl}/api/facebook?action=simple`;
        const mockCode = `mock_test_code_${Date.now()}`;
        
        const requestBody = JSON.stringify({
            code: mockCode,
            redirectUri: config.redirectUri,
            workspaceId: config.workspaceId
        });
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            },
            body: requestBody
        };
        
        const response = await makeRequest(url, options);
        
        console.log('✅ Token Exchange Response:');
        console.log(`   Status: ${response.statusCode}`);
        console.log('   Data:', JSON.stringify(response.data, null, 2));
        
        return response;
    } catch (error) {
        console.log('❌ Token Exchange Error:', error.message);
        return null;
    }
}

async function testTokenValidation() {
    console.log('\n🧪 Testing Token Validation...');
    
    try {
        const url = `${config.baseUrl}/api/facebook?action=validate`;
        const mockToken = `mock_test_token_${Date.now()}`;
        
        const requestBody = JSON.stringify({
            accessToken: mockToken,
            workspaceId: config.workspaceId
        });
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            },
            body: requestBody
        };
        
        const response = await makeRequest(url, options);
        
        console.log('✅ Token Validation Response:');
        console.log(`   Status: ${response.statusCode}`);
        console.log('   Data:', JSON.stringify(response.data, null, 2));
        
        return response;
    } catch (error) {
        console.log('❌ Token Validation Error:', error.message);
        return null;
    }
}

async function testPageFetch() {
    console.log('\n🧪 Testing Page Fetch...');
    
    try {
        const url = `${config.baseUrl}/api/facebook?action=pages`;
        const mockToken = `mock_test_token_${Date.now()}`;
        
        const requestBody = JSON.stringify({
            accessToken: mockToken,
            workspaceId: config.workspaceId
        });
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            },
            body: requestBody
        };
        
        const response = await makeRequest(url, options);
        
        console.log('✅ Page Fetch Response:');
        console.log(`   Status: ${response.statusCode}`);
        console.log('   Data:', JSON.stringify(response.data, null, 2));
        
        return response;
    } catch (error) {
        console.log('❌ Page Fetch Error:', error.message);
        return null;
    }
}

async function testCodeReuse() {
    console.log('\n🧪 Testing Code Reuse Prevention...');
    
    try {
        const url = `${config.baseUrl}/api/facebook?action=simple`;
        const mockCode = `reuse_test_code_${Date.now()}`;
        
        const requestBody = JSON.stringify({
            code: mockCode,
            redirectUri: config.redirectUri,
            workspaceId: config.workspaceId
        });
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            },
            body: requestBody
        };
        
        console.log('🔄 First request...');
        const response1 = await makeRequest(url, options);
        console.log(`   Status: ${response1.statusCode}`);
        
        console.log('🔄 Second request (same code)...');
        const response2 = await makeRequest(url, options);
        console.log(`   Status: ${response2.statusCode}`);
        
        console.log('✅ Code Reuse Test Results:');
        console.log(`   First call: ${response1.statusCode}`);
        console.log(`   Second call: ${response2.statusCode}`);
        console.log('   Second call data:', JSON.stringify(response2.data, null, 2));
        
        return { response1, response2 };
    } catch (error) {
        console.log('❌ Code Reuse Test Error:', error.message);
        return null;
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Facebook API Tests...');
    console.log('🌐 Testing against:', config.baseUrl);
    console.log('🆔 Workspace ID:', config.workspaceId);
    
    const results = {};
    
    // Run all tests
    results.diagnostics = await testDiagnostics();
    results.tokenExchange = await testTokenExchange();
    results.tokenValidation = await testTokenValidation();
    results.pageFetch = await testPageFetch();
    results.codeReuse = await testCodeReuse();
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('='.repeat(50));
    
    Object.entries(results).forEach(([test, result]) => {
        if (result) {
            const status = result.statusCode === 200 ? '✅ PASS' : '❌ FAIL';
            console.log(`${test.padEnd(20)}: ${status} (${result.statusCode})`);
        } else {
            console.log(`${test.padEnd(20)}: ❌ ERROR`);
        }
    });
    
    console.log('='.repeat(50));
    console.log('🎯 Tests completed!');
    
    return results;
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(console.error);
}

export {
    runAllTests,
    testDiagnostics,
    testTokenExchange,
    testTokenValidation,
    testPageFetch,
    testCodeReuse
};
