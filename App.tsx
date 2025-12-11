import React, { useState, useEffect } from 'react';
import { User, UserAttempt, QuestionCategory } from './types';
import { STORY_TITLE, STORY_TEXT, GLOSSARY, QUESTIONS } from './constants';
import { Button } from './components/Button';
import { evaluateAnswerWithGemini, generateRemediation, generateTextToSpeech } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from "jspdf";

type Step = 'login' | 'reading' | 'quiz' | 'results';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState<Step>('login');
  const [inputName, setInputName] = useState({ first: '', last: '' });
  
  // Quiz State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [attempts, setAttempts] = useState<UserAttempt[]>([]);
  const [tryCount, setTryCount] = useState(0); // 0 = not submitted, 1 = first try done, 2 = second try done
  const [feedback, setFeedback] = useState<{ type: 'success' | 'retry' | 'fail', msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Audio State
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  // Remediation
  const [remediation, setRemediation] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioSource) {
        try { audioSource.stop(); } catch {}
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.first && inputName.last) {
      setUser({ firstName: inputName.first, lastName: inputName.last });
      setStep('reading');
    }
  };

  const decodePCM = (buffer: ArrayBuffer, ctx: AudioContext): AudioBuffer => {
    // Gemini returns raw PCM 16-bit at 24kHz (usually)
    const pcmData = new Int16Array(buffer);
    const channels = 1;
    const sampleRate = 24000;
    
    const audioBuffer = ctx.createBuffer(channels, pcmData.length, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < pcmData.length; i++) {
        // Convert Int16 to Float32
        channelData[i] = pcmData[i] / 32768.0;
    }
    
    return audioBuffer;
  };

  const handlePlayAudio = async () => {
    // 1. Initialize Context on user gesture if needed
    let ctx = audioContext;
    if (!ctx) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        // Specifying sampleRate helps some browsers, though we manually create buffer later
        ctx = new Ctx({ sampleRate: 24000 });
        setAudioContext(ctx);
    }

    // 2. Resume if suspended (browser autoplay policy)
    if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
    }

    // 3. Stop if playing
    if (isPlaying && audioSource) {
      audioSource.stop();
      setIsPlaying(false);
      return;
    }

    if (!ctx) return;

    setAudioLoading(true);
    const audioBufferRaw = await generateTextToSpeech(STORY_TITLE + ". " + STORY_TEXT);
    setAudioLoading(false);

    if (audioBufferRaw) {
      try {
        // Manual PCM Decode instead of decodeAudioData
        const decodedBuffer = decodePCM(audioBufferRaw, ctx);
        
        const source = ctx.createBufferSource();
        source.buffer = decodedBuffer;
        source.connect(ctx.destination);
        source.start(0);
        
        setAudioSource(source);
        setIsPlaying(true);
        
        source.onended = () => setIsPlaying(false);
      } catch (e) {
        console.error("Error decoding/playing audio", e);
        alert("Impossible de lire l'audio sur cet appareil.");
      }
    }
  };

  const startQuiz = () => {
    if (audioSource) {
      try { audioSource.stop(); } catch {}
      setIsPlaying(false);
    }
    setStep('quiz');
  };

  const handleSubmitAnswer = async () => {
    if (!userResponse.trim()) return;
    setLoading(true);

    const currentQ = QUESTIONS[currentQIndex];
    
    // Evaluate via Gemini
    const evaluation = await evaluateAnswerWithGemini(currentQ, userResponse);
    setLoading(false);

    // Logic based on rules
    if (evaluation.status === 'correct') {
      // Success
      setFeedback({ type: 'success', msg: `Bonne réponse. ${evaluation.feedback}` });
      recordAttempt('correct');
      setTryCount(2); // Mark as done
    } else {
      // Not correct
      if (tryCount === 0) {
        // First Fail - HINT ONLY
        setTryCount(1);
        let hintMsg = "Votre réponse est incorrecte. ";
        if (evaluation.status === 'partial') {
          hintMsg = "Votre réponse est incomplète. ";
        }
        setFeedback({ 
            type: 'retry', 
            msg: `${hintMsg}Voici un indice pour vous aider : ${currentQ.hintSubtle}` 
        });
      } else {
        // Second Fail - FULL ANSWER
        setTryCount(2);
        recordAttempt('wrong');
        setFeedback({ 
            type: 'fail', 
            msg: `Réponse incorrecte. La bonne réponse est : "${currentQ.correctAnswer}"` 
        });
      }
    }
  };

  const recordAttempt = (status: 'correct' | 'wrong') => {
    setAttempts(prev => [...prev, {
      questionId: QUESTIONS[currentQIndex].id,
      attempts: tryCount + 1,
      status: status,
      userResponse: userResponse
    }]);
  };

  const nextQuestion = () => {
    if (currentQIndex < QUESTIONS.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setTryCount(0);
      setFeedback(null);
      setUserResponse('');
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setLoading(true);
    setStep('results');
    
    // Prepare Data for Chart
    const cats = [QuestionCategory.LITERAL, QuestionCategory.INFERENTIAL, QuestionCategory.EVALUATIVE];
    const data = cats.map(cat => {
      const qs = QUESTIONS.filter(q => q.category === cat);
      const categoryAttempts = attempts.filter(a => qs.find(q => q.id === a.questionId));
      const correctCount = categoryAttempts.filter(a => a.status === 'correct').length;
      return {
        name: cat,
        Score: qs.length > 0 ? (correctCount / qs.length) * 100 : 0,
        Total: qs.length,
        Correct: correctCount
      };
    });
    setChartData(data);

    // Generate Remediation
    const lesson = await generateRemediation(attempts);
    setRemediation(lesson);
    setLoading(false);
  };

  const handleDownloadPDF = () => {
    if (!user) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(18);
    doc.text("Bilan de Compréhension du texte : Alexandra David Néel, une exploratrice sur le toit du monde", pageWidth / 2, 20, { align: 'center' });
    
    // Student Info
    doc.setFontSize(12);
    doc.text(`Élève : ${user.firstName} ${user.lastName}`, 14, 35);
    doc.text(`Date : ${new Date().toLocaleDateString()}`, 14, 42);

    // Scores
    doc.setFontSize(14);
    doc.text("Résultats par catégorie :", 14, 55);
    doc.setFontSize(12);
    let yPos = 65;
    chartData.forEach(d => {
        doc.text(`- ${d.name} : ${d.Score.toFixed(0)}% (${d.Correct}/${d.Total})`, 20, yPos);
        yPos += 7;
    });

    // Remediation Content
    doc.setFontSize(14);
    doc.text("Synthèse des acquis et des difficultés :", 14, yPos + 10);
    
    doc.setFontSize(10);
    // Simple strip markdown for PDF or just print as is
    const cleanRemediation = remediation.replace(/[\#\*]/g, ''); 
    const splitText = doc.splitTextToSize(cleanRemediation, 180);
    doc.text(splitText, 14, yPos + 20);

    doc.save(`Bilan_${user.lastName}_${user.firstName}.pdf`);
  };

  // --- RENDERERS ---

  if (step === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 via-purple-100 to-yellow-100 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-100"></div>
        <div className="absolute -bottom-8 left-20 w-32 h-32 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-200"></div>

        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-4 border-blue-400 relative z-10">
          {/* Colorful header decoration */}
          <div className="flex justify-center gap-2 mb-6">
            <div className="w-4 h-4 rounded-full bg-red-500 animate-bounce"></div>
            <div className="w-4 h-4 rounded-full bg-yellow-400 animate-bounce delay-100"></div>
            <div className="w-4 h-4 rounded-full bg-green-500 animate-bounce delay-200"></div>
            <div className="w-4 h-4 rounded-full bg-blue-500 animate-bounce delay-300"></div>
            <div className="w-4 h-4 rounded-full bg-violet-500 animate-bounce delay-400"></div>
          </div>

          <h1 className="text-3xl font-extrabold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
            Compréhension de L'écrit
          </h1>
          <p className="text-center text-gray-500 mb-8 font-medium">Pour la 5ème année primaire</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-blue-800 font-bold mb-2 text-lg">Ton Prénom</label>
              <input 
                type="text" 
                required
                className="w-full p-4 border-2 border-yellow-300 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-200 outline-none transition-all text-lg"
                placeholder="Ex: Amine"
                value={inputName.first}
                onChange={e => setInputName({...inputName, first: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-blue-800 font-bold mb-2 text-lg">Ton Nom</label>
              <input 
                type="text" 
                required
                className="w-full p-4 border-2 border-red-300 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-200 outline-none transition-all text-lg"
                placeholder="Ex: Alami"
                value={inputName.last}
                onChange={e => setInputName({...inputName, last: e.target.value})}
              />
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full mt-6 bg-gradient-to-r from-blue-500 to-violet-600 border-none hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
              Commencer l'Aventure !
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'reading') {
    return (
      <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto font-sans">
        <header className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">Lecture du texte</h2>
          <div className="flex gap-2">
            <Button onClick={handlePlayAudio} variant="primary" disabled={audioLoading}>
              {audioLoading ? 'Chargement...' : isPlaying ? 'Arrêter la lecture' : 'Écouter la lecture magistrale'}
            </Button>
            <Button onClick={startQuiz} variant="success">
              Accéder aux questions
            </Button>
          </div>
        </header>

        <div className="bg-white rounded-lg p-6 md:p-10 shadow border border-gray-200">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">{STORY_TITLE}</h1>
          
          <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed whitespace-pre-line text-justify">
            {STORY_TEXT}
          </div>

          <div className="mt-10 bg-gray-50 p-6 rounded-lg border border-gray-300">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Glossaire</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {GLOSSARY.map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded shadow-sm border border-gray-200">
                  <span className="font-bold text-blue-900 block">{item.word}</span>
                  <span className="text-sm text-gray-700">{item.definition}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'quiz') {
    const question = QUESTIONS[currentQIndex];
    return (
      <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto flex flex-col font-sans">
        <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div>
            <span className="text-sm font-bold text-gray-500 uppercase">Question {currentQIndex + 1}/{QUESTIONS.length}</span>
            <div className="text-xs text-gray-600 mt-1">Catégorie : {question.category}</div>
          </div>
          <div className="w-1/3 h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentQIndex + 1) / QUESTIONS.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-md border border-gray-200 flex-grow relative">
          <Button 
             variant="secondary" 
             size="sm" 
             className="absolute top-4 right-4" 
             onClick={() => setStep('reading')}
          >
            Consulter le texte
          </Button>

          <h3 className="text-xl font-bold text-gray-900 mb-6 mt-4">
            {question.text}
          </h3>

          {!feedback || feedback.type === 'retry' ? (
            <div className="space-y-4">
              <textarea 
                className="w-full p-4 text-base border border-gray-300 rounded-lg focus:border-blue-500 outline-none resize-none h-32 bg-gray-50 text-gray-800"
                placeholder="Veuillez saisir votre réponse..."
                value={userResponse}
                onChange={e => setUserResponse(e.target.value)}
                disabled={loading || (tryCount === 2 && feedback?.type !== 'retry')}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitAnswer} 
                  disabled={loading || !userResponse}
                  variant="primary"
                  size="md"
                >
                  {loading ? 'Analyse...' : 'Valider'}
                </Button>
              </div>
            </div>
          ) : null}

          {feedback && (
            <div className={`mt-6 p-4 rounded-lg border-l-4 ${
              feedback.type === 'success' ? 'bg-green-50 border-green-600 text-green-900' :
              feedback.type === 'retry' ? 'bg-orange-50 border-orange-500 text-orange-900' :
              'bg-red-50 border-red-600 text-red-900'
            }`}>
              <div className="flex flex-col">
                <h4 className="font-bold text-md mb-1">
                  {feedback.type === 'success' ? 'Correct' : feedback.type === 'retry' ? 'Attention' : 'Incorrect'}
                </h4>
                <p className="text-sm leading-relaxed">{feedback.msg}</p>
              </div>
            </div>
          )}

          {(feedback?.type === 'success' || (feedback?.type === 'fail' && tryCount === 2)) && (
            <div className="mt-8 flex justify-center">
              <Button onClick={nextQuestion} variant="success" size="md">
                {currentQIndex < QUESTIONS.length - 1 ? 'Question Suivante' : 'Terminer l\'exercice'}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'results') {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gray-50 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white rounded-lg p-8 shadow text-center border-t-4 border-blue-600">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bilan de l'Exercice de compréhension</h1>
            <p className="text-lg text-gray-600">Élève : {user?.firstName} {user?.lastName}</p>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
              <h3 className="text-lg font-bold text-center mb-6 text-gray-800">Scores par Compétence</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 11}} interval={0} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="Score" radius={[4, 4, 0, 0]} name="Réussite (%)">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.Score >= 50 ? '#16a34a' : '#dc2626'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Remediation */}
            <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                Analyse Pédagogique
              </h3>
              {loading ? (
                <div className="flex items-center justify-center h-48 text-gray-500">
                  Génération du bilan en cours...
                </div>
              ) : (
                <div className="prose prose-sm prose-blue bg-gray-50 p-4 rounded max-w-none text-gray-800">
                  <ReactMarkdown>{remediation}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-4 pb-10">
            <Button onClick={handleDownloadPDF} variant="secondary" size="md" disabled={loading}>
              Télécharger le Bilan (PDF)
            </Button>
            <Button onClick={() => window.location.reload()} variant="danger" size="md">
              Quitter l'application
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <div>Chargement...</div>;
};

export default App;