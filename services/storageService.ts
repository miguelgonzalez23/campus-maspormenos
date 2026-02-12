
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

// Versión v7 para asegurar que todos los clientes vean la nueva lista de 14 manuales maestros
const MANUALS_KEY = 'campus_manuals_v7'; 
const PASSWORD_KEY = 'campus_trainer_password';

const encodeText = (str: string): string => {
  try { return window.btoa(unescape(encodeURIComponent(str))); } catch (e) { return ""; }
};

// --- BIBLIOTECA DE MANUALES MAESTROS MASPORMENOS ---
const INITIAL_MANUALS: Manual[] = [
  // ATENCIÓN AL CLIENTE
  { id: 'm_atc_01', name: 'Cuaderno de ruta del vendedor de montaña', uploadDate: '2025-02-27', category: 'Atención al Cliente', fileData: encodeText("Manual de Atención al Cliente: Protocolos de bienvenida, despedida y asesoramiento técnico en montaña."), mimeType: 'text/plain' },
  { id: 'm_atc_02', name: 'Info formación vendedor', uploadDate: '2025-02-27', category: 'Atención al Cliente', fileData: encodeText("Resumen clave de formación para vendedores: habilidades de comunicación y actitud comercial."), mimeType: 'text/plain' },
  
  // OPERATIVA (8 MANUALES)
  { id: 'm_ope_01', name: 'Cierre de caja', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Procedimiento oficial de cierre de caja TPV, arqueo diario y gestión de efectivo."), mimeType: 'text/plain' },
  { id: 'm_ope_02', name: 'Compras de personal', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Condiciones y límites de compra para el personal de tienda: descuentos y normativa interna."), mimeType: 'text/plain' },
  { id: 'm_ope_03', name: 'Manual envío facturas', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Guía para la creación y envío de facturas a clientes desde el sistema FrontRetail."), mimeType: 'text/plain' },
  { id: 'm_ope_04', name: 'Manual procedimientos pda', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Manual de uso de la PDA: pedidos web, roturas y gestión de stock en tiempo real."), mimeType: 'text/plain' },
  { id: 'm_ope_05', name: 'Nuevo procedimiento postventas', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Protocolo de postventa: gestión de taras, devoluciones y garantías de marcas técnicas."), mimeType: 'text/plain' },
  { id: 'm_ope_06', name: 'Procedimiento gestión de inventarios en pda', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Guía paso a paso para realizar inventarios parciales y totales utilizando la PDA."), mimeType: 'text/plain' },
  { id: 'm_ope_07', name: 'Recepción de mercancía', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Protocolo de recepción de mercancía en tienda: bultos, albaranes AVI y registro en PDA."), mimeType: 'text/plain' },
  { id: 'm_ope_08', name: 'Manual tpv', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Guía completa de FrontRetail: ventas, devoluciones, vales y fidelización de clientes."), mimeType: 'text/plain' },
  
  // PRODUCTO
  { id: 'm_prod_01', name: 'Manual de formación textil calzado', uploadDate: '2025-02-27', category: 'Producto', fileData: encodeText("Formación técnica: membranas Gore-Tex, impermeabilidad, transpirabilidad y tipos de calzado."), mimeType: 'text/plain' },
  { id: 'm_prod_02', name: 'Manual de material imprescindible de escalada', uploadDate: '2025-02-27', category: 'Producto', fileData: encodeText("Seguridad en escalada: cuerdas, arneses, mosquetones, aseguradores y mantenimiento."), mimeType: 'text/plain' },
  
  // VISUAL
  { id: 'm_vis_01', name: 'VM22', uploadDate: '2025-02-27', category: 'Visual', fileData: encodeText("Estándares de Visual Merchandising: planogramas, exposición por género y precios."), mimeType: 'text/plain' },
  { id: 'm_vis_02', name: 'Info VM', uploadDate: '2025-02-27', category: 'Visual', fileData: encodeText("Guía rápida de Visual: alarmado de prendas, iluminación de producto y uso de perchas."), mimeType: 'text/plain' },
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
