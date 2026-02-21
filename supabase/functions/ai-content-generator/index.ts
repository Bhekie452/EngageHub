// @ts-nocheck
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!);

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const {
      platform,
      contentType,
      topic,
      audience,
      tone,
      cta,
      currentContent,
    } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return new Response(JSON.stringify({ result: text }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
