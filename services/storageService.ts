
import { Manual, QuizResult, ManualCategory } from "../types";
import { db } from "../firebaseConfig";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  collection, 
  getDocs, 
  increment 
} from "firebase/firestore";

// Incrementamos la versión para forzar el reseteo de la lista de manuales y ver los 8 de Operativa
const MANUALS_KEY = 'campus_manuals_v6'; 
const PASSWORD_KEY = 'campus_trainer_password';

const encodeText = (str: string): string => {
  try { return window.btoa(unescape(encodeURIComponent(str))); } catch (e) { return ""; }
};

// --- MANUALES INICIALES: BLOQUE OPERATIVA AMPLIADO A 8 DOCUMENTOS ---
const INITIAL_MANUALS: Manual[] = [
  // Atención al Cliente
  { id: 'm_atc_01', name: 'Cuaderno de Ruta del Asesor', uploadDate: '2025-02-27', category: 'Atención al Cliente', fileData: encodeText("Contenido del Cuaderno de Ruta..."), mimeType: 'text/plain' },
  { id: 'm_atc_02', name: 'Protocolo de Bienvenida y Despedida', uploadDate: '2025-02-27', category: 'Atención al Cliente', fileData: encodeText("Contenido Protocolo..."), mimeType: 'text/plain' },
  
  // Operativa (8 MANUALES SOLICITADOS)
  { id: 'm_ope_00', name: '1. Manual Básico TPV FrontRetail', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Manual: TPV Básico..."), mimeType: 'text/plain' },
  { id: 'm_ope_01', name: '2. Gestión de Devoluciones y Vales', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Contenido Devoluciones..."), mimeType: 'text/plain' },
  { id: 'm_ope_02', name: '3. Uso de PDA: Recepción de Mercancía', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Contenido PDA..."), mimeType: 'text/plain' },
  { id: 'm_ope_03', name: '4. Cierre de Caja y Arqueo Diario', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Contenido Cierre..."), mimeType: 'text/plain' },
  { id: 'm_ope_04', name: '5. Protocolo de Apertura de Tienda', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Contenido Apertura..."), mimeType: 'text/plain' },
  { id: 'm_ope_05', name: '6. Gestión de Stock y Pedidos Especiales', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Contenido Stock..."), mimeType: 'text/plain' },
  { id: 'm_ope_06', name: '7. Inventario y Auditoría de Tienda', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Contenido Inventario..."), mimeType: 'text/plain' },
  { id: 'm_ope_07', name: '8. Procedimientos de Seguridad y Alarmas', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Contenido Seguridad..."), mimeType: 'text/plain' },
  
  // Producto
  { id: 'm_prod_01', name: 'Tecnología Textil y Calzado 2023', uploadDate: '2025-02-27', category: 'Producto', fileData: encodeText("Manual: Tecnología..."), mimeType: 'text/plain' },
  { id: 'm_prod_02', name: 'Guía de Mantenimiento Gore-Tex', uploadDate: '2025-02-27', category: 'Producto', fileData: encodeText("Contenido GoreTex..."), mimeType: 'text/plain' },
  
  // Visual
  { id: 'm_vis_01', name: 'Estándares Visual Merchandising', uploadDate: '2025-02-27', category: 'Visual', fileData: encodeText("Manual: Visual..."), mimeType: 'text/plain' },
  { id: 'm_vis_02', name: 'Colocación de Escaparates Temporada', uploadDate: '2025-02-27', category: 'Visual', fileData: encodeText("Contenido Escaparates..."), mimeType: 'text/plain' },
];

export const getManuals = (): Manual[] => {
  const stored = localStorage.getItem(MANUALS_KEY);
  if (!stored) {
    localStorage.setItem(MANUALS_KEY, JSON.stringify(INITIAL_MANUALS));
    return INITIAL_MANUALS;
  }
  return JSON.parse(stored);
};

export const resetToDefaults = (): void => {
  localStorage.setItem(MANUALS_KEY, JSON.stringify(INITIAL_MANUALS));
};

export const saveManual = (manual: Manual): void => {
  const manuals = getManuals();
  manuals.push(manual);
  localStorage.setItem(MANUALS_KEY, JSON.stringify(manuals));
};

export const deleteManual = (id: string): void => {
  const manuals = getManuals();
  const updatedManuals = manuals.filter(m => m.id !== id);
  localStorage.setItem(MANUALS_KEY, JSON.stringify(updatedManuals));
};

export const saveResult = async (result: QuizResult): Promise<void> => {
  const userDocRef = doc(db, "users", result.studentName);
  const statsDocRef = doc(db, "campus_stats", "general");

  try {
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      await updateDoc(userDocRef, { results: arrayUnion(result) });
    } else {
      await setDoc(userDocRef, { results: [result], createdAt: new Date().toISOString() });
    }
    await updateDoc(statsDocRef, { testsRealizados: increment(1) }).catch(() => {
      setDoc(statsDocRef, { testsRealizados: 1 }, { merge: true });
    });
  } catch (error) {
    console.error("Error al guardar resultado:", error);
    throw error;
  }
};

export const getResults = async (): Promise<QuizResult[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const allResults: QuizResult[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.results) allResults.push(...data.results);
    });
    return allResults;
  } catch (error) {
    return [];
  }
};

export const getStudentResults = async (studentName: string): Promise<QuizResult[]> => {
  try {
    const userDocRef = doc(db, "users", studentName);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) return userSnap.data().results || [];
    return [];
  } catch (error) {
    return [];
  }
};

export interface StudentStats {
  name: string;
  averageScore: number;
  totalTests: number;
  passedCount: number;
  lastTestDate: string;
  improvement: 'up' | 'down' | 'neutral';
  history: QuizResult[];
}

export const getStudentsEvolution = async (): Promise<StudentStats[]> => {
  const results = await getResults();
  const studentMap = new Map<string, QuizResult[]>();
  results.forEach(res => {
    const list = studentMap.get(res.studentName) || [];
    list.push(res);
    studentMap.set(res.studentName, list);
  });
  return Array.from(studentMap.entries()).map(([name, resList]) => {
    const sorted = resList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const totalScore = sorted.reduce((acc, r) => acc + r.score, 0);
    const avgScore = totalScore / sorted.length;
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (sorted.length >= 2) {
      const last = sorted[sorted.length - 1].score;
      const prev = sorted[sorted.length - 2].score;
      if (last > prev) trend = 'up';
      else if (last < prev) trend = 'down';
    }
    return { 
      name, averageScore: avgScore, totalTests: sorted.length, 
      passedCount: sorted.filter(r => r.score >= 80).length, 
      lastTestDate: sorted[sorted.length - 1].date, 
      improvement: trend, history: [...sorted].reverse() 
    };
  }).sort((a, b) => b.averageScore - a.averageScore);
};

export const getGlobalStats = async () => {
  const results = await getResults();
  if (results.length === 0) return { avgScore: 0, totalTests: 0, passRate: 0 };
  const totalScore = results.reduce((acc, r) => acc + r.score, 0);
  const avgScore = totalScore / results.length;
  const passed = results.filter(r => r.score >= 80).length;
  return { avgScore, totalTests: results.length, passRate: (passed / results.length) * 100 };
};

export const clearAllResults = async (): Promise<void> => { console.warn("Función no implementada."); };
export const getTrainerPassword = (): string => localStorage.getItem(PASSWORD_KEY) || '123456';
export const setTrainerPassword = (password: string): void => localStorage.setItem(PASSWORD_KEY, password);
