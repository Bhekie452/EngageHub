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
      currentContent,
      refinementType,
      refinementPrompt,
    } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    const result = await model.generateContent(prompt);
    const refinedText = result.response.text();

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
