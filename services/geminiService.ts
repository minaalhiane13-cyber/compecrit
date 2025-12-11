import { GoogleGenAI, Modality } from "@google/genai";
import { UserAttempt, Question, QuestionCategory } from "../types";
import { STORY_TEXT } from "../constants";

// ATTENTION : getAiClient et evaluateAnswerWithGemini ont été déplacées
// dans netlify/functions/evaluate.js pour la sécurité.

// Helper to get client (RÉINSÉRÉ pour les autres fonctions, mais moins sécurisé ici si c'est exécuté côté client !)
// Vous devriez déplacer generateRemediation et generateTextToSpeech également !
const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};


/**
 * Generates remediation lesson based on mistakes.
 * NOTE: Cette fonction utilise encore la clé API. Pour une sécurité totale, elle doit être déplacée
 * dans une autre Netlify Function (e.g., netlify/functions/remediate.js)
 */
export const generateRemediation = async (attempts: UserAttempt[]): Promise<string> => {
  const ai = getAiClient();
// ... Le reste de votre fonction generateRemediation ...
  const userPerformanceSummary = attempts.map(a => 
    `Question ID ${a.questionId} (Statut: ${a.status}, Réponse élève: "${a.userResponse}")`
  ).join("\n");

  const prompt = `
    Tu t'adresses directement à l'élève...
    ...
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "Impossible de générer le bilan.";
  } catch (error) {
    console.error(error);
    return "Une erreur est survenue lors de la création du bilan.";
  }
};

/**
 * Generates Speech for the text using Gemini TTS
 * NOTE: Cette fonction utilise aussi la clé API et le modèle gemini-2.5-flash-preview-tts
 * qui n'est pas fait pour le client. Elle DOIT être déplacée dans une Netlify Function.
 */
export const generateTextToSpeech = async (text: string): Promise<ArrayBuffer | null> => {
    const ai = getAiClient();
    try {
// ... Le reste de votre fonction generateTextToSpeech ...
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text: text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Fenrir' },
                    },
                },
            },
        });

// ... Le reste de votre fonction generateTextToSpeech ...
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) return null;

        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;

    } catch (error) {
        console.error("TTS Error", error);
        return null;
    }
}