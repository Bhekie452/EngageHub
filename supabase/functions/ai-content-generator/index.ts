// @ts-nocheck
// Use OpenAI API for content generation

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;

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
    const { platform, contentType, topic, audience, tone, cta, currentContent, existingText, variationIndex, websiteUrl } = await req.json();

    // Handle Image Text content type
    if (contentType === 'Image Text' || contentType === 'Image Text Regenerate') {
      let companyContext = '';
      
      // If website URL is provided, fetch company info
      if (websiteUrl) {
        try {
          const websiteResponse = await fetch(websiteUrl, {
            headers: { 'User-Agent': 'EngageHub-Bot/1.0' }
          });
          const html = await websiteResponse.text();
          
          // Extract basic info from HTML
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
          
          const companyName = titleMatch?.[1] || 'Company';
          const description = descMatch?.[1] || '';
          
          companyContext = `
COMPANY INFO FROM WEBSITE:
- Company Name: ${companyName}
- Description: ${description}
- Use this company identity to create relevant, consistent content that matches their brand.
`;
        } catch (e) {
          console.log('Could not fetch website info:', e);
        }
      }

      const imageTextPrompt = contentType === 'Image Text Regenerate' 
        ? `Generate a new catchy text for an image based on topic: ${topic}. The current text is: ${existingText || ''}. Generate 5 short, impactful text options (max 15 words each) suitable for overlay on images. Make them attention-grabbing, emotional, or question-based.`
        : `You are a professional graphic designer and copywriter specializing in social media image text overlays.

Generate catchy, scroll-stopping text for images based on:
- Topic/Theme: ${topic}
- Target Audience: ${audience}
- Tone: ${tone}
${companyContext}
Create 5 short, impactful text options (MAX 15 words each) that work well as image overlays. They should be:
✓ Attention-grabbing
✓ Easy to read at a glance
✓ Emotionally compelling
✓ Different styles (bold statement, question, quote, minimal, FOMO)
✓ Match the company brand if company info provided

FORMAT YOUR RESPONSE EXACTLY LIKE THIS (one option per line, no numbering):

---

Make it happen today

---

Ready to level up?

---

Your journey starts here

---

Don't miss out!

---

What's stopping you?`;

      const imageTextResponse = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: imageTextPrompt }],
          temperature: 0.9,
          max_tokens: 1024,
        }),
      });

      if (!imageTextResponse.ok) {
        const errorData = await imageTextResponse.text();
        throw new Error(`Groq API error: ${imageTextResponse.status} - ${errorData}`);
      }

      const imageTextData = await imageTextResponse.json();
      const imageText = imageTextData.choices[0]?.message?.content || '';

      return new Response(JSON.stringify({ result: imageText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Original content generation for other types
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

    // Use fetch to call Groq API
    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || 'No response generated';

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
