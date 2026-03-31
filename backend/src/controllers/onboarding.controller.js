const { prisma } = require('../config/prismaClient');
const { randomUUID } = require('crypto');

const ETAPAS = ['Boas-vindas', 'Grupo da Turma', 'Envio do Livro', 'Concluído', 'Feedback'];

function etapaIndex(etapa) {
  const idx = ETAPAS.indexOf(etapa);
  return idx === -1 ? 0 : idx;
}

/**
 * Dado uma lista de registros de onboarding (já ordenada por data_mudanca DESC),
 * retorna um Map com o registro mais recente de cada aluno.
 * Quando duas datas são iguais, desempata pela etapa mais avançada.
 */
function deduplicarPorAluno(records) {
  const map = new Map();
  for (const record of records) {
    const existing = map.get(record.aluno_id);
    if (!existing) {
      map.set(record.aluno_id, record);
    } else {
      const existingTime = new Date(existing.data_mudanca).getTime();
      const recordTime = new Date(record.data_mudanca).getTime();
      if (recordTime === existingTime && etapaIndex(record.etapa) > etapaIndex(existing.etapa)) {
        map.set(record.aluno_id, record);
      }
    }
  }
  return map;
}

// ============================================================================
// LISTAR ONBOARDING — etapa atual de cada aluno (registro mais recente)
// ============================================================================
exports.listarOnboarding = async (req, res) => {
  try {
    const { etapa, turma_id, nome } = req.query;

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

    const latestByAluno = deduplicarPorAluno(allRecords);

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
    const records = await prisma.ci_onboarding.findMany({
      where: { aluno_id: alunoId },
      orderBy: { data_mudanca: 'desc' }
    });
    if (records.length === 0) return res.status(404).json({ error: 'Registro de onboarding nao encontrado' });

    const map = deduplicarPorAluno(records);
    res.json(map.get(alunoId));
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

    const current = await prisma.ci_onboarding.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: 'Registro nao encontrado' });

    // Buscar a etapa ATUAL real do aluno (mais recente), não só o registro clicado
    const records = await prisma.ci_onboarding.findMany({
      where: { aluno_id: current.aluno_id },
      orderBy: { data_mudanca: 'desc' }
    });
    const map = deduplicarPorAluno(records);
    const latest = map.get(current.aluno_id);

    // Se a etapa atual já é a desejada, não criar duplicata
    if (latest && latest.etapa === etapa) {
      return res.json(latest);
    }

    const newId = randomUUID();
    const created = await prisma.ci_onboarding.create({
      data: {
        id: newId,
        aluno_id: current.aluno_id,
        etapa,
        data_mudanca: new Date(),
      }
    });

    console.log('[Onboarding] Nova etapa registrada:', current.aluno_id, (latest ? latest.etapa : '?'), '->', etapa);
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

    const records = await prisma.ci_onboarding.findMany({
      where: { aluno_id: alunoId },
      orderBy: { data_mudanca: 'desc' }
    });

    if (records.length === 0) return res.status(404).json({ error: 'Registro de onboarding nao encontrado' });

    const map = deduplicarPorAluno(records);
    const record = map.get(alunoId);

    const currentIndex = ETAPAS.indexOf(record.etapa);
    if (currentIndex === -1 || currentIndex >= ETAPAS.length - 1) {
      return res.json({ message: 'Aluno ja esta na ultima etapa', record });
    }

    const novaEtapa = ETAPAS[currentIndex + 1];
    const newId = randomUUID();

    const created = await prisma.ci_onboarding.create({
      data: {
        id: newId,
        aluno_id: alunoId,
        etapa: novaEtapa,
        data_mudanca: new Date(),
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
    const latestRecords = await prisma.$queryRaw`
      SELECT etapa FROM (
        SELECT *,
          ROW_NUMBER() OVER (
            PARTITION BY aluno_id
            ORDER BY data_mudanca DESC,
              CASE etapa
                WHEN 'Feedback'       THEN 5
                WHEN 'Concluído'      THEN 4
                WHEN 'Envio do Livro' THEN 3
                WHEN 'Grupo da Turma' THEN 2
                WHEN 'Boas-vindas'    THEN 1
                ELSE 0
              END DESC
          ) AS rn
        FROM lovable.ci_onboarding
      ) sub
      WHERE rn = 1
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
