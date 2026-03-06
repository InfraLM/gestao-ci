const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT NOW() as db_time, version() as pg_version`;
    const row = result[0] || {};
    return {
      connected: true,
      serverTime: row.db_time || new Date().toISOString(),
      version: row.pg_version ? row.pg_version.split(',')[0] : null,
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
      code: err.code,
    };
  }
}

module.exports = {
  prisma,
  testConnection,
};
