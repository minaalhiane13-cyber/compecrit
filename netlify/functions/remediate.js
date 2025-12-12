// netlify/functions/remediate.js (VERSION FINALE AVEC CONTOURNEMENT DE L'ERREUR)

// Les constantes sont importées en dehors du handler
const { QUESTIONS, STORY_TEXT } = require("../../src/constants"); 

exports.handler = async (event, context) => {
    // 1. Déplacer l'importation de GenAI à l'intérieur du handler
    // C'EST LA CORRECTION CRITIQUE QUI DOIT RÉGLER LE PLANTE 502
    const { GoogleGenAI } = require("@google/genai"); 
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 2. Vérification de la méthode et du corps
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: JSON.stringify({ remediation: "Méthode non autorisée." }) };
    }
    
    // 3. Récupération des données (attempts)
    let data;
    try {
        data = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ remediation: "Format JSON invalide." }) };
    }

    const { attempts } = data;
    if (!attempts || attempts.length === 0) {
        // Optionnel : renvoyer un bilan par défaut si aucune tentative n'est trouvée
        return { 
            statusCode: 200, 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ remediation: "Aucune tentative n'a été enregistrée pour générer le bilan." }) 
        };
    }

    // 4. Préparation du prompt pour la remédiation
    const userPerformanceSummary = attempts.map(a => {
        const q = QUESTIONS.find(q => q.id === a.questionId);
        // Si la question n'est pas trouvée (juste au cas où)
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

    // 5. Appel à Gemini
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
        // Le 500 ici est plus informatif que le 502 de Netlify
        return {
            statusCode: 500,
            body: JSON.stringify({ remediation: `Erreur serveur lors de la génération du bilan. Le problème persiste : la librairie Gemini cause un plantage. (${error.message || 'Erreur inconnue'})` })
        };
    }
};