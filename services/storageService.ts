
import { Manual, QuizResult, ManualCategory } from "../types";

// Cambiamos la clave a v5 para forzar la actualización de la base de datos en el navegador del usuario
const MANUALS_KEY = 'campus_manuals_v5'; 
const RESULTS_KEY = 'campus_results';
const PASSWORD_KEY = 'campus_trainer_password';

const encodeText = (str: string): string => {
  try {
    return window.btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    return "";
  }
};

// --- CONTENIDOS EXTRACTOS DE LA BIBLIOTECA MAESTRA COMPLETA ---

const CONTENT_CUADERNO_RUTA = `Manual: Cuaderno de Ruta del Asesor de Montaña. 
- Mentalidad Sherpa: No despachar, guiar. 
- Fases: Aproximación (evitar "¿Puedo ayudarte?"), Exploración (3 preguntas de oro: Actividad, Dónde, Experiencia), Equipamiento (Venta cruzada "Y SI..."), Cierre (Palabras de poder). 
- Prohibiciones: Decir "No sé" o "Es barato".`;

const CONTENT_RUTA_VENDEDOR = `Manual: Formación Vendedor Maspormenos. 
- Habilidades: Escucha activa y conocimiento experto. 
- Ciclo de venta: Bienvenida -> Análisis -> Presentación -> Objeciones -> Cierre -> Post-Venta.`;

const CONTENT_VISUAL_STANDARDS = `Manual: Estándares Visual Merchandising. 
- Etiquetas: Verde (20%), Roja (50%), Azul (Final). 
- Gometeado: Obligatorio según descuento. 
- Planograma: Hombre > Mujer > Niño. Montaña prioridad sobre Deporte. 
- Calzado: Pie derecho, dirección del paso, talla 38M/42H. 
- Textil: Primera prenda vestida (3 capas), talla pequeña expuesta.`;

const CONTENT_TPV_BASICO = `Manual: Manual Básico TPV FrontRetail. 
- Identificación: Password + botón entrada (2). 
- Venta: Lectura EAN, modificación de unidades o dtos pulsando sobre el campo. 
- Cobro: Botón 'Fras. Simplificada'. 
- Vales: Botón 'Anticipos/Vales' para aplicar o generar vales si el saldo es negativo. 
- Consulta Ventas: Filtros por fecha y vendedor. Botón 'A Factura' para convertir ticket.`;

const CONTENT_CIERRE_CAJA = `Manual: Cierre de Caja TPV. 
- Cierre X: No obligatorio pero recomendable. Declarar Tarjeta GPRS y Vales antiguos. 
- Cierre Z: OBLIGATORIO al finalizar. Declarar Tarjeta GPRS. 
- Vales Antiguos: Enviar a central semanalmente a la atención de contabilidad.`;

const CONTENT_COMPRA_PERSONAL = `Manual: Condiciones de Compra de Personal. 
- Descuentos: 40% Denim, 30% Deporte. 
- Límites: Máximo 1000€ anuales por empleado. 
- Restricciones: No aplica a Continuidad ni Complementos. Obligatorio pasar Tarjeta Club. 
- Prohibiciones: Apartarse ropa, reservas en trastienda, autocobro o autodevolución.`;

const CONTENT_ENVIO_FACTURAS = `Manual: Envío de Facturas desde TPV. 
- Proceso: Botón 'Factura' -> Seleccionar/Crear cliente -> 'Consulta ventas' -> 'A factura' -> Elegir formato 'FACTURA MXM DIN4'. 
- Envío: Botón 'Email' -> 'Cargar plantilla' -> Seleccionar tienda -> 'Aceptar' -> 'Enviar'.`;

const CONTENT_PROCEDIMIENTOS_PDA = `Manual: Procedimientos PDA Maspormenos. 
- Pedido Web: Compras -> Picking devolución -> Buscar pedido -> Leer EAN -> Registrar. 
- Roturas: Ajustes stock -> Negativo (para regularizar faltas web) o Positivo (si aparece stock perdido). 
- Consulta Stock: Stock Real = Inventario - (Pedidos Tránsito + Ventas Tienda). 
- Envíos Web: Usar prefijos obligatorios C- (Cambio), R- (Rotura), E- (Extra).`;

const CONTENT_POSTVENTA = `Manual: Nuevo Procedimiento Postventa. 
- Garantía: Máximo 3 años con ticket/resguardo. 
- Marcas Directas (+8000, Joluvi): Devolución inmediata al cliente. 
- Marcas Técnicas (Sportiva, Bestard, Scarpa, Boreal): NO abonar sin autorización de la marca (reparación). 
- Registro: 5 fotos obligatorias: General, Suela, Defecto, Ticket y Lengüeta.`;

const CONTENT_INVENTARIOS_PDA = `Manual: Gestión de Inventarios PDA. 
- Pasos: Menú Inventario -> Agrupación de Inventario -> Cargar marcas lanzadas por central -> Bipar artículos (sin orden específico) -> Registrar. 
- Nota: La PDA actualiza el stock al último registro realizado.`;

const CONTENT_RECEPCION_MERCANCIA = `Manual: Recepción de Mercancía en Tienda. 
- Regla de Oro: Recepcionar SIEMPRE antes de sacar el producto a la venta. 
- Incidencias: Si faltan bultos en la expedición, NO recepcionar hasta tener todo. 
- Identificación: Albaranes AVI indican número de pedido, tienda destino y bultos.`;

