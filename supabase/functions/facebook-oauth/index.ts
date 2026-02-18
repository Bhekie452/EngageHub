import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const url = new URL(req.url)
  const pathname = url.pathname

  // /start - redirect to Facebook OAuth
  if (pathname.includes("/start")) {
    const workspaceId = url.searchParams.get('workspaceId')
    const returnUrl = url.searchParams.get('returnUrl') || ''
    const state = btoa(JSON.stringify({ workspaceId, returnUrl }))

    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${Deno.env.get('FB_CLIENT_ID') || ''}&` +
      `redirect_uri=${encodeURIComponent(Deno.env.get('FB_REDIRECT_URI') || '')}&` +
      `response_type=code&` +
      `scope=pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content&` +
      `state=${state}`

    return new Response(null, {
      status: 302,
      headers: { Location: facebookAuthUrl }
    })
  }

  // /callback - exchange code for tokens
  if (pathname.includes("/callback")) {
    const code = url.searchParams.get("code")
    const { state } = Object.fromEntries(url.searchParams)
    let workspaceId = ''
    let returnUrl = ''
    try {
      const parsed = JSON.parse(atob(state || ''))
      workspaceId = parsed.workspaceId
      returnUrl = parsed.returnUrl
    } catch {
      return new Response('Invalid state parameter', { status: 400 })
    }

    if (!code || !workspaceId) {
      return new Response("Missing code or workspaceId", { status: 400 })
    }

    try {
      const tokenRes = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: Deno.env.get('FB_CLIENT_ID') || '',
          client_secret: Deno.env.get('FB_CLIENT_SECRET') || '',
          redirect_uri: Deno.env.get('FB_REDIRECT_URI') || '',
        })
      })
      const tokenData = await tokenRes.json()
      if (tokenData.error) {
        return new Response(JSON.stringify({ error: tokenData.error }), { status: 400 })
      }

      // TODO: Store tokens in social_accounts table, fetch pages, profile details
      console.log('Facebook tokens received for workspace:', workspaceId)

      const target = returnUrl || Deno.env.get('VERCEL_URL') || 'http://localhost:3000'
      const redir = new URL(target)
      redir.searchParams.set('fb_oauth', 'success')
      return new Response(null, { status: 302, headers: { Location: redir.toString() } })
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
  }

  return new Response("Facebook OAuth Handler", { status: 200 })
})
