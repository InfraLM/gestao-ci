import React, { useState, useEffect } from 'react';
import DateInput from '../DateInput';
import { formularioAPI } from '../../services/api';

type SubTab = 'respostas' | 'resultados';

interface Resposta {
  id: string;
  data_resposta: string | null;
  horario_resposta: string | null;
  nps: number | null;
  avaliacao_organizacao: string | null;
  avaliacao_leia: string | null;
  avaliacao_valter: string | null;
  avaliacao_apoio: string | null;
  avaliacao_geral: string | null;
  o_que_melhorar: string | null;
  o_que_mais_gostou: string | null;
  comentarios: string | null;
}

interface Resultados {
  total: number;
  nps: {
    media: number;
    promotores: number;
    neutros: number;
    detratores: number;
    score: number;
    distribuicao?: Record<string, number>;
  };
  avaliacoes: Record<string, Record<string, number>>;
}

const avaliacaoLabels: Record<string, string> = {
  avaliacao_organizacao: 'Organizacao',
  avaliacao_leia: 'Leia',
  avaliacao_valter: 'Valter',
  avaliacao_apoio: 'Apoio',
  avaliacao_geral: 'Geral',
};

const avaliacaoCores: Record<string, string> = {
  'Excelente': 'bg-emerald-500',
  'Bom': 'bg-blue-500',
  'Regular': 'bg-yellow-500',
  'Ruim': 'bg-orange-500',
  'Muito Ruim': 'bg-red-500',
};

const formatDateForAPI = (date: Date | null): string | null => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const FORM_URL = 'https://liberdademedicaedu.com.br/ci-feedback/';

