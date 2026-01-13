
import { GoogleGenAI } from "@google/genai";

/**
 * Generates creative content ideas or post drafts using Gemini.
 * Follows the guideline of creating a new instance right before the call.
 */
export const generateContentSuggestion = async (prompt: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert social media manager for a solo entrepreneur. Suggest creative content ideas, hooks, or full post drafts based on the input.",
      }
    });
    // Correct usage: .text is a property, not a method.
    return response.text;
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "Error generating AI suggestions. Please check your connection or try again later.";
  }
};

/**
 * Analyzes lead information to provide a score and next steps.
 */
export const analyzeCRMLead = async (leadInfo: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this lead information and provide a score (1-10) and next steps: ${leadInfo}`,
      config: {
        systemInstruction: "You are a sales assistant helping a solo operator score leads.",
      }
    });
    // Correct usage: .text is a property, not a method.
    return response.text;
  } catch (error) {
    console.error("AI Lead Analysis Error:", error);
    return "Could not analyze lead at this time.";
  }
};
