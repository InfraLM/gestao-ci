const express = require('express');
const router = express.Router();
const financeiroController = require('../controllers/financeiro.controller');

// ============================================================================
// ENDPOINTS ESPECÍFICOS (devem vir ANTES das rotas com parâmetros)
// ============================================================================

// GET /api/financeiro/stats/resumo - Estatísticas financeiras (total gastos)
router.get('/stats/resumo', financeiroController.estatisticasFinanceiro);

// GET /api/financeiro/resumo/turmas - Gastos agrupados por turma
router.get('/resumo/turmas', financeiroController.resumoPorTurma);

// GET /api/financeiro/resumo/completo - Resumo completo (receitas + despesas + saldo)
router.get('/resumo/completo', financeiroController.resumoCompleto);

// GET /api/financeiro/turma/:turmaId - Gastos de uma turma específica
router.get('/turma/:turmaId', financeiroController.obterFinanceiroPorTurma);

// ============================================================================
// CRUD BÁSICO
// ============================================================================

// POST /api/financeiro - Criar novo gasto
router.post('/', financeiroController.criarFinanceiro);

// GET /api/financeiro - Listar gastos (sempre tipo=SAIDA)
router.get('/', financeiroController.listarFinanceiro);

// GET /api/financeiro/:id - Obter gasto por ID
router.get('/:id', financeiroController.obterFinanceiro);

// PUT /api/financeiro/:id - Atualizar gasto
router.put('/:id', financeiroController.atualizarFinanceiro);

// DELETE /api/financeiro/:id - Deletar gasto
router.delete('/:id', financeiroController.deletarFinanceiro);

module.exports = router;
