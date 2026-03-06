const { pool, query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { getBrazilDate } = require('../utils/dateBrazil');
const { recalcTurmaStatus } = require('../utils/turmaStatus');

// ============================================================================
// MATRICULAR ALUNO EM TURMA
// ============================================================================
exports.matricularAluno = async (req, res) => {
  try {
    const { aluno_id, turma_id, status, valor_venda } = req.body;

    if (!aluno_id || !turma_id) {
      return res.status(400).json({ error: 'aluno_id e turma_id sao obrigatorios' });
    }

    // Verificar capacidade da turma
    const turmaResult = await query(
      'SELECT capacidade FROM lovable.ci_turmas WHERE id = $1',
      [turma_id]
    );

    if (turmaResult.rows.length === 0) {
      return res.status(400).json({ error: 'Turma nao encontrada' });
    }

    const capacidade = turmaResult.rows[0].capacidade;

    // Contar alunos ja matriculados na turma
    const countResult = await query(
      'SELECT COUNT(*) as total FROM lovable.ci_aluno_turma WHERE turma_id = $1',
      [turma_id]
    );

    const alunosCont = parseInt(countResult.rows[0].total);

    if (alunosCont >= capacidade) {
      return res.status(409).json({
        error: `A turma esta cheia! (${alunosCont}/${capacidade} vagas)`,
        alunosCont,
        capacidade,
        full: true
      });
    }

    // Gerar ID sequencial para aluno_turma
    const idResult = await query(
      'SELECT COALESCE(MAX(CAST(id_indice AS INTEGER)), 0) + 1 as next_id FROM lovable.ci_aluno_turma'
    );
    const id_indice = String(idResult.rows[0].next_id);
    const dataAtual = getBrazilDate();

    const result = await query(
      `INSERT INTO lovable.ci_aluno_turma (
        id_indice, aluno_id, turma_id, data_associacao, status,
        data_atualizacao
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        id_indice, aluno_id, turma_id, dataAtual, status || 'inscrito',
        dataAtual
      ]
    );

    // Criar ci_financeiro_aluno (receita) automaticamente
    try {
      // Gerar ID sequencial para financeiro_aluno
      const finIdResult = await query(
        'SELECT COALESCE(MAX(CAST(id AS INTEGER)), 0) + 1 as next_id FROM lovable.ci_financeiro_aluno'
      );
      const finAlunoId = String(finIdResult.rows[0].next_id);
      // Buscar valor_venda do aluno
      const alunoResult = await query(
        'SELECT valor_venda FROM lovable.ci_alunos WHERE id = $1',
        [aluno_id]
      );
      const alunoValorVenda = alunoResult.rows.length > 0 ? alunoResult.rows[0].valor_venda : (valor_venda || null);

      await query(
        `INSERT INTO lovable.ci_financeiro_aluno (
          id, aluno_id, turma_id, valor_venda, data_matricula,
          data_criacao, data_atualizacao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (aluno_id, turma_id) DO NOTHING`,
        [
          finAlunoId, aluno_id, turma_id, alunoValorVenda || valor_venda || null, dataAtual,
          dataAtual, dataAtual
        ]
      );
      console.log('[Aluno-Turma] Financeiro-aluno (receita) criado:', finAlunoId);
    } catch (err) {
      console.error('[Aluno-Turma] Erro ao criar financeiro-aluno:', err.message);
    }

    // Recalcular status da turma com base na capacidade
    await recalcTurmaStatus(turma_id);

    console.log('[Aluno-Turma] Matricula criada:', id_indice);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Matricula Create] Erro:', error.message);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Aluno ja esta matriculado nesta turma' });
    }
    if (error.code === '23503') {
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

    const result = await query(
      'SELECT * FROM lovable.ci_aluno_turma WHERE id_indice = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matricula nao encontrada' });
    }

    res.json(result.rows[0]);
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

    let sql = 'SELECT * FROM lovable.ci_aluno_turma WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (aluno_id) {
      sql += ` AND aluno_id = $${paramIndex}`;
      params.push(aluno_id);
      paramIndex++;
    }
    if (turma_id) {
      sql += ` AND turma_id = $${paramIndex}`;
      params.push(turma_id);
      paramIndex++;
    }
    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ' ORDER BY data_associacao DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const countResult = await query('SELECT COUNT(*) as total FROM lovable.ci_aluno_turma');

    res.json({
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].total / limit)
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

    const result = await query(
      `UPDATE lovable.ci_aluno_turma SET
        status = COALESCE($1, status),
        data_atualizacao = $2
      WHERE id_indice = $3
      RETURNING *`,
      [status, dataAtual, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matricula nao encontrada' });
    }

    console.log('[Aluno-Turma] Matricula atualizada:', id);
    res.json(result.rows[0]);
  } catch (error) {
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

    const result = await query(
      'DELETE FROM lovable.ci_aluno_turma WHERE id_indice = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matricula nao encontrada' });
    }

    const turma_id = result.rows[0].turma_id;

    // Recalcular status da turma com base na capacidade
    await recalcTurmaStatus(turma_id);

    console.log('[Aluno-Turma] Matricula deletada:', id);
    res.json({ message: 'Matricula deletada com sucesso', deletedMatricula: result.rows[0] });
  } catch (error) {
    console.error('[Matricula Delete] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// TRANSFERIR ALUNO ENTRE TURMAS
// ============================================================================
exports.transferirAluno = async (req, res) => {
  const { prisma } = require('../config/prismaClient');
  const { getNextId } = require('../utils/sequentialId');

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

    // 5. Recalcular status de ambas turmas (fora da transacao)
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

    let sql = 'SELECT * FROM lovable.vw_alunos_turmas WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (aluno_id) {
      sql += ` AND aluno_id = $${paramIndex}`;
      params.push(aluno_id);
      paramIndex++;
    }
    if (turma_id) {
      sql += ` AND turma_id = $${paramIndex}`;
      params.push(turma_id);
      paramIndex++;
    }

    const result = await query(sql, params);
    res.json(result.rows);
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
    const result = await query(
      `SELECT
        COUNT(*) as total_matriculas,
        COUNT(DISTINCT aluno_id) as total_alunos_unicos,
        COUNT(DISTINCT turma_id) as total_turmas_com_alunos,
        SUM(CASE WHEN status = 'inscrito' THEN 1 ELSE 0 END) as inscritos,
        SUM(CASE WHEN status = 'desassociado' THEN 1 ELSE 0 END) as desassociados
       FROM lovable.ci_aluno_turma`
    );

    res.json(result.rows[0]);
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

    const result = await query(
      'SELECT * FROM lovable.ci_aluno_turma WHERE aluno_id = $1 AND turma_id = $2',
      [aluno_id, turma_id]
    );

    res.json({
      existe: result.rows.length > 0,
      dados: result.rows.length > 0 ? result.rows[0] : null
    });
  } catch (error) {
    console.error('[Verificar Matricula] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};
