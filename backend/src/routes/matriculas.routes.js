const express = require('express');
const router = express.Router();
const alunoTurmaController = require('../controllers/aluno-turma.controller');

// ============================================================================
// CRUD BÁSICO
// ============================================================================

// POST /api/matriculas/transferir - Transferir aluno entre turmas
router.post('/transferir', alunoTurmaController.transferirAluno);

// POST /api/matriculas - Matricular aluno em turma
router.post('/', alunoTurmaController.matricularAluno);

// GET /api/matriculas - Listar matrículas com filtros
router.get('/', alunoTurmaController.listarMatriculas);

// GET /api/matriculas/:id - Obter matrícula por ID
router.get('/:id', alunoTurmaController.obterMatricula);

// PUT /api/matriculas/:id - Atualizar matrícula
router.put('/:id', alunoTurmaController.atualizarMatricula);

// DELETE /api/matriculas/:id - Deletar matrícula
router.delete('/:id', alunoTurmaController.deletarMatricula);

// ============================================================================
// ENDPOINTS ESPECÍFICOS
// ============================================================================

// GET /api/matriculas/verificar/:aluno_id/:turma_id - Verificar se aluno está matriculado
router.get('/verificar/:aluno_id/:turma_id', alunoTurmaController.verificarMatricula);

// GET /api/matriculas/view/alunos-turmas - View de alunos com turmas
router.get('/view/alunos-turmas', alunoTurmaController.obterAlunosTurmasView);

// GET /api/matriculas/stats/resumo - Estatísticas de matrículas
router.get('/stats/resumo', alunoTurmaController.estatisticasMatriculas);

module.exports = router;
