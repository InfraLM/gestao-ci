const { prisma } = require('../config/prismaClient');

// ============================================================================
// LISTAR RESPOSTAS (com filtro de data)
// ============================================================================
exports.listar = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;

    const where = {};
    if (data_inicio || data_fim) {
      where.data_resposta = {};
      if (data_inicio) {
        where.data_resposta.gte = new Date(data_inicio + 'T00:00:00.000Z');
      }
      if (data_fim) {
        where.data_resposta.lte = new Date(data_fim + 'T00:00:00.000Z');
      }
    }

    const respostas = await prisma.ci_formulario.findMany({
      where,
      orderBy: { data_resposta: 'desc' },
    });

    res.json(respostas);
  } catch (err) {
    console.error('[Formulario] Erro ao listar:', err);
    res.status(500).json({ error: 'Erro ao listar respostas', details: err.message });
  }
};

// ============================================================================
// OBTER RESPOSTA POR ID
// ============================================================================
exports.obter = async (req, res) => {
  try {
    const { id } = req.params;
    const resposta = await prisma.ci_formulario.findUnique({ where: { id } });
    if (!resposta) {
      return res.status(404).json({ error: 'Resposta nao encontrada' });
    }
    res.json(resposta);
  } catch (err) {
    console.error('[Formulario] Erro ao obter:', err);
    res.status(500).json({ error: 'Erro ao obter resposta', details: err.message });
  }
};

// ============================================================================
// RESULTADOS / ANALYTICS (com filtro de data)
// ============================================================================
exports.resultados = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;

    const where = {};
    if (data_inicio || data_fim) {
      where.data_resposta = {};
      if (data_inicio) {
        where.data_resposta.gte = new Date(data_inicio + 'T00:00:00.000Z');
      }
      if (data_fim) {
        where.data_resposta.lte = new Date(data_fim + 'T00:00:00.000Z');
      }
    }

    const respostas = await prisma.ci_formulario.findMany({ where });
    const total = respostas.length;

    if (total === 0) {
      return res.json({
        total: 0,
        nps: { media: 0, promotores: 0, neutros: 0, detratores: 0, score: 0 },
        avaliacoes: {},
      });
    }

    // NPS calculation
    const npsValues = respostas.filter(r => r.nps != null).map(r => r.nps);
    const npsTotal = npsValues.length;
    const promotores = npsValues.filter(n => n >= 9).length;
    const neutros = npsValues.filter(n => n >= 7 && n <= 8).length;
    const detratores = npsValues.filter(n => n <= 6).length;
    const npsScore = npsTotal > 0
      ? Math.round(((promotores - detratores) / npsTotal) * 100)
      : 0;
    const npsMedia = npsTotal > 0
      ? Math.round((npsValues.reduce((a, b) => a + b, 0) / npsTotal) * 10) / 10
      : 0;

    // Avaliacoes distribution
    const campos = [
      'avaliacao_organizacao',
      'avaliacao_leia',
      'avaliacao_valter',
      'avaliacao_apoio',
      'avaliacao_geral',
    ];
    const opcoes = ['Excelente', 'Bom', 'Regular', 'Ruim', 'Muito Ruim'];

    const avaliacoes = {};
    for (const campo of campos) {
      const counts = {};
      for (const opcao of opcoes) {
        counts[opcao] = respostas.filter(r => r[campo] === opcao).length;
      }
      avaliacoes[campo] = counts;
    }

    // NPS distribution (1-10)
    const npsDistribuicao = {};
    for (let i = 1; i <= 10; i++) {
      npsDistribuicao[i] = npsValues.filter(n => n === i).length;
    }

    res.json({
      total,
      nps: {
        media: npsMedia,
        promotores,
        neutros,
        detratores,
        score: npsScore,
        distribuicao: npsDistribuicao,
      },
      avaliacoes,
    });
  } catch (err) {
    console.error('[Formulario] Erro ao calcular resultados:', err);
    res.status(500).json({ error: 'Erro ao calcular resultados', details: err.message });
  }
};
