import { GoogleGenAI, Modality } from "@google/genai";
import { UserAttempt, Question, QuestionCategory } from "../types";
import { STORY_TEXT } from "../constants";

// Helper to get client
const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Evaluates the student's answer using Gemini.
 */
export const evaluateAnswerWithGemini = async (
  question: Question,
  userAnswer: string
): Promise<{ status: 'correct' | 'partial' | 'wrong', feedback: string }> => {
  const ai = getAiClient();
  
  const prompt = `
    Agis en tant que professeur de français évaluateur.
    Texte de référence : "${STORY_TEXT}"
    Question : "${question.text}"
    Réponse attendue : "${question.correctAnswer}"
    Réponse de l'élève : "${userAnswer}"

    Instructions d'évaluation :
    1. **Tolérance Linguistique** : Ignorez strictement les fautes d'orthographe, de grammaire ou de syntaxe tant que le sens de la réponse est compréhensible et correct sur le fond.
    2. Si la réponse de l'élève démontre une compréhension correcte de l'élément demandé, marquez "CORRECT".
    3. Si la réponse est incomplète mais sur la bonne voie, marquez "PARTIAL".
    4. Si la réponse est factuellement fausse ou incompréhensible, marquez "WRONG".
    
    Instructions de Feedback :
    - Le feedback doit être factuel, neutre et pédagogique.
    - Évitez les émojis et le ton enthousiaste excessif.
    - Si PARTIAL ou WRONG, expliquez brièvement pourquoi sans donner la réponse.

    Format de réponse attendu (JSON uniquement):
    {
      "status": "CORRECT" | "PARTIAL" | "WRONG",
      "feedback": "Commentaire pédagogique court."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      status: result.status.toLowerCase(),
      feedback: result.feedback
    };
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return { status: 'wrong', feedback: "Analyse non disponible. Veuillez réessayer." };
  }
};

/**
 * Generates remediation lesson based on mistakes.
 */
export const generateRemediation = async (attempts: UserAttempt[]): Promise<string> => {
  const ai = getAiClient();

  const userPerformanceSummary = attempts.map(a => 
    `Question ID ${a.questionId} (Statut: ${a.status}, Réponse élève: "${a.userResponse}")`
  ).join("\n");

  const prompt = `
    Tu t'adresses directement à l'élève (niveau 5ème année primaire, environ 10-11 ans).
    Voici ses résultats sur le texte "Alexandra David-Néel, une exploratrice sur le toit du monde" :
    ${userPerformanceSummary}

    Les catégories sont :
    - Littérale (Trouver l'information écrite directement dans le texte)
    - Inférentielle (Comprendre ce qui n'est pas écrit mais suggéré par des indices)
    - Évaluative (Donner son avis personnel et le justifier)

    Tes consignes :
    1. Analyse les erreurs.
    2. Rédige un bilan **simple et encourageant** adressé à l'enfant (utilise le "Tu").
    3. Pour chaque catégorie qui a posé problème (ou pour les 3 si nécessaire pour réviser), explique simplement ce que c'est.
    4. **TRÈS IMPORTANT** : Pour chaque catégorie expliquée, donne un **exemple concret** de Question et de Réponse (tu peux inventer un exemple simple hors du texte ou lié au texte mais l'exemple doit être adapté à un élève marocain de 5ème année primaire).

    Format Markdown attendu :
    ## Ton Bilan
    [Commentaire général simple sur ce qui est réussi et ce qui est à revoir]

    ## Conseils et Exemples
    
    ### [Nom de la catégorie]
    **C'est quoi ?** : [Définition très simple pour un enfant de 10 ans]
    **Exemple pour t'entraîner** :
    *   **Question** : [Exemple de question]
    *   **Réponse** : [Exemple de réponse]
    **Le conseil** : [Petite astuce méthodologique]

    (Répète pour les autres catégories si besoin)
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
 */
export const generateTextToSpeech = async (text: string): Promise<ArrayBuffer | null> => {
    const ai = getAiClient();
    try {
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
