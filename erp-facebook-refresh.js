/**
 * ERP Facebook Token Management System
 * Automatically refreshes Facebook tokens every 50 days
 */

require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');

// Your ERP Database Connection (replace with your actual DB)
class ERPTokenManager {
    constructor() {
        // Replace with your actual database connection
        this.db = {
            tokens: new Map() // Mock DB - replace with real ERP DB
        };
    }

    // Get stored tokens from ERP database
    async getTokens(userId) {
        console.log(`📋 Fetching tokens for user: ${userId}`);
        // Replace with actual ERP DB query
        const stored = this.db.tokens.get(userId);
        if (!stored) {
            throw new Error('No tokens found in ERP system');
        }
        return stored;
    }

    // Save updated tokens to ERP database
    async saveTokens(userId, longToken, pageTokens) {
        console.log(`💾 Saving tokens for user: ${userId}`);
        // Replace with actual ERP DB update
        this.db.tokens.set(userId, {
            longLivedToken: this.encrypt(longToken),
            pageTokens: pageTokens.map(p => ({
                pageId: p.id,
                pageName: p.name,
                pageToken: this.encrypt(p.access_token),
                expiresAt: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000)
            })),
            updatedAt: new Date()
        });
    }

    // Encrypt tokens for ERP storage
    encrypt(text) {
        // Replace with your ERP encryption method
        return Buffer.from(text).toString('base64');
    }

    // Decrypt tokens from ERP storage
    decrypt(encryptedText) {
        // Replace with your ERP decryption method
        return Buffer.from(encryptedText, 'base64').toString();
    }

    // Exchange short-lived for long-lived token
    async exchangeToken(shortLivedToken) {
        try {
            console.log('🔄 Exchanging short-lived token for long-lived token...');
            
            const response = await axios.get(
                'https://graph.facebook.com/v20.0/oauth/access_token',
                {
                    params: {
                        grant_type: 'fb_exchange_token',
                        client_id: process.env.FACEBOOK_APP_ID,
                        client_secret: process.env.FACEBOOK_APP_SECRET,
                        fb_exchange_token: shortLivedToken
                    }
                }
            );

            const longToken = response.data.access_token;
            const expiresIn = response.data.expires_in;
            
            console.log(`✅ New long-lived token expires in: ${expiresIn} seconds`);
            return longToken;
        } catch (error) {
            console.error('❌ Token exchange failed:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get Facebook Pages using long-lived token
    async getPageTokens(longLivedToken) {
        try {
            console.log('📄 Fetching Facebook Pages...');
            
            const response = await axios.get(
                'https://graph.facebook.com/v20.0/me/accounts',
                {
                    params: {
                        fields: 'id,name,access_token,instagram_business_account',
                        access_token: longLivedToken
                    }
                }
            );

            return response.data.data || [];
        } catch (error) {
            console.error('❌ Failed to fetch pages:', error.response?.data || error.message);
            throw error;
        }
    }

    // Validate token with Facebook
    async validateToken(token) {
        try {
            const response = await axios.get(
                `https://graph.facebook.com/debug_token`,
                {
                    params: {
                        input_token: token,
                        access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
                    }
                }
            );

            return response.data.data;
        } catch (error) {
            console.error('❌ Token validation failed:', error.message);
            return null;
        }
    }
}

// Main refresh process
class FacebookTokenRefresher {
    constructor() {
        this.erp = new ERPTokenManager();
    }

    // Refresh all tokens in ERP system
    async refreshAllTokens() {
        console.log('🚀 Starting ERP Facebook token refresh process...');
        
        try {
            // Get all users with expiring tokens (replace with ERP DB query)
            const usersToRefresh = ['user123']; // Replace with ERP user query
            
            for (const userId of usersToRefresh) {
                await this.refreshUserTokens(userId);
            }
            
            console.log('✅ ERP token refresh completed');
        } catch (error) {
            console.error('❌ ERP refresh failed:', error.message);
        }
    }

    // Refresh tokens for specific user
    async refreshUserTokens(userId) {
        try {
            console.log(`🔄 Refreshing tokens for user: ${userId}`);
            
            // Get current tokens from ERP
            const currentTokens = await this.erp.getTokens(userId);
            const longLivedToken = currentTokens.longLivedToken;

            // Validate current token
            const validation = await this.erp.validateToken(longLivedToken);
            if (!validation || !validation.is_valid) {
                console.log('⚠️ Token invalid, requires manual re-auth');
                return;
            }

            // Get fresh page tokens
            const pageTokens = await this.erp.getPageTokens(longLivedToken);
            
            // Save updated tokens to ERP
            await this.erp.saveTokens(userId, longLivedToken, pageTokens);
            
            console.log(`✅ Refreshed ${pageTokens.length} pages for user ${userId}`);
        } catch (error) {
            console.error(`❌ Failed to refresh user ${userId}:`, error.message);
        }
    }
}

// Initialize ERP system
const refresher = new FacebookTokenRefresher();

// Schedule automatic refresh every 50 days
cron.schedule('0 0 */50 * *', async () => {
    console.log('🕒 ERP: Running scheduled Facebook token refresh...');
    await refresher.refreshAllTokens();
});

console.log('🏭 ERP Facebook Token Management System Started');
console.log('📅 Next refresh: 50 days from now');
console.log('🔧 Manual refresh command: node erp-facebook-refresh.js --refresh-now');

// Allow manual refresh
if (process.argv.includes('--refresh-now')) {
    await refresher.refreshAllTokens();
}