const CONTENT_TEXTIL_CALZADO_2023 = `Manual: Tecnología Textil y Calzado 2023. 
- Membranas: Gore-Tex (microporosa, impermeable y transpirable). 
- Mantenimiento: DWR (repelencia) se reactiva con calor (secadora/plancha). 
- Materiales: Cordura (abrasión), Coolmax (humedad), Polartec (forro térmico), Primaloft (pluma sintética). 
- Calzado: Pisada Neutra, Pronadora o Supinadora. Drop (diferencia talón-punta). Amortiguación (Gel, Wave, Boost).`;

const CONTENT_MATERIAL_ESCALADA = `Manual: Material Técnico de Escalada. 
- Cuerdas: Dinámicas (para escalar), Estáticas (prohibido escalar). 
- Mosquetones: HMS (forma de pera para asegurar). 
- Pies de gato: Simétricos (confort), Asimétricos (precisión), Agresivos (desplomes). 
- Vida útil: Textil (arnés/cuerdas) 5-10 años. Revisión pre-uso obligatoria.`;

const CONTENT_EQUIPAMIENTO_2026 = `Manual: Guía Equipamiento Montaña 2026. 
- Sistema 3 Capas: 1ª (Humedad/No algodón), 2ª (Calor/Pluma o Fibra), 3ª (Protección/Gore-Tex). 
- Calzado: Zapatillas (senderos), Botas (tobillo), Semirrígidas (cramponables), Rígidas (hielo). 
- Mochilas: Ajuste lumbar debe soportar el 80% del peso.`;

const INITIAL_MANUALS: Manual[] = [
  // ATENCIÓN AL CLIENTE
  { id: 'm_atc_01', name: 'Cuaderno de Ruta del Asesor', uploadDate: '2025-02-27', category: 'Atención al Cliente', fileData: encodeText(CONTENT_CUADERNO_RUTA), mimeType: 'text/plain' },
  { id: 'm_atc_02', name: 'La Ruta del Vendedor (Resumen)', uploadDate: '2025-02-27', category: 'Atención al Cliente', fileData: encodeText(CONTENT_RUTA_VENDEDOR), mimeType: 'text/plain' },
  
  // OPERATIVA
  { id: 'm_ope_00', name: 'Manual Básico TPV FrontRetail', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText(CONTENT_TPV_BASICO), mimeType: 'text/plain' },
  { id: 'm_ope_01', name: 'Cierre de Caja TPV (X/Z)', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText(CONTENT_CIERRE_CAJA), mimeType: 'text/plain' },
  { id: 'm_ope_02', name: 'Condiciones Compra Personal', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText(CONTENT_COMPRA_PERSONAL), mimeType: 'text/plain' },
  { id: 'm_ope_03', name: 'Manual Envío Facturas', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText(CONTENT_ENVIO_FACTURAS), mimeType: 'text/plain' },
  { id: 'm_ope_04', name: 'Procedimientos PDA Completo', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText(CONTENT_PROCEDIMIENTOS_PDA), mimeType: 'text/plain' },
  { id: 'm_ope_05', name: 'Nuevo Procedimiento Postventa', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText(CONTENT_POSTVENTA), mimeType: 'text/plain' },
  { id: 'm_ope_06', name: 'Gestión de Inventarios PDA', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText(CONTENT_INVENTARIOS_PDA), mimeType: 'text/plain' },
  { id: 'm_ope_07', name: 'Recepción de Mercancía', uploadDate: '2025-02-27', category: 'Operativa', fileData: encodeText(CONTENT_RECEPCION_MERCANCIA), mimeType: 'text/plain' },
  
  // PRODUCTO
  { id: 'm_prod_01', name: 'Tecnología Textil y Calzado 2023', uploadDate: '2025-02-27', category: 'Producto', fileData: encodeText(CONTENT_TEXTIL_CALZADO_2023), mimeType: 'text/plain' },
  { id: 'm_prod_02', name: 'Material Técnico de Escalada', uploadDate: '2025-02-27', category: 'Producto', fileData: encodeText(CONTENT_MATERIAL_ESCALADA), mimeType: 'text/plain' },
  { id: 'm_prod_03', name: 'Guía Equipamiento Montaña 2026', uploadDate: '2025-02-27', category: 'Producto', fileData: encodeText(CONTENT_EQUIPAMIENTO_2026), mimeType: 'text/plain' },
  
  // VISUAL
  { id: 'm_vis_01', name: 'Estándares Visual Merchandising', uploadDate: '2025-02-27', category: 'Visual', fileData: encodeText(CONTENT_VISUAL_STANDARDS), mimeType: 'text/plain' },
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

export const getResults = (): QuizResult[] => {
  const stored = localStorage.getItem(RESULTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveResult = (result: QuizResult): void => {
  const results = getResults();
  results.push(result);
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
};

export const clearAllResults = (): void => {
  localStorage.removeItem(RESULTS_KEY);
};

export const getGlobalStats = () => {
  const results = getResults();
  if (results.length === 0) return { avgScore: 0, totalTests: 0, passRate: 0 };
  const totalScore = results.reduce((acc, r) => acc + r.score, 0);
  const avgScore = totalScore / results.length;
  const passed = results.filter(r => r.score >= 80).length;
  return { avgScore, totalTests: results.length, passRate: (passed / results.length) * 100 };
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

export const getStudentsEvolution = (): StudentStats[] => {
  const results = getResults();
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
    return { name, averageScore: avgScore, totalTests: sorted.length, passedCount: sorted.filter(r => r.score >= 80).length, lastTestDate: sorted[sorted.length - 1].date, improvement: trend, history: sorted.reverse() };
  }).sort((a, b) => b.averageScore - a.averageScore);
};

export const getTrainerPassword = (): string => localStorage.getItem(PASSWORD_KEY) || '123456';
export const setTrainerPassword = (password: string): void => localStorage.setItem(PASSWORD_KEY, password);
