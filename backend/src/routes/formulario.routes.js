const express = require('express');
const router = express.Router();
const formularioController = require('../controllers/formulario.controller');

router.get('/', formularioController.listar);
router.get('/resultados', formularioController.resultados);
router.get('/:id', formularioController.obter);

module.exports = router;
