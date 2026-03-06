const express = require('express');
const router = express.Router();
const turmasController = require('../controllers/turmas.controller');

// ============================================================================
// ENDPOINTS ESPECÍFICOS (devem vir ANTES das rotas com parâmetros)
// ============================================================================

// GET /api/turmas/stats/resumo - Estatísticas de turmas
router.get('/stats/resumo', turmasController.estatisticasTurmas);

// GET /api/turmas/resumo/todas - Turmas com resumo detalhado
router.get('/resumo/todas', turmasController.turmasComResumo);

// GET /api/turmas/abertas/disponiveis - Turmas abertas para matrícula
router.get('/abertas/disponiveis', turmasController.turmasAbertas);

// POST /api/turmas/sync/statuses - Recalcular status de todas as turmas
router.post('/sync/statuses', turmasController.syncStatuses);

// ============================================================================
// CRUD BÁSICO
// ============================================================================

// POST /api/turmas - Criar nova turma
router.post('/', turmasController.criarTurma);

// GET /api/turmas - Listar turmas com filtros
router.get('/', turmasController.listarTurmas);

// GET /api/turmas/:id - Obter turma por ID
router.get('/:id', turmasController.obterTurma);

// PUT /api/turmas/:id - Atualizar turma
router.put('/:id', turmasController.atualizarTurma);

// DELETE /api/turmas/:id - Deletar turma
router.delete('/:id', turmasController.deletarTurma);

module.exports = router;
