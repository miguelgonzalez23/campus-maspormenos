
import React, { useState, useEffect, useRef } from 'react';
import { Question, QuizConfig, QuizResult, QuestionType } from '../types';
import * as GeminiService from '../services/geminiService';
import * as StorageService from '../services/storageService';
import { CheckCircle, ArrowRight, Timer, ShieldCheck, ChevronLeft, GitMerge, RotateCcw } from 'lucide-react';

const SESSION_KEY = 'campus_active_quiz_session';

export const QuizInterface: React.FC<{
  config: QuizConfig;
  manualFiles: { data: string, mimeType: string }[];
  studentName: string;
  onExit: () => void;
}> = ({ config, manualFiles, studentName, onExit }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});
  const [completed, setCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(config.questionCount * 60);
  
  // Estados para la pregunta de Matching
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matchingPairs, setMatchingPairs] = useState<{[key: number]: number}>({});

  useEffect(() => {
    const initQuiz = async () => {
      try {
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession) {
          const session = JSON.parse(savedSession);
          if (session.studentName === studentName && session.manualId === config.manualId) {
            setQuestions(session.questions);
            setCurrentQuestionIndex(session.currentQuestionIndex || 0);
            setUserAnswers(session.userAnswers || {});
            setTimeLeft(session.timeLeft);
            setLoading(false);
            return;
          }
        }
        const generatedQuestions = await GeminiService.generateQuizQuestions(manualFiles, config);
        setQuestions(generatedQuestions);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    initQuiz();
  }, [studentName, config.manualId]);

  useEffect(() => {
    if (!loading && !completed && questions.length > 0) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        studentName, manualId: config.manualId, questions, 
        currentQuestionIndex, userAnswers, timeLeft
      }));
    }
  }, [currentQuestionIndex, userAnswers, timeLeft, loading, completed]);

  useEffect(() => {
    if (loading || completed) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, completed]);

  const finishQuiz = () => {
    setCompleted(true);
    localStorage.removeItem(SESSION_KEY);
    let correctCount = 0;
    const details = questions.map(q => {
      const isCorrect = userAnswers[q.id] === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id, questionText: q.questionText, 
        userAnswer: userAnswers[q.id] || "Sin responder", 
        correctAnswer: q.correctAnswer, isCorrect, 
        explanation: q.explanation, sourceManual: q.sourceManual
      };
    });
    StorageService.saveResult({
      id: Date.now().toString(), studentName, manualName: config.manualName,
      category: config.category, score: (correctCount / questions.length) * 100,
      totalQuestions: questions.length, correctAnswers: correctCount,
      date: new Date().toISOString(), difficulty: config.difficulty,
      isPractice: config.isPractice, details
    });
  };

  const handleMatchingSelection = (rightIndex: number) => {
    if (selectedLeft === null) return;
    const newPairs = { ...matchingPairs, [selectedLeft]: rightIndex };
    setMatchingPairs(newPairs);
    setSelectedLeft(null);
    
    // Actualizar userAnswers
    const answerStr = Object.entries(newPairs)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([l, r]) => `${l}:${r}`)
      .join(', ');
    setUserAnswers(prev => ({ ...prev, [questions[currentQuestionIndex].id]: answerStr }));
  };

  if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader /></div>;

  if (completed) {
    const score = Math.round((questions.filter(q => userAnswers[q.id] === q.correctAnswer).length / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto p-12 bg-white rounded-4xl shadow-2xl text-center">
        <h2 className={`text-6xl font-black mb-4 ${score >= 80 ? 'text-green-600' : 'text-red-600'}`}>{score}%</h2>
        <p className="text-xl font-bold mb-8">{score >= 80 ? '¡Certificación lograda!' : 'Refuerza los conceptos'}</p>
        <button onClick={onExit} className="w-full p-5 bg-black text-white rounded-2xl font-black uppercase text-xs">Volver al Campus</button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isAnswered = !!userAnswers[currentQuestion.id];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <span className="px-3 py-1 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest">{config.manualName}</span>
          <p className="text-xs font-bold text-gray-400 mt-1">Pregunta {currentQuestionIndex + 1} de {questions.length}</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-black text-gray-700">
          <Timer className="h-4 w-4 text-gray-400" />
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="bg-white rounded-4xl shadow-2xl border p-10 relative overflow-hidden">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
             <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${currentQuestion.type === 'matching' ? 'bg-purple-100 text-purple-700' : 'bg-brand-50 text-brand-700'}`}>
                {currentQuestion.type === 'matching' ? 'Relación de Conceptos' : 'Opción Múltiple'}
             </span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 leading-tight">{currentQuestion.questionText}</h2>
        </div>

        {currentQuestion.type === 'matching' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Columna Izquierda: Conceptos */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Conceptos</p>
                {currentQuestion.options.map((opt, i) => (
                  <button
                    key={`l-${i}`}
                    onClick={() => setSelectedLeft(i)}
                    className={`w-full p-4 rounded-2xl border-2 text-sm font-bold transition-all text-left flex items-center justify-between
                      ${selectedLeft === i ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-200' : 
                        matchingPairs[i] !== undefined ? 'border-green-200 bg-green-50 text-green-800' : 'border-gray-50 bg-gray-50'}`}
                  >
                    <span>{opt}</span>
                    {matchingPairs[i] !== undefined && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </button>
                ))}
              </div>

              {/* Columna Derecha: Definiciones */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Definiciones</p>
                {currentQuestion.matchingOptions?.map((opt, i) => {
                  const pairedLeftIndex = Object.entries(matchingPairs).find(([_, r]) => r === i)?.[0];
                  return (
                    <button
                      key={`r-${i}`}
                      onClick={() => handleMatchingSelection(i)}
                      disabled={selectedLeft === null && pairedLeftIndex === undefined}
                      className={`w-full p-4 rounded-2xl border-2 text-xs font-medium transition-all text-left flex items-center gap-3
                        ${pairedLeftIndex !== undefined ? 'border-green-200 bg-green-50' : 
                          selectedLeft !== null ? 'border-brand-200 hover:border-brand-600 cursor-pointer' : 'border-gray-50 opacity-50 cursor-not-allowed'}`}
                    >
                      <div className="h-5 w-5 rounded-lg bg-white border flex items-center justify-center text-[10px] font-black">
                        {pairedLeftIndex !== undefined ? String.fromCharCode(65 + Number(pairedLeftIndex)) : '?'}
                      </div>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {Object.keys(matchingPairs).length > 0 && (
              <button 
                onClick={() => {setMatchingPairs({}); setUserAnswers(p => ({...p, [currentQuestion.id]: ''}));}}
                className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest mx-auto"
              >
                <RotateCcw className="h-3 w-3" /> Reiniciar Relación
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {currentQuestion.options.map((opt, i) => (
              <button
                key={opt}
                onClick={() => setUserAnswers(p => ({ ...p, [currentQuestion.id]: opt }))}
                className={`w-full text-left p-6 rounded-3xl border-2 font-bold transition-all flex items-center gap-4
                  ${userAnswers[currentQuestion.id] === opt ? 'border-brand-600 bg-brand-50 text-brand-900' : 'border-gray-50 hover:bg-gray-50'}`}
              >
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black ${userAnswers[currentQuestion.id] === opt ? 'bg-brand-600 text-white' : 'bg-gray-100'}`}>
                  {String.fromCharCode(65 + i)}
                </div>
                {opt}
              </button>
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-between items-center">
          <button 
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)} 
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl text-xs font-black uppercase text-gray-400 hover:text-black disabled:opacity-0"
          >
            <ChevronLeft /> Anterior
          </button>
          <button 
            onClick={() => currentQuestionIndex === questions.length - 1 ? finishQuiz() : setCurrentQuestionIndex(prev => prev + 1)}
            disabled={currentQuestion.type === 'matching' ? Object.keys(matchingPairs).length < currentQuestion.options.length : !isAnswered}
            className="flex items-center gap-3 px-10 py-5 bg-black text-white rounded-2xl font-black uppercase text-xs disabled:opacity-20"
          >
            {currentQuestionIndex === questions.length - 1 ? 'Finalizar' : 'Siguiente'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Loader = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="h-12 w-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-sm font-black uppercase tracking-widest">Analizando Manuales Técnicos...</p>
  </div>
);
