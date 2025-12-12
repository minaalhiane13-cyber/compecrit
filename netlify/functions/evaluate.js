// netlify/functions/evaluate.js

// Imports nécessaires pour l'exécution côté serveur
import { GoogleGenAI } from "@google/genai";
// Ajustez le chemin pour accéder à STORY_TEXT (le chemin '..' signifie remonter d'un niveau)
import { STORY_TEXT } from "../../src/constants.js"; 

// 1. Fonction d'accès au client AI (maintenant sécurisée)
const getAiClient = () => {
    // process.env.API_KEY est disponible ici (dans la Netlify Function)
    if (!process.env.API_KEY) {
        throw new Error("API Key not found in Netlify environment."); 
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// 2. Fonction d'évaluation (maintenant côté serveur)
const evaluateAnswerWithGemini = async (question, userAnswer) => {
    const ai = getAiClient();
    
    // Assurez-vous que les champs requis sont présents
    if (!question || !userAnswer || !question.text || !question.correctAnswer) {
         return { status: 'wrong', feedback: "Données d'entrée incomplètes." };
    }

    const prompt = `
        Agis en tant que professeur de français évaluateur.
        Texte de référence : "${STORY_TEXT}"
        Question : "${question.text}"
        Réponse attendue : "${question.correctAnswer}"
        Réponse de l'élève : "${userAnswer}"

        Instructions d'évaluation :
        1. Tolérance Linguistique : Ignorez strictement les fautes d'orthographe, de grammaire ou de syntaxe tant que le sens est correct.
        2. Si la réponse est correcte, marquez "CORRECT".
        3. Si la réponse est incomplète mais sur la bonne voie, marquez "PARTIAL".
        4. Si la réponse est fausse ou incompréhensible, marquez "WRONG".
        
        Instructions de Feedback :
        - Le feedback doit être factuel, neutre et pédagogique.
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
        const status = result.status?.toLowerCase();
        const feedback = result.feedback || "Feedback manquant.";

        return {
            status: status, 
            feedback: feedback
        };
    } catch (error) {
        console.error("Gemini API Error in Function:", error);
        return { status: 'wrong', feedback: "Analyse indisponible. Le service Gemini a rencontré un problème." };
    }
};


// 3. Le Handler (Point d'entrée pour Netlify)
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        // Le corps de la requête est une chaîne JSON qu'il faut analyser
        const { question, userAnswer } = JSON.parse(event.body);

        // Appel de la logique métier
        const result = await evaluateAnswerWithGemini(question, userAnswer);

        // Réponse envoyée au navigateur
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error("Fatal Error Processing Request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                status: 'wrong', 
                feedback: "Erreur Serveur Interne : La fonction n'a pas pu s'exécuter." 
            })
        };
    }
};