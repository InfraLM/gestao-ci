require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { prisma, testConnection } = require('./config/prismaClient');

const alunosRoutes = require('./routes/alunos.routes');
const turmasRoutes = require('./routes/turma.routes');
const matriculasRoutes = require('./routes/matriculas.routes');
const financeiroRoutes = require('./routes/financeiro.routes');
const financeiroAlunoRoutes = require('./routes/financeiro-aluno.routes');
const onboardingRoutes = require('./routes/onboarding.routes');
const formularioRoutes = require('./routes/formulario.routes');
const authRoutes = require('./routes/auth.routes');
const { authMiddleware } = require('./middleware/authMiddleware');

const app = express();

// ============================================================================
// CORS CONFIGURATION
// ============================================================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'https://ci.lmedu.com.br',
  'https://certificacoes.lmedu.com.br',
  'https://www.lmedu.com.br',
  'https://lmedu.com.br',
  ...(process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || [])
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, true); // permissivo em produção
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// ============================================================================
// LOGGING MIDDLEWARE
// ============================================================================
app.use((req, res, next) => {
  console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// NO-CACHE MIDDLEWARE
// ============================================================================
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
});

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get('/api/health', async (req, res) => {
  const dbInfo = await testConnection();
  const health = {
    status: dbInfo.connected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: !!dbInfo.connected,
      error: dbInfo.error || null,
    },
  };
  res.status(dbInfo.connected ? 200 : 503).json(health);
});

// DB test endpoint
app.get('/api/db-test', async (req, res) => {
  const tests = { timestamp: new Date().toISOString(), results: [] };
  try {
    const dbInfo = await testConnection();
    if (!dbInfo.connected) {
      tests.results.push({ test: 'Conexão básica', status: 'error', error: dbInfo.error });
      return res.status(500).json(tests);
    }
    tests.results.push({ test: 'Conexão básica', status: 'success' });

    const result = await prisma.$queryRaw`SELECT version() as pg_version, NOW() as current_time`;
    tests.results.push({ test: 'Query simples', status: 'success', data: result[0] });
  } catch (err) {
    tests.results.push({ test: 'Geral', status: 'error', error: err.message });
  }
  const allSuccess = tests.results.every(r => r.status === 'success');
  res.status(allSuccess ? 200 : 500).json(tests);
});

// ============================================================================
// ROTAS PUBLICAS (sem autenticacao)
// ============================================================================
app.use('/api/auth', authRoutes);

// ============================================================================
// ROTAS PROTEGIDAS (requerem JWT)
// ============================================================================
app.use('/api/alunos', authMiddleware, alunosRoutes);
app.use('/api/turmas', authMiddleware, turmasRoutes);
app.use('/api/matriculas', authMiddleware, matriculasRoutes);
app.use('/api/financeiro', authMiddleware, financeiroRoutes);
app.use('/api/financeiro-aluno', authMiddleware, financeiroAlunoRoutes);
app.use('/api/onboarding', authMiddleware, onboardingRoutes);
app.use('/api/formulario', authMiddleware, formularioRoutes);

// Root da API
app.get('/api', (req, res) => {
  res.json({
    message: 'API Dashboard de Gestão - Certificações LM Edu',
    version: '1.0.0',
    status: 'running',
  });
});

// ============================================================================
// ERROR HANDLERS
// ============================================================================
app.use((err, req, res, next) => {
  console.error('💥 [Error]:', err);
  const dbCodes = ['P1001', 'P1002', 'P1008', 'P1017'];
  if (err.code && dbCodes.includes(err.code)) {
    return res.status(503).json({
      error: 'Servico temporariamente indisponivel',
      code: 'DB_UNAVAILABLE',
    });
  }
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Rota ${req.method} ${req.path} não encontrada` });
});

module.exports = app;
