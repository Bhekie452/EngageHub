// @ts-nocheck
// Use OpenAI API for content refinement

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;

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
      currentContent,
      refinementType,
      refinementPrompt,
    } = await req.json();

    // Build the prompt for refinement
    const prompt = `You are a professional social media marketing expert.

Your task is to refine existing social media content for ${platform}.

CURRENT CONTENT:
"${currentContent}"

REFINEMENT REQUEST: ${refinementPrompt}

IMPORTANT:
- Keep the core message intact
- Stay optimized for ${platform}
- Maintain the same format/structure
- Return ONLY the refined content, no explanations or preamble
- Do not add any markdown formatting or quotes

Refined content:`;

    // Call Groq API
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
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const refinedText = data.choices[0]?.message?.content || '';

    // Clean up the response
    const cleanedText = refinedText
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/^#+\s/, "")
      .trim();

    return new Response(JSON.stringify({ result: cleanedText }), {
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
