require('dotenv').config();
const path = require('path');
const { testConnection } = require('./config/prismaClient');

const app = require('./app');
const { ensureSemTurma } = require('./utils/seedSemTurma');

const PORT = process.env.PORT || 3001;

// Servir arquivos estáticos do build React (apenas local / VPS)
const express = require('express');
app.use('/', express.static(path.join(__dirname, '../../dist')));
app.get('/*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not Found' });
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

async function startServer() {
  try {
    console.log('\n🔍 [Server] Testando conexão com banco de dados...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.warn('\n⚠️  [Server] SERVIDOR INICIANDO SEM CONEXÃO COM BANCO!');
    } else {
      console.log('\n✅ [Server] Conexão com banco estabelecida!\n');
      await ensureSemTurma();
    }

    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🚀 Backend Server - ONLINE');
      console.log('='.repeat(60));
      console.log(`🌐 Local:      http://localhost:${PORT}`);
      console.log(`📡 API:        http://localhost:${PORT}/api`);
      console.log(`💾 DB Status:  ${dbConnected ? '✅ CONECTADO' : '❌ DESCONECTADO'}`);
      console.log('='.repeat(60) + '\n');
    });
  } catch (err) {
    console.error('❌ [Server] ERRO FATAL ao iniciar:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  const { prisma } = require('./config/prismaClient');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  const { prisma } = require('./config/prismaClient');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
