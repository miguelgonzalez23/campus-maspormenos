
import React, { useState } from 'react';
import Layout from './components/Layout';
import { AdminPanel } from './components/AdminPanel';
import { StudentPanel } from './components/StudentPanel';
import { QuizInterface } from './components/QuizInterface';
import { Chatbot } from './components/Chatbot';
import { UserRole, AppState, QuizConfig } from './types';
import * as StorageService from './services/storageService';
import { Users, UserCog, Store, User, ArrowLeft, Lock, Hash } from 'lucide-react';

const STORES_LIST = [
  "Vilafranca", "Haro", "Vitoria", "Tolosa", "Denim", "Collado", 
  "Dantxarinea", "Zarautz", "Oiarzaum", "Mora", "Natural", "Getafe", "Pamplona"
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    userRole: UserRole.NONE,
    currentView: 'LOGIN',
    currentUser: ''
  });

  const [activeQuizConfig, setActiveQuizConfig] = useState<QuizConfig | null>(null);
  const [activeManualFiles, setActiveManualFiles] = useState<{data: string, mimeType: string}[] | null>(null);

  const [studentNameInput, setStudentNameInput] = useState('');
  const [storeNameInput, setStoreNameInput] = useState('');
  const [trainerPasswordInput, setTrainerPasswordInput] = useState('');
  const [trainerError, setTrainerError] = useState('');

  const login = (role: UserRole, name: string) => {
    setState({
      userRole: role,
      currentUser: name,
      currentView: role === UserRole.ADMIN ? 'ADMIN_DASHBOARD' : 'STUDENT_DASHBOARD'
    });
  };

  const handleStudentLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentNameInput.length === 4 && storeNameInput.trim()) {
      const displayName = `${studentNameInput} (${storeNameInput})`;
      login(UserRole.STUDENT, displayName);
    }
  };

  const handleDniInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Solo números
    if (val.length <= 4) {
      setStudentNameInput(val);
    }
  };

  const handleTrainerLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPassword = StorageService.getTrainerPassword();
    if (trainerPasswordInput === storedPassword) {
      login(UserRole.ADMIN, 'Formador');
      setTrainerPasswordInput('');
      setTrainerError('');
    } else {
      setTrainerError('Contraseña incorrecta');
    }
  };

  const logout = () => {
    setState({ userRole: UserRole.NONE, currentView: 'LOGIN', currentUser: '' });
    setActiveQuizConfig(null);
    setActiveManualFiles(null);
    setStudentNameInput('');
    setStoreNameInput('');
    setTrainerPasswordInput('');
    setTrainerError('');
  };

  const startQuiz = (config: QuizConfig, files: { data: string, mimeType: string }[]) => {
    setActiveQuizConfig(config);
    setActiveManualFiles(files);
    setState(prev => ({ ...prev, currentView: 'QUIZ_TAKER' }));
  };

  const exitQuiz = () => {
    setActiveQuizConfig(null);
    setActiveManualFiles(null);
    setState(prev => ({ ...prev, currentView: 'STUDENT_DASHBOARD' }));
  };

  const renderStudentLogin = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md bg-white rounded-4xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-8 bg-brand-50 border-b border-brand-100 flex items-center gap-4">
          <div className="bg-brand-600 p-3 rounded-2xl shadow-lg shadow-brand-200">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-900 uppercase tracking-tight">Acceso Alumno</h2>
            <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Campus Maspormenos</p>
          </div>
        </div>
        <form onSubmit={handleStudentLoginSubmit} className="p-10 space-y-8">
          <div>
            <label htmlFor="dni" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">4 Últimos dígitos DNI (Sin letra)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Hash className="h-5 w-5 text-gray-300" /></div>
              <input 
                type="text" 
                id="dni" 
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                required 
                className="block w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl bg-gray-50 text-sm font-black focus:ring-4 focus:ring-brand-500/10 focus:border-brand-600 focus:bg-white transition-all outline-none placeholder:text-gray-300 tabular-nums" 
                placeholder="Ej: 1234" 
                value={studentNameInput} 
                onChange={handleDniInputChange} 
              />
            </div>
          </div>
          <div>
            <label htmlFor="store" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Selecciona tu Tienda</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Store className="h-5 w-5 text-gray-300" /></div>
              <select 
                id="store" 
                required 
                className="block w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl bg-gray-50 text-sm font-black focus:ring-4 focus:ring-brand-500/10 focus:border-brand-600 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                value={storeNameInput} 
                onChange={(e) => setStoreNameInput(e.target.value)}
              >
                <option value="" disabled>Elige tu centro...</option>
                {STORES_LIST.sort().map(store => (
                  <option key={store} value={store}>{store}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-4 flex flex-col gap-4">
            <button 
              type="submit" 
              disabled={studentNameInput.length !== 4 || !storeNameInput}
              className="w-full flex justify-center py-5 px-4 border border-transparent rounded-2xl shadow-xl text-xs font-black uppercase tracking-widest text-white bg-black hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
            >
              Entrar al Campus
            </button>
            <button 
              type="button" 
              onClick={() => setState(prev => ({ ...prev, currentView: 'LOGIN' }))} 
              className="w-full flex justify-center items-center gap-2 py-4 px-4 border-2 border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderTrainerLogin = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md bg-white rounded-4xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-8 bg-zinc-900 border-b border-zinc-800 flex items-center gap-4 text-white">
          <div className="bg-zinc-800 p-3 rounded-2xl shadow-lg border border-zinc-700">
            <UserCog className="h-6 w-6 text-brand-500" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Acceso Formador</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Panel de Gestión</p>
          </div>
        </div>
        <form onSubmit={handleTrainerLoginSubmit} className="p-10 space-y-8">
          <div>
            <label htmlFor="pass" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contraseña de seguridad</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-300" /></div>
              <input 
                type="password" 
                id="pass" 
                required 
                className="block w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl bg-gray-50 text-sm font-black focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 focus:bg-white transition-all outline-none" 
                placeholder="Introduce tu contraseña" 
                value={trainerPasswordInput} 
                onChange={(e) => setTrainerPasswordInput(e.target.value)} 
              />
            </div>
            {trainerError && <p className="mt-3 text-xs font-bold text-red-600 uppercase tracking-tight">{trainerError}</p>}
          </div>
          <div className="pt-4 flex flex-col gap-4">
            <button type="submit" className="w-full flex justify-center py-5 px-4 border border-transparent rounded-2xl shadow-xl text-xs font-black uppercase tracking-widest text-white bg-black hover:bg-zinc-800 transition-all active:scale-95">Acceder al Panel</button>
            <button type="button" onClick={() => { setState(prev => ({ ...prev, currentView: 'LOGIN' })); setTrainerError(''); setTrainerPasswordInput(''); }} className="w-full flex justify-center items-center gap-2 py-4 px-4 border-2 border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 bg-white hover:bg-gray-50 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderLogin = () => (
    <>
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tight leading-none">Bienvenido al <span className="text-brand-600">Campus</span></h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">Plataforma de gestión del conocimiento y evaluación continua para el equipo de Maspormenos.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <button onClick={() => setState(prev => ({ ...prev, currentView: 'STUDENT_LOGIN' }))} className="group flex flex-col items-center p-10 bg-white rounded-4xl shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 text-center">
            <div className="p-6 bg-brand-50 rounded-3xl mb-8 group-hover:bg-brand-600 group-hover:scale-110 transition-all duration-500"><Users className="h-10 w-10 text-brand-600 group-hover:text-white" /></div>
            <h3 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">Soy Alumno</h3>
            <p className="text-sm text-gray-400 font-medium leading-relaxed">Realiza tests de formación, consulta tus resultados y accede a los manuales operativos.</p>
            <div className="mt-8 text-brand-600 text-xs font-black uppercase tracking-widest group-hover:translate-x-2 transition-transform">Entrar al Campus &rarr;</div>
          </button>
          <button onClick={() => setState(prev => ({ ...prev, currentView: 'TRAINER_LOGIN' }))} className="group flex flex-col items-center p-10 bg-white rounded-4xl shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 text-center">
            <div className="p-6 bg-gray-100 rounded-3xl mb-8 group-hover:bg-zinc-900 group-hover:scale-110 transition-all duration-500"><UserCog className="h-10 w-10 text-gray-800 group-hover:text-white" /></div>
            <h3 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">Soy Formador</h3>
            <p className="text-sm text-gray-400 font-medium leading-relaxed">Gestiona manuales, revisa el progreso del equipo y analiza las estadísticas globales.</p>
            <div className="mt-8 text-zinc-900 text-xs font-black uppercase tracking-widest group-hover:translate-x-2 transition-transform">Entrar como Formador &rarr;</div>
          </button>
        </div>
      </div>
      <Chatbot />
    </>
  );

  return (
    <Layout userRole={state.userRole} userName={state.currentUser} onLogout={logout}>
      {state.currentView === 'LOGIN' && renderLogin()}
      {state.currentView === 'STUDENT_LOGIN' && renderStudentLogin()}
      {state.currentView === 'TRAINER_LOGIN' && renderTrainerLogin()}
      {state.currentView === 'ADMIN_DASHBOARD' && <AdminPanel />}
      {state.currentView === 'STUDENT_DASHBOARD' && <StudentPanel studentName={state.currentUser} onStartQuiz={startQuiz} />}
      {state.currentView === 'QUIZ_TAKER' && activeQuizConfig && activeManualFiles && (
        <QuizInterface config={activeQuizConfig} manualFiles={activeManualFiles} studentName={state.currentUser} onExit={exitQuiz} />
      )}
    </Layout>
  );
};

export default App;
