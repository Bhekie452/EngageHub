import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

type LikeBody = {
  workspaceId: string;
  videoId: string;
  rating?: "like" | "none" | "dislike";
};

function getEnv(k: string): string {
  return (((globalThis as any).Deno?.env?.get?.(k) as string | undefined) ?? "") || "";
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in?: number } | null> {
  const CLIENT_ID = getEnv("YT_CLIENT_ID");
  const CLIENT_SECRET = getEnv("YT_CLIENT_SECRET");
  if (!CLIENT_ID || !CLIENT_SECRET || !refreshToken) return null;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const json = await resp.json();
  if (!resp.ok || json?.error) return null;
  return json;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const SUPABASE_URL = getEnv("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "missing_supabase_env" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: LikeBody;
  try {
    body = (await req.json()) as LikeBody;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body?.workspaceId || !body?.videoId) {
    return new Response(JSON.stringify({ error: "workspaceId_and_videoId_required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: acct, error: acctErr } = await sb
    .from("youtube_accounts")
    .select("access_token, refresh_token, token_expires_at")
    .eq("workspace_id", body.workspaceId)
    .maybeSingle();

  if (acctErr) {
    return new Response(JSON.stringify({ error: "db_error", details: acctErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!acct?.access_token) {
    return new Response(JSON.stringify({ error: "youtube_not_connected" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let accessToken = String(acct.access_token);
  const rating = body.rating || "like";

  // Attempt request; if unauthorized and refresh token exists, refresh then retry
  const doRate = async (token: string) => {
    const rateUrl = `https://www.googleapis.com/youtube/v3/videos/rate?id=${encodeURIComponent(body.videoId)}&rating=${encodeURIComponent(rating)}`;
    return fetch(rateUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  let ytResp = await doRate(accessToken);

  if (ytResp.status === 401 && acct?.refresh_token) {
    const refreshed = await refreshAccessToken(String(acct.refresh_token));
    if (refreshed?.access_token) {
      accessToken = String(refreshed.access_token);
      const expiresIn = Number(refreshed.expires_in || 0);
      const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

      await sb
        .from("youtube_accounts")
        .update({ access_token: accessToken, token_expires_at: tokenExpiresAt })
        .eq("workspace_id", body.workspaceId);

      ytResp = await doRate(accessToken);
    }
  }

  if (!ytResp.ok) {
    const text = await ytResp.text().catch(() => "");
    return new Response(
      JSON.stringify({ error: "youtube_rate_failed", status: ytResp.status, details: text || undefined }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
