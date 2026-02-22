// YouTube Token Refresh Cron Job
// This function runs on a schedule to refresh expired YouTube tokens

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getEnv = (k: string) => ((globalThis as any).Deno?.env?.get?.(k) as string | undefined) || ''

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = getEnv('SUPABASE_URL') || 'https://zourlqrkoyugzymxkbgn.supabase.co'
    const SUPABASE_SERVICE_ROLE_KEY = getEnv('SERVICE_ROLE_KEY') || ''
    const YT_CLIENT_ID = getEnv('YT_CLIENT_ID') || ''
    const YT_CLIENT_SECRET = getEnv('YT_CLIENT_SECRET') || ''

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    console.log('=== YouTube Token Refresh Cron Job Started ===')
    console.log('Time:', new Date().toISOString())

    // Fetch all YouTube accounts with tokens
    const { data: youtubeAccounts, error: fetchError } = await supabase
      .from('youtube_accounts')
      .select('id, workspace_id, access_token, refresh_token, token_expires_at, channel_id')
      .not('refresh_token', 'is', null)

    if (fetchError) {
      console.error('Error fetching YouTube accounts:', fetchError)
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${youtubeAccounts?.length || 0} YouTube accounts to check`)

    let refreshedCount = 0
    let errorCount = 0
    const results: any[] = []

    if (youtubeAccounts && youtubeAccounts.length > 0) {
      for (const account of youtubeAccounts) {
        try {
          const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null
          const now = new Date()
          // Refresh if expired or expiring in less than 30 minutes
          const shouldRefresh = !expiresAt || expiresAt.getTime() - now.getTime() < 30 * 60 * 1000

          if (shouldRefresh && account.refresh_token) {
            console.log(`Refreshing token for workspace: ${account.workspace_id}`)

            // Call Google OAuth to refresh token
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: YT_CLIENT_ID,
                client_secret: YT_CLIENT_SECRET,
                refresh_token: account.refresh_token,
                grant_type: 'refresh_token'
              })
            })

            if (tokenResponse.ok) {
              const tokens = await tokenResponse.json()
              
              // Update the token in database
              const { error: updateError } = await supabase
                .from('youtube_accounts')
                .update({
                  access_token: tokens.access_token,
                  token_expires_at: tokens.expires_in 
                    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
                    : new Date(Date.now() + 3600 * 1000).toISOString(), // Default 1 hour
                  updated_at: new Date().toISOString()
                })
                .eq('id', account.id)

              if (updateError) {
                console.error(`Error updating token for ${account.workspace_id}:`, updateError)
                errorCount++
                results.push({ workspace_id: account.workspace_id, status: 'error', message: updateError.message })
              } else {
                console.log(`Token refreshed successfully for workspace: ${account.workspace_id}`)
                refreshedCount++
                results.push({ workspace_id: account.workspace_id, status: 'success' })
              }
            } else {
              const errorText = await tokenResponse.text()
              console.error(`Failed to refresh token for ${account.workspace_id}:`, errorText)
              errorCount++
              
              // If refresh token is invalid, mark as disconnected
              if (errorText.includes('invalid_grant') || errorText.includes('token expired')) {
                console.log(`Refresh token invalid for ${account.workspace_id}, marking as needs reconnect`)
                results.push({ workspace_id: account.workspace_id, status: 'needs_reconnect' })
              } else {
                results.push({ workspace_id: account.workspace_id, status: 'error', message: errorText })
              }
            }
          } else {
            console.log(`Token still valid for workspace: ${account.workspace_id}, expires: ${expiresAt}`)
            results.push({ workspace_id: account.workspace_id, status: 'valid', expires_at: account.token_expires_at })
          }
        } catch (accountError) {
          console.error(`Error processing account ${account.workspace_id}:`, accountError)
          errorCount++
          results.push({ workspace_id: account.workspace_id, status: 'error', message: String(accountError) })
        }
      }
    }

    const summary = {
      total_accounts: youtubeAccounts?.length || 0,
      refreshed: refreshedCount,
      errors: errorCount,
      results,
      timestamp: new Date().toISOString()
    }

    console.log('=== Token Refresh Summary ===')
    console.log(JSON.stringify(summary, null, 2))

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('YouTube Token Refresh Cron Error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
