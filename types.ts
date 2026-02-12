
export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT',
  NONE = 'NONE'
}

export type ManualCategory = 'Atención al Cliente' | 'Operativa' | 'Producto' | 'Visual';

export interface Manual {
  id: string;
  name: string;
  uploadDate: string;
  category: ManualCategory;
  fileData?: string; 
  mimeType?: string;
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  CASE_STUDY = 'case_study',
  MATCHING = 'matching'
}

export interface Question {
  id: number;
  type: QuestionType;
  questionText: string;
  options: string[]; // Para matching, estos son los conceptos de la IZQUIERDA
  matchingOptions?: string[]; // Para matching, estos son las definiciones de la DERECHA (desordenadas)
  correctAnswer: string; // Para matching, formato "0:1, 1:0, 2:2" indicando el índice correcto
  explanation: string;
  referenceContext: string;
  sourceManual?: string;
}

export interface QuizConfig {
  manualId: string;
  manualName: string;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  questionCount: number;
  isPractice?: boolean;
  category?: ManualCategory | 'Global';
}

export interface QuizResult {
  id: string;
  studentName: string;
  manualName: string;
  category?: ManualCategory | 'Global';
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  date: string;
  difficulty: string;
  isPractice?: boolean;
  details: {
    questionId: number;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
    sourceManual?: string;
  }[];
}

export interface AppState {
  userRole: UserRole;
  currentView: 'LOGIN' | 'STUDENT_LOGIN' | 'TRAINER_LOGIN' | 'ADMIN_DASHBOARD' | 'STUDENT_DASHBOARD' | 'QUIZ_CONFIG' | 'QUIZ_TAKER' | 'RESULTS';
  currentUser: string;
}
