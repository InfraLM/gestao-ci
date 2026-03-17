import React, { useState, useEffect, useCallback } from 'react';
import ErrorMessage from '../ErrorMessage';
import Select from '../Select';
import { onboardingAPI, turmasAPI } from '../../services/api';
import { formatDateUTC } from '../../utils/dateUtils';

const ETAPAS = ['Boas-vindas', 'Grupo da Turma', 'Envio do Livro', 'Concluído', 'Feedback'];

interface OnboardingRecord {
  id: string;
  aluno_id: string;
  etapa: string;
  data_mudanca: string;
  nome: string;
  email?: string;
  telefone?: string;
  turmas?: { id: string; tipo: string; data_evento_inicio?: string; data_evento_fim?: string }[];
}

interface Turma {
  id: string;
  tipo: string;
  data_evento_inicio?: string;
  data_evento_fim?: string;
}

// ============================================================================
// FLOW CARD (contagem por etapa)
// ============================================================================
const FlowCard: React.FC<{ title: string; count: number; isActive: boolean; onClick: () => void }> = ({
  title, count, isActive, onClick
}) => (
  <button
    onClick={onClick}
    className={`flex-1 p-4 rounded-lg shadow text-center transition-colors ${
      isActive
        ? 'bg-brand-teal text-white'
        : 'bg-white text-gray-800 hover:bg-gray-50'
    }`}
  >
    <p className="text-2xl font-bold">{count}</p>
    <p className="text-sm mt-1">{title}</p>
  </button>
);

// ============================================================================
// STUDENT CARD
// ============================================================================
const StudentCard: React.FC<{
  student: OnboardingRecord;
  onUpdate: () => void;
}> = ({ student, onUpdate }) => {
  const [updating, setUpdating] = useState(false);

  const handleEtapaChange = async (novaEtapa: string) => {
    setUpdating(true);
    try {
      await onboardingAPI.atualizar(student.id, { etapa: novaEtapa });
      onUpdate();
    } catch (err) {
      console.error('Erro ao atualizar etapa:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleAvancar = async () => {
    setUpdating(true);
    try {
      await onboardingAPI.avancar(student.aluno_id);
      onUpdate();
    } catch (err) {
      console.error('Erro ao avancar etapa:', err);
    } finally {
      setUpdating(false);
    }
  };

  const currentIndex = ETAPAS.indexOf(student.etapa);
  const isLastStep = currentIndex >= ETAPAS.length - 1;

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${
      student.etapa === 'Concluído' ? 'border-green-500' : 'border-brand-teal'
    } ${updating ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-800">{student.nome}</p>
          {student.email && <p className="text-sm text-gray-500">{student.email}</p>}
        </div>
        {student.turmas && student.turmas.length > 0 && (
          <div className="flex gap-1 flex-wrap justify-end">
            {student.turmas.map(t => (
              <span key={t.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {t.tipo}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1">
          <Select
            value={student.etapa}
            onChange={handleEtapaChange}
            options={ETAPAS.map(etapa => ({ value: etapa, label: etapa }))}
            disabled={updating}
          />
        </div>
        <button
          onClick={handleAvancar}
          disabled={updating || isLastStep}
          className={`px-3 py-2 rounded-md text-white font-bold text-sm ${
            isLastStep
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-brand-teal hover:bg-teal-600'
          }`}
          title={isLastStep ? 'Ja esta na ultima etapa' : `Avancar para ${ETAPAS[currentIndex + 1]}`}
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// PAGINA PRINCIPAL
// ============================================================================
const Onboarding: React.FC = () => {
  const [students, setStudents] = useState<OnboardingRecord[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filterEtapa, setFilterEtapa] = useState('');
  const [filterTurma, setFilterTurma] = useState('');
  const [filterNome, setFilterNome] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (filterEtapa) filters.etapa = filterEtapa;
      if (filterTurma) filters.turma_id = filterTurma;
      if (filterNome) filters.nome = filterNome;

      const [result, contagemResult] = await Promise.all([
        onboardingAPI.listar(filters),
        onboardingAPI.contagem()
      ]);

      setStudents(result.data || []);
      setCounts(contagemResult || {});
    } catch (err) {
      console.error('Erro ao carregar onboarding:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [filterEtapa, filterTurma, filterNome]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadTurmas = async () => {
      try {
        const result = await turmasAPI.listar({ limit: '200' });
        setTurmas(result.data || []);
      } catch (err) {
        console.error('Erro ao carregar turmas:', err);
      }
    };
    loadTurmas();
  }, []);

  const handleFlowCardClick = (etapa: string) => {
    setFilterEtapa(prev => prev === etapa ? '' : etapa);
  };

  return (
    <div className="p-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Pipeline de Onboarding</h1>
        <p className="text-gray-500 mt-1">Acompanhe o processo de integracao dos novos alunos</p>
      </header>

      {/* Flow Cards */}
      <div className="mt-6 flex gap-3">
        {ETAPAS.map(etapa => (
          <FlowCard
            key={etapa}
            title={etapa}
            count={counts[etapa] || 0}
            isActive={filterEtapa === etapa}
            onClick={() => handleFlowCardClick(etapa)}
          />
        ))}
      </div>

      {/* Filtros */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por nome</label>
          <input
            type="text"
            value={filterNome}
            onChange={(e) => setFilterNome(e.target.value)}
            placeholder="Nome do aluno..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-teal focus:border-brand-teal"
          />
        </div>
        <div className="min-w-[180px]">
          <Select
            label="Turma"
            value={filterTurma}
            onChange={setFilterTurma}
            options={turmas.map(t => ({
              value: t.id,
              label: `${t.tipo}${t.data_evento_inicio ? ` | ${formatDateUTC(t.data_evento_inicio)}${t.data_evento_fim ? ` - ${formatDateUTC(t.data_evento_fim)}` : ''}` : ''}`
            }))}
            placeholder="Todas as turmas"
          />
        </div>
        <div className="min-w-[160px]">
          <Select
            label="Etapa"
            value={filterEtapa}
            onChange={setFilterEtapa}
            options={ETAPAS.map(e => ({ value: e, label: e }))}
            placeholder="Todas as etapas"
          />
        </div>
      </div>

      {/* Cards */}
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : error ? (
          <ErrorMessage error={error} onRetry={loadData} />
        ) : students.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum aluno encontrado{filterEtapa || filterTurma || filterNome ? ' com os filtros aplicados' : ' em onboarding'}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map(student => (
              <StudentCard
                key={student.id}
                student={student}
                onUpdate={loadData}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
