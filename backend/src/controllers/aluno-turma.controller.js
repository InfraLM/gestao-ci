const { prisma } = require('../config/prismaClient');
const { getBrazilDate } = require('../utils/dateBrazil');
const { getNextId } = require('../utils/sequentialId');
const { recalcTurmaStatus } = require('../utils/turmaStatus');
const { formatDecimal } = require('../utils/formatters');

// ============================================================================
// MATRICULAR ALUNO EM TURMA
// ============================================================================
exports.matricularAluno = async (req, res) => {
  try {
    const { aluno_id, turma_id, status, valor_venda, forma_pagamento, parcelas } = req.body;

    if (!aluno_id || !turma_id) {
      return res.status(400).json({ error: 'aluno_id e turma_id sao obrigatorios' });
    }

    // Verificar capacidade da turma
    const turma = await prisma.ci_turmas.findUnique({ where: { id: turma_id } });
    if (!turma) {
      return res.status(400).json({ error: 'Turma nao encontrada' });
    }

    const alunosCont = await prisma.ci_aluno_turma.count({ where: { turma_id } });
    if (alunosCont >= turma.capacidade) {
      return res.status(409).json({
        error: `A turma esta cheia! (${alunosCont}/${turma.capacidade} vagas)`,
        alunosCont,
        capacidade: turma.capacidade,
        full: true
      });
    }

    // Gerar ID sequencial e criar associacao
    const id_indice = await getNextId('ci_aluno_turma', 'id_indice');
    const dataAtual = getBrazilDate();

    const created = await prisma.ci_aluno_turma.create({
      data: {
        id_indice,
        aluno_id,
        turma_id,
        status: status || 'inscrito',
        data_associacao: new Date(dataAtual),
        data_atualizacao: new Date(dataAtual),
      }
    });

    // Criar ci_financeiro_aluno (receita) automaticamente
    try {
      const finAlunoId = await getNextId('ci_financeiro_aluno', 'id');
      // Buscar valor_venda do aluno se nao foi informado
      let valorFinal = valor_venda;
      if (!valorFinal) {
        const aluno = await prisma.ci_alunos.findUnique({ where: { id: aluno_id }, select: { valor_venda: true } });
        valorFinal = aluno?.valor_venda;
      }

      await prisma.ci_financeiro_aluno.create({
        data: {
          id: finAlunoId,
          aluno_id,
          turma_id,
          valor_venda: valorFinal ? formatDecimal(valorFinal) : null,
          forma_pagamento: forma_pagamento || 'A VISTA',
          parcelas: forma_pagamento === 'PARCELADO' ? (parseInt(parcelas) || 1) : 1,
          data_matricula: new Date(dataAtual),
          data_criacao: new Date(dataAtual),
          data_atualizacao: new Date(dataAtual),
        }
      });
      console.log('[Aluno-Turma] Financeiro-aluno (receita) criado:', finAlunoId);
    } catch (err) {
      console.error('[Aluno-Turma] Erro ao criar financeiro-aluno:', err.message);
    }

    // Recalcular status da turma
    await recalcTurmaStatus(turma_id);

    console.log('[Aluno-Turma] Matricula criada:', id_indice);
    res.status(201).json(created);
  } catch (error) {
    console.error('[Matricula Create] Erro:', error.message);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Aluno ja esta matriculado nesta turma' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Aluno ou turma nao existe' });
    }
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// OBTER MATRICULA POR ID
// ============================================================================
exports.obterMatricula = async (req, res) => {
  try {
    const { id } = req.params;
    const matricula = await prisma.ci_aluno_turma.findUnique({ where: { id_indice: id } });
    if (!matricula) {
      return res.status(404).json({ error: 'Matricula nao encontrada' });
    }
    res.json(matricula);
  } catch (error) {
    console.error('[Matricula Get] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// LISTAR MATRICULAS COM FILTROS
// ============================================================================
exports.listarMatriculas = async (req, res) => {
  try {
    const { aluno_id, turma_id, status, page = 1, limit = 10 } = req.query;

    const where = {};
    if (aluno_id) where.aluno_id = aluno_id;
    if (turma_id) where.turma_id = turma_id;
    if (status) where.status = status;

    const take = parseInt(limit, 10) || 10;
    const skip = ((parseInt(page, 10) || 1) - 1) * take;

    const [data, total] = await Promise.all([
      prisma.ci_aluno_turma.findMany({
        where,
        orderBy: { data_associacao: 'desc' },
        skip,
        take,
      }),
      prisma.ci_aluno_turma.count({ where }),
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
    console.error('[Matriculas List] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// ATUALIZAR MATRICULA
// ============================================================================
exports.atualizarMatricula = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const dataAtual = getBrazilDate();

    const updated = await prisma.ci_aluno_turma.update({
      where: { id_indice: id },
      data: {
        status: status || undefined,
        data_atualizacao: new Date(dataAtual),
      }
    });

    console.log('[Aluno-Turma] Matricula atualizada:', id);
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Matricula nao encontrada' });
    }
    console.error('[Matricula Update] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// DELETAR MATRICULA
// ============================================================================
exports.deletarMatricula = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await prisma.ci_aluno_turma.delete({ where: { id_indice: id } });

    // Recalcular status da turma
    await recalcTurmaStatus(deleted.turma_id);

    console.log('[Aluno-Turma] Matricula deletada:', id);
    res.json({ message: 'Matricula deletada com sucesso', deletedMatricula: deleted });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Matricula nao encontrada' });
    }
    console.error('[Matricula Delete] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// TRANSFERIR ALUNO ENTRE TURMAS
// ============================================================================
exports.transferirAluno = async (req, res) => {
  try {
    const { aluno_id, turma_origem_id, turma_destino_id } = req.body;

    if (!aluno_id || !turma_origem_id || !turma_destino_id) {
      return res.status(400).json({ error: 'aluno_id, turma_origem_id e turma_destino_id sao obrigatorios' });
    }

    if (turma_origem_id === turma_destino_id) {
      return res.status(400).json({ error: 'Turma de origem e destino sao iguais' });
    }

    // Validar turma destino
    const turmaDestino = await prisma.ci_turmas.findUnique({ where: { id: turma_destino_id } });
    if (!turmaDestino) {
      return res.status(404).json({ error: 'Turma de destino nao encontrada' });
    }

    const alunosDestino = await prisma.ci_aluno_turma.count({ where: { turma_id: turma_destino_id } });
    if (alunosDestino >= turmaDestino.capacidade) {
      return res.status(409).json({ error: `Turma de destino esta cheia (${alunosDestino}/${turmaDestino.capacidade})` });
    }

    // Buscar valor_venda atual para preservar
    const finAlunoAtual = await prisma.ci_financeiro_aluno.findFirst({
      where: { aluno_id, turma_id: turma_origem_id }
    });
    const valorVenda = finAlunoAtual?.valor_venda || null;

    // Gerar IDs sequenciais antes da transacao
    const novoIdIndice = await getNextId('ci_aluno_turma', 'id_indice');
    const novoFinId = await getNextId('ci_financeiro_aluno', 'id');
    const dataAtual = getBrazilDate();

    await prisma.$transaction(async (tx) => {
      // 1. Remover matricula antiga
      await tx.ci_aluno_turma.deleteMany({
        where: { aluno_id, turma_id: turma_origem_id }
      });

      // 2. Remover financeiro-aluno antigo
      await tx.ci_financeiro_aluno.deleteMany({
        where: { aluno_id, turma_id: turma_origem_id }
      });

      // 3. Criar nova matricula
      await tx.ci_aluno_turma.create({
        data: {
          id_indice: novoIdIndice,
          aluno_id,
          turma_id: turma_destino_id,
          status: 'inscrito',
          data_associacao: new Date(dataAtual),
          data_atualizacao: new Date(dataAtual),
        }
      });

      // 4. Criar novo financeiro-aluno com mesmo valor_venda
      await tx.ci_financeiro_aluno.create({
        data: {
          id: novoFinId,
          aluno_id,
          turma_id: turma_destino_id,
          valor_venda: valorVenda,
          data_matricula: new Date(dataAtual),
          data_criacao: new Date(dataAtual),
          data_atualizacao: new Date(dataAtual),
        }
      });
    });

    // 5. Recalcular status de ambas turmas
    await recalcTurmaStatus(turma_origem_id);
    await recalcTurmaStatus(turma_destino_id);

    console.log(`[Transferencia] Aluno ${aluno_id}: ${turma_origem_id} -> ${turma_destino_id}`);
    res.json({
      message: 'Aluno transferido com sucesso',
      aluno_id,
      turma_origem_id,
      turma_destino_id,
    });
  } catch (error) {
    console.error('[Transferencia] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// OBTER VW_ALUNOS_TURMAS (view de alunos com turmas)
// ============================================================================
exports.obterAlunosTurmasView = async (req, res) => {
  try {
    const { aluno_id, turma_id } = req.query;

    const conditions = [];
    const params = [];
    if (aluno_id) { conditions.push(`aluno_id = $${params.length + 1}`); params.push(aluno_id); }
    if (turma_id) { conditions.push(`turma_id = $${params.length + 1}`); params.push(turma_id); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await prisma.$queryRawUnsafe(
      `SELECT * FROM lovable.vw_alunos_turmas ${whereClause}`,
      ...params
    );
    res.json(result);
  } catch (error) {
    console.error('[View Alunos Turmas] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// ESTATISTICAS DE MATRICULAS
// ============================================================================
exports.estatisticasMatriculas = async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total_matriculas,
        COUNT(DISTINCT aluno_id) as total_alunos_unicos,
        COUNT(DISTINCT turma_id) as total_turmas_com_alunos,
        SUM(CASE WHEN status = 'inscrito' THEN 1 ELSE 0 END) as inscritos,
        SUM(CASE WHEN status = 'desassociado' THEN 1 ELSE 0 END) as desassociados
      FROM lovable.ci_aluno_turma`;

    // Convert BigInt to Number for JSON serialization
    const row = result[0] || {};
    const serialized = {};
    for (const [key, value] of Object.entries(row)) {
      serialized[key] = typeof value === 'bigint' ? Number(value) : value;
    }

    res.json(serialized);
  } catch (error) {
    console.error('[Matriculas Stats] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// VERIFICAR SE ALUNO JA ESTA MATRICULADO
// ============================================================================
exports.verificarMatricula = async (req, res) => {
  try {
    const { aluno_id, turma_id } = req.params;

    const matricula = await prisma.ci_aluno_turma.findFirst({
      where: { aluno_id, turma_id }
    });

    res.json({
      existe: !!matricula,
      dados: matricula || null
    });
  } catch (error) {
    console.error('[Verificar Matricula] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};
