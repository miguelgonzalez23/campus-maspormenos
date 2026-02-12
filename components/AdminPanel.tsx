
import React, { useState, useEffect, useMemo } from 'react';
import { Manual, QuizResult, ManualCategory } from '../types';
import * as StorageService from '../services/storageService';
import { 
  Upload, FileText, Download, Users, Settings, Lock, Check, 
  UserCheck, Award, Trash2, TrendingUp, TrendingDown, Minus, 
  ArrowUpRight, GraduationCap, BarChart3, ChevronRight, 
  ChevronUp, ChevronDown, Image as ImageIcon, Presentation, 
  Target, RefreshCw, ArrowLeft, Calendar, ShieldCheck, Medal, Printer, Dumbbell,
  HelpCircle, Zap, Filter, Search, Library, Eye, X, Store, AlertTriangle, UserMinus, Stamp, FileBadge, History, BookOpen
} from 'lucide-react';

const categories: ManualCategory[] = ['Atención al Cliente', 'Operativa', 'Producto', 'Visual'];

const MaspormenosLogo: React.FC<{ className?: string, hideText?: boolean }> = ({ className = "h-12", hideText = false }) => (
  <div className={`flex flex-col items-center gap-2 ${className}`}>
    <div className="flex items-center gap-1.5 h-full">
      <div className="bg-black aspect-square h-full flex items-center justify-center p-[15%]">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="square">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <div className="aspect-square h-full flex items-center justify-center p-[5%]">
        <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4.5" strokeLinecap="square">
          <line x1="4" y1="4" x2="20" y2="20" />
          <line x1="20" y1="4" x2="4" y2="20" />
        </svg>
      </div>
      <div className="bg-black aspect-square h-full flex items-center justify-center p-[15%]">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="square">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
    </div>
    {!hideText && <div className="font-mono font-bold tracking-[-0.05em] text-black text-[0.8em] leading-none uppercase">maspormenos</div>}
  </div>
);

const extractStore = (fullName: string): string => {
  const match = fullName.match(/\(([^)]+)\)/);
  return match ? match[1] : 'Sin Tienda';
};

const decodeText = (base64: string): string => {
  try { return decodeURIComponent(escape(window.atob(base64))); } 
  catch (e) { return "Error al decodificar."; }
};

const RadarChart: React.FC<{ data: number[], labels: string[], size?: number }> = ({ data, labels, size = 320 }) => {
  const center = size / 2;
  const radius = (size / 2) * 0.65;
  const angleStep = (Math.PI * 2) / (labels.length || 1);
  const levels = [0.2, 0.4, 0.6, 0.8, 1];
  const getPoint = (angle: number, factor: number) => ({
    x: center + radius * factor * Math.cos(angle - Math.PI / 2),
    y: center + radius * factor * Math.sin(angle - Math.PI / 2)
  });
  const levelPaths = levels.map(level => labels.map((_, i) => {
    const { x, y } = getPoint(i * angleStep, level);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ') + ' Z');
  const dataPoints = data.map((val, i) => {
    const { x, y } = getPoint(i * angleStep, Math.max(0.08, val / 100));
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ') + ' Z';
  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {levelPaths.map((path, i) => <path key={i} d={path} fill={i % 2 === 0 ? '#F9FAFB' : 'white'} stroke="#E5E7EB" strokeWidth="1" />)}
        {labels.map((_, i) => {
          const { x, y } = getPoint(i * angleStep, 1);
          return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2" />;
        })}
        <path d={dataPoints} fill="rgba(37, 99, 235, 0.25)" stroke="#2563EB" strokeWidth="3" strokeLinejoin="round" />
        {labels.map((label, i) => {
          const { x, y } = getPoint(i * angleStep, 1.18);
          const anchor = x > center + 10 ? 'start' : x < center - 10 ? 'end' : 'middle';
          return <text key={i} x={x} y={y} textAnchor={anchor} fontSize="9" fontWeight="800" fill="#4B5563" className="uppercase tracking-tighter">{label}</text>;
        })}
      </svg>
    </div>
  );
};

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manuals' | 'evolution' | 'results' | 'settings'>('manuals');
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [studentStats, setStudentStats] = useState<StorageService.StudentStats[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StorageService.StudentStats | null>(null);
  const [viewingManual, setViewingManual] = useState<Manual | null>(null);
  const [certificateResult, setCertificateResult] = useState<QuizResult | null>(null);
  const [tempFullName, setTempFullName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<ManualCategory>('Operativa');
  const [storeFilter, setStoreFilter] = useState<string>('Todas');

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      setManuals(StorageService.getManuals());
      const [res, stats, global] = await Promise.all([
        StorageService.getResults(),
        StorageService.getStudentsEvolution(),
        StorageService.getGlobalStats()
      ]);
      setResults(res);
      setStudentStats(stats);
      setGlobalStats(global);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      const newManual: Manual = {
        id: Date.now().toString(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        uploadDate: new Date().toISOString().split('T')[0],
        category: uploadCategory,
        fileData: base64,
        mimeType: file.type
      };
      StorageService.saveManual(newManual);
      loadData();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {loading && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-10 w-10 text-brand-600 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sincronizando Firestore...</p>
          </div>
        </div>
      )}
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print {
          html, body { height: 100%; margin: 0 !important; background: #fff !important; -webkit-print-color-adjust: exact; }
          body * { visibility: hidden; }
          #printable-certificate, #printable-certificate * { visibility: visible; }
          #printable-certificate { position: fixed; left: 0; top: 0; width: 297mm; height: 210mm; display: flex !important; align-items: center; justify-content: center; border: none !important; }
        }
      `}</style>

      {/* MODALES Y DIPLOMAS */}
      {certificateResult && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-6xl rounded-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-fit max-h-[95vh]">
            <div className="w-full md:w-80 bg-gray-50 p-8 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col gap-6 print:hidden">
              <h3 className="font-black text-xs uppercase tracking-widest text-gray-900">Emisión de Diploma</h3>
              <input type="text" value={tempFullName} onChange={(e) => setTempFullName(e.target.value)} placeholder="Nombre del Empleado" className="w-full p-4 border-2 border-gray-200 rounded-2xl text-sm font-bold outline-none" />
              <button onClick={() => window.print()} disabled={!tempFullName.trim()} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl disabled:opacity-20">Imprimir Diploma</button>
              <button onClick={() => setCertificateResult(null)} className="w-full py-4 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black text-xs uppercase">Cancelar</button>
            </div>
            <div className="flex-1 bg-zinc-100 p-4 sm:p-12 print:p-0 print:bg-white overflow-y-auto">
              <div id="printable-certificate" className="bg-white aspect-[1.414/1] w-full max-w-4xl mx-auto relative shadow-2xl overflow-hidden print:shadow-none p-16 flex flex-col items-center justify-center text-center border-[20px] border-double border-zinc-200">
                <MaspormenosLogo className="h-24 mb-10" />
                <h1 className="text-4xl font-serif italic text-zinc-800">Certificación de Excelencia en Retail</h1>
                <div className="h-0.5 w-64 bg-zinc-900 my-8"></div>
                <p className="text-zinc-500 uppercase tracking-widest text-xs">Por la presente se certifica que:</p>
                <h2 className="text-5xl font-black text-zinc-900 uppercase my-6 underline decoration-zinc-200 decoration-4 underline-offset-8">{tempFullName || "NOMBRE DEL EMPLEADO"}</h2>
                <p className="text-zinc-600 text-lg max-w-2xl mx-auto">Ha superado los estándares de formación del Campus Maspormenos en:</p>
                <div className="bg-black py-4 px-10 rounded-xl my-6 inline-block"><span className="text-2xl font-bold text-white uppercase tracking-widest">{certificateResult.manualName}</span></div>
                <div className="mt-12 grid grid-cols-2 gap-20 w-full max-w-2xl">
                  <div className="border-t border-zinc-300 pt-4 text-[10px] uppercase font-black text-zinc-400">Dirección de Formación</div>
                  <div className="border-t border-zinc-300 pt-4 text-[10px] uppercase font-black text-zinc-400">Fecha: {new Date(certificateResult.date).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingManual && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-4xl shadow-2xl flex flex-col animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-black">{viewingManual.name}</h3>
              <button onClick={() => setViewingManual(null)}><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10"><pre className="whitespace-pre-wrap font-sans text-gray-700">{viewingManual.fileData ? decodeText(viewingManual.fileData) : "Sin contenido."}</pre></div>
          </div>
        </div>
      )}

      {/* HEADER DE NAVEGACIÓN */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          {selectedStudent ? (
            <button onClick={() => setSelectedStudent(null)} className="mr-2 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft />
            </button>
          ) : (
            <Library className="text-brand-600" />
          )}
          {selectedStudent ? `Ficha Alumno: ${selectedStudent.name.split('(')[0].trim()}` : 'Biblioteca Maestros'}
        </h2>
        <div className="flex space-x-1 bg-white p-1 rounded-2xl border border-gray-200">
          {['manuals', 'evolution', 'results', 'settings'].map(t => (
            <button key={t} onClick={() => { setActiveTab(t as any); setSelectedStudent(null); }} className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all ${activeTab === t ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}
      {activeTab === 'manuals' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-4xl border-2 border-dashed border-gray-200 text-center hover:border-brand-600 transition-all group">
            <Upload className="h-12 w-12 text-brand-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-black">Añadir Manual a la Biblioteca</h3>
            <p className="text-sm text-gray-500 mt-2">Selecciona a qué bloque maestro pertenece el contenido.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value as any)} className="bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 font-black text-sm outline-none focus:border-brand-600">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="bg-brand-600 text-white px-8 py-4 rounded-2xl font-black text-sm cursor-pointer hover:bg-brand-700 shadow-xl transition-all active:scale-95">
                Seleccionar PDF/Texto
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt" />
              </label>
            </div>
          </div>

          <div className="space-y-10">
            {categories.map(cat => {
              const catManuals = manuals.filter(m => m.category === cat);
              return (
                <div key={cat} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                    <div className="h-3 w-3 rounded-full bg-brand-600"></div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{cat} ({catManuals.length})</h3>
                  </div>
                  {catManuals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {catManuals.map(m => (
                        <div key={m.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <FileText className="text-brand-600" />
                            <span className="font-bold text-gray-800 text-sm">{m.name}</span>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setViewingManual(m)} className="p-2 hover:bg-brand-50 rounded-xl"><Eye className="h-4 w-4 text-brand-600" /></button>
                            <button onClick={() => { StorageService.deleteManual(m.id); loadData(); }} className="p-2 hover:bg-red-50 rounded-xl"><Trash2 className="h-4 w-4 text-red-600" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic px-6">Sin manuales asignados a este bloque.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'evolution' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {!selectedStudent ? (
            <>
              {/* VISTA GENERAL DE EVOLUCIÓN */}
              <div className="bg-white p-8 rounded-4xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Dominio Global de Competencias</h3>
                  <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="text-xs font-black uppercase bg-gray-50 p-2 rounded-xl outline-none border border-gray-200">
                    <option value="Todas">Todas las Tiendas</option>
                    {Array.from(new Set(results.map(r => extractStore(r.studentName)))).sort().map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="flex flex-col items-center">
                    <RadarChart data={categories.map(c => {
                      const relResults = results.filter(r => (storeFilter === 'Todas' || extractStore(r.studentName) === storeFilter) && r.category === c);
                      return relResults.length ? relResults.reduce((a, b) => a + b.score, 0) / relResults.length : 0;
                    })} labels={categories} size={350} />
                  </div>
                  <div className="space-y-6">
                    {categories.map(c => {
                      const catResults = results.filter(r => (storeFilter === 'Todas' || extractStore(r.studentName) === storeFilter) && r.category === c);
                      const avg = catResults.length ? catResults.reduce((a, b) => a + b.score, 0) / catResults.length : 0;
                      return (
                        <div key={c} className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                          <div className="flex justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest">{c}</span>
                            <span className="text-[10px] font-black text-brand-600">{avg.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden"><div className="h-full bg-brand-600 transition-all duration-1000" style={{ width: `${avg}%` }}></div></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50 font-black text-[10px] uppercase text-gray-400">
                    <tr><th className="px-8 py-4 text-left">Vendedor</th><th className="px-8 py-4 text-center">Tienda</th><th className="px-8 py-4 text-center">Nota Media</th><th className="px-8 py-4 text-right">Acción</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {studentStats.filter(s => storeFilter === 'Todas' || extractStore(s.name) === storeFilter).map(s => (
                      <tr key={s.name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-5 font-black text-sm">{s.name.split('(')[0].trim()}</td>
                        <td className="px-8 py-5 text-center text-xs font-bold text-gray-400">{extractStore(s.name)}</td>
                        <td className="px-8 py-5 text-center"><span className={`px-3 py-1 rounded-xl text-xs font-black ${s.averageScore >= 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{s.averageScore.toFixed(1)}%</span></td>
                        <td className="px-8 py-5 text-right"><button onClick={() => setSelectedStudent(s)} className="text-brand-600 font-black text-[10px] uppercase hover:underline">Ficha Técnica</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* VISTA DE FICHA TÉCNICA INDIVIDUAL */
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Resumen de KPI */}
                <div className="md:col-span-1 space-y-6">
                  <div className="bg-white p-8 rounded-4xl border border-gray-100 shadow-sm text-center">
                    <div className="h-20 w-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-100">
                      <GraduationCap className="h-10 w-10 text-brand-600" />
                    </div>
                    <h3 className="text-xl font-black">{selectedStudent.name.split('(')[0].trim()}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{extractStore(selectedStudent.name)}</p>
                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Test Totales</p>
                        <p className="text-2xl font-black">{selectedStudent.totalTests}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Superados</p>
                        <p className="text-2xl font-black text-green-600">{selectedStudent.passedCount}</p>
                      </div>
                    </div>
                    <div className="mt-4 bg-black text-white p-5 rounded-2xl">
                      <p className="text-[9px] font-black text-zinc-500 uppercase">Nota Media Global</p>
                      <p className="text-3xl font-black">{selectedStudent.averageScore.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* Mapa de Competencias Individual */}
                <div className="md:col-span-2 bg-white p-8 rounded-4xl border border-gray-100 shadow-sm">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Target className="h-4 w-4 text-brand-600" /> Mapa de Competencias Individual
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <RadarChart data={categories.map(c => {
                      const catResults = selectedStudent.history.filter(h => h.category === c && !h.isPractice);
                      return catResults.length ? catResults.reduce((a, b) => a + b.score, 0) / catResults.length : 0;
                    })} labels={categories} size={280} />
                    <div className="space-y-4">
                      {categories.map(c => {
                        const catResults = selectedStudent.history.filter(h => h.category === c && !h.isPractice);
                        const avg = catResults.length ? catResults.reduce((a, b) => a + b.score, 0) / catResults.length : 0;
                        return (
                          <div key={c} className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-black uppercase text-gray-400 w-24 truncate">{c}</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-600" style={{ width: `${avg}%` }}></div>
                            </div>
                            <span className="text-[10px] font-black text-gray-900 w-8 text-right">{avg.toFixed(0)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Historial de Exámenes del Alumno */}
              <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b bg-gray-50 flex items-center justify-between">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tight"><History className="text-brand-600" /> Historial Académico</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50 font-black text-[10px] uppercase text-gray-400">
                      <tr><th className="px-8 py-5 text-left">Examen / Módulo</th><th className="px-8 py-5 text-center">Tipo</th><th className="px-8 py-5 text-center">Resultado</th><th className="px-8 py-5 text-right">Fecha</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {selectedStudent.history.map((res) => (
                        <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-gray-900">{res.manualName}</span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{res.category || 'Global'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${res.isPractice ? 'bg-zinc-100 text-zinc-500' : 'bg-brand-50 text-brand-700'}`}>
                              {res.isPractice ? 'Práctica' : 'Oficial'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className={`text-lg font-black ${res.score >= 80 ? 'text-green-600' : 'text-orange-600'}`}>{res.score.toFixed(0)}%</span>
                          </td>
                          <td className="px-8 py-5 text-right text-xs text-gray-400 font-bold">{new Date(res.date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight">Últimas Evaluaciones</h3>
              <div className="flex items-center gap-4">
                 <button onClick={() => { if(confirm("Acción no reversible. ¿Confirmar?")) { StorageService.clearAllResults(); loadData(); } }} className="text-[10px] font-black text-red-500 hover:underline uppercase">Borrar Todo</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50 font-black text-[10px] uppercase text-gray-400">
                  <tr><th className="px-8 py-4 text-left">Alumno</th><th className="px-8 py-4 text-left">Test</th><th className="px-8 py-4 text-center">Nota</th><th className="px-8 py-4 text-right">Fecha</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {results.slice().reverse().map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-8 py-4 font-black text-xs">{r.studentName}</td>
                      <td className="px-8 py-4 text-xs font-bold text-gray-400">{r.manualName}</td>
                      <td className="px-8 py-4 text-center"><span className={`px-2 py-1 rounded-lg text-xs font-black ${r.score >= 80 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.score.toFixed(0)}%</span></td>
                      <td className="px-8 py-4 text-right text-xs text-gray-400">{new Date(r.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
           <div className="bg-white p-8 rounded-4xl border shadow-sm">
             <h3 className="font-black text-xl mb-6 flex items-center gap-3"><Medal className="text-brand-600" /> Emisión de Diplomas</h3>
             <div className="space-y-4">
               {results.filter(r => r.score >= 80).slice().reverse().map(r => (
                 <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <div className="min-w-0">
                     <p className="text-sm font-black truncate">{r.studentName}</p>
                     <p className="text-[10px] font-bold text-gray-400 uppercase">{r.manualName} • {r.score.toFixed(0)}%</p>
                   </div>
                   <button onClick={() => setCertificateResult(r)} className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase">Emitir Diploma</button>
                 </div>
               ))}
             </div>
           </div>
           <div className="bg-white p-10 rounded-4xl border grid grid-cols-1 md:grid-cols-2 gap-8">
             <button onClick={() => { if(confirm("¿Estás seguro? Se borrará todo el historial.")) { StorageService.clearAllResults(); loadData(); } }} className="p-6 border-2 border-red-50 text-red-600 rounded-3xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all">Limpiar Historial Notas</button>
             <button onClick={() => { if(confirm("Se borrarán los manuales subidos. ¿Continuar?")) { StorageService.resetToDefaults(); loadData(); } }} className="p-6 border-2 border-gray-100 text-gray-700 rounded-3xl font-black uppercase text-xs hover:bg-black hover:text-white transition-all">Restaurar Manuales Fábrica</button>
           </div>
        </div>
      )}
    </div>
  );
};
