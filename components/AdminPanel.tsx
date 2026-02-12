
import React, { useState, useEffect, useMemo } from 'react';
import { Manual, QuizResult, ManualCategory } from '../types';
import * as StorageService from '../services/storageService';
import { 
  Upload, FileText, Download, Users, Settings, Lock, Check, 
  UserCheck, Award, Trash2, TrendingUp, TrendingDown, Minus, 
  ArrowUpRight, GraduationCap, BarChart3, ChevronRight, 
  ChevronUp, ChevronDown, Image as ImageIcon, Presentation, 
  Target, RefreshCw, ArrowLeft, Calendar, ShieldCheck, Medal, Printer, Dumbbell,
  HelpCircle, Zap, Filter, Search, Library, Eye, X, Store, AlertTriangle, UserMinus, Stamp, FileBadge, History, BookOpen, Eraser, Layers
} from 'lucide-react';

const categories: ManualCategory[] = ['Atención al Cliente', 'Operativa', 'Producto', 'Visual'];
const STORES = ["Vilafranca", "Haro", "Vitoria", "Tolosa", "Denim", "Collado", "Dantxarinea", "Zarautz", "Oiarzaum", "Mora", "Natural", "Getafe", "Pamplona"];

const extractStore = (fullName: string): string => {
  const match = fullName.match(/\(([^)]+)\)/);
  return match ? match[1] : 'Sin Tienda';
};

