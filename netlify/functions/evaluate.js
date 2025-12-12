// netlify/functions/evaluate.js (VERSION FINALE AVEC CONTOURNEMENT D'ERREUR)

// NOTE: Le require est déplacé À L'INTÉRIEUR du handler pour éviter le plantage à l'initialisation globale.
const { QUESTIONS } = require("../../src/constants.js"); 

exports.handler = async (event, context) => {
    // 1. Déplacer l'importation de GenAI à l'intérieur du handler
    const { GoogleGenAI } = require("@google/genai"); 
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // ... (Reste de votre code de vérification, puis du prompt) ...

    // Reste de la logique de vérification (méthode, JSON.parse, etc.)
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: JSON.stringify({ feedback: "Méthode non autorisée." }) };
    }
    
    let data;
    try {
        data = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ feedback: "Format JSON invalide." }) };
    }

    const { question, userAnswer } = data;

    // ... (Code du prompt et de l'appel GenAI, tel que dans votre version précédente) ...

    const prompt = `
        Tu es un correcteur expert en compréhension de l'écrit... [Utilisez le prompt complet que vous aviez]
        ...
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const jsonText = response.text.replace(/```json|```/g, '').trim();
        const evaluation = JSON.parse(jsonText);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(evaluation)
        };

    } catch (error) {
        // Cette erreur devrait maintenant être une erreur d'API (clé) et non une erreur d'initialisation
        console.error("Erreur Gemini lors de l'évaluation:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                status: 'wrong',
                feedback: `Erreur critique du serveur d'analyse. La clé API est-elle valide? (${error.message || '500'})` 
            })
        };
    }
};