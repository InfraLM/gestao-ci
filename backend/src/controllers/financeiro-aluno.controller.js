const { prisma } = require('../config/prismaClient');
const { v4: uuidv4 } = require('uuid');
const { formatDecimal, formatDecimalFields } = require('../utils/formatters');
const { getBrazilDate } = require('../utils/dateBrazil');
const { getNextId } = require('../utils/sequentialId');

// ============================================================================
// CRIAR FINANCEIRO-ALUNO (receita: valor pago pelo aluno para uma turma)
// ============================================================================
exports.criarFinanceiroAluno = async (req, res) => {
  try {
    const { aluno_id, turma_id, valor_venda, data_matricula } = req.body;

    if (!aluno_id || !turma_id) {
      return res.status(400).json({ error: 'aluno_id e turma_id sao obrigatorios' });
    }

    const id = await getNextId('ci_financeiro_aluno', 'id');
    const now = getBrazilDate();

    const created = await prisma.ci_financeiro_aluno.create({
      data: {
        id,
        aluno_id,
        turma_id,
        valor_venda: valor_venda ? formatDecimal(valor_venda) : null,
        data_matricula: data_matricula ? new Date(data_matricula) : null,
        data_criacao: new Date(now),
        data_atualizacao: new Date(now),
      }
    });

    console.log('[Financeiro-Aluno] Nova receita criada:', id);
    res.status(201).json(formatDecimalFields(created, ['valor_venda']));
  } catch (error) {
    console.error('[Financeiro-Aluno Create] Erro:', error.message);
    if (error.code === 'P2002' || error.code === '23505') {
      return res.status(409).json({ error: 'Ja existe registro financeiro para este aluno nesta turma' });
    }
    if (error.code === 'P2003' || error.code === '23503') {
      return res.status(400).json({ error: 'Aluno ou turma nao existe' });
    }
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// LISTAR FINANCEIRO-ALUNO COM FILTROS
// ============================================================================
exports.listarFinanceiroAluno = async (req, res) => {
  try {
    const { aluno_id, turma_id, page = 1, limit = 100 } = req.query;
    const where = {};
    if (aluno_id) where.aluno_id = aluno_id;
    if (turma_id) where.turma_id = turma_id;

    const take = parseInt(limit, 10) || 100;
    const skip = ((parseInt(page, 10) || 1) - 1) * take;

    const [data, total] = await Promise.all([
      prisma.ci_financeiro_aluno.findMany({
        where,
        include: {
          aluno: { select: { nome: true, cpf: true } },
          turma: { select: { tipo: true, data_evento_inicio: true, data_evento_fim: true } },
        },
        orderBy: { data_criacao: 'desc' },
        skip,
        take,
      }),
      prisma.ci_financeiro_aluno.count({ where }),
    ]);

    res.json({
      data: data.map(item => formatDecimalFields(item, ['valor_venda'])),
      pagination: { total, page: parseInt(page, 10), limit: take, pages: Math.ceil(total / take) }
    });
  } catch (error) {
    console.error('[Financeiro-Aluno List] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// OBTER FINANCEIRO-ALUNO POR ID
// ============================================================================
exports.obterFinanceiroAluno = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await prisma.ci_financeiro_aluno.findUnique({
      where: { id },
      include: {
        aluno: { select: { nome: true, cpf: true } },
        turma: { select: { tipo: true, data_evento_inicio: true, data_evento_fim: true } },
      },
    });
    if (!record) return res.status(404).json({ error: 'Registro nao encontrado' });
    res.json(formatDecimalFields(record, ['valor_venda']));
  } catch (error) {
    console.error('[Financeiro-Aluno Get] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// ATUALIZAR FINANCEIRO-ALUNO
// ============================================================================
exports.atualizarFinanceiroAluno = async (req, res) => {
  try {
    const { id } = req.params;
    const { valor_venda, data_matricula } = req.body;
    const now = getBrazilDate();

    const updateData = {
      valor_venda: valor_venda !== undefined ? formatDecimal(valor_venda) : undefined,
      data_matricula: data_matricula ? new Date(data_matricula) : undefined,
      data_atualizacao: new Date(now),
    };

    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

    try {
      const updated = await prisma.ci_financeiro_aluno.update({ where: { id }, data: updateData });
      console.log('[Financeiro-Aluno] Registro atualizado:', id);
      res.json(formatDecimalFields(updated, ['valor_venda']));
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Registro nao encontrado' });
      res.status(500).json({ error: err.message });
    }
  } catch (error) {
    console.error('[Financeiro-Aluno Update] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// DELETAR FINANCEIRO-ALUNO
// ============================================================================
exports.deletarFinanceiroAluno = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const deleted = await prisma.ci_financeiro_aluno.delete({ where: { id } });
      console.log('[Financeiro-Aluno] Registro deletado:', id);
      res.json({ message: 'Registro deletado com sucesso', deletedFinanceiroAluno: deleted });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Registro nao encontrado' });
      res.status(500).json({ error: err.message });
    }
  } catch (error) {
    console.error('[Financeiro-Aluno Delete] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// OBTER HISTORICO FINANCEIRO DO ALUNO
// ============================================================================
exports.obterHistoricoAluno = async (req, res) => {
  try {
    const { alunoId } = req.params;
    const rows = await prisma.ci_financeiro_aluno.findMany({
      where: { aluno_id: alunoId },
      include: {
        turma: { select: { tipo: true, data_evento_inicio: true, data_evento_fim: true } },
      },
      orderBy: { data_criacao: 'desc' }
    });

    res.json(rows.map(r => formatDecimalFields(r, ['valor_venda'])));
  } catch (error) {
    console.error('[Historico Aluno] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// OBTER FINANCEIRO DO ALUNO POR TURMA
// ============================================================================
exports.obterFinanceiroAlunoPorTurma = async (req, res) => {
  try {
    const { alunoId, turmaId } = req.params;
    const record = await prisma.ci_financeiro_aluno.findFirst({
      where: { aluno_id: alunoId, turma_id: turmaId },
      include: {
        turma: { select: { tipo: true, data_evento_inicio: true, data_evento_fim: true } },
      },
    });
    if (!record) return res.status(404).json({ error: 'Registro nao encontrado' });
    res.json(formatDecimalFields(record, ['valor_venda']));
  } catch (error) {
    console.error('[Financeiro Aluno por Turma] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// ESTATISTICAS FINANCEIRO-ALUNO (receitas)
// ============================================================================
exports.estatisticasFinanceiroAluno = async (req, res) => {
  try {
    const [total_registros, alunosUnicos, valorTotalAgg] = await Promise.all([
      prisma.ci_financeiro_aluno.count(),
      prisma.ci_financeiro_aluno.groupBy({ by: ['aluno_id'] }),
      prisma.ci_financeiro_aluno.aggregate({ _sum: { valor_venda: true } }),
    ]);

    const total_alunos_unicos = alunosUnicos.length;
    const valor_total = formatDecimal(valorTotalAgg._sum?.valor_venda || 0);

    res.json({ total_registros, total_alunos_unicos, valor_total });
  } catch (error) {
    console.error('[Financeiro-Aluno Stats] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// RESUMO FINANCEIRO DO ALUNO
// ============================================================================
exports.resumoFinanceiroAluno = async (req, res) => {
  try {
    const { alunoId } = req.params;
    const [total_registros, valorTotalAgg] = await Promise.all([
      prisma.ci_financeiro_aluno.count({ where: { aluno_id: alunoId } }),
      prisma.ci_financeiro_aluno.aggregate({ _sum: { valor_venda: true }, where: { aluno_id: alunoId } }),
    ]);

    const valor_total = formatDecimal(valorTotalAgg._sum?.valor_venda || 0);

    res.json({ total_registros, valor_total });
  } catch (error) {
    console.error('[Resumo Financeiro Aluno] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};