const RadarChart: React.FC<{ data: number[], labels: string[], size?: number, color?: string, title?: string }> = ({ data, labels, size = 280, color = "#2563EB", title }) => {
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
    <div className="flex flex-col items-center justify-center p-4">
      {title && <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">{title}</p>}
      <svg width={size} height={size} className="overflow-visible drop-shadow-sm">
        {levelPaths.map((path, i) => <path key={i} d={path} fill={i % 2 === 0 ? '#F9FAFB' : 'white'} stroke="#E5E7EB" strokeWidth="1" />)}
        {labels.map((_, i) => {
          const { x, y } = getPoint(i * angleStep, 1);
          return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2" />;
        })}
        <path d={dataPoints} fill={`${color}20`} stroke={color} strokeWidth="3" strokeLinejoin="round" className="transition-all duration-700" />
        {labels.map((label, i) => {
          const { x, y } = getPoint(i * angleStep, 1.2);
          const anchor = x > center + 10 ? 'start' : x < center - 10 ? 'end' : 'middle';
          const lines = label.split(' ');
          return (
            <text key={i} x={x} y={y} textAnchor={anchor} fontSize="8" fontWeight="800" fill="#6B7280" className="uppercase tracking-tighter transition-all">
              {lines.map((l, li) => <tspan key={li} x={x} dy={li === 0 ? 0 : 10}>{l}</tspan>)}
            </text>
          );
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
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StorageService.StudentStats | null>(null);
  const [uploadCategory, setUploadCategory] = useState<ManualCategory>('Operativa');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      setManuals(StorageService.getManuals());
      const [res, stats] = await Promise.all([
        StorageService.getResults(),
        StorageService.getStudentsEvolution()
      ]);
      setResults(res.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setStudentStats(stats);
      if (selectedStudent) {
        const updated = stats.find(s => s.name === selectedStudent.name);
        setSelectedStudent(updated || null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fix: Implemented handleFileUpload to allow trainers to upload new manuals.
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const base64Data = dataUrl.split(',')[1];
      
      const newManual: Manual = {
        id: `m_${Date.now()}`,
        name: file.name,
        uploadDate: new Date().toISOString().split('T')[0],
        category: uploadCategory,
        fileData: base64Data,
        mimeType: file.type || 'text/plain'
      };
      
      StorageService.saveManual(newManual);
      loadData();
      alert("Manual cargado con éxito.");
    };
    reader.readAsDataURL(file);
  };

  // Fix: Implemented handlePasswordChange to update the trainer access password.
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      alert("La contraseña es demasiado corta (mínimo 4 caracteres).");
      return;
    }
    StorageService.setTrainerPassword(newPassword);
    setNewPassword('');
    alert("Contraseña de administración actualizada correctamente.");
  };

  // Filtrado de datos por tienda
  const filteredStats = useMemo(() => {
    if (selectedStore === 'all') return studentStats;
    return studentStats.filter(s => extractStore(s.name) === selectedStore);
  }, [studentStats, selectedStore]);

  const filteredResults = useMemo(() => {
    if (selectedStore === 'all') return results;
    return results.filter(r => extractStore(r.studentName) === selectedStore);
  }, [results, selectedStore]);

  const aggregateRadarData = (resList: QuizResult[]) => {
    return categories.map(cat => {
      const catExams = resList.filter(r => r.category === cat && !r.isPractice);
      return catExams.length ? catExams.reduce((a, b) => a + b.score, 0) / catExams.length : 0;
    });
  };

  const globalRadarData = useMemo(() => aggregateRadarData(filteredResults), [filteredResults]);

  const handleDeleteResult = async (studentName: string, resultId: string) => {
    if (!confirm("¿Eliminar este examen permanentemente?")) return;
    try {
      await StorageService.deleteResult(studentName, resultId);
      await loadData();
    } catch (e) { alert("Error al eliminar."); }
  };

  const handleClearHistory = async (studentName: string) => {
    if (!confirm("¿Vaciar todo el historial de este alumno?")) return;
    try {
      await StorageService.clearStudentHistory(studentName);
      await loadData();
    } catch (e) { alert("Error al limpiar."); }
  };

  const handleDeleteStudent = async (studentName: string) => {
    if (!confirm(`¿ELIMINAR ALUMNO COMPLETAMENTE?\n\nSe borrará a ${studentName} de la base de datos.`)) return;
    try {
      await StorageService.deleteStudent(studentName);
      setSelectedStudent(null);
      await loadData();
    } catch (e) { alert("Error al eliminar."); }
  };

  return (
    <div className="space-y-8 pb-32">
      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-12 w-12 text-brand-600 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sincronizando Dashboard...</p>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          {selectedStudent ? (
            <button onClick={() => setSelectedStudent(null)} className="p-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-2xl shadow-sm transition-all">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          ) : (
            <div className="p-4 bg-brand-600 rounded-3xl shadow-xl shadow-brand-100 text-white">
               <Layers className="h-6 w-6" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {selectedStudent ? `Ficha: ${selectedStudent.name.split('(')[0]}` : 'Analytics Maspormenos'}
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {selectedStudent ? extractStore(selectedStudent.name) : 'Monitorización Global de Red'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab !== 'settings' && activeTab !== 'manuals' && !selectedStudent && (
             <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-gray-200 shadow-sm">
                <Store className="h-4 w-4 text-brand-600" />
                <select 
                  value={selectedStore} 
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="bg-transparent text-[11px] font-black uppercase outline-none cursor-pointer text-gray-700"
                >
                  <option value="all">Todas las Tiendas</option>
                  {STORES.sort().map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
          )}
          <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
            {[
              {id: 'manuals', label: 'Manuales'},
              {id: 'evolution', label: 'Evolución'},
              {id: 'results', label: 'Resultados'},
              {id: 'settings', label: 'Ajustes'}
            ].map(t => (
              <button key={t.id} onClick={() => { setActiveTab(t.id as any); setSelectedStudent(null); }} className={`px-4 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${activeTab === t.id ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-50'}`}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. SECCIÓN MANUALES (Mantenida igual para gestión técnica) */}
      {activeTab === 'manuals' && (
        <div className="space-y-12 animate-in fade-in">
          <div className="bg-white p-12 rounded-4xl border-2 border-dashed border-gray-200 text-center hover:border-brand-600 transition-all group shadow-sm">
            <Upload className="h-16 w-16 text-brand-600 mx-auto mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-black">Cargar Manual Maestro</h3>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value as any)} className="bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 font-black text-sm outline-none focus:border-brand-600">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="bg-brand-600 text-white px-10 py-4 rounded-2xl font-black text-sm cursor-pointer hover:bg-brand-700 shadow-xl transition-all active:scale-95">
                Subir PDF / TXT
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12">
            {categories.map(cat => (
              <div key={cat} className="space-y-6">
                <div className="flex items-center gap-4 border-l-4 border-brand-600 pl-4 py-1">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">{cat}</h3>
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black text-gray-500">{manuals.filter(m => m.category === cat).length} Docs</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {manuals.filter(m => m.category === cat).map(m => (
                    <div key={m.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all min-h-[140px]">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-brand-50 rounded-2xl text-brand-600"><FileText className="h-5 w-5" /></div>
                        <span className="font-bold text-gray-800 text-sm line-clamp-2 leading-snug">{m.name}</span>
                      </div>
                      <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-50">
                        <button onClick={() => { if(confirm("¿Eliminar?")) { StorageService.deleteManual(m.id); loadData(); } }} className="p-2.5 hover:bg-red-50 rounded-xl transition-colors text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. SECCIÓN EVOLUCIÓN (Con Radar Global y Filtro) */}
      {activeTab === 'evolution' && !selectedStudent && (
        <div className="space-y-8 animate-in fade-in">
          {/* DASHBOARD SUMMARY */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 bg-white p-8 rounded-4xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 bg-brand-50 rounded-3xl flex items-center justify-center text-brand-600 mb-4">
                <Target className="h-8 w-8" />
              </div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nota Media Centro</h4>
              <p className="text-4xl font-black text-gray-900 mt-1">
                {(filteredStats.reduce((a,b) => a + b.averageScore, 0) / (filteredStats.length || 1)).toFixed(0)}%
              </p>
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-4xl border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden">
               <RadarChart data={globalRadarData} labels={categories} size={240} title="Perfil de Competencias del Equipo" />
            </div>
            <div className="lg:col-span-1 bg-black p-8 rounded-4xl shadow-xl flex flex-col items-center justify-center text-center text-white">
              <div className="h-16 w-16 bg-zinc-800 rounded-3xl flex items-center justify-center text-brand-400 mb-4">
                <Award className="h-8 w-8" />
              </div>
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Aptos del Centro</h4>
              <p className="text-4xl font-black mt-1">
                {filteredStats.reduce((a,b) => a + b.passedCount, 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStats.map(student => (
              <button key={student.name} onClick={() => setSelectedStudent(student)} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all text-left flex items-center justify-between group transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-lg">{student.name.charAt(0)}</div>
                  <div>
                    <h4 className="font-black text-gray-900 group-hover:text-brand-600 transition-colors">{student.name.split('(')[0]}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">{extractStore(student.name)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-black ${student.averageScore >= 80 ? 'text-green-600' : 'text-brand-600'}`}>{student.averageScore.toFixed(0)}%</p>
                  <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{student.totalTests} Tests</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DETALLE ALUMNO */}
      {activeTab === 'evolution' && selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right-4 duration-500">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-10 rounded-4xl border border-gray-100 shadow-sm flex flex-col items-center">
              <RadarChart data={aggregateRadarData(selectedStudent.history)} labels={categories} title="Mapa de Conocimiento" />
              <div className="mt-8 w-full space-y-3">
                <div className="flex justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Nota Histórica</span>
                  <span className="text-sm font-black text-gray-900">{selectedStudent.averageScore.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Módulos Aptos</span>
                  <span className="text-sm font-black text-green-600">{selectedStudent.passedCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-4xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Gestión Académica</h3>
              <button onClick={() => handleClearHistory(selectedStudent.name)} className="w-full flex items-center justify-between p-4 bg-orange-50 text-orange-700 rounded-2xl hover:bg-orange-100 transition-colors group">
                <div className="flex items-center gap-3 font-bold text-xs uppercase"><Eraser className="h-4 w-4" /> Vaciar Historial</div>
                <ChevronRight className="h-4 w-4 opacity-30" />
              </button>
              <button onClick={() => handleDeleteStudent(selectedStudent.name)} className="w-full flex items-center justify-between p-4 bg-red-50 text-red-700 rounded-2xl hover:bg-red-100 transition-colors group">
                <div className="flex items-center gap-3 font-bold text-xs uppercase"><UserMinus className="h-4 w-4" /> Eliminar Alumno</div>
                <ChevronRight className="h-4 w-4 opacity-30" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b bg-gray-50 flex items-center gap-3">
               <History className="text-brand-600 h-5 w-5" />
               <h3 className="font-black text-gray-900 uppercase tracking-tight">Histórico de Exámenes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50 font-black text-[10px] text-gray-400 uppercase">
                  <tr>
                    <th className="px-8 py-6 text-left">Examen</th>
                    <th className="px-8 py-6 text-center">Nota</th>
                    <th className="px-8 py-6 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {selectedStudent.history.map((res, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-8 py-6">
                         <span className="font-bold text-gray-900 block">{res.manualName}</span>
                         <span className="text-[9px] text-gray-400 uppercase font-black">{new Date(res.date).toLocaleDateString()}</span>
                      </td>
                      <td className={`px-8 py-6 text-center font-black ${res.score >= 80 ? 'text-green-600' : 'text-red-600'}`}>{res.score.toFixed(0)}%</td>
                      <td className="px-8 py-6 text-right">
                        <button onClick={() => handleDeleteResult(selectedStudent.name, res.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECCIÓN RESULTADOS (Con Radar de Acierto y Filtro) */}
      {activeTab === 'results' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-1 bg-white p-8 rounded-4xl border border-gray-100 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-6">
                   <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600"><Check className="h-6 w-6" /></div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Actividad de Centro</p>
                      <p className="text-2xl font-black text-gray-900">{filteredResults.length} Registros</p>
                   </div>
                </div>
                <div className="space-y-3">
                   {categories.map((cat, i) => {
                      const count = filteredResults.filter(r => r.category === cat).length;
                      const pct = filteredResults.length ? (count / filteredResults.length) * 100 : 0;
                      return (
                        <div key={cat}>
                           <div className="flex justify-between text-[8px] font-black uppercase text-gray-400 mb-1">
                              <span>{cat}</span>
                              <span>{count} tests</span>
                           </div>
                           <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-600 rounded-full" style={{ width: `${pct}%` }}></div>
                           </div>
                        </div>
                      );
                   })}
                </div>
             </div>
             <div className="lg:col-span-1 bg-white p-6 rounded-4xl border border-gray-100 shadow-sm flex items-center justify-center">
                <RadarChart data={globalRadarData} labels={categories} size={220} color="#10B981" title="Balance de Conocimiento" />
             </div>
             <div className="lg:col-span-1 bg-brand-600 p-8 rounded-4xl shadow-xl flex flex-col items-center justify-center text-white">
                <Medal className="h-10 w-10 mb-4 text-brand-200" />
                <h4 className="text-[10px] font-black text-brand-200 uppercase tracking-widest">Tasa de Superación</h4>
                <p className="text-5xl font-black mt-2">
                   {filteredResults.length ? ((filteredResults.filter(r => r.score >= 80).length / filteredResults.length) * 100).toFixed(0) : 0}%
                </p>
             </div>
          </div>

          <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50 font-black text-[10px] text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-6 text-left">Alumno</th>
                    <th className="px-8 py-6 text-left">Tienda</th>
                    <th className="px-8 py-6 text-left">Materia</th>
                    <th className="px-8 py-6 text-center">Nota</th>
                    <th className="px-8 py-6 text-right">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredResults.map((res, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-6 font-bold text-gray-900">{res.studentName.split('(')[0]}</td>
                      <td className="px-8 py-6 text-xs text-gray-400 font-black uppercase">{extractStore(res.studentName)}</td>
                      <td className="px-8 py-6">
                         <span className="text-xs font-bold text-gray-700 block">{res.manualName}</span>
                         <span className="text-[8px] text-brand-600 uppercase font-black">{res.category}</span>
                      </td>
                      <td className={`px-8 py-6 text-center font-black text-lg ${res.score >= 80 ? 'text-green-600' : 'text-brand-600'}`}>{res.score.toFixed(0)}%</td>
                      <td className="px-8 py-6 text-right">
                         <button onClick={() => handleDeleteResult(res.studentName, res.id)} className="p-2 text-gray-200 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. SECCIÓN AJUSTES */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in">
          <div className="bg-white p-10 rounded-4xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-zinc-900 rounded-2xl text-white shadow-lg"><Lock className="h-6 w-6" /></div>
              <h3 className="text-xl font-black uppercase tracking-tight">Acceso y Seguridad</h3>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Nueva Contraseña de Administración</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 4 caracteres" className="w-full p-6 bg-gray-50 border-2 border-transparent rounded-2xl font-black text-sm outline-none focus:border-brand-600 focus:bg-white transition-all shadow-inner" />
              </div>
              <button type="submit" className="w-full bg-black text-white py-6 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Actualizar Seguridad</button>
            </form>
          </div>

          <div className="bg-red-50 p-10 rounded-4xl border border-red-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4 text-red-600">
               <AlertTriangle className="h-6 w-6" />
               <h3 className="text-xl font-black uppercase tracking-tight">Mantenimiento Crítico</h3>
            </div>
            <p className="text-sm text-red-700 mb-8 font-medium">Esta acción restablece la base de datos de manuales a su configuración maestra de fábrica.</p>
            <button onClick={() => { if(confirm("¿Restablecer manuales originales?")) { StorageService.resetToDefaults(); window.location.reload(); }}} className="w-full bg-white border-2 border-red-200 text-red-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all">Restablecer Biblioteca</button>
          </div>
        </div>
      )}
    </div>
  );
};
