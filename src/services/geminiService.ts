import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getChatResponse(
  message: string, 
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
) {
  const systemInstruction = `
    Du bist ein hilfreicher, präziser und intelligenter KI-Assistent. 
    Du bist freundlich und hilfsbereit. 
    Antworte immer auf Deutsch, sofern der Benutzer nichts anderes wünscht.
    Gib korrekte und sachliche Informationen.
  `;

  const contents = [
    ...history,
    { role: 'user', parts: [{ text: message }] }
  ];

  const modelsToTry = [
    "gemini-3-flash-preview",
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite-preview"
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: contents as any,
        config: {
          systemInstruction
        }
      });
      return response.text;
    } catch (error: any) {
      console.warn(`Model ${model} failed:`, error.message);
      lastError = error;
      
      // Specific check for API key errors
      if (error.message?.includes("API key not valid") || error.status === 400) {
        throw new Error("Der Gemini API-Schlüssel fehlt oder ist ungültig. Wenn Sie diese App extern hosten (z.B. Vercel, Firebase), müssen Sie dort in den Einstellungen die Umgebungsvariable 'GEMINI_API_KEY' eintragen.");
      }

      // If it's a 503/501 or UNAVAILABLE error, continue to the next model
      if (error.message?.includes("demand") || error.message?.includes("UNAVAILABLE") || error.status === 503 || error.status === 501) {
        continue;
      }
      // For other errors, throw immediately
      throw new Error(error.message || "Ein Fehler ist bei der KI-Anfrage aufgetreten.");
    }
  }

  // If all models fail
  console.error("All Gemini models failed. Last error:", lastError);
  throw new Error("Alle KI-Modelle sind derzeit überlastet. Bitte versuchen Sie es in ein paar Minuten noch einmal.");
}
