import React, { useState, useEffect, useCallback } from 'react';
import ErrorMessage from '../ErrorMessage';
import Select from '../Select';
import Modal from '../Modal';
import { onboardingAPI, turmasAPI } from '../../services/api';
import { formatDateUTC } from '../../utils/dateUtils';

const ETAPAS = ['Boas-vindas', 'Grupo da Turma', 'Envio do Livro', 'Concluído', 'Feedback'];

const ETAPA_ICONS: Record<string, string> = {
  'Boas-vindas': '\u{1F44B}',
  'Grupo da Turma': '\u{1F465}',
  'Envio do Livro': '\u{1F4DA}',
  'Concluído': '\u2705',
  'Feedback': '\u{1F4AC}',
};

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

interface HistoricoEntry {
  id: string;
  aluno_id: string;
  etapa: string;
  data_mudanca: string;
}

interface Turma {
  id: string;
  tipo: string;
  data_evento_inicio?: string;
  data_evento_fim?: string;
}

// ============================================================================
// FLOW CARD
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
  onClickHistorico: (student: OnboardingRecord) => void;
}> = ({ student, onUpdate, onClickHistorico }) => {
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
    <div
      className={`bg-white p-4 rounded-lg shadow-md border-l-4 cursor-pointer hover:shadow-lg transition-shadow ${
        student.etapa === 'Concluído' ? 'border-green-500' : 'border-brand-teal'
      } ${updating ? 'opacity-50' : ''}`}
      onClick={() => onClickHistorico(student)}
    >
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

      <div className="mt-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
// MODAL DE HISTORICO
// ============================================================================
const HistoricoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  student: OnboardingRecord | null;
}> = ({ isOpen, onClose, student }) => {
  const [historico, setHistorico] = useState<HistoricoEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      setLoading(true);
      onboardingAPI.historico(student.aluno_id)
        .then((result: any) => {
          setHistorico(result.data || []);
        })
        .catch((err: any) => {
          console.error('Erro ao carregar historico:', err);
          setHistorico([]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, student]);

  if (!student) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Historico de Onboarding`}>
      <div className="mb-4">
        <p className="text-lg font-semibold text-gray-800">{student.nome}</p>
        {student.email && <p className="text-sm text-gray-500">{student.email}</p>}
        {student.turmas && student.turmas.length > 0 && (
          <div className="flex gap-1 mt-2">
            {student.turmas.map(t => (
              <span key={t.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {t.tipo}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-4">TIMELINE DE ETAPAS</h3>
        {loading ? (
          <p className="text-gray-500 text-center py-4">Carregando...</p>
        ) : historico.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhum registro encontrado.</p>
        ) : (
          <div className="relative pl-6">
            {/* Linha vertical */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />

            {historico.map((entry, index) => {
              const isLast = index === historico.length - 1;
              return (
                <div key={entry.id} className="relative mb-6 last:mb-0">
                  {/* Bolinha */}
                  <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    isLast ? 'bg-brand-teal text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {ETAPA_ICONS[entry.etapa] ? (
                      <span className="text-[10px]">{ETAPA_ICONS[entry.etapa]}</span>
                    ) : (
                      <span className="text-[10px]">{index + 1}</span>
                    )}
                  </div>

                  <div className={`pl-3 ${isLast ? '' : 'opacity-70'}`}>
                    <p className={`font-semibold ${isLast ? 'text-brand-teal' : 'text-gray-700'}`}>
                      {entry.etapa}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDateUTC(entry.data_mudanca)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
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
  const [selectedStudent, setSelectedStudent] = useState<OnboardingRecord | null>(null);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);

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
        const data = result.data || [];
        setTurmas(data.filter((t: any) => t.id !== 'Sem Turma'));
      } catch (err) {
        console.error('Erro ao carregar turmas:', err);
      }
    };
    loadTurmas();
  }, []);

  const handleFlowCardClick = (etapa: string) => {
    setFilterEtapa(prev => prev === etapa ? '' : etapa);
  };

  const handleClickHistorico = (student: OnboardingRecord) => {
    setSelectedStudent(student);
    setIsHistoricoOpen(true);
  };

  return (
    <div className="p-8">
      <HistoricoModal
        isOpen={isHistoricoOpen}
        onClose={() => { setIsHistoricoOpen(false); setSelectedStudent(null); }}
        student={selectedStudent}
      />

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
                onClickHistorico={handleClickHistorico}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
