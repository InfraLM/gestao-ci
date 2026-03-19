const { prisma } = require('../config/prismaClient');

const SEM_TURMA_ID = 'Sem Turma';

/**
 * Garante que o registro sentinela "Sem Turma" existe em ci_turmas.
 * Usado como turma_id padrao quando aluno nao esta associado a nenhuma turma real.
 */
async function ensureSemTurma() {
  try {
    const existing = await prisma.ci_turmas.findUnique({ where: { id: SEM_TURMA_ID } });
    if (!existing) {
      await prisma.ci_turmas.create({
        data: {
          id: SEM_TURMA_ID,
          tipo: 'Sem Turma',
          status: 'EM ABERTO',
          capacidade: 999999,
        }
      });
      console.log('[Seed] Registro "Sem Turma" criado em ci_turmas');
    }
  } catch (err) {
    console.error('[Seed] Erro ao criar "Sem Turma":', err.message);
  }
}

module.exports = { ensureSemTurma, SEM_TURMA_ID };
