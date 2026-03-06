const express = require('express');
const router = express.Router();
const financeiroAlunoController = require('../controllers/financeiro-aluno.controller');

// ============================================================================
// ENDPOINTS ESPECIFICOS (devem vir ANTES das rotas com parametros)
// ============================================================================

// GET /api/financeiro-aluno/stats/resumo - Estatisticas
router.get('/stats/resumo', financeiroAlunoController.estatisticasFinanceiroAluno);

// GET /api/financeiro-aluno/aluno/:alunoId/historico - Historico financeiro do aluno
router.get('/aluno/:alunoId/historico', financeiroAlunoController.obterHistoricoAluno);

// GET /api/financeiro-aluno/aluno/:alunoId/resumo - Resumo financeiro do aluno
router.get('/aluno/:alunoId/resumo', financeiroAlunoController.resumoFinanceiroAluno);

// GET /api/financeiro-aluno/aluno/:alunoId/turma/:turmaId - Financeiro do aluno por turma
router.get('/aluno/:alunoId/turma/:turmaId', financeiroAlunoController.obterFinanceiroAlunoPorTurma);

// ============================================================================
// CRUD BASICO
// ============================================================================

// POST /api/financeiro-aluno - Criar novo registro de receita
router.post('/', financeiroAlunoController.criarFinanceiroAluno);

// GET /api/financeiro-aluno - Listar registros com filtros
router.get('/', financeiroAlunoController.listarFinanceiroAluno);

// GET /api/financeiro-aluno/:id - Obter registro por ID
router.get('/:id', financeiroAlunoController.obterFinanceiroAluno);

// PUT /api/financeiro-aluno/:id - Atualizar registro
router.put('/:id', financeiroAlunoController.atualizarFinanceiroAluno);

// DELETE /api/financeiro-aluno/:id - Deletar registro
router.delete('/:id', financeiroAlunoController.deletarFinanceiroAluno);

module.exports = router;
