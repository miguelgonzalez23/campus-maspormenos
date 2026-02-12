
import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionType, QuizConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = "gemini-3-flash-preview";

const createSystemInstruction = (count: number): string => {
  return `
    Eres un experto formador corporativo senior para la cadena de tiendas de deporte 'Maspormenos'.
    Tu objetivo es evaluar a los empleados con el máximo rigor pedagógico basándote EXCLUSIVAMENTE en el material proporcionado.
    
    CRITERIOS DE EXAMEN:
    1. Generarás exactamente ${count} preguntas.
    2. Tipos de preguntas a incluir obligatoriamente:
       - 'true_false': Exactamente dos opciones ["Verdadero", "Falso"]. (30% del test)
       - 'multiple_choice': 4 opciones plausibles. (40% del test)
       - 'matching': Relación de conceptos. Ideal para terminología técnica, procesos PDA o categorías visuales. (30% del test)
    3. Formato para 'matching':
       - 'options': Lista de 4-5 conceptos cortos (ej: "Gore-Tex", "Vibram").
       - 'matchingOptions': Lista de 4-5 definiciones correspondientes pero DESORDENADAS.
       - 'correctAnswer': Una cadena que indique los índices correctos del tipo "0:2, 1:0, 2:1..." donde el primer número es el índice de 'options' y el segundo el de 'matchingOptions'.
    4. Rigurosidad: Si el material es técnico, las preguntas deben ser precisas en datos y flujos.
    5. Identificación: Indica en 'sourceManual' el nombre del manual del que extraes la pregunta.
    6. Formato: Devuelve la respuesta estrictamente en formato JSON válido.
  `;
};

const createChatbotInstruction = (): string => {
  return `
    Eres el 'Asistente Senior del Campus Maspormenos'. Tu misión es resolver dudas operativas de los empleados de tienda.
    
    REGLAS DE ORO:
    1. ACCESO TOTAL: Tienes acceso a MÚLTIPLES manuales. Busca en todos ellos para dar una respuesta completa.
    2. CITADO: Indica SIEMPRE de qué manual o manuales has extraído la información.
    3. PRECISIÓN: Si no encuentras la información exacta en los documentos, indícalo educadamente. No inventes procedimientos.
    4. TONO: Profesional, servicial y experto en retail.
  `;
};

export const generateQuizQuestions = async (
  files: { data: string, mimeType: string }[],
  config: QuizConfig
): Promise<Question[]> => {
  
  const count = config.questionCount || 20;
  const prompt = `
    Genera un examen de formación ${config.isPractice ? 'DE PRÁCTICA' : 'OFICIAL'} con ${count} preguntas variadas.
    
    Contexto: ${config.manualId === 'all_manuals' ? 'CERTIFICACIÓN GLOBAL' : `ESPECÍFICO: ${config.manualName}`}
    
    Incluye preguntas de relación de conceptos (matching) para evaluar el dominio de términos técnicos y flujos de trabajo.
  `;

  try {
    const fileParts = files.map(f => ({
      inlineData: {
        data: f.data,
        mimeType: f.mimeType,
      },
    }));

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [...fileParts, { text: prompt }] }],
      config: {
        systemInstruction: createSystemInstruction(count),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              type: { type: Type.STRING },
              questionText: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              matchingOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              referenceContext: { type: Type.STRING },
              sourceManual: { type: Type.STRING },
            },
            required: ["id", "type", "questionText", "options", "correctAnswer", "explanation", "referenceContext", "sourceManual"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as Question[];
    }
    throw new Error("No text response from Gemini");
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const askManualChatbot = async (
  question: string,
  files: { data: string, mimeType: string }[]
): Promise<string> => {
  try {
    const fileParts = files.map(f => ({
      inlineData: { data: f.data, mimeType: f.mimeType }
    }));
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [...fileParts, { text: question }] }],
      config: { 
        systemInstruction: createChatbotInstruction(),
        temperature: 0.2,
      },
    });
    
    return response.text || "No hay información disponible.";
  } catch (error) {
    return "Error al conectar con el servidor.";
  }
};
