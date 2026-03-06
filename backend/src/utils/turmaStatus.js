const { prisma } = require('../config/prismaClient');
const { getBrazilDate } = require('./dateBrazil');

async function recalcTurmaStatus(turma_id) {
  const turma = await prisma.ci_turmas.findUnique({ where: { id: turma_id } });
  if (!turma || !turma.capacidade) return null;

  // Estados terminais nao devem ser alterados automaticamente
  if (['CANCELADA', 'ACONTECEU'].includes(turma.status)) return turma.status;

  const count = await prisma.ci_aluno_turma.count({ where: { turma_id } });
  const newStatus = count >= turma.capacidade ? 'LOTADA' : 'EM ABERTO';

  if (turma.status !== newStatus) {
    const now = getBrazilDate();
    await prisma.ci_turmas.update({
      where: { id: turma_id },
      data: { status: newStatus, data_atualizacao: new Date(now) }
    });
  }

  return newStatus;
}

async function recalcAllTurmaStatuses() {
  const turmas = await prisma.ci_turmas.findMany({
    where: { status: { notIn: ['CANCELADA', 'ACONTECEU'] } }
  });

  const results = [];
  for (const turma of turmas) {
    const newStatus = await recalcTurmaStatus(turma.id);
    results.push({ turma_id: turma.id, tipo: turma.tipo, status: newStatus });
  }
  return results;
}

module.exports = { recalcTurmaStatus, recalcAllTurmaStatuses };
