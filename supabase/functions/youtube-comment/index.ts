import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

type CommentBody = {
  workspaceId: string;
  videoId: string;
  text: string;
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

async function insertComment(accessToken: string, videoId: string, text: string): Promise<Response> {
  return fetch("https://www.googleapis.com/youtube/v3/commentThreads?part=snippet", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      snippet: {
        videoId,
        topLevelComment: {
          snippet: {
            textOriginal: text,
          },
        },
      },
    }),
  });
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

  let body: CommentBody;
  try {
    body = (await req.json()) as CommentBody;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body?.workspaceId || !body?.videoId || !body?.text?.trim()) {
    return new Response(JSON.stringify({ error: "workspaceId_videoId_text_required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: acct, error: acctErr } = await sb
    .from("youtube_accounts")
    .select("access_token, refresh_token")
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
  let ytResp = await insertComment(accessToken, body.videoId, body.text);

  if (ytResp.status === 401 && acct?.refresh_token) {
    const refreshed = await refreshAccessToken(String(acct.refresh_token));
    if (refreshed?.access_token) {
      accessToken = String(refreshed.access_token);
      await sb.from("youtube_accounts").update({ access_token: accessToken }).eq("workspace_id", body.workspaceId);
      ytResp = await insertComment(accessToken, body.videoId, body.text);
    }
  }

  if (!ytResp.ok) {
    const text = await ytResp.text().catch(() => "");
    return new Response(
      JSON.stringify({ error: "youtube_comment_failed", status: ytResp.status, details: text || undefined }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const json = await ytResp.json().catch(() => ({}));
  return new Response(JSON.stringify({ ok: true, data: json }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
