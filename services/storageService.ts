
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

const MANUALS_KEY = 'campus_manuals_v5'; 
const PASSWORD_KEY = 'campus_trainer_password';

const encodeText = (str: string): string => {
  try { return window.btoa(unescape(encodeURIComponent(str))); } catch (e) { return ""; }
};

// --- MANUALES (Se mantienen en localStorage por ahora o como base estática) ---
const INITIAL_MANUALS: Manual[] = [
  { id: 'm_atc_01', name: 'Cuaderno de Ruta del Asesor', uploadDate: '2025-02-27', category: 'Atención al Cliente', fileData: encodeText("Manual: Cuaderno de Ruta..."), mimeType: 'text/plain' },
  { id: 'm_ope_00', name: 'Manual Básico TPV FrontRetail', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText("Manual: TPV Básico..."), mimeType: 'text/plain' },
  { id: 'm_prod_01', name: 'Tecnología Textil y Calzado 2023', uploadDate: '2025-02-27', category: 'Producto', fileData: encodeText("Manual: Tecnología..."), mimeType: 'text/plain' },
  { id: 'm_vis_01', name: 'Estándares Visual Merchandising', uploadDate: '2025-02-27', category: 'Visual', fileData: encodeText("Manual: Visual..."), mimeType: 'text/plain' },
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

// --- RESULTADOS Y EVOLUCIÓN (AHORA EN FIRESTORE) ---

/**
 * Guarda un resultado de test en Firestore.
 * Si es el primer test del usuario, crea el documento.
 */
export const saveResult = async (result: QuizResult): Promise<void> => {
  const userDocRef = doc(db, "users", result.studentName);
  const statsDocRef = doc(db, "campus_stats", "general");

  try {
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      await updateDoc(userDocRef, {
        results: arrayUnion(result)
      });
    } else {
      await setDoc(userDocRef, {
        results: [result],
        createdAt: new Date().toISOString()
      });
    }

    // Incrementar contador global de tests realizados
    await updateDoc(statsDocRef, {
      testsRealizados: increment(1)
    }).catch(() => {
      // Si el doc no existe, lo inicializamos
      setDoc(statsDocRef, { testsRealizados: 1 }, { merge: true });
    });

  } catch (error) {
    console.error("Error al guardar resultado en Firestore:", error);
    throw error;
  }
};

/**
 * Recupera todos los resultados de todos los usuarios (para el Formador).
 */
export const getResults = async (): Promise<QuizResult[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const allResults: QuizResult[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.results) {
        allResults.push(...data.results);
      }
    });
    return allResults;
  } catch (error) {
    console.error("Error al recuperar resultados de Firestore:", error);
    return [];
  }
};

/**
 * Recupera el historial específico de un alumno.
 */
export const getStudentResults = async (studentName: string): Promise<QuizResult[]> => {
  try {
    const userDocRef = doc(db, "users", studentName);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      return userSnap.data().results || [];
    }
    return [];
  } catch (error) {
    console.error("Error al recuperar resultados del alumno:", error);
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
      name, 
      averageScore: avgScore, 
      totalTests: sorted.length, 
      passedCount: sorted.filter(r => r.score >= 80).length, 
      lastTestDate: sorted[sorted.length - 1].date, 
      improvement: trend, 
      history: [...sorted].reverse() 
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

export const clearAllResults = async (): Promise<void> => {
  // Nota: Borrar una colección entera requiere iterar.
  // En un entorno real se haría con una Cloud Function o por seguridad no se permitiría.
  console.warn("La función clearAllResults no está implementada para Firestore por seguridad.");
};

export const getTrainerPassword = (): string => localStorage.getItem(PASSWORD_KEY) || '123456';
export const setTrainerPassword = (password: string): void => localStorage.setItem(PASSWORD_KEY, password);
