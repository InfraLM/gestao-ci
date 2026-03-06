const { prisma } = require('../config/prismaClient');
const { v4: uuidv4 } = require('uuid');
const { getBrazilDate } = require('../utils/dateBrazil');

const ETAPAS = ['Boas-vindas', 'Envio do Livro', 'Grupo da Turma', 'Concluído', 'Feedback'];

// ============================================================================
// LISTAR ONBOARDING (com filtros: etapa, turma_id, nome)
// ============================================================================
exports.listarOnboarding = async (req, res) => {
  try {
    const { etapa, turma_id, nome } = req.query;

    const where = {};
    if (etapa) where.etapa = etapa;

    // Filtro por nome do aluno
    if (nome) {
      where.aluno = { nome: { contains: nome, mode: 'insensitive' } };
    }

    // Filtro por turma: alunos que estao associados a essa turma
    if (turma_id) {
      where.aluno = {
        ...where.aluno,
        aluno_turma: { some: { turma_id } }
      };
    }

    const data = await prisma.ci_onboarding.findMany({
      where,
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            aluno_turma: {
              include: { turma: { select: { id: true, tipo: true, data_evento: true } } }
            }
          }
        }
      },
      orderBy: { data_mudanca: 'desc' }
    });

    // Formatar resposta
    const result = data.map(item => ({
      id: item.id,
      aluno_id: item.aluno_id,
      etapa: item.etapa,
      data_mudanca: item.data_mudanca,
      nome: item.aluno.nome,
      email: item.aluno.email,
      telefone: item.aluno.telefone,
      turmas: item.aluno.aluno_turma.map(at => ({
        id: at.turma.id,
        tipo: at.turma.tipo,
        data_evento: at.turma.data_evento
      }))
    }));

    res.json({ data: result });
  } catch (error) {
    console.error('[Onboarding List] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// OBTER ONBOARDING POR ALUNO
// ============================================================================
exports.obterPorAluno = async (req, res) => {
  try {
    const { alunoId } = req.params;
    const record = await prisma.ci_onboarding.findFirst({
      where: { aluno_id: alunoId }
    });
    if (!record) return res.status(404).json({ error: 'Registro de onboarding nao encontrado' });
    res.json(record);
  } catch (error) {
    console.error('[Onboarding Get] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// ATUALIZAR ETAPA
// ============================================================================
exports.atualizarEtapa = async (req, res) => {
  try {
    const { id } = req.params;
    const { etapa } = req.body;

    if (!etapa || !ETAPAS.includes(etapa)) {
      return res.status(400).json({ error: `Etapa invalida. Opcoes: ${ETAPAS.join(', ')}` });
    }

    const now = getBrazilDate();
    const updated = await prisma.ci_onboarding.update({
      where: { id },
      data: { etapa, data_mudanca: new Date(now) }
    });

    console.log('[Onboarding] Etapa atualizada:', id, '->', etapa);
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Registro nao encontrado' });
    console.error('[Onboarding Update] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// AVANCAR ETAPA (proximo passo automatico)
// ============================================================================
exports.avancarEtapa = async (req, res) => {
  try {
    const { alunoId } = req.params;

    const record = await prisma.ci_onboarding.findFirst({
      where: { aluno_id: alunoId }
    });

    if (!record) return res.status(404).json({ error: 'Registro de onboarding nao encontrado' });

    const currentIndex = ETAPAS.indexOf(record.etapa);
    if (currentIndex === -1 || currentIndex >= ETAPAS.length - 1) {
      return res.json({ message: 'Aluno ja esta na ultima etapa', record });
    }

    const novaEtapa = ETAPAS[currentIndex + 1];
    const now = getBrazilDate();

    const updated = await prisma.ci_onboarding.update({
      where: { id: record.id },
      data: { etapa: novaEtapa, data_mudanca: new Date(now) }
    });

    console.log('[Onboarding] Etapa avancada:', alunoId, record.etapa, '->', novaEtapa);
    res.json(updated);
  } catch (error) {
    console.error('[Onboarding Avancar] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// CONTAGEM POR ETAPA
// ============================================================================
exports.contagemPorEtapa = async (req, res) => {
  try {
    const counts = await prisma.ci_onboarding.groupBy({
      by: ['etapa'],
      _count: { _all: true }
    });

    const result = {};
    ETAPAS.forEach(e => { result[e] = 0; });
    counts.forEach(c => { result[c.etapa] = c._count._all; });

    res.json(result);
  } catch (error) {
    console.error('[Onboarding Stats] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};