const Formulario: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SubTab>('respostas');
  const [loading, setLoading] = useState(false);
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(FORM_URL);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = FORM_URL;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    }
  };

  // Respostas state
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [selectedResposta, setSelectedResposta] = useState<Resposta | null>(null);

  // Resultados state
  const [resultados, setResultados] = useState<Resultados | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const getFilters = () => {
    const filters: any = {};
    const inicio = formatDateForAPI(dataInicio);
    const fim = formatDateForAPI(dataFim);
    if (inicio) filters.data_inicio = inicio;
    if (fim) filters.data_fim = fim;
    return filters;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const filters = getFilters();
      if (activeTab === 'respostas') {
        const data = await formularioAPI.listar(filters);
        setRespostas(Array.isArray(data) ? data : []);
      } else {
        const data = await formularioAPI.resultados(filters);
        setResultados(data);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do formulario:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadData();
  };

  const getNpsColor = (nps: number | null): string => {
    if (nps == null) return 'text-gray-400';
    if (nps >= 9) return 'text-emerald-600';
    if (nps >= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getNpsBadge = (nps: number | null) => {
    if (nps == null) return null;
    if (nps >= 9) return { label: 'Promotor', bg: 'bg-emerald-100 text-emerald-700' };
    if (nps >= 7) return { label: 'Neutro', bg: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Detrator', bg: 'bg-red-100 text-red-700' };
  };

  const getAvaliacaoBadgeColor = (valor: string | null): string => {
    switch (valor) {
      case 'Excelente': return 'bg-emerald-100 text-emerald-700';
      case 'Bom': return 'bg-blue-100 text-blue-700';
      case 'Regular': return 'bg-yellow-100 text-yellow-700';
      case 'Ruim': return 'bg-orange-100 text-orange-700';
      case 'Muito Ruim': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="p-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Formulario</h1>
          <p className="text-gray-500 mt-1">Respostas e analises do formulario de avaliacao.</p>
        </div>
        <button
          onClick={copiarLink}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            linkCopiado
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm'
          }`}
        >
          {linkCopiado ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          )}
          {linkCopiado ? 'Link copiado!' : 'Copiar link do formulario'}
        </button>
      </header>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('respostas')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'respostas'
              ? 'bg-white text-brand-teal shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Respostas
        </button>
        <button
          onClick={() => setActiveTab('resultados')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'resultados'
              ? 'bg-white text-brand-teal shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Resultados
        </button>
      </div>

      {/* Date filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-wrap items-end gap-4">
        <DateInput
          label="Data Inicio"
          value={dataInicio}
          onChange={setDataInicio}
        />
        <DateInput
          label="Data Fim"
          value={dataFim}
          onChange={setDataFim}
        />
        <button
          onClick={handleFilter}
          className="px-5 py-2 bg-brand-teal text-white rounded-lg hover:bg-teal-600 text-sm font-medium transition-colors h-[38px]"
        >
          Filtrar
        </button>
        {(dataInicio || dataFim) && (
          <button
            onClick={() => {
              setDataInicio(null);
              setDataFim(null);
              setTimeout(loadData, 100);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors h-[38px]"
          >
            Limpar
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-teal" />
        </div>
      ) : activeTab === 'respostas' ? (
        <RespostasTab
          respostas={respostas}
          selectedResposta={selectedResposta}
          setSelectedResposta={setSelectedResposta}
          getNpsColor={getNpsColor}
          getNpsBadge={getNpsBadge}
          getAvaliacaoBadgeColor={getAvaliacaoBadgeColor}
        />
      ) : (
        <ResultadosTab resultados={resultados} />
      )}
    </div>
  );
};

// ============================================================================
// RESPOSTAS TAB
// ============================================================================
interface RespostasTabProps {
  respostas: Resposta[];
  selectedResposta: Resposta | null;
  setSelectedResposta: (r: Resposta | null) => void;
  getNpsColor: (nps: number | null) => string;
  getNpsBadge: (nps: number | null) => { label: string; bg: string } | null;
  getAvaliacaoBadgeColor: (valor: string | null) => string;
}

const RespostasTab: React.FC<RespostasTabProps> = ({
  respostas,
  selectedResposta,
  setSelectedResposta,
  getNpsColor,
  getNpsBadge,
  getAvaliacaoBadgeColor,
}) => {
  if (respostas.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
        Nenhuma resposta encontrada para o periodo selecionado.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List */}
      <div className="lg:col-span-1 bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-800">{respostas.length} respostas</h3>
        </div>
        <div className="divide-y max-h-[600px] overflow-y-auto">
          {respostas.map((r) => {
            const badge = getNpsBadge(r.nps);
            return (
              <button
                key={r.id}
                onClick={() => setSelectedResposta(r)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedResposta?.id === r.id ? 'bg-teal-50 border-l-4 border-brand-teal' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {r.data_resposta
                      ? new Date(r.data_resposta).toLocaleDateString('pt-BR')
                      : 'Sem data'}
                  </span>
                  {badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.bg}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-2xl font-bold ${getNpsColor(r.nps)}`}>
                    {r.nps ?? '-'}
                  </span>
                  <span className="text-xs text-gray-400">NPS</span>
                </div>
                {r.horario_resposta && (
                  <span className="text-xs text-gray-400">{r.horario_resposta}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail */}
      <div className="lg:col-span-2">
        {selectedResposta ? (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Detalhes da Resposta</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedResposta.data_resposta
                    ? new Date(selectedResposta.data_resposta).toLocaleDateString('pt-BR')
                    : 'Sem data'}
                  {selectedResposta.horario_resposta && ` as ${selectedResposta.horario_resposta}`}
                </p>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-bold ${getNpsColor(selectedResposta.nps)}`}>
                  {selectedResposta.nps ?? '-'}
                </div>
                <div className="text-xs text-gray-400 mt-1">NPS</div>
              </div>
            </div>

            {/* Avaliacoes grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {Object.entries(avaliacaoLabels).map(([key, label]) => (
                <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">{label}</div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getAvaliacaoBadgeColor((selectedResposta as any)[key])}`}>
                    {(selectedResposta as any)[key] || '-'}
                  </span>
                </div>
              ))}
            </div>

            {/* Text fields */}
            <div className="space-y-4">
              {selectedResposta.o_que_melhorar && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">O que melhorar?</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedResposta.o_que_melhorar}</p>
                </div>
              )}
              {selectedResposta.o_que_mais_gostou && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">O que mais gostou?</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedResposta.o_que_mais_gostou}</p>
                </div>
              )}
              {selectedResposta.comentarios && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Comentarios</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedResposta.comentarios}</p>
                </div>
              )}
              {!selectedResposta.o_que_melhorar && !selectedResposta.o_que_mais_gostou && !selectedResposta.comentarios && (
                <p className="text-sm text-gray-400 italic">Nenhum comentario textual nesta resposta.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Selecione uma resposta para ver os detalhes.
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// RESULTADOS TAB
// ============================================================================
interface ResultadosTabProps {
  resultados: Resultados | null;
}

const ResultadosTab: React.FC<ResultadosTabProps> = ({ resultados }) => {
  if (!resultados || resultados.total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
        Nenhuma resposta encontrada para calcular resultados.
      </div>
    );
  }

  const { nps, avaliacoes, total } = resultados;

  const npsScoreColor = nps.score >= 50
    ? 'text-emerald-600'
    : nps.score >= 0
      ? 'text-yellow-600'
      : 'text-red-600';

  const npsScoreBg = nps.score >= 50
    ? 'from-emerald-50 to-emerald-100 border-emerald-200'
    : nps.score >= 0
      ? 'from-yellow-50 to-yellow-100 border-yellow-200'
      : 'from-red-50 to-red-100 border-red-200';

  return (
    <div className="space-y-6">
      {/* NPS Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`bg-gradient-to-br ${npsScoreBg} border rounded-xl p-5`}>
          <div className="text-sm text-gray-600 mb-1">NPS Score</div>
          <div className={`text-4xl font-bold ${npsScoreColor}`}>{nps.score}</div>
          <div className="text-xs text-gray-500 mt-1">de -100 a 100</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="text-sm text-gray-500 mb-1">Media NPS</div>
          <div className="text-3xl font-bold text-gray-800">{nps.media}</div>
          <div className="text-xs text-gray-400 mt-1">{total} respostas</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Promotores</span>
            <span className="text-emerald-600 font-bold">{nps.promotores}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Neutros</span>
            <span className="text-yellow-600 font-bold">{nps.neutros}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Detratores</span>
            <span className="text-red-600 font-bold">{nps.detratores}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="text-sm text-gray-500 mb-3">Distribuicao</div>
          <div className="flex items-end gap-1 h-16">
            {nps.distribuicao && Object.entries(nps.distribuicao).map(([score, count]) => {
              const vals = Object.values(nps.distribuicao!) as number[];
              const maxCount = Math.max(...vals);
              const heightPct = maxCount > 0 ? ((count as number) / maxCount) * 100 : 0;
              const scoreNum = parseInt(score);
              const barColor = scoreNum >= 9
                ? 'bg-emerald-500'
                : scoreNum >= 7
                  ? 'bg-yellow-500'
                  : 'bg-red-500';
              return (
                <div key={score} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className={`w-full rounded-t ${barColor} transition-all`}
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                    title={`${score}: ${count}`}
                  />
                  <span className="text-[10px] text-gray-400">{score}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Avaliacoes breakdown */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Avaliacoes por Categoria</h3>
        <div className="space-y-5">
          {Object.entries(avaliacoes).map(([campo, counts]) => {
            const totalCampo = Object.values(counts).reduce((a, b) => a + b, 0);
            return (
              <div key={campo}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {avaliacaoLabels[campo] || campo}
                  </span>
                  <span className="text-xs text-gray-400">{totalCampo} respostas</span>
                </div>
                {/* Stacked bar */}
                <div className="flex h-7 rounded-lg overflow-hidden bg-gray-100">
                  {Object.entries(counts).map(([opcao, count]) => {
                    const pct = totalCampo > 0 ? (count / totalCampo) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={opcao}
                        className={`${avaliacaoCores[opcao] || 'bg-gray-400'} flex items-center justify-center transition-all`}
                        style={{ width: `${pct}%` }}
                        title={`${opcao}: ${count} (${Math.round(pct)}%)`}
                      >
                        {pct > 10 && (
                          <span className="text-[10px] text-white font-medium truncate px-1">
                            {Math.round(pct)}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {Object.entries(counts).map(([opcao, count]) => (
                    <div key={opcao} className="flex items-center gap-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${avaliacaoCores[opcao] || 'bg-gray-400'}`} />
                      <span className="text-xs text-gray-500">{opcao}: {count}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Formulario;
