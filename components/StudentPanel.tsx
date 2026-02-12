
import React, { useState, useEffect, useMemo } from 'react';
import { Manual, QuizConfig, QuizResult, ManualCategory } from '../types';
import * as StorageService from '../services/storageService';
import { BookOpen, Search, Filter, Play, CheckCircle, Clock, Award, Target, Zap, ChevronRight, BarChart3, ShieldCheck, Dumbbell, Medal, Users, Store, ChevronDown, ChevronUp, FileText, ArrowRight, RefreshCw } from 'lucide-react';

const categories: ManualCategory[] = ['Atención al Cliente', 'Operativa', 'Producto', 'Visual'];

const RadarChart: React.FC<{ data: number[], labels: string[], size?: number }> = ({ data, labels, size = 280 }) => {
  const center = size / 2;
  const radius = (size / 2) * 0.7;
  const angleStep = (Math.PI * 2) / (labels.length || 1);
  const getPoint = (angle: number, factor: number) => ({
    x: center + radius * factor * Math.cos(angle - Math.PI / 2),
    y: center + radius * factor * Math.sin(angle - Math.PI / 2)
  });
  const levelPaths = [0.2, 0.4, 0.6, 0.8, 1].map(level => labels.map((_, i) => {
    const { x, y } = getPoint(i * angleStep, level);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ') + ' Z');
  const dataPoints = data.map((val, i) => {
    const { x, y } = getPoint(i * angleStep, Math.max(0.05, val / 100));
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ') + ' Z';
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <svg width={size} height={size} className="overflow-visible">
        {levelPaths.map((path, i) => <path key={i} d={path} fill="none" stroke="#E5E7EB" strokeWidth="1" />)}
        {labels.map((_, i) => <line key={i} x1={center} y1={center} x2={getPoint(i * angleStep, 1).x} y2={getPoint(i * angleStep, 1).y} stroke="#E5E7EB" strokeWidth="1" />)}
        <path d={dataPoints} fill="rgba(37, 99, 235, 0.15)" stroke="#2563EB" strokeWidth="3" className="transition-all duration-1000" />
        {labels.map((label, i) => {
          const { x, y } = getPoint(i * angleStep, 1.25);
          const anchor = x > center ? 'start' : x < center ? 'end' : 'middle';
          return <text key={i} x={x} y={y} textAnchor={anchor} fontSize="9" fontWeight="800" fill="#6B7280" className="uppercase tracking-tighter">{label}</text>;
        })}
      </svg>
    </div>
  );
};

interface StudentPanelProps {
  onStartQuiz: (config: QuizConfig, manualFiles: { data: string, mimeType: string }[]) => void;
  studentName: string;
}

export const StudentPanel: React.FC<StudentPanelProps> = ({ onStartQuiz, studentName }) => {
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    const loadStudentData = async () => {
      setLoading(true);
      try {
        setManuals(StorageService.getManuals());
        const results = await StorageService.getStudentResults(studentName);
        setHistory(results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } finally {
        setLoading(false);
      }
    };
    loadStudentData();
  }, [studentName]);

  const radarData = useMemo(() => {
    return categories.map(cat => {
      const catResults = history.filter(r => r.category === cat && !r.isPractice);
      return catResults.length ? catResults.reduce((a, b) => a + b.score, 0) / catResults.length : 0;
    });
  }, [history]);

  const handleStartManualQuiz = (manual: Manual, isPractice: boolean = false) => {
    if (!manual.fileData) return;
    onStartQuiz({
      manualId: manual.id,
      manualName: manual.name,
      category: manual.category,
      difficulty: isPractice ? 'Básico' : 'Intermedio',
      questionCount: isPractice ? 10 : 20,
      isPractice
    }, [{ data: manual.fileData, mimeType: manual.mimeType || 'text/plain' }]);
  };

  const handleStartBlockQuiz = (category: ManualCategory, isPractice: boolean = false) => {
    const categoryManuals = manuals.filter(m => m.category === category && m.fileData);
    if (categoryManuals.length === 0) {
      alert("No hay manuales cargados en este bloque todavía.");
      return;
    }
    onStartQuiz({
      manualId: `block_${category}`,
      manualName: `Certificación Bloque: ${category}`,
      category: category,
      difficulty: isPractice ? 'Intermedio' : 'Avanzado',
      questionCount: 20,
      isPractice
    }, categoryManuals.map(m => ({ data: m.fileData!, mimeType: m.mimeType || 'text/plain' })));
  };

  const handleStartGlobalQuiz = (isPractice: boolean = false) => {
    const validManuals = manuals.filter(m => m.fileData);
    if (validManuals.length === 0) return;
    onStartQuiz({
      manualId: 'all_manuals',
      manualName: 'Certificación Global Campus',
      category: 'Global',
      difficulty: isPractice ? 'Intermedio' : 'Avanzado',
      questionCount: 30,
      isPractice
    }, validManuals.map(m => ({ data: m.fileData!, mimeType: m.mimeType || 'text/plain' })));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <RefreshCw className="h-10 w-10 text-brand-600 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Recuperando tu progreso de Firestore...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-black rounded-4xl p-10 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl group border-b-[10px] border-brand-600">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><Zap className="h-48 w-48 text-brand-400 rotate-12" /></div>
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-brand-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">Certificación Master Campus</span>
            <h2 className="text-4xl font-black mb-4 tracking-tight">Certificación Global Maspormenos</h2>
            <p className="text-zinc-400 max-w-md text-sm leading-relaxed mb-8 font-medium">Demuestra tu conocimiento integral combinando Atención, Operativa, Producto y Visual.</p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-4">
            <button onClick={() => handleStartGlobalQuiz(false)} className="bg-white text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-brand-500 hover:text-white transition-all active:scale-95 shadow-xl"><Medal className="h-5 w-5" /> Iniciar Certificación</button>
            <button onClick={() => handleStartGlobalQuiz(true)} className="bg-zinc-900 text-zinc-400 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest border border-zinc-800 hover:text-white transition-all">Simulacro Global</button>
          </div>
        </div>

        <div className="bg-white rounded-4xl border border-gray-200 p-8 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Target className="h-4 w-4 text-brand-600" /> Mapa de Competencias</h3>
          <RadarChart data={radarData} labels={categories} />
        </div>
      </div>

      {/* Main Categories and Manuals */}
      <section className="space-y-8">
        <div className="flex items-end justify-between border-b-2 border-gray-100 pb-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Itinerarios de Formación</h2>
            <p className="text-gray-500 text-sm font-medium mt-1">Explora los manuales técnicos y obtén tus sellos de bloque.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {categories.map((cat) => {
            const catManuals = manuals.filter(m => m.category === cat);
            const isExpanded = expandedCategory === cat;
            const catResults = history.filter(h => h.category === cat && !h.isPractice);
            const lastScore = catResults.length > 0 ? catResults[0].score : null;

            return (
              <div key={cat} className="bg-white rounded-4xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300">
                <div 
                  className="p-8 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                >
                  <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-3xl transition-colors ${isExpanded ? 'bg-brand-600 text-white shadow-xl' : 'bg-brand-50 text-brand-600'}`}>
                      <BookOpen className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{cat}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{catManuals.length} Documentos Maestros</span>
                        {lastScore !== null && (
                          <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${lastScore >= 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            Nota Bloque: {lastScore.toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleStartBlockQuiz(cat as ManualCategory, false); }}
                      className="hidden sm:flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 transition-all shadow-md active:scale-95"
                    >
                      <ShieldCheck className="h-4 w-4" /> Certificar Bloque
                    </button>
                    {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-6 sm:p-10 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {catManuals.map(m => {
                        const mHistory = history.filter(h => h.manualName === m.name).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        const bestScore = mHistory.length > 0 ? Math.max(...mHistory.map(h => h.score)) : null;

                        return (
                          <div key={m.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-full">
                            <div>
                              <div className="flex justify-between items-start mb-4">
                                <FileText className="text-brand-600 h-5 w-5" />
                                {bestScore !== null && (
                                  <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${bestScore >= 80 ? 'bg-green-50 text-green-600' : 'bg-zinc-100 text-zinc-500'}`}>
                                    Record: {bestScore.toFixed(0)}%
                                  </div>
                                )}
                              </div>
                              <h4 className="font-black text-gray-900 text-sm leading-tight mb-6">{m.name}</h4>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => handleStartManualQuiz(m, false)}
                                className="w-full py-3 bg-gray-50 text-gray-900 border border-gray-100 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-all flex items-center justify-center gap-2"
                              >
                                Realizar Test <ArrowRight className="h-3 w-3" />
                              </button>
                              <button 
                                onClick={() => handleStartManualQuiz(m, true)}
                                className="w-full py-2.5 text-gray-400 text-[8px] font-black uppercase tracking-widest hover:text-gray-900 transition-colors"
                              >
                                Entrenamiento IA
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {/* Mobile Block Button */}
                      <button 
                        onClick={() => handleStartBlockQuiz(cat as ManualCategory, false)}
                        className="sm:hidden w-full py-5 bg-black text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl"
                      >
                        Certificar Bloque Integral
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer History */}
      {history.length > 0 && (
        <section className="bg-white rounded-4xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-8 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tight"><Award className="text-brand-600" /> Actividad Reciente</h3>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{history.length} Tests Realizados</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 font-black text-[10px] uppercase text-gray-400">
                <tr><th className="px-8 py-5 text-left">Manual / Bloque</th><th className="px-8 py-5 text-center">Modalidad</th><th className="px-8 py-5 text-center">Nota</th><th className="px-8 py-5 text-right">Fecha</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {history.slice(0, 5).map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">{res.manualName}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{res.category}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${res.isPractice ? 'bg-zinc-100 text-zinc-500' : 'bg-brand-50 text-brand-700'}`}>
                        {res.isPractice ? 'Simulación' : 'Certificación'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {res.score >= 80 && <CheckCircle className="h-4 w-4 text-green-500" />}
                        <span className={`text-lg font-black ${res.score >= 80 ? 'text-green-600' : 'text-orange-600'}`}>{res.score.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right text-xs text-gray-400 font-bold">{new Date(res.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
