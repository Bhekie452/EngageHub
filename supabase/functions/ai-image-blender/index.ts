import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenerativeAI } from 'npm:@google/genai';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// CORS headers - allow any origin for flexibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing GEMINI_API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const { image, text, textColor, backgroundColor } = await req.json();

  if (!image || !text || !textColor || !backgroundColor) {
    return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

  const prompt = `
    You are an AI image editor. Your task is to take an image and overlay text on it.
    Do not change the original image in any other way.
    The text to add is: "${text}".
    The text color should be ${textColor}.
    The background color for the text (if any) should be ${backgroundColor}.
    Place the text in a visually appealing position on the image.
    Return only the modified image as a base64 encoded string.
  `;

  try {
    const imagePart = {
      inlineData: {
        data: image,
        mimeType: 'image/jpeg',
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const base64Image = await response.text();


    return new Response(JSON.stringify({ image: `data:image/jpeg;base64,${base64Image}` }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
