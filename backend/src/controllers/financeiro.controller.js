const { prisma } = require('../config/prismaClient');
const { v4: uuidv4 } = require('uuid');
const { formatDecimal, formatDecimalFields } = require('../utils/formatters');
const { getBrazilDate } = require('../utils/dateBrazil');

// ============================================================================
// CRIAR REGISTRO FINANCEIRO (apenas gastos/despesas)
// ============================================================================
exports.criarFinanceiro = async (req, res) => {
  try {
    const { turma_id, categoria, descricao, valor_total, data_movimentacao, observacoes } = req.body;

    if (!turma_id || !categoria || !data_movimentacao) {
      return res.status(400).json({ error: 'turma_id, categoria e data_movimentacao sao obrigatorios' });
    }

    const id = uuidv4();
    const now = getBrazilDate();

    const created = await prisma.ci_financeiro.create({
      data: {
        id,
        turma_id,
        categoria,
        descricao: descricao || null,
        valor_total: valor_total ? formatDecimal(valor_total) : null,
        data_movimentacao: new Date(data_movimentacao),
        observacoes: observacoes || null,
        data_criacao: new Date(now),
        data_atualizacao: new Date(now),
      }
    });

    console.log('[Financeiro] Novo gasto criado:', id);
    res.status(201).json(formatDecimalFields(created, ['valor_total']));
  } catch (error) {
    console.error('[Financeiro Create] Erro:', error.message);
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Turma nao existe' });
    }
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// LISTAR REGISTROS (gastos)
// ============================================================================
exports.listarFinanceiro = async (req, res) => {
  try {
    const { turma_id, categoria, data_inicio, data_fim, page = 1, limit = 100 } = req.query;

    const where = {};
    if (turma_id) where.turma_id = turma_id;
    if (categoria) where.categoria = categoria;
    if (data_inicio || data_fim) {
      where.data_movimentacao = {};
      if (data_inicio) where.data_movimentacao.gte = new Date(data_inicio);
      if (data_fim) where.data_movimentacao.lte = new Date(data_fim);
    }

    const take = parseInt(limit, 10) || 100;
    const skip = ((parseInt(page, 10) || 1) - 1) * take;

    const [data, total] = await Promise.all([
      prisma.ci_financeiro.findMany({ where, orderBy: { data_movimentacao: 'desc' }, skip, take }),
      prisma.ci_financeiro.count({ where }),
    ]);

    res.json({
      data: data.map(item => formatDecimalFields(item, ['valor_total'])),
      pagination: { total, page: parseInt(page, 10), limit: take, pages: Math.ceil(total / take) }
    });
  } catch (error) {
    console.error('[Financeiro List] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// OBTER REGISTRO POR ID
// ============================================================================
exports.obterFinanceiro = async (req, res) => {
  try {
    const { id } = req.params;
    const registro = await prisma.ci_financeiro.findUnique({ where: { id } });
    if (!registro) return res.status(404).json({ error: 'Registro financeiro nao encontrado' });
    res.json(formatDecimalFields(registro, ['valor_total']));
  } catch (error) {
    console.error('[Financeiro Get] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// ATUALIZAR REGISTRO
// ============================================================================
exports.atualizarFinanceiro = async (req, res) => {
  try {
    const { id } = req.params;
    const { turma_id, categoria, descricao, valor_total, data_movimentacao, observacoes } = req.body;
    const now = getBrazilDate();

    const updateData = {
      turma_id,
      categoria,
      descricao,
      valor_total: valor_total !== undefined ? formatDecimal(valor_total) : undefined,
      data_movimentacao: data_movimentacao ? new Date(data_movimentacao) : undefined,
      observacoes,
      data_atualizacao: new Date(now),
    };

    // Remove undefined keys
    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

    try {
      const updated = await prisma.ci_financeiro.update({ where: { id }, data: updateData });
      console.log('[Financeiro] Registro atualizado:', id);
      res.json(formatDecimalFields(updated, ['valor_total']));
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Registro nao encontrado' });
      throw err;
    }
  } catch (error) {
    console.error('[Financeiro Update] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// DELETAR REGISTRO
// ============================================================================
exports.deletarFinanceiro = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const deleted = await prisma.ci_financeiro.delete({ where: { id } });
      console.log('[Financeiro] Registro deletado:', id);
      res.json({ message: 'Registro deletado com sucesso', deletedFinanceiro: deleted });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Registro nao encontrado' });
      throw err;
    }
  } catch (error) {
    console.error('[Financeiro Delete] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// OBTER GASTOS POR TURMA
// ============================================================================
exports.obterFinanceiroPorTurma = async (req, res) => {
  try {
    const { turmaId } = req.params;
    const records = await prisma.ci_financeiro.findMany({
      where: { turma_id: turmaId },
      orderBy: { data_movimentacao: 'desc' }
    });
    res.json(records.map(r => formatDecimalFields(r, ['valor_total'])));
  } catch (error) {
    console.error('[Financeiro por Turma] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// ESTATISTICAS FINANCEIRAS (apenas gastos)
// ============================================================================
exports.estatisticasFinanceiro = async (req, res) => {
  try {
    const [total_registros, somaGastos, turmasArr] = await Promise.all([
      prisma.ci_financeiro.count(),
      prisma.ci_financeiro.aggregate({ _sum: { valor_total: true } }),
      prisma.ci_financeiro.findMany({ distinct: ['turma_id'], select: { turma_id: true } }),
    ]);

    const total_gastos = formatDecimal(somaGastos._sum?.valor_total || 0);
    const turmas_com_gastos = turmasArr.length;

    res.json({
      total_registros,
      total_gastos,
      turmas_com_gastos,
      total_despesas: total_gastos,
      saldo_liquido: -total_gastos,
    });
  } catch (error) {
    console.error('[Financeiro Stats] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// RESUMO POR TURMA (agrega gastos por turma_id)
// ============================================================================
exports.resumoPorTurma = async (_req, res) => {
  try {
    const groups = await prisma.ci_financeiro.groupBy({
      by: ['turma_id'],
      _count: { _all: true },
      _sum: { valor_total: true },
      orderBy: { turma_id: 'asc' }
    });

    res.json(groups.map(g => ({
      turma_id: g.turma_id,
      quantidade_registros: g._count._all,
      total_gastos: formatDecimal(g._sum.valor_total || 0),
    })));
  } catch (error) {
    console.error('[Financeiro Resumo Turma] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// RESUMO COMPLETO (receitas + despesas + saldo, por turma e total)
// ============================================================================
exports.resumoCompleto = async (req, res) => {
  try {
    const { mes, tipo_data } = req.query;
    // tipo_data: 'movimentacao' (default) ou 'evento'

    let dateFilterDespesas = {};
    let dateFilterReceitas = {};
    let turmaDateFilter = {};

    if (mes) {
      const [year, month] = mes.split('-').map(Number);
      const start = new Date(`${year}-${String(month).padStart(2, '0')}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      if (tipo_data === 'evento') {
        // Filtrar por data_evento da turma
        turmaDateFilter = { data_evento: { gte: start, lt: end } };
      } else {
        // Filtrar por data da movimentacao/matricula
        dateFilterDespesas = { data_movimentacao: { gte: start, lt: end } };
        dateFilterReceitas = { data_matricula: { gte: start, lt: end } };
      }
    }

    let turmaIds = null;
    if (tipo_data === 'evento' && mes) {
      // Buscar turmas do periodo
      const turmasNoPeriodo = await prisma.ci_turmas.findMany({
        where: turmaDateFilter,
        select: { id: true }
      });
      turmaIds = turmasNoPeriodo.map(t => t.id);
      if (turmaIds.length > 0) {
        dateFilterDespesas = { turma_id: { in: turmaIds } };
        dateFilterReceitas = { turma_id: { in: turmaIds } };
      } else {
        // Nenhuma turma no periodo
        return res.json({
          total_receitas: 0,
          total_despesas: 0,
          saldo: 0,
          mes: mes || 'todos',
          tipo_data: tipo_data || 'movimentacao',
          por_turma: []
        });
      }
    }

    // Totais agregados
    const [receitasAgg, despesasAgg] = await Promise.all([
      prisma.ci_financeiro_aluno.aggregate({
        _sum: { valor_venda: true },
        where: dateFilterReceitas
      }),
      prisma.ci_financeiro.aggregate({
        _sum: { valor_total: true },
        where: dateFilterDespesas
      })
    ]);

    const total_receitas = formatDecimal(receitasAgg._sum?.valor_venda || 0);
    const total_despesas = formatDecimal(despesasAgg._sum?.valor_total || 0);
    const saldo = formatDecimal(total_receitas - total_despesas);

    // Por turma
    const [receitasPorTurma, despesasPorTurma] = await Promise.all([
      prisma.ci_financeiro_aluno.groupBy({
        by: ['turma_id'],
        _sum: { valor_venda: true },
        _count: { _all: true },
        where: dateFilterReceitas
      }),
      prisma.ci_financeiro.groupBy({
        by: ['turma_id'],
        _sum: { valor_total: true },
        _count: { _all: true },
        where: dateFilterDespesas
      })
    ]);

    // Merge por turma
    const turmaMap = new Map();
    receitasPorTurma.forEach(r => {
      turmaMap.set(r.turma_id, {
        turma_id: r.turma_id,
        receitas: formatDecimal(r._sum.valor_venda || 0),
        despesas: 0,
        qtd_alunos: r._count._all,
        qtd_gastos: 0,
      });
    });
    despesasPorTurma.forEach(d => {
      const existing = turmaMap.get(d.turma_id) || {
        turma_id: d.turma_id,
        receitas: 0,
        despesas: 0,
        qtd_alunos: 0,
        qtd_gastos: 0,
      };
      existing.despesas = formatDecimal(d._sum.valor_total || 0);
      existing.qtd_gastos = d._count._all;
      turmaMap.set(d.turma_id, existing);
    });

    // Buscar info das turmas
    const allTurmaIds = [...turmaMap.keys()];
    const turmasInfo = allTurmaIds.length > 0
      ? await prisma.ci_turmas.findMany({
          where: { id: { in: allTurmaIds } },
          select: { id: true, tipo: true, data_evento: true, status: true }
        })
      : [];

    const turmasInfoMap = new Map(turmasInfo.map(t => [t.id, t]));

    const por_turma = [...turmaMap.values()].map(item => {
      const info = turmasInfoMap.get(item.turma_id);
      return {
        ...item,
        saldo: formatDecimal(item.receitas - item.despesas),
        turma_tipo: info?.tipo || 'Desconhecida',
        data_evento: info?.data_evento || null,
        turma_status: info?.status || null,
      };
    }).sort((a, b) => b.saldo - a.saldo);

    res.json({
      total_receitas,
      total_despesas,
      saldo,
      mes: mes || 'todos',
      tipo_data: tipo_data || 'movimentacao',
      por_turma
    });
  } catch (error) {
    console.error('[Financeiro Resumo Completo] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};
