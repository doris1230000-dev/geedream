import { GoogleGenAI, Type } from "@google/genai";
import { DreamFragment } from "../types";
import { v4 as uuidv4 } from 'uuid';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-2.5-flash";

const systemInstruction = `
You are an expert dream analyst and Jungian psychologist. 
Your task is to take a user's dream description and break it down into "fragments" (key scenes or thought units).
For each fragment, you must analyze:
1. Characters involved.
2. Locations.
3. Emotions felt.
4. Colors: If explicitly mentioned, use them. If not, INFER the color based on the emotion (e.g., Fear -> Red/Black, Sadness -> Blue, Joy -> Yellow, Confusion -> Purple, Peace -> Green).
5. Actions taken.
6. Energy Score: An integer from 0 (low energy/passive) to 100 (high energy/intense).
7. Interpretation: A concise 1-sentence psychoanalytic interpretation of this specific fragment.

IMPORTANT: All text output (interpretation, characters, emotions, locations, etc.) MUST be in Traditional Chinese (繁體中文).

Return the response strictly as a JSON object.
`;

export const analyzeDreamText = async (dreamText: string, context?: string, reentryRecord?: string): Promise<DreamFragment[]> => {
  try {
    const prompt = `
    Context/Recent Life Events: ${context || "None provided"}
    
    Spiritual Re-entry/Active Imagination Record (Context only): ${reentryRecord || "None provided"}
    
    Dream Description:
    ${dreamText}
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fragments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "The original text of this fragment in Traditional Chinese" },
                  characters: { type: Type.ARRAY, items: { type: Type.STRING } },
                  locations: { type: Type.ARRAY, items: { type: Type.STRING } },
                  emotions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                  actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  energy_score: { type: Type.INTEGER, description: "0 to 100" },
                  interpretation: { type: Type.STRING, description: "Interpretation in Traditional Chinese" },
                },
                required: ["text", "characters", "locations", "emotions", "colors", "actions", "energy_score", "interpretation"]
              }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    const parsed = JSON.parse(jsonText);
    
    // Add UUIDs to fragments
    return parsed.fragments.map((f: any) => ({
      ...f,
      id: uuidv4()
    }));

  } catch (error) {
    console.error("Dream Analysis Error:", error);
    throw error;
  }
};