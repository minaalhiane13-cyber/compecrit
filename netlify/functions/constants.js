// src/constants.js

// L'import de type est supprimé pour le JavaScript
// export const STORY_TITLE = ... etc.

export const STORY_TITLE = "Alexandra David-Néel, une exploratrice sur le toit du monde";

export const STORY_TEXT = `
À vingt et un ans, elle obtient le premier prix de chant lyrique du Conservatoire et, sous le pseudonyme de Mademoiselle Myrial, elle part en tournée dans des théâtres de province, d'Europe, d'Afrique du Nord et d'Indochine.

Pendant environ un an, elle occupera l'emploi de première chanteuse d'opéra d'Hanoï, avant de rencontrer et de se marier à Tunis Philippe Néel, ingénieur des chemins de fer.

Mais Alexandra s'ennuie dans sa nouvelle vie. Elle quitte son mari, le 9 août 1911, c'est le grand départ. Elle est âgée de quarante-trois ans et s'embarque sur un paquebot des Messageries maritimes en direction de l'Inde. Elle pense revenir dans quelques mois, mais ne réapparaitra que quatorze ans plus tard !

Pendant ce deuxième voyage en Inde, elle va de monastère en monastère, accompagnée de sa mère spirituelle.

En 1914, elle arrive au Sikkim, où elle fait la connaissance d'Aphur Yongden, un jeune Sikkimis qui rêve de voyages et d'aller aux Îles Philippines. Pendant quarante ans, il sera au service de l'exploratrice, au début comme son assistant, puis au fil du temps il deviendra son fils adoptif. Elle rencontre également le treizième dalai-lama, le plus haut guide spirituel du Tibet, qui lui conseille d'apprendre le tibétain et l'encourage à se rendre dans ce pays.

Dès cet instant, Alexandra sent cet appel irrésistible des sommets et des hauts plateaux himalayens, où règnent la paix et le silence.

Un maître tibétain l'invite à suivre son enseignement, mais à une seule condition : vivre dans une caverne à plus de quatre mille mètres d'altitude dans le haut Sikkim ! Alexandra, qui a toujours rêvé de fuir la civilisation, est ravie. Le froid mordant de l'hiver, une nourriture très réduite ne lui font pas peur.

Ses domestiques l'aident à aménager sa caverne : planches et tissu, sans oublier son tub en zinc sur lequel est écrit « À Lachen, elle va pratiquer la méditation, le yoga, étudier la philosophie bouddhiste et enfin livre les secrets de la sagesse. »

Perché tel un chat sur le « toit du monde », Alexandra vit enfin heureuse, comme ensorcelée par la beauté, la nature, les nuées et le silence et la solitude des lieux. Plus tard, elle écrira un essai : « Ni le mal du pays pour un pays qui n'est pas le mien. »

Quand la Première Guerre mondiale éclate en Europe, il est impossible pour Alexandra et son fils adoptif Yongden, de rester. Aussi poursuivent-ils leur voyage : ils quittent les Indes en 1916 pour la Birmanie, le Japon, puis la Corée et la Chine.
`;

export const GLOSSARY = [
  { word: "Chant lyrique", definition: "Un chant d'opéra, très puissant et musical." },
  { word: "Pseudonyme", definition: "Un faux nom utilisé par un artiste pour cacher sa vraie identité." },
  { word: "Sikkim", definition: "Une région montagneuse située au nord de l'Inde." },
  { word: "Tub en zinc", definition: "Une grande bassine en métal utilisée autrefois pour prendre un bain." },
  { word: "Toit du monde", definition: "Surnom donné à l'Himalaya car ce sont les montagnes les plus hautes." },
  { word: "Méditation", definition: "Pratique pour calmer son esprit et réfléchir profondément." }
];

export const QUESTIONS = [
  // LITTERALE
  {
    id: 1,
    category: "LITERAL",
    text: "Quel pseudonyme utilise Alexandra David-Néel au début de sa carrière de chanteuse d'opéra ?",
    correctAnswer: "Elle utilise le pseudonyme de Mademoiselle Myrial.",
    hintSubtle: "Ce n'est pas son vrai nom, cherchez le nom commençant par 'M'.",
    hintSpecific: "Relis le tout premier paragraphe du texte."
  },
  {
    id: 2,
    category: "LITERAL",
    text: "Quel âge avait Alexandra David-Néel lorsqu'elle quitte son mari et s'embarque pour l'Inde en 1911 ?",
    correctAnswer: "Elle avait quarante-trois ans.",
    hintSubtle: "C'est un nombre écrit en toutes lettres dans le texte.",
    hintSpecific: "Cherche dans le troisième paragraphe, près de la date '1911'."
  },
  {
    id: 3,
    category: "LITERAL",
    text: "Qui est Aphur Yongden, et dans quelle région le rencontre-t-elle pour la première fois ?",
    correctAnswer: "C'est un jeune Sikkimis (futur fils adoptif) qu'elle rencontre au Sikkim.",
    hintSubtle: "Il deviendra très important pour elle. Le lieu est une région au nord de l'Inde.",
    hintSpecific: "Regarde le paragraphe qui commence par 'En 1914...'."
  },
  {
    id: 4,
    category: "LITERAL",
    text: "Quel équipement Alexandra emmène-t-elle dans sa caverne ?",
    correctAnswer: "Elle emmène un tub en zinc (une baignoire).",
    hintSubtle: "C'est un objet en métal pour se laver.",
    hintSpecific: "Cherche dans le paragraphe où ses domestiques l'aident à aménager sa caverne."
  },
  // INFERENTIELLE
  {
    id: 5,
    category: "INFERENTIAL",
    text: "Pourquoi peut-on affirmer qu'Alexandra David-Néel a fait une rupture radicale avec son ancienne vie en 1911 ?",
    correctAnswer: "Car elle quitte son mari, part très loin (en Inde) et ne revient pas avant 14 ans alors qu'elle pensait partir quelques mois.",
    hintSubtle: "Pense à la durée de son absence et à ce qu'elle a laissé derrière elle.",
    hintSpecific: "Relis la fin du troisième paragraphe : 'Elle pense revenir...'"
  },
  {
    id: 6,
    category: "INFERENTIAL",
    text: "Dans quel but principal le treizième dalaï-lama conseille-t-il à Alexandra David-Néel d'apprendre le tibétain ?",
    correctAnswer: "Pour qu'elle puisse se rendre au Tibet.",
    hintSubtle: "Il l'encourage à aller dans un pays spécifique.",
    hintSpecific: "Cherche la rencontre avec le dalaï-lama dans le texte."
  },
  {
    id: 7,
    category: "INFERENTIAL",
    text: "Que signifie l'expression « toit du monde » dans le contexte du texte ?",
    correctAnswer: "Cela désigne les hautes montagnes de l'Himalaya/Tibet.",
    hintSubtle: "Ce n'est pas un vrai toit de maison.",
    hintSpecific: "Regarde le glossaire ou le paragraphe qui commence par 'Perché tel un chat...'."
  },
  {
    id: 8,
    category: "INFERENTIAL",
    text: "L'auteure écrit qu'Alexandra vit « enfin heureuse » dans sa caverne. Que sous-entend le mot « enfin » par rapport à sa vie antérieure ?",
    correctAnswer: "Cela sous-entend qu'elle n'était pas vraiment heureuse avant, qu'elle s'ennuyait ou cherchait sa place.",
    hintSubtle: "Si on dit 'enfin', c'est qu'on a attendu ce bonheur longtemps.",
    hintSpecific: "Rappelle-toi du début du texte où il est dit qu'elle 's'ennuie dans sa nouvelle vie'."
  },
  // EVALUATIVE
  {
    id: 9,
    category: "EVALUATIVE",
    text: "Selon toi, quel trait de caractère est le plus dominant chez Alexandra : la ténacité ou la quête de spiritualité ? Justifiez.",
    correctAnswer: "Les deux réponses sont acceptables si justifiées. Ténacité (supporte le froid, reste 14 ans) ou Spiritualité (méditation, dalaï-lama).",
    hintSubtle: "Il n'y a pas de mauvaise réponse si tu expliques pourquoi. Pense à ce qu'elle endure ou à ce qu'elle étudie.",
    hintSpecific: "Réfléchis à sa vie dans la caverne : le froid (ténacité) ou le yoga/méditation (spiritualité)."
  },
  {
    id: 10,
    category: "EVALUATIVE",
    text: "« Ni le mal du pays pour un pays qui n'est pas le mien. » Explique cette phrase et dis si elle reflète du courage ou de l'indifférence.",
    correctAnswer: "Elle ne regrette pas la France car elle ne s'y sentait pas chez elle. Cela peut être vu comme du courage d'assumer sa vraie nature.",
    hintSubtle: "Elle parle de la France (son pays d'origine) qu'elle ne considère pas vraiment comme le sien.",
    hintSpecific: "Relis la phrase. Elle dit qu'elle n'est pas triste d'être loin. Pourquoi ?"
  }
];