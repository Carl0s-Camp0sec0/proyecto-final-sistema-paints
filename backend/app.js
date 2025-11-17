require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// === MIDDLEWARE DE SEGURIDAD ===
app.use(helmet());

// === CONFIGURACIÓN DE CORS PARA LIVE SERVER ===
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? 
    ['https://tu-dominio.com'] : [
      // Live Server (VS Code) - PUERTOS PRINCIPALES
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      'http://127.0.0.1:5501',
      'http://localhost:5501',
      'http://127.0.0.1:5502',
      'http://localhost:5502',
      // Desarrollo local
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      // Para archivos locales (file://)
      'null'
    ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));

// Headers CORS adicionales para mayor compatibilidad
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // En desarrollo, permitir cualquier origen local
  if (process.env.NODE_ENV !== 'production' && origin) {
    if (origin.includes('127.0.0.1') || origin.includes('localhost')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Responder a preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutos por defecto
  max: parseInt(process.env.RATE_LIMIT_MAX || 100), // 100 requests por defecto
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  }
});
app.use('/api/', limiter);

// === MIDDLEWARE PARA PARSEAR DATOS ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// === SERVIR ARCHIVOS ESTÁTICOS ===
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, '../frontend')));

// === MIDDLEWARE PERSONALIZADO ===
// Logger mejorado para desarrollo con info de CORS
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const origin = req.headers.origin || 'no-origin';
    console.log(`📡 ${req.method} ${req.path} - Origin: ${origin}`);
    next();
  });
}

// === RUTAS PRINCIPALES ===
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema Paints API',
    version: '1.0.0',
    status: 'operativo',
    timestamp: new Date().toISOString(),
    proyecto: 'Universidad UMES - Bases de Datos II',
    documentacion: '/api/test',
    cors_configurado: true
  });
});

// Ruta de test específica para verificar CORS
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: "API Routes funcionando correctamente",
    timestamp: new Date().toISOString(),
    origin_request: req.headers.origin || 'no-origin',
    user_agent: req.headers['user-agent'],
    cors_headers: {
      'access-control-allow-origin': res.getHeader('Access-Control-Allow-Origin'),
      'access-control-allow-credentials': res.getHeader('Access-Control-Allow-Credentials')
    }
  });
});

// Importar y usar rutas de la API
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// === MANEJO DE ERRORES ===
// Middleware para rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 
      'Error interno del servidor' : 
      err.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

module.exports = app;