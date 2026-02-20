const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnv() {
    const envPath = path.resolve('.env.local');
    if (fs.existsSync(envPath)) {
        const txt = fs.readFileSync(envPath, 'utf8');
        txt.split(/\r?\n/).forEach(line => {
            const lineTrim = line.trim();
            if (!lineTrim || lineTrim.startsWith('#')) return;
            const idx = lineTrim.indexOf('=');
            if (idx === -1) return;
            const key = lineTrim.slice(0, idx).trim();
            let val = lineTrim.slice(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            process.env[key] = val;
        });
    }
}
loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zourlqrkoyugzymxkbgn.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXJscXJrb3l1Z3p5bXhrYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIxMTM2MiwiZXhwIjoyMDgzNzg3MzYyfQ.ic8p6qw_KJw5QtojcZwpIJ7ISJo3bxz9ef5RQA1wzfM';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// CLIENT CREDENTIALS - These should be in your environment variables/secrets
const YT_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YT_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;

async function refreshTokens() {
    console.log('--- YouTube Token Refresh Job ---');
    console.log('Time:', new Date().toISOString());

    if (!YT_CLIENT_ID || !YT_CLIENT_SECRET) {
        console.error('❌ Error: YT_CLIENT_ID or YT_CLIENT_SECRET is missing.');
        console.log('Please provide these in .env.local to enable token refresh.');
        return;
    }

    // 1. Fetch all YouTube accounts
    const { data: accounts, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('platform', 'youtube');

    if (error) {
        console.error('Error fetching accounts:', error.message);
        return;
    }

    console.log(`Found ${accounts.length} YouTube accounts to check.`);

    for (const account of accounts) {
        const expiresAt = new Date(account.token_expires_at);
        const now = new Date();
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

        if (now >= new Date(expiresAt.getTime() - bufferTime)) {
            console.log(`Refreshing token for account: ${account.display_name || account.id} (expired or expiring soon)`);

            if (!account.refresh_token) {
                console.warn(`  - No refresh_token for account ${account.id}. Cannot refresh.`);
                continue;
            }

            try {
                const response = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        client_id: YT_CLIENT_ID,
                        client_secret: YT_CLIENT_SECRET,
                        refresh_token: account.refresh_token,
                        grant_type: 'refresh_token'
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Google API error: ${response.status} ${errorText}`);
                }

                const tokens = await response.json();

                // 2. Update database
                const { error: updateError } = await supabase
                    .from('social_accounts')
                    .update({
                        access_token: tokens.access_token,
                        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', account.id);

                if (updateError) {
                    console.error(`  - Failed to update DB: ${updateError.message}`);
                } else {
                    console.log(`  - Successfully refreshed token. New expiry: ${new Date(Date.now() + tokens.expires_in * 1000).toISOString()}`);
                }

            } catch (err) {
                console.error(`  - Refresh failed: ${err.message}`);
            }
        } else {
            console.log(`Token for ${account.display_name || account.id} is still valid.`);
        }
    }
}

refreshTokens();
