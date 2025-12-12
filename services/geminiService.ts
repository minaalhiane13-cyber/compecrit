// src/services/geminiService.ts (NOUVELLE VERSION PROPRE ET SÉCURISÉE)

// Ce fichier ne fait que des appels HTTP vers les fonctions serveur sécurisées.

// NOTE: Vous aurez besoin de la structure complète UserAttempt et Question
// pour le typage des fonctions, assurez-vous que vous avez importé ces types
// (Si vous en avez besoin, ajoutez ici : import { UserAttempt, Question } from "../types";)

/**
 * Appel sécurisé à la Netlify Function pour générer le bilan de remédiation.
 * @param attempts La liste des tentatives de l'utilisateur.
 * @returns Le texte du bilan généré par l'IA.
 */
export const generateRemediation = async (attempts: any[]): Promise<string> => {
    // Le chemin d'accès à la fonction serveur
    const endpoint = '/.netlify/functions/remediate'; 
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attempts }),
        });

        if (!response.ok) {
            let errorMsg = `Erreur serveur (HTTP ${response.status}).`;
            try {
                const errorBody = await response.json();
                errorMsg = errorBody.remediation || errorMsg; // Tente de lire l'erreur renvoyée par le serveur (500)
            } catch {}
            throw new Error(errorMsg);
        }

        const result = await response.json();
        return result.remediation || 'Bilan généré, mais le contenu est vide.';

    } catch (error) {
        console.error("Network or Fetch Error for Remediation:", error);
        return "Échec de la connexion au serveur pour générer le bilan. Veuillez réessayer plus tard.";
    }
};

/**
 * Gestionnaire pour la synthèse vocale.
 * NOTE: Cette fonction devrait AUSSI être une Netlify Function pour la sécurité,
 * mais comme vous n'avez pas créé de fonction tts.js, nous la laissons factice.
 */
export const generateTextToSpeech = async (text: string): Promise<ArrayBuffer | null> => {
    // Dans l'attente d'une fonction serveur sécurisée pour le TTS, on ne retourne rien pour ne pas planter.
    console.warn("TTS désactivé : besoin d'une fonction serveur sécurisée (tts.js).");
    return null;
};