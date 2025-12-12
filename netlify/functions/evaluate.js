// netlify/functions/evaluate.js (VERSION IMPORT ESM)

// UTILISATION DE L'IMPORT ASYNCHRONE DE STYLE ESM/DYNAMIC
const { QUESTIONS, STORY_TEXT } = await import("../../src/constants.js");
const { GoogleGenAI } = await import("@google/genai"); 

// Changement de la syntaxe d'export de CommonJS à ESM
export const handler = async (event, context) => {
    
    // Initialisation du client (fait ici pour un import dynamique/asynchrone)
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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

    if (!question || !userAnswer) {
        return { statusCode: 400, body: JSON.stringify({ feedback: "Données requises manquantes (question ou userAnswer)." }) };
    }

    const prompt = `
        Tu es un correcteur expert en compréhension de l'écrit pour des élèves de 5ème année primaire. 
        Ton rôle est d'évaluer la réponse de l'élève à la question suivante, en utilisant le texte comme référence si nécessaire. 
        
        Question: "${question.text}"
        Réponse attendue/correcte: "${question.correctAnswer}"
        Réponse de l'élève: "${userAnswer}"
        
        Analyse la réponse de l'élève. Réponds uniquement avec un objet JSON strict au format suivant :
        {
            "status": "correct" | "partial" | "wrong",
            "feedback": "Un court message de motivation/correction à l'élève, maximum 10 mots."
        }
        
        Considère 'partial' si la réponse de l'élève contient l'idée principale mais manque de détails cruciaux.
        Considère 'correct' si l'idée principale est là, même si la formulation est différente.
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
        console.error("Erreur Gemini lors de l'évaluation:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                status: 'wrong',
                feedback: `Erreur serveur d'analyse. (${error.message || 'Clé API?'} - 500)` 
            })
        };
    }
};