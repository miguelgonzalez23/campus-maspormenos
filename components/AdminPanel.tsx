
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

const extractStore = (fullName: string): string => {
  const match = fullName.match(/\(([^)]+)\)/);
  return match ? match[1] : 'Sin Tienda';
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
  const [uploadCategory, setUploadCategory] = useState<ManualCategory>('Operativa');
  const [newPassword, setNewPassword] = useState('');

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

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) return alert("La contraseña debe tener al menos 4 caracteres.");
    StorageService.setTrainerPassword(newPassword);
    alert("Contraseña actualizada con éxito.");
    setNewPassword('');
  };

  return (
    <div className="space-y-8 pb-32">
      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-12 w-12 text-brand-600 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sincronizando datos...</p>
          </div>
        </div>
      )}

      {/* HEADER DE NAVEGACIÓN */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-gray-100 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          {selectedStudent ? (
            <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </button>
          ) : (
            <Library className="text-brand-600" />
          )}
          {selectedStudent ? `Ficha Alumno: ${selectedStudent.name.split('(')[0]}` : 'Panel de Control'}
        </h2>
        <div className="flex flex-wrap justify-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200">
          {[
            {id: 'manuals', label: 'Manuales'},
            {id: 'evolution', label: 'Evolución'},
            {id: 'results', label: 'Resultados'},
            {id: 'settings', label: 'Ajustes'}
          ].map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id as any); setSelectedStudent(null); }} className={`px-5 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === t.id ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* 1. SECCIÓN MANUALES */}
      {activeTab === 'manuals' && (
        <div className="space-y-12 animate-in fade-in">
          <div className="bg-white p-12 rounded-4xl border-2 border-dashed border-gray-200 text-center hover:border-brand-600 transition-all group shadow-sm">
            <Upload className="h-16 w-16 text-brand-600 mx-auto mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-black">Cargar Nuevo Manual Maestro</h3>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value as any)} className="bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 font-black text-sm outline-none focus:border-brand-600">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="bg-brand-600 text-white px-10 py-4 rounded-2xl font-black text-sm cursor-pointer hover:bg-brand-700 shadow-xl transition-all active:scale-95">
                Seleccionar Archivo
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt" />
              </label>
            </div>
          </div>

          <div className="space-y-12">
            {categories.map(cat => {
              const catManuals = manuals.filter(m => m.category === cat);
              return (
                <div key={cat} className="space-y-6">
                  <div className="flex items-center gap-4 border-l-4 border-brand-600 pl-4 py-1">
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">{cat}</h3>
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black text-gray-500">{catManuals.length} Documentos</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {catManuals.map(m => (
                      <div key={m.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all min-h-[140px]">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-brand-50 rounded-2xl text-brand-600"><FileText className="h-5 w-5" /></div>
                          <span className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{m.name}</span>
                        </div>
                        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-50">
                          <button onClick={() => { if(confirm("¿Eliminar manual maestro?")) { StorageService.deleteManual(m.id); loadData(); } }} className="p-2.5 hover:bg-red-50 rounded-xl transition-colors text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. SECCIÓN EVOLUCIÓN */}
      {activeTab === 'evolution' && !selectedStudent && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in">
          {studentStats.map(student => (
            <button key={student.name} onClick={() => setSelectedStudent(student)} className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm hover:shadow-xl transition-all text-left flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-lg">{student.name.charAt(0)}</div>
                <div>
                  <h4 className="font-black text-gray-900">{student.name.split('(')[0]}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{extractStore(student.name)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xl font-black ${student.averageScore >= 80 ? 'text-green-600' : 'text-brand-600'}`}>{student.averageScore.toFixed(0)}%</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{student.totalTests} Tests</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeTab === 'evolution' && selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right-4 duration-500">
          <div className="lg:col-span-1 bg-white p-10 rounded-4xl border border-gray-100 shadow-sm flex flex-col items-center">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-10">Mapa de Competencias</h3>
            <RadarChart 
              data={categories.map(cat => {
                const catResults = selectedStudent.history.filter(h => h.category === cat && !h.isPractice);
                return catResults.length ? catResults.reduce((a, b) => a + b.score, 0) / catResults.length : 0;
              })} 
              labels={categories} 
            />
            <div className="mt-10 w-full space-y-4">
              <div className="flex justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-[10px] font-black text-gray-400 uppercase">Nota Media</span>
                <span className="text-sm font-black text-gray-900">{selectedStudent.averageScore.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-[10px] font-black text-gray-400 uppercase">Tests Aptos</span>
                <span className="text-sm font-black text-green-600">{selectedStudent.passedCount}</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b bg-gray-50 flex items-center gap-3">
               <History className="text-brand-600 h-5 w-5" />
               <h3 className="font-black text-gray-900 uppercase tracking-tight">Historial de Exámenes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50 font-black text-[10px] text-gray-400 uppercase">
                  <tr>
                    <th className="px-8 py-6 text-left">Manual / Bloque</th>
                    <th className="px-8 py-6 text-center">Nota</th>
                    <th className="px-8 py-6 text-right">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {selectedStudent.history.map((res, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-6 font-bold text-gray-900">{res.manualName}</td>
                      <td className={`px-8 py-6 text-center font-black ${res.score >= 80 ? 'text-green-600' : 'text-red-600'}`}>{res.score.toFixed(0)}%</td>
                      <td className="px-8 py-6 text-right text-xs text-gray-400">{new Date(res.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECCIÓN RESULTADOS GLOBALES */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-8 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Registro de Actividad Campus</h3>
            <span className="bg-brand-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase">{results.length} Registros</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 font-black text-[10px] text-gray-400 uppercase">
                <tr>
                  <th className="px-8 py-6 text-left">Alumno</th>
                  <th className="px-8 py-6 text-left">Tienda</th>
                  <th className="px-8 py-6 text-left">Materia</th>
                  <th className="px-8 py-6 text-center">Nota</th>
                  <th className="px-8 py-6 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {results.map((res, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-6 font-bold text-gray-900">{res.studentName.split('(')[0]}</td>
                    <td className="px-8 py-6 text-sm text-gray-500 font-medium uppercase">{extractStore(res.studentName)}</td>
                    <td className="px-8 py-6">
                       <span className="text-xs font-bold text-gray-700">{res.manualName}</span>
                       <span className="block text-[9px] text-gray-400 uppercase font-black">{res.category}</span>
                    </td>
                    <td className={`px-8 py-6 text-center font-black text-lg ${res.score >= 80 ? 'text-green-600' : 'text-brand-600'}`}>{res.score.toFixed(0)}%</td>
                    <td className="px-8 py-6 text-right text-xs text-gray-400">{new Date(res.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SECCIÓN AJUSTES */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in">
          <div className="bg-white p-10 rounded-4xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-zinc-900 rounded-2xl text-white"><Lock className="h-6 w-6" /></div>
              <h3 className="text-xl font-black uppercase tracking-tight">Seguridad del Panel</h3>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nueva Contraseña de Formador</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl font-black text-sm outline-none focus:border-brand-600 focus:bg-white transition-all"
                />
              </div>
              <button type="submit" className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Actualizar Acceso</button>
            </form>
          </div>

          <div className="bg-red-50 p-10 rounded-4xl border border-red-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4 text-red-600">
               <AlertTriangle className="h-6 w-6" />
               <h3 className="text-xl font-black uppercase tracking-tight">Zona Crítica</h3>
            </div>
            <p className="text-sm text-red-700 mb-8 font-medium">Estas acciones son irreversibles y afectarán a la base de datos de todos los centros.</p>
            <button 
              onClick={() => { if(confirm("¿Seguro que quieres resetear los manuales a su estado original? Se perderán las cargas personalizadas.")) { StorageService.resetToDefaults(); window.location.reload(); }}}
              className="w-full bg-white border-2 border-red-200 text-red-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
            >
              Restablecer Manuales Maestros
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
