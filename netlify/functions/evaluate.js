// netlify/functions/evaluate.js (Test ULTIME de Stabilité - Vrai)

exports.handler = async (event, context) => {
    // Si ce code est exécuté, cela confirmera que le problème est le require/import de GoogleGenAI.
    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            status: 'correct',
            feedback: 'TEST ULTIME OK : Le serveur est stable. Le problème est dans la ligne require("@google/genai").',
            source: 'TEST ULTIME'
        })
    };
};