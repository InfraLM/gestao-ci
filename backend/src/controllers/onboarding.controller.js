const { prisma } = require('../config/prismaClient');
const { randomUUID } = require('crypto');
const { getBrazilDate } = require('../utils/dateBrazil');

const ETAPAS = ['Boas-vindas', 'Grupo da Turma', 'Envio do Livro', 'Concluído', 'Feedback'];

// ============================================================================
// LISTAR ONBOARDING — etapa atual de cada aluno (registro mais recente)
// ============================================================================
exports.listarOnboarding = async (req, res) => {
  try {
    const { etapa, turma_id, nome } = req.query;

    // Buscar todos os registros ordenados por data desc
    const allRecords = await prisma.ci_onboarding.findMany({
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            aluno_turma: {
              include: { turma: { select: { id: true, tipo: true, data_evento_inicio: true, data_evento_fim: true } } }
            }
          }
        }
      },
      orderBy: { data_mudanca: 'desc' }
    });

    // Agrupar por aluno_id, pegar apenas o mais recente de cada
    const latestByAluno = new Map();
    for (const record of allRecords) {
      if (!latestByAluno.has(record.aluno_id)) {
        latestByAluno.set(record.aluno_id, record);
      }
    }

    let result = Array.from(latestByAluno.values()).map(item => ({
      id: item.id,
      aluno_id: item.aluno_id,
      etapa: item.etapa,
      data_mudanca: item.data_mudanca,
      nome: item.aluno.nome,
      email: item.aluno.email,
      telefone: item.aluno.telefone,
      turmas: item.aluno.aluno_turma
        .filter(at => at.turma.id !== 'Sem Turma')
        .map(at => ({
          id: at.turma.id,
          tipo: at.turma.tipo,
          data_evento_inicio: at.turma.data_evento_inicio,
          data_evento_fim: at.turma.data_evento_fim
        }))
    }));

    // Aplicar filtros
    if (etapa) {
      result = result.filter(r => r.etapa === etapa);
    }
    if (nome) {
      const nomeLower = nome.toLowerCase();
      result = result.filter(r => r.nome.toLowerCase().includes(nomeLower));
    }
    if (turma_id) {
      result = result.filter(r => r.turmas.some(t => t.id === turma_id));
    }

    res.json({ data: result });
  } catch (error) {
    console.error('[Onboarding List] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// OBTER ONBOARDING POR ALUNO — etapa atual (registro mais recente)
// ============================================================================
exports.obterPorAluno = async (req, res) => {
  try {
    const { alunoId } = req.params;
    const record = await prisma.ci_onboarding.findFirst({
      where: { aluno_id: alunoId },
      orderBy: { data_mudanca: 'desc' }
    });
    if (!record) return res.status(404).json({ error: 'Registro de onboarding nao encontrado' });
    res.json(record);
  } catch (error) {
    console.error('[Onboarding Get] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// HISTORICO DE ONBOARDING POR ALUNO — todos os registros
// ============================================================================
exports.historicoAluno = async (req, res) => {
  try {
    const { alunoId } = req.params;
    const records = await prisma.ci_onboarding.findMany({
      where: { aluno_id: alunoId },
      orderBy: { data_mudanca: 'asc' }
    });
    res.json({ data: records });
  } catch (error) {
    console.error('[Onboarding Historico] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// ATUALIZAR ETAPA — cria novo registro (log), mantém antigo
// ============================================================================
exports.atualizarEtapa = async (req, res) => {
  try {
    const { id } = req.params;
    const { etapa } = req.body;

    if (!etapa || !ETAPAS.includes(etapa)) {
      return res.status(400).json({ error: `Etapa invalida. Opcoes: ${ETAPAS.join(', ')}` });
    }

    // Buscar registro atual para obter aluno_id
    const current = await prisma.ci_onboarding.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: 'Registro nao encontrado' });

    // Se a etapa e a mesma, nao criar novo registro
    if (current.etapa === etapa) {
      return res.json(current);
    }

    const now = getBrazilDate();
    const newId = randomUUID();

    const created = await prisma.ci_onboarding.create({
      data: {
        id: newId,
        aluno_id: current.aluno_id,
        etapa,
        data_mudanca: new Date(now),
      }
    });

    console.log('[Onboarding] Nova etapa registrada:', current.aluno_id, current.etapa, '->', etapa);
    res.json(created);
  } catch (error) {
    console.error('[Onboarding Update] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// AVANCAR ETAPA — cria novo registro com proxima etapa
// ============================================================================
exports.avancarEtapa = async (req, res) => {
  try {
    const { alunoId } = req.params;

    // Buscar registro mais recente do aluno
    const record = await prisma.ci_onboarding.findFirst({
      where: { aluno_id: alunoId },
      orderBy: { data_mudanca: 'desc' }
    });

    if (!record) return res.status(404).json({ error: 'Registro de onboarding nao encontrado' });

    const currentIndex = ETAPAS.indexOf(record.etapa);
    if (currentIndex === -1 || currentIndex >= ETAPAS.length - 1) {
      return res.json({ message: 'Aluno ja esta na ultima etapa', record });
    }

    const novaEtapa = ETAPAS[currentIndex + 1];
    const now = getBrazilDate();
    const newId = randomUUID();

    const created = await prisma.ci_onboarding.create({
      data: {
        id: newId,
        aluno_id: alunoId,
        etapa: novaEtapa,
        data_mudanca: new Date(now),
      }
    });

    console.log('[Onboarding] Etapa avancada:', alunoId, record.etapa, '->', novaEtapa);
    res.json(created);
  } catch (error) {
    console.error('[Onboarding Avancar] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// CONTAGEM POR ETAPA — conta apenas etapa atual de cada aluno
// ============================================================================
exports.contagemPorEtapa = async (req, res) => {
  try {
    // Usar DISTINCT ON para pegar apenas o registro mais recente por aluno
    const latestRecords = await prisma.$queryRaw`
      SELECT DISTINCT ON (aluno_id) etapa
      FROM lovable.ci_onboarding
      ORDER BY aluno_id, data_mudanca DESC
    `;

    const result = {};
    ETAPAS.forEach(e => { result[e] = 0; });
    latestRecords.forEach(r => {
      if (result[r.etapa] !== undefined) {
        result[r.etapa]++;
      }
    });

    res.json(result);
  } catch (error) {
    console.error('[Onboarding Stats] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};
