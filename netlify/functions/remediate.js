// netlify/functions/remediate.js

import { GoogleGenAI } from "@google/genai";
// IMPORTANT : Assurez-vous que le chemin vers constants.js est correct
import { STORY_TEXT, QUESTIONS } from "../../src/constants.js";

// 1. Fonction d'accès au client AI (getAiClient)
const getAiClient = () => {
    // Cette variable est configurée sur Netlify pour la sécurité
    if (!process.env.API_KEY) {
        throw new Error("API Key not found in Netlify environment.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// 2. Logique de génération du bilan (generateRemediation)
const generateRemediationWithGemini = async (attempts) => {
    const ai = getAiClient();

    if (!attempts || attempts.length === 0) {
        return "Aucune tentative n'a été enregistrée pour générer le bilan.";
    }

    // Préparation des données pour l'IA
    const userPerformanceSummary = attempts.map(a => {
        const question = QUESTIONS.find(q => q.id === a.questionId);
        const category = question ? question.category : 'Inconnue';
        return `
            - Question (Catégorie ${category}) : ${question?.text}
              (Statut final : ${a.status.toUpperCase()})
              Tentatives : ${a.attempts}
              Réponse de l'élève : "${a.userResponse}"
        `;
    }).join("\n");

    const prompt = `
        Agis en tant que professeur évaluateur spécialisé dans la remédiation pour la 5ème année.
        Ton objectif est de rédiger un bilan constructif pour l'élève.

        Voici le texte de référence :
        ---
        ${STORY_TEXT}
        ---

        Voici les performances détaillées de l'élève :
        ---
        ${userPerformanceSummary}
        ---

        Instructions pour la Remédiation :
        1. Rédige un message direct à l'élève, commençant par une phrase d'encouragement générale.
        2. Crée deux sections formatées en Markdown (avec des titres en **gras**) :
           - **Points Forts et Réussites :** Mentionne les catégories ou les questions réussies.
           - **Axes d'Amélioration :** Identifie la compétence principale à améliorer (Ex: Inférence, Lecture Littérale ou Évaluation).
        3. Pour l'axe d'amélioration, donne un conseil précis et pédagogique sur la **méthode** à employer pour s'améliorer (Ex: "Relis la phrase exacte" pour le Littéral, ou "Fais attention aux mots-clés de cause/conséquence" pour l'Inférentiel).
        4. Le bilan doit être bienveillant et professionnel.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text || "Impossible de générer le bilan.";
    } catch (error) {
        console.error("Gemini API Error in Remediation Function:", error);
        return "Une erreur est survenue lors de la création du bilan. Le service Gemini a rencontré un problème.";
    }
};

// 3. Le Handler (Point d'entrée de la Netlify Function)
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { attempts } = JSON.parse(event.body);

        // Appel de la logique de génération du bilan
        const resultText = await generateRemediationWithGemini(attempts);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ remediation: resultText })
        };
    } catch (error) {
        console.error("Fatal Error Processing Remediation Request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                remediation: "Erreur Serveur Interne : La fonction Remédiation n'a pas pu s'exécuter."
            })
        };
    }
};