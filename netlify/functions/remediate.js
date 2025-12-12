// netlify/functions/remediate.js (VERSION FINALE ET STABLE)

// RIEN n'est importé ici pour éviter les erreurs Top-level.

exports.handler = async (event, context) => {
    // Importation paresseuse de CONSTANTES (résout le chemin)
    const { QUESTIONS, STORY_TEXT } = require("../../src/constants.js"); 
    
    // Importation paresseuse de GENAI (résout le plantage 502)
    const { GoogleGenAI } = require("@google/genai"); 
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: JSON.stringify({ remediation: "Méthode non autorisée." }) };
    }
    
    // ... (Le reste du code reste identique) ...

    let data;
    try {
        data = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ remediation: "Format JSON invalide." }) };
    }

    const { attempts } = data;
    if (!attempts || attempts.length === 0) {
        return { 
            statusCode: 200, 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ remediation: "Aucune tentative n'a été enregistrée pour générer le bilan." }) 
        };
    }

    const userPerformanceSummary = attempts.map(a => {
        const q = QUESTIONS.find(q => q.id === a.questionId);
        if (!q) return ''; 
        return `Question [${q.category}]: "${q.text}". Statut final: ${a.status}. Réponse de l'élève: "${a.userResponse}". Tentatives: ${a.attempts}.`;
    }).join("\n");

    const prompt = `
        Tu es un professeur de français. Sur la base du texte que les élèves ont lu et des résultats ci-dessous, rédige un bilan de remédiation en français, en utilisant la mise en forme Markdown.
        
        Texte lu : ${STORY_TEXT}
        
        Performance de l'élève (par catégorie) :
        ---
        ${userPerformanceSummary}
        ---
        
        Ton bilan doit être divisé en deux sections :
        1. **Synthèse des acquis :** Les points forts de l'élève (catégories réussies).
        2. **Axes de progression :** La ou les catégories (LITERAL, INFERENTIAL, EVALUATIVE) où l'élève a eu des difficultés, avec des conseils précis sur comment aborder ces types de questions la prochaine fois. 
        
        Ne dépasse pas 300 mots au total.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ remediation: response.text })
        };

    } catch (error) {
        console.error("Erreur Gemini lors de la remédiation:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ remediation: `Erreur serveur lors de la génération du bilan. Le problème persiste : la librairie Gemini cause un plantage. (${error.message || 'Erreur inconnue'})` })
        };
    }
};