const express = require('express');
const router = express.Router();
const alunosController = require('../controllers/alunos.controller');

// ============================================================================
// ENDPOINTS ESPECÍFICOS (devem vir ANTES das rotas com parâmetros)
// ============================================================================

// GET /api/alunos/stats/resumo - Estatísticas de alunos
router.get('/stats/resumo', alunosController.estatisticasAlunos);

// GET /api/alunos/relatorio - Relatório completo de alunos
router.get('/relatorio', alunosController.relatorioAlunos);

// GET /api/alunos/turma/:turmaId/alunos - Obter alunos por turma
router.get('/turma/:turmaId/alunos', alunosController.obterAlunosPorTurma);

// ============================================================================
// CRUD BÁSICO
// ============================================================================

// POST /api/alunos - Criar novo aluno
router.post('/', alunosController.criarAluno);

// GET /api/alunos - Listar alunos com filtros
router.get('/', alunosController.listarAlunos);

// GET /api/alunos/:id - Obter aluno por ID
router.get('/:id', alunosController.obterAluno);

// PUT /api/alunos/:id - Atualizar aluno
router.put('/:id', alunosController.atualizarAluno);

// DELETE /api/alunos/:id - Deletar aluno
router.delete('/:id', alunosController.deletarAluno);

// GET /api/alunos/:alunoId/turmas - Obter turmas do aluno
router.get('/:alunoId/turmas', alunosController.obterTurmasAluno);

module.exports = router;
