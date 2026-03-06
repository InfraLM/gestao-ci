const { prisma } = require('../config/prismaClient');
const { v4: uuidv4 } = require('uuid');
const { recalcAllTurmaStatuses } = require('../utils/turmaStatus');

// Helper: converte string YYYY-MM-DD para Date UTC
function toDateUTC(str) {
  if (!str) return null;
  return new Date(str + 'T00:00:00.000Z');
}

// ============================================================================
// CRIAR TURMA
// ============================================================================
exports.criarTurma = async (req, res) => {
  try {
    const { tipo, data_evento_inicio, data_evento_fim, descricao, horario, local_evento, capacidade, instrutor, status } = req.body;

    if (!tipo) return res.status(400).json({ error: 'Tipo e obrigatorio' });

    const id = uuidv4();

    const created = await prisma.ci_turmas.create({
      data: {
        id,
        tipo,
        data_evento_inicio: toDateUTC(data_evento_inicio),
        data_evento_fim: toDateUTC(data_evento_fim),
        descricao: descricao || null,
        horario: horario || null,
        local_evento: local_evento || null,
        capacidade: capacidade || null,
        instrutor: instrutor || null,
        status: status || 'EM ABERTO',
      }
    });

    console.log('[Turmas] Nova turma criada:', id);
    res.status(201).json(created);
  } catch (error) {
    console.error('[Turmas Create] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// LISTAR TURMAS COM FILTROS
// ============================================================================
exports.listarTurmas = async (req, res) => {
  try {
    const { tipo, status, instrutor, page = 1, limit = 10 } = req.query;

    const where = {};
    if (tipo) where.tipo = { contains: tipo, mode: 'insensitive' };
    if (status) where.status = status;
    if (instrutor) where.instrutor = { contains: instrutor, mode: 'insensitive' };

    const take = parseInt(limit, 10) || 10;
    const skip = ((parseInt(page, 10) || 1) - 1) * take;

    const [data, total] = await Promise.all([
      prisma.ci_turmas.findMany({ where, orderBy: { data_evento_inicio: 'desc' }, skip, take }),
      prisma.ci_turmas.count({ where }),
    ]);

    res.json({
      data,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        pages: Math.ceil(total / take),
      }
    });
  } catch (error) {
    console.error('[Turmas List] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// OBTER TURMA POR ID
// ============================================================================
exports.obterTurma = async (req, res) => {
  try {
    const { id } = req.params;
    const turma = await prisma.ci_turmas.findUnique({ where: { id } });
    if (!turma) return res.status(404).json({ error: 'Turma nao encontrada' });

    const alunosCount = await prisma.ci_aluno_turma.count({ where: { turma_id: id } });
    turma.alunos_inscritos = alunosCount;

    res.json(turma);
  } catch (error) {
    console.error('[Turmas Get] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// ATUALIZAR TURMA
// ============================================================================
exports.atualizarTurma = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.data_evento_inicio && typeof updateData.data_evento_inicio === 'string') {
      updateData.data_evento_inicio = toDateUTC(updateData.data_evento_inicio);
    }
    if (updateData.data_evento_fim && typeof updateData.data_evento_fim === 'string') {
      updateData.data_evento_fim = toDateUTC(updateData.data_evento_fim);
    }

    try {
      const updated = await prisma.ci_turmas.update({ where: { id }, data: updateData });
      console.log('[Turmas] Turma atualizada:', id);
      res.json(updated);
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Turma nao encontrada' });
      console.error('[Turmas Update] Erro:', err.message);
      res.status(500).json({ error: err.message });
    }
  } catch (error) {
    console.error('[Turmas Update] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// DELETAR TURMA
// ============================================================================
exports.deletarTurma = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const deleted = await prisma.ci_turmas.delete({ where: { id } });
      console.log('[Turmas] Turma deletada:', id);
      res.json({ message: 'Turma deletada com sucesso', deletedTurma: deleted });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Turma nao encontrada' });
      console.error('[Turmas Delete] Erro:', err.message);
      res.status(500).json({ error: err.message });
    }
  } catch (error) {
    console.error('[Turmas Delete] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// ESTATISTICAS DE TURMAS
// ============================================================================
exports.estatisticasTurmas = async (req, res) => {
  try {
    const [total, emAberto, canceladas, lotadas, aconteceu, capacidadeAgg, totalAlunos] = await Promise.all([
      prisma.ci_turmas.count(),
      prisma.ci_turmas.count({ where: { status: 'EM ABERTO' } }),
      prisma.ci_turmas.count({ where: { status: 'CANCELADA' } }),
      prisma.ci_turmas.count({ where: { status: 'LOTADA' } }),
      prisma.ci_turmas.count({ where: { status: 'ACONTECEU' } }),
      prisma.ci_turmas.aggregate({ _sum: { capacidade: true } }),
      prisma.ci_aluno_turma.count(),
    ]);

    res.json({
      total_turmas: total,
      em_aberto: emAberto,
      canceladas,
      lotadas,
      aconteceu,
      capacidade_total: capacidadeAgg._sum?.capacidade || 0,
      total_alunos_matriculados: totalAlunos,
    });
  } catch (error) {
    console.error('[Turmas Stats] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// TURMAS COM RESUMO (para dashboard)
// ============================================================================
exports.turmasComResumo = async (req, res) => {
  try {
    const rows = await prisma.ci_turmas.findMany({
      orderBy: { data_evento_inicio: 'desc' },
      include: { _count: { select: { aluno_turma: true } } }
    });

    const result = rows.map(r => {
      const alunos_inscritos = r._count?.aluno_turma || 0;
      const capacidade = r.capacidade || 1;
      const percentual_ocupacao = Number(((alunos_inscritos / capacidade) * 100).toFixed(2));
      const { _count, ...rest } = r;

      // Formatar datas para DD/MM/AAAA (UTC-safe)
      const fmtDate = (d) => {
        if (!d) return null;
        const dt = new Date(d);
        const dd = String(dt.getUTCDate()).padStart(2, '0');
        const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
        const yyyy = dt.getUTCFullYear();
        return `${dd}/${mm}/${yyyy}`;
      };
      const dateStart = fmtDate(rest.data_evento_inicio);
      const dateEnd = fmtDate(rest.data_evento_fim);
      const date = dateStart ? (dateEnd ? `${dateStart} - ${dateEnd}` : dateStart) : null;

      return {
        ...rest,
        alunos_inscritos,
        percentual_ocupacao,
        name: rest.tipo,
        instructor: rest.instrutor,
        students: alunos_inscritos,
        capacity: capacidade,
        progress: percentual_ocupacao,
        date,
        dateStart,
        dateEnd,
        time: rest.horario,
        location: rest.local_evento,
        description: rest.descricao,
        classStatus: rest.status
      };
    });

    res.json({ data: result });
  } catch (error) {
    console.error('[Turmas com Resumo] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// SYNC STATUSES
// ============================================================================
exports.syncStatuses = async (req, res) => {
  try {
    const results = await recalcAllTurmaStatuses();
    console.log(`[Turmas Sync] ${results.length} turmas recalculadas`);
    res.json({ message: 'Statuses recalculados', results });
  } catch (error) {
    console.error('[Turmas Sync] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// LISTAR TURMAS ABERTAS
// ============================================================================
exports.turmasAbertas = async (req, res) => {
  try {
    const rows = await prisma.ci_turmas.findMany({
      where: { status: 'EM ABERTO' },
      orderBy: { data_evento_inicio: 'asc' },
      include: { _count: { select: { aluno_turma: true } } }
    });

    const result = rows.map(r => {
      const alunos_inscritos = r._count?.aluno_turma || 0;
      const capacidade = r.capacidade || 1;
      const vagas_disponiveis = capacidade - alunos_inscritos;
      const { _count, ...rest } = r;
      return {
        ...rest,
        alunos_inscritos,
        vagas_disponiveis,
        pode_matricular: vagas_disponiveis > 0
      };
    });

    res.json(result);
  } catch (error) {
    console.error('[Turmas Abertas] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};
