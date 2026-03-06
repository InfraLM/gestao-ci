const { prisma } = require('../config/prismaClient');

async function getNextId(table, field) {
  const result = await prisma.$queryRawUnsafe(
    `SELECT COALESCE(MAX(CAST(${field} AS INTEGER)), 0) + 1 as next_id FROM lovable.${table}`
  );
  return String(result[0].next_id);
}

module.exports = { getNextId };
