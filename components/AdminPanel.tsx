
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
    <div className="space-y-8 pb-32">
      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-12 w-12 text-brand-600 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sincronizando biblioteca...</p>
          </div>
        </div>
      )}

      {/* HEADER DE NAVEGACIÓN */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-gray-100 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          {selectedStudent ? (
            <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft />
            </button>
          ) : (
            <Library className="text-brand-600" />
          )}
          {selectedStudent ? `Ficha Alumno: ${selectedStudent.name.split('(')[0]}` : 'Biblioteca Central'}
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

      {/* CONTENIDO DE PESTAÑAS */}
      {activeTab === 'manuals' && (
        <div className="space-y-12 animate-in fade-in">
          <div className="bg-white p-12 rounded-4xl border-2 border-dashed border-gray-200 text-center hover:border-brand-600 transition-all group shadow-sm">
            <Upload className="h-16 w-16 text-brand-600 mx-auto mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-black">Cargar Nuevo Manual</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">Sube manuales en PDF o Texto para que la IA genere tests basados exclusivamente en ellos.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value as any)} className="bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 font-black text-sm outline-none focus:border-brand-600 cursor-pointer">
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
                  {catManuals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {catManuals.map(m => (
                        <div key={m.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[140px]">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-brand-50 rounded-2xl text-brand-600"><FileText className="h-5 w-5" /></div>
                            <span className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{m.name}</span>
                          </div>
                          <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-50">
                            <button onClick={() => setViewingManual(m)} className="p-2.5 hover:bg-brand-50 rounded-xl transition-colors"><Eye className="h-4 w-4 text-brand-600" /></button>
                            <button onClick={() => { if(confirm("¿Eliminar manual?")) { StorageService.deleteManual(m.id); loadData(); } }} className="p-2.5 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="h-4 w-4 text-red-600" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50/50 rounded-3xl p-10 text-center border border-gray-100 border-dashed">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sin documentos maestros en este bloque</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* ... (Las demás pestañas se mantienen igual o se ajustan según la necesidad del grid) */}
    </div>
  );
};
