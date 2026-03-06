const { prisma } = require('../config/prismaClient');
const { v4: uuidv4 } = require('uuid');
const { formatDecimal } = require('../utils/formatters');
const { getBrazilDate } = require('../utils/dateBrazil');
const { getNextId } = require('../utils/sequentialId');
const { recalcTurmaStatus } = require('../utils/turmaStatus');

// ============================================================================
// CRIAR ALUNO
// ============================================================================
exports.criarAluno = async (req, res) => {
  try {
    const { nome, cpf, email, telefone, data_nascimento, endereco, status, observacoes, vendedor, pos_graduacao, valor_venda, turma_id } = req.body;

    if (!nome || !cpf) {
      return res.status(400).json({ error: 'Nome e CPF sao obrigatorios' });
    }

    let dataNascimentoFormatted = null;
    if (data_nascimento) {
      dataNascimentoFormatted = new Date(data_nascimento + 'T00:00:00.000Z');
    }

    const id = uuidv4();
    const now = getBrazilDate();

    const created = await prisma.ci_alunos.create({
      data: {
        id,
        nome,
        cpf,
        email: email || null,
        telefone: telefone || null,
        data_nascimento: dataNascimentoFormatted,
        endereco: endereco || null,
        status: status || 'Em Onboarding',
        observacoes: observacoes || null,
        vendedor: vendedor || null,
        pos_graduacao: pos_graduacao || false,
        valor_venda: valor_venda ? formatDecimal(valor_venda) : null,
        data_cadastro: new Date(now),
        data_atualizacao: new Date(now),
      }
    });

    console.log('[Alunos] Novo aluno criado:', id);

    // Criar registro de onboarding (etapa inicial: Boas-vindas)
    try {
      await prisma.ci_onboarding.create({
        data: {
          id: uuidv4(),
          aluno_id: id,
          etapa: 'Boas-vindas',
          data_mudanca: new Date(now),
        }
      });
      console.log('[Alunos] Onboarding criado para aluno:', id);
    } catch (err) {
      console.error('[Alunos] Erro ao criar onboarding:', err.message);
    }

    // Se tem turma, verificar capacidade e criar associacao + financeiro_aluno (receita)
    if (turma_id) {
      try {
        // Verificar capacidade da turma
        const turma = await prisma.ci_turmas.findUnique({ where: { id: turma_id } });
        const alunosCount = await prisma.ci_aluno_turma.count({ where: { turma_id } });

        if (!turma || alunosCount >= turma.capacidade) {
          console.log('[Alunos] Turma lotada ou nao encontrada, aluno criado sem vinculo');
          return res.status(201).json({ ...created, turma_warning: 'Turma lotada, aluno criado sem vinculo' });
        }

        // Criar ci_aluno_turma com ID sequencial
        const matriculaId = await getNextId('ci_aluno_turma', 'id_indice');
        await prisma.ci_aluno_turma.create({
          data: {
            id_indice: matriculaId,
            aluno_id: id,
            turma_id: turma_id,
            status: 'inscrito',
            data_associacao: new Date(now),
            data_atualizacao: new Date(now),
          }
        });
        console.log('[Alunos] Associacao aluno-turma criada:', matriculaId);

        // Criar ci_financeiro_aluno (receita) com ID sequencial
        const finAlunoId = await getNextId('ci_financeiro_aluno', 'id');
        await prisma.ci_financeiro_aluno.create({
          data: {
            id: finAlunoId,
            aluno_id: id,
            turma_id: turma_id,
            valor_venda: valor_venda ? formatDecimal(valor_venda) : null,
            data_matricula: new Date(now),
            data_criacao: new Date(now),
            data_atualizacao: new Date(now),
          }
        });
        console.log('[Alunos] Financeiro-aluno (receita) criado:', finAlunoId);

        // Recalcular status da turma com base na capacidade
        await recalcTurmaStatus(turma_id);
      } catch (err) {
        console.error('[Alunos] Erro ao criar matricula/financeiro:', err.message);
      }
    }

    res.status(201).json(created);
  } catch (error) {
    console.error('[Alunos Create] Erro:', error.message);
    if (error.code === '23505' || error.code === 'P2002') {
      return res.status(409).json({ error: 'CPF ja cadastrado no sistema' });
    }
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// LISTAR ALUNOS COM FILTROS
// ============================================================================
exports.listarAlunos = async (req, res) => {
  try {
    const { nome, email, cpf, status, vendedor, page = 1, limit = 10 } = req.query;

    const where = {};
    if (nome) where.nome = { contains: nome, mode: 'insensitive' };
    if (email) where.email = { contains: email, mode: 'insensitive' };
    if (cpf) where.cpf = cpf;
    if (status) where.status = status;
    if (vendedor) where.vendedor = vendedor;

    const take = parseInt(limit, 10) || 10;
    const skip = ((parseInt(page, 10) || 1) - 1) * take;

    const [data, total] = await Promise.all([
      prisma.ci_alunos.findMany({
        where,
        orderBy: { data_cadastro: 'desc' },
        skip,
        take,
        include: {
          aluno_turma: {
            include: { turma: { select: { id: true, tipo: true, data_evento: true } } },
            orderBy: { data_associacao: 'desc' },
            take: 1,
          },
          financeiro_aluno: {
            select: { valor_venda: true },
            take: 1,
          },
        },
      }),
      prisma.ci_alunos.count({ where }),
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
    console.error('[Alunos List] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// OBTER ALUNO POR ID
// ============================================================================
exports.obterAluno = async (req, res) => {
  try {
    const { id } = req.params;
    const aluno = await prisma.ci_alunos.findUnique({ where: { id } });
    if (!aluno) return res.status(404).json({ error: 'Aluno nao encontrado' });
    res.json(aluno);
  } catch (error) {
    console.error('[Alunos Get] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// ATUALIZAR ALUNO
// ============================================================================
exports.atualizarAluno = async (req, res) => {
  try {
    const { id } = req.params;
    const now = getBrazilDate();

    const { turma_id, ...bodyWithoutTurma } = req.body;
    const updateData = { ...bodyWithoutTurma, data_atualizacao: new Date(now) };
    if (updateData.data_nascimento && typeof updateData.data_nascimento === 'string') {
      updateData.data_nascimento = new Date(updateData.data_nascimento + 'T00:00:00.000Z');
    }
    if (updateData.valor_venda !== undefined) {
      updateData.valor_venda = updateData.valor_venda ? formatDecimal(updateData.valor_venda) : null;
    }

    try {
      const updated = await prisma.ci_alunos.update({ where: { id }, data: updateData });
      console.log('[Alunos] Aluno atualizado:', id);
      res.json(updated);
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'CPF ja cadastrado no sistema' });
      }
      console.error('[Alunos Update] Erro:', err.message);
      res.status(500).json({ error: err.message });
    }
  } catch (error) {
    console.error('[Alunos Update] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// DELETAR ALUNO
// ============================================================================
exports.deletarAluno = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const deleted = await prisma.ci_alunos.delete({ where: { id } });
      console.log('[Alunos] Aluno deletado:', id);
      res.json({ message: 'Aluno deletado com sucesso', deletedAluno: deleted });
    } catch (err) {
      console.error('[Alunos Delete] Erro:', err.message);
      res.status(500).json({ error: err.message });
    }
  } catch (error) {
    console.error('[Alunos Delete] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// OBTER ALUNOS POR TURMA
// ============================================================================
exports.obterAlunosPorTurma = async (req, res) => {
  try {
    const { turmaId } = req.params;
    const rows = await prisma.ci_aluno_turma.findMany({
      where: { turma_id: turmaId },
      include: { aluno: true },
      orderBy: { data_associacao: 'desc' }
    });

    const result = rows.map(r => ({
      ...r.aluno,
      data_associacao: r.data_associacao,
      status_matricula: r.status,
    }));
    res.json(result);
  } catch (error) {
    console.error('[Alunos por Turma] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// OBTER TURMAS DE UM ALUNO
// ============================================================================
exports.obterTurmasAluno = async (req, res) => {
  try {
    const { alunoId } = req.params;
    const rows = await prisma.ci_aluno_turma.findMany({
      where: { aluno_id: alunoId },
      include: { turma: true },
      orderBy: { data_associacao: 'desc' }
    });
    const result = rows.map(r => ({
      ...r.turma,
      data_associacao: r.data_associacao,
      status_matricula: r.status,
    }));
    res.json(result);
  } catch (error) {
    console.error('[Turmas do Aluno] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// ESTATISTICAS DE ALUNOS
// ============================================================================
exports.estatisticasAlunos = async (req, res) => {
  try {
    const [total, emOnboarding, ativos, inativos, formados, comPos] = await Promise.all([
      prisma.ci_alunos.count(),
      prisma.ci_alunos.count({ where: { status: 'Em Onboarding' } }),
      prisma.ci_alunos.count({ where: { status: 'Ativo' } }),
      prisma.ci_alunos.count({ where: { status: 'Inativo' } }),
      prisma.ci_alunos.count({ where: { status: 'Formado' } }),
      prisma.ci_alunos.count({ where: { pos_graduacao: true } }),
    ]);

    res.json({ total_alunos: total, em_onboarding: emOnboarding, ativos, inativos, formados, com_pos_graduacao: comPos });
  } catch (error) {
    console.error('[Alunos Stats] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// RELATORIO COMPLETO DE ALUNOS (para aba de relatorios)
// ============================================================================
exports.relatorioAlunos = async (req, res) => {
  try {
    // Buscar todos os alunos com turmas e financeiro
    const alunos = await prisma.ci_alunos.findMany({
      include: {
        aluno_turma: {
          include: { turma: { select: { id: true, tipo: true, data_evento: true } } }
        },
        financeiro_aluno: { select: { valor_venda: true, turma_id: true } }
      },
      orderBy: { data_cadastro: 'desc' }
    });

    // Vendedores: contagem e receita por vendedor
    const vendedorMap = {};
    alunos.forEach(a => {
      const v = a.vendedor || 'Sem vendedor';
      if (!vendedorMap[v]) vendedorMap[v] = { vendedor: v, alunos: 0, receita: 0 };
      vendedorMap[v].alunos++;
      a.financeiro_aluno.forEach(f => {
        vendedorMap[v].receita += f.valor_venda ? parseFloat(f.valor_venda.toString()) : 0;
      });
    });
    const porVendedor = Object.values(vendedorMap).sort((a, b) => b.receita - a.receita);

    // Ticket medio por turma
    const turmaTicket = {};
    alunos.forEach(a => {
      a.financeiro_aluno.forEach(f => {
        const tid = f.turma_id;
        if (!turmaTicket[tid]) turmaTicket[tid] = { total: 0, count: 0 };
        turmaTicket[tid].total += f.valor_venda ? parseFloat(f.valor_venda.toString()) : 0;
        turmaTicket[tid].count++;
      });
    });

    // Status distribution
    const statusMap = {};
    alunos.forEach(a => {
      const s = a.status || 'Indefinido';
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    const porStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    // Pos-graduacao distribution
    const comPos = alunos.filter(a => a.pos_graduacao === true).length;
    const semPos = alunos.length - comPos;

    // Cadastros por mes (ultimos 12 meses)
    const cadastrosPorMes = {};
    alunos.forEach(a => {
      if (a.data_cadastro) {
        const d = new Date(a.data_cadastro);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        cadastrosPorMes[key] = (cadastrosPorMes[key] || 0) + 1;
      }
    });
    const evolucaoCadastros = Object.entries(cadastrosPorMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, count]) => ({ mes, count }));

    res.json({
      total: alunos.length,
      por_vendedor: porVendedor,
      por_status: porStatus,
      pos_graduacao: { com: comPos, sem: semPos },
      evolucao_cadastros: evolucaoCadastros,
    });
  } catch (error) {
    console.error('[Alunos Relatorio] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};
