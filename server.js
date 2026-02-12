
import express from 'express';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración para obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Inicialización de Firebase Admin con Application Default Credentials (ADC).
 * Cloud Run inyectará automáticamente los permisos necesarios si la cuenta de servicio tiene el rol de Firestore.
 */
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
  console.log("Firebase Admin inicializado correctamente con ADC.");
}

const db = admin.firestore();
const app = express();

// Middleware para parsear JSON
app.use(express.json());

/**
 * API ENDPOINT: GET /api/health
 * Verificación de estado del servicio.
 */
app.get('/api/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] Healthcheck solicitado`);
  res.status(200).json({ 
    ok: true, 
    status: 'ready',
    timestamp: new Date().toISOString(),
    service: 'Campus Maspormenos Node Backend'
  });
});

/**
 * API ENDPOINT: GET /api/get
 * Recupera datos de un usuario de la colección 'users'.
 * Query: ?userId=XXXX
 */
app.get('/api/get', async (req, res) => {
  const { userId } = req.query;
  console.log(`[${new Date().toISOString()}] Consultando datos para usuario: ${userId}`);

  if (!userId) {
    return res.status(400).json({ error: 'El parámetro userId es obligatorio.' });
  }

  try {
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.status(200).json({
      userId: doc.id,
      ...doc.data()
    });
  } catch (error) {
    console.error('Error al recuperar de Firestore:', error);
    res.status(500).json({ error: 'Error interno al recuperar los datos.' });
  }
});

/**
 * API ENDPOINT: POST /api/save
 * Guarda o actualiza datos en la colección 'users'.
 * Body: { userId: string, payload: object }
 */
app.post('/api/save', async (req, res) => {
  const { userId, payload } = req.body;
  console.log(`[${new Date().toISOString()}] Guardando datos para usuario: ${userId}`);

  if (!userId || !payload) {
    return res.status(400).json({ error: 'userId y payload son obligatorios en el cuerpo de la petición.' });
  }

  try {
    // Se utiliza merge: true para no destruir campos existentes si se hace un update parcial
    await db.collection('users').doc(userId).set(payload, { merge: true });
    res.status(200).json({ 
      success: true, 
      message: `Datos del usuario ${userId} actualizados correctamente.` 
    });
  } catch (error) {
    console.error('Error al guardar en Firestore:', error);
    res.status(500).json({ error: 'Error interno al guardar los datos.' });
  }
});

// --- SERVICIO DE FRONTEND ---

/**
 * 1. Servir archivos estáticos de /dist (generados por vite build)
 * y de la raíz (donde están index.html/index.tsx originalmente).
 */
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(__dirname));

/**
 * 2. Fallback para Single Page Application (SPA).
 * Cualquier ruta que no coincida con la API ni con un archivo físico
 * debe devolver index.html para que el Router de React tome el control.
 */
app.get('*', (req, res) => {
  // Evitar que las llamadas fallidas a /api devuelvan el HTML
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint de API no encontrado.' });
  }

  // Intentar servir desde /dist primero, si no desde la raíz
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(distIndex, (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, 'index.html'));
    }
  });
});

/**
 * ARRANQUE DEL SERVIDOR
 * Es fundamental escuchar en 0.0.0.0 y usar el puerto proporcionado por Cloud Run.
 */
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`--------------------------------------------------`);
  console.log(`🚀 Campus Maspormenos iniciado en puerto ${PORT}`);
  console.log(`📂 Sirviendo frontend y API Firestore`);
  console.log(`🔗 Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`--------------------------------------------------`);
});
