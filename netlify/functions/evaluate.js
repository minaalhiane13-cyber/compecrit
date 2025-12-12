// netlify/functions/evaluate.js

import { GoogleGenAI } from "@google/genai";
import { STORY_TEXT, QUESTIONS } from "../../src/constants.js"; // <-- CORRECTION CLÉ : ajout de .js

// 1. Fonction d'accès au client AI (getAiClient)
const getAiClient = () => {
    if (!process.env.API_KEY) {
        // En mode production, cette erreur indique que la variable Netlify n'est pas définie.
        throw new Error("API Key not found in Netlify environment. Check your environment variables.");
    }
    // L'API Key est lue uniquement côté serveur
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// 2. Logique d'évaluation (evaluateAnswerWithGemini)
const evaluateAnswerWithGemini = async (question, userAnswer) => {
    const ai = getAiClient();
    
    // Vérification de base
    if (!question || !userAnswer || !question.text || !question.correctAnswer) {
         return { status: 'wrong', feedback: "Données d'entrée incomplètes." };
    }

    const prompt = `
        Agis en tant que professeur de français évaluateur de haut niveau, spécialisé en compréhension de l'écrit.
        Ta mission est d'être **TRES TOLÉRANT** sur la forme et de te concentrer **UNIQUEMENT** sur le fond et la justesse de l'information.

        Question : "${question.text}"
        Réponse attendue (Référence) : "${question.correctAnswer}"
        Réponse de l'élève : "${userAnswer}"

        Instructions d'évaluation EXTRÊMEMENT STRICTES :
        1. **Tolérance Linguistique Max:** Ignore strictement les fautes d'orthographe, de grammaire, de ponctuation ou de syntaxe. La forme n'est pas évaluée.
        2. **Évaluation du Fond:** Compare le sens de la "Réponse de l'élève" avec le sens de la "Réponse attendue (Référence)".
        3. **Classification:**
           - Si la réponse de l'élève contient **tous les éléments clés** du sens de la Réponse attendue, même si elle est formulée différemment, marque **"CORRECT"**.
           - Si la réponse de l'élève contient **une partie significative** mais manque des détails cruciaux ou est imprécise, marque **"PARTIAL"**.
           - Si la réponse est complètement fausse, hors sujet, ou ne contient aucun élément clé, marque **"WRONG"**.
        
        Instructions de Feedback :
        - Le feedback doit être factuel, neutre et pédagogique.
        - S'il est PARTIAL ou WRONG, explique très brièvement (1 phrase) quel concept est manquant ou erroné, sans donner la réponse complète.
        - S'il est CORRECT, félicite l'élève en mentionnant pourquoi c'était pertinent.

        Format de réponse attendu (JSON uniquement):
        {
          "status": "CORRECT" | "PARTIAL" | "WRONG",
          "feedback": "Commentaire pédagogique court et encourageant, basé sur la tolérance."
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        // Tente de parser le JSON renvoyé par Gemini
        const jsonText = response.text.trim().match(/\{[\s\S]*\}/)?.[0];
        if (!jsonText) {
             console.error("Gemini did not return valid JSON:", response.text);
             return { status: 'wrong', feedback: "Erreur de format IA. Réessayez." };
        }
        
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Gemini API Error in Evaluation Function:", error);
        // Si l'IA plante, on retourne une erreur générique pour le client
        return { status: 'wrong', feedback: "Une erreur est survenue lors de l'analyse (service IA indisponible)." };
    }
};

// 3. Le Handler (Point d'entrée de la Netlify Function)
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { question, userAnswer } = JSON.parse(event.body);

        // Appel de la logique d'évaluation
        const result = await evaluateAnswerWithGemini(question, userAnswer);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error("Fatal Error Processing Evaluation Request:", error);
        // C'est ce type d'erreur qui cause le 502 si elle est très précoce
        return {
            statusCode: 500,
            body: JSON.stringify({
                status: 'wrong',
                feedback: "Erreur Serveur Interne : Impossible d'exécuter l'analyse."
            })
        };
    }
};