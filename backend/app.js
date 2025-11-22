require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// === MIDDLEWARE DE SEGURIDAD ===
// Desactivar CSP en desarrollo para evitar bloqueos
if (process.env.NODE_ENV === 'production') {
  // Solo activar Helmet en producción
  app.use(helmet());
} else {
  // En desarrollo, desactivar CSP completamente
  app.use(
    helmet({
      contentSecurityPolicy: false, // Desactivar CSP completamente en desarrollo
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
    })
  );
}

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

// Rate limiting - Desactivado en desarrollo
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutos por defecto
    max: parseInt(process.env.RATE_LIMIT_MAX || 100), // 100 requests por defecto
    message: {
      error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
    }
  });
  app.use('/api/', limiter);
} else {
  console.log('⚠️  Rate limiting desactivado en desarrollo');
}

// === MIDDLEWARE PARA PARSEAR DATOS ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
    console.log('\n🔥 === REQUEST INTERCEPTED ===');
    console.log('📡 Method + Path:', req.method, req.path);
    console.log('📝 Body:', req.body);
    console.log('==============================\n');
    next();
});

// === SERVIR ARCHIVOS ESTÁTICOS ===
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Servir archivos del frontend (CSS, JS, imágenes)
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

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
// Ruta raíz: redirigir al index del frontend
app.get('/', (req, res) => {
  res.redirect('/frontend/pages/public/index.html');
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