
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
        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Recuperando tu progreso...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-40">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-black rounded-4xl p-8 sm:p-12 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl group border-b-[10px] border-brand-600">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Zap className="h-64 w-64 text-brand-400 rotate-12" />
          </div>
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-brand-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">Master Campus v1.5</span>
            <h2 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight">Certificación Global Retail</h2>
            <p className="text-zinc-400 max-w-lg text-base leading-relaxed mb-10 font-medium">Valida tus competencias en todas las áreas estratégicas: Atención, Operativa, Producto y Visual Merchandising.</p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-4">
            <button onClick={() => handleStartGlobalQuiz(false)} className="flex-1 sm:flex-none bg-white text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-brand-500 hover:text-white transition-all active:scale-95 shadow-xl">
              <Medal className="h-5 w-5" /> Iniciar Certificación
            </button>
            <button onClick={() => handleStartGlobalQuiz(true)} className="flex-1 sm:flex-none bg-zinc-900 text-zinc-400 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest border border-zinc-800 hover:text-white transition-all">
              Simulacro Global
            </button>
          </div>
        </div>

        <div className="bg-white rounded-4xl border border-gray-200 p-8 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Target className="h-4 w-4 text-brand-600" /> Mapa de Competencias</h3>
          <RadarChart data={radarData} labels={categories} />
        </div>
      </div>

      {/* Main Categories and Manuals */}
      <section className="space-y-8">
        <div className="border-b-2 border-gray-100 pb-4 flex items-center justify-between px-2">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Biblioteca Técnica</h2>
            <p className="text-gray-500 text-sm font-medium mt-1">Accede a los manuales oficiales de cada bloque formativo.</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {categories.map((cat) => {
            const catManuals = manuals.filter(m => m.category === cat);
            const isExpanded = expandedCategory === cat;
            const catResults = history.filter(h => h.category === cat && !h.isPractice);
            const lastScore = catResults.length > 0 ? catResults[0].score : null;

            return (
              <div key={cat} className="bg-white rounded-4xl border border-gray-200 shadow-sm transition-all duration-300">
                <div 
                  className="p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors gap-6"
                  onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                >
                  <div className="flex items-center gap-6">
                    <div className={`p-4 sm:p-5 rounded-3xl transition-colors ${isExpanded ? 'bg-brand-600 text-white shadow-xl' : 'bg-brand-50 text-brand-600'}`}>
                      <BookOpen className="h-7 w-7 sm:h-8 w-8" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight">{cat}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{catManuals.length} Manuales</span>
                        {lastScore !== null && (
                          <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${lastScore >= 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            Record Bloque: {lastScore.toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleStartBlockQuiz(cat as ManualCategory, false); }}
                      className="hidden md:flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 transition-all shadow-md active:scale-95"
                    >
                      <ShieldCheck className="h-5 w-5" /> Certificar Bloque
                    </button>
                    <div className="p-2 ml-auto">
                      {isExpanded ? <ChevronUp className="text-gray-400 h-6 w-6" /> : <ChevronDown className="text-gray-400 h-6 w-6" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-6 sm:p-12 animate-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {catManuals.map(m => {
                        const mHistory = history.filter(h => h.manualName === m.name).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        const bestScore = mHistory.length > 0 ? Math.max(...mHistory.map(h => h.score)) : null;

                        return (
                          <div key={m.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between h-full min-h-[200px]">
                            <div>
                              <div className="flex justify-between items-start mb-6">
                                <FileText className="text-brand-600 h-6 w-6" />
                                {bestScore !== null && (
                                  <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${bestScore >= 80 ? 'bg-green-50 text-green-600' : 'bg-zinc-100 text-zinc-500'}`}>
                                    Record: {bestScore.toFixed(0)}%
                                  </div>
                                )}
                              </div>
                              <h4 className="font-black text-gray-900 text-base leading-tight mb-8 line-clamp-3">{m.name}</h4>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => handleStartManualQuiz(m, false)}
                                className="w-full py-4 bg-gray-50 text-gray-900 border border-gray-100 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-all flex items-center justify-center gap-2"
                              >
                                Examen Oficial <ArrowRight className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleStartManualQuiz(m, true)}
                                className="w-full py-3 text-gray-400 text-[8px] font-black uppercase tracking-widest hover:text-gray-900 transition-colors"
                              >
                                Entrenamiento IA
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {/* Mobile Action for Block */}
                      <button 
                        onClick={() => handleStartBlockQuiz(cat as ManualCategory, false)}
                        className="md:hidden w-full py-6 bg-black text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 mt-4"
                      >
                        <ShieldCheck className="h-6 w-6" /> Certificar Todo el Bloque
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
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tight"><Award className="text-brand-600" /> Mi Actividad Académica</h3>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{history.length} Tests Superados</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 font-black text-[10px] uppercase text-gray-400">
                <tr>
                  <th className="px-8 py-6 text-left">Documentación</th>
                  <th className="px-8 py-6 text-center">Nota</th>
                  <th className="px-8 py-6 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {history.slice(0, 10).map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 truncate max-w-[200px] sm:max-w-none">{res.manualName}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{res.category}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`text-lg font-black ${res.score >= 80 ? 'text-green-600' : 'text-orange-600'}`}>{res.score.toFixed(0)}%</span>
                    </td>
                    <td className="px-8 py-6 text-right text-xs text-gray-400 font-bold">
                      {new Date(res.date).toLocaleDateString()}
                    </td>
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
