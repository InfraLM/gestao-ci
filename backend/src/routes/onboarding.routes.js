const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboarding.controller');

// Endpoints especificos ANTES dos parametrizados
router.get('/stats/contagem', onboardingController.contagemPorEtapa);
router.get('/aluno/:alunoId', onboardingController.obterPorAluno);
router.get('/aluno/:alunoId/historico', onboardingController.historicoAluno);
router.put('/avancar/:alunoId', onboardingController.avancarEtapa);

// CRUD
router.get('/', onboardingController.listarOnboarding);
router.put('/:id', onboardingController.atualizarEtapa);

module.exports = router;
