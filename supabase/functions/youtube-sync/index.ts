import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

function getEnv(k: string): string {
  return (((globalThis as any).Deno?.env?.get?.(k) as string | undefined) ?? "") || "";
}

function extractVideoId(externalUrl: string | null): string | null {
  const url = (externalUrl || "").trim();
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "") || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] || null;
    }
  } catch {
    // ignore
  }
  return null;
}

serve(async (req) => {
  // allow GET/POST (GET is convenient for cron)
  if (!["GET", "POST"].includes(req.method)) return new Response("Method Not Allowed", { status: 405 });

  const SUPABASE_URL = getEnv("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const YT_KEY = getEnv("VITE_YOUTUBE_API_KEY") || getEnv("YT_API_KEY") || '';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "missing_supabase_env" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!YT_KEY) {
    return new Response(JSON.stringify({ error: "missing_youtube_api_key" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Fetch published YouTube posts
  const { data: posts, error } = await sb
    .from("posts")
    .select("id, workspace_id, link_url, platforms")
    .contains("platforms", ["youtube"])
    .not("link_url", "is", null)
    .limit(200);

  if (error) {
    return new Response(JSON.stringify({ error: "db_error", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rows = posts || [];
  let processed = 0;
  let updated = 0;

  for (const p of rows) {
    processed++;
    const videoId = extractVideoId(p.link_url || null);
    if (!videoId) continue;

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(YT_KEY)}`;
    const resp = await fetch(apiUrl);
    if (!resp.ok) continue;

    const json = await resp.json().catch(() => ({}));
    const stats = json?.items?.[0]?.statistics;
    if (!stats) continue;

    const payload = {
      post_id: p.id,
      workspace_id: p.workspace_id,
      video_id: videoId,
      views: Number(stats.viewCount) || 0,
      likes: Number(stats.likeCount) || 0,
      comments: Number(stats.commentCount) || 0,
      fetched_at: new Date().toISOString(),
    };

    const { error: upErr } = await sb.from("post_youtube_stats").upsert(payload, { onConflict: "post_id" });
    if (!upErr) updated++;
  }

  return new Response(JSON.stringify({ ok: true, processed, updated }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
