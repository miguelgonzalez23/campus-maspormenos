import express from 'express';
import * as admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración para obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Inicialización de Firebase Admin con Application Default Credentials (ADC).
 */
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
  console.log("Firebase Admin inicializado.");
}

const db = admin.firestore();
const app = express();

// Middleware para procesar cuerpos JSON
app.use(express.json() as any);

/**
 * RUTA: GET /api/health
 */
app.get('/api/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] Healthcheck OK`);
  res.status(200).json({ 
    ok: true, 
    status: 'ready',
    service: 'Campus Maspormenos',
    timestamp: new Date().toISOString()
  });
});

/**
 * RUTA: POST /api/save
 */
app.post('/api/save', async (req, res) => {
  const { userId, userData } = req.body;
  if (!userId || !userData) {
    res.status(400).json({ error: 'userId y userData son obligatorios' });
    return;
  }

  try {
    await db.collection('users').doc(userId).set(userData, { merge: true });
    res.status(200).json({ success: true, message: `Usuario ${userId} guardado.` });
  } catch (error) {
    console.error('Error Firestore Save:', error);
    res.status(500).json({ error: 'Error al guardar datos.' });
  }
});

/**
 * RUTA: GET /api/get
 */
app.get('/api/get', async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'userId requerido' });
    return;
  }

  try {
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'No encontrado' });
      return;
    }
    res.status(200).json({ userId: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error Firestore Get:', error);
    res.status(500).json({ error: 'Error al recuperar datos.' });
  }
});

// --- SERVICIO DE ARCHIVOS ESTÁTICOS Y SPA ---

// 1. Servir archivos estáticos de la raíz (index.html, index.tsx, etc)
// Fix: Cast express.static middleware to any to prevent TypeScript overload resolution issues on line 84.
app.use(express.static(__dirname) as any);

// 2. Fallback para Single Page Application (SPA)
// Cualquier ruta que no sea /api/* y no sea un archivo físico, sirve index.html
// Fix: Use any for req and res to prevent overload mismatch issues and ensure return void in handlers.
app.get('*', (req: any, res: any) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Ruta de API no encontrada' });
    return;
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * Arranque del servidor vinculando al puerto de Cloud Run.
 */
// Fix: Cast PORT to number to match the signature expected by app.listen.
const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor Campus Maspormenos ejecutándose en puerto ${PORT}`);
});