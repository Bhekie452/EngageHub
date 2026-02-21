// @ts-nocheck
// Use fetch directly to call Gemini API with v1 endpoint

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

// Simple CORS headers for public access (no JWT verification)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { platform, contentType, topic, audience, tone, cta, currentContent } = await req.json();

    const platformGuidelines = {
      "X (Twitter)":
        "Max 280 characters. Keep punchy and conversational. Include relevant hashtags (up to 2).",
      Instagram:
        "Casual and visual-focused. Use 20-30 hashtags. Include emojis naturally. Focus on creating FOMO.",
      Facebook:
        "Longer form OK. Community-first tone. Include call-to-action. Emojis work well.",
      LinkedIn:
        "Professional but personable. Remove hashtags or use 3 max. Focus on value and insights. This is B2B.",
      YouTube:
        "Engaging title/description. Include timestamps if applicable. Strong hooks in first line.",
      TikTok:
        "Short, punchy, trend-aware. Viral hooks. Trendy language OK. Emojis for emphasis.",
      "Multi-Platform":
        "General engaging content that works across platforms.",
    };

    const guidelines = platformGuidelines[platform as keyof typeof platformGuidelines] || platformGuidelines["Multi-Platform"];

    const prompt = `You are a professional social media marketing expert specializing in ${platform}.

Generate a high-performing ${contentType} for ${platform}.

CONTEXT:
- Topic/Product: ${topic}
- Target Audience: ${audience}
- Tone: ${tone}
- Call-to-Action: ${cta}
${currentContent ? `- Current Content: ${currentContent}` : ""}

PLATFORM GUIDELINES:
${guidelines}

TASK:
Generate exactly 3 variations of content that are:
✓ Optimized specifically for ${platform}
✓ Using appropriate emojis
✓ Including relevant hashtags (if platform supports them)
✓ Engaging and scroll-stopping
✓ Different in approach (one emotional, one data-driven, one story-based)

FORMAT YOUR RESPONSE EXACTLY LIKE THIS (no extra text):

---

Variation 1: Professional Approach
[CONTENT HERE]

---

Variation 2: Emotional Approach
[CONTENT HERE]

---

Variation 3: Story-Driven Approach
[CONTENT HERE]

---

Generate only the 3 variations. No preamble, no explanations.`;

    // Use fetch to call Gemini API directly with v1 endpoint
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return new Response(JSON.stringify({ result: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
