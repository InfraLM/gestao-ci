import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import DateInput from '../DateInput';
import Select from '../Select';
import { useAuth } from '../../context/AuthContext';
import { turmasAPI, alunosAPI, financeiroAPI, financeiroAlunoAPI } from '../../services/api';
import { formatCurrency } from '../../hooks/useCurrencyInput';

function parseDateFromAPI(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('T')[0].split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

function formatDateForAPI(date: Date | null): string | null {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface ClassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onSuccess?: () => void;
}

type TabType = 'alunos' | 'dados' | 'financeiro';

const ClassDetailsModal: React.FC<ClassDetailsModalProps> = ({
  isOpen,
  onClose,
  classId,
  onSuccess
}) => {
  const { isVendedor } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(isVendedor ? 'dados' : 'alunos');
  const [turma, setTurma] = useState<any>(null);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [gastos, setGastos] = useState<any[]>([]);
  const [receitasTurma, setReceitasTurma] = useState<any[]>([]);
  const [finLoading, setFinLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo: '',
    instrutor: '',
    data_evento_inicio: null as Date | null,
    data_evento_fim: null as Date | null,
    horario: '',
    local_evento: '',
    capacidade: 0,
    descricao: '',
    status: 'EM ABERTO'
  });

  useEffect(() => {
    if (isOpen && classId) {
      setActiveTab(isVendedor ? 'dados' : 'alunos');
      loadClassData();
    }
  }, [isOpen, classId]);

  useEffect(() => {
    if (isOpen && classId && activeTab === 'financeiro' && gastos.length === 0 && receitasTurma.length === 0) {
      loadFinanceiroData();
    }
  }, [activeTab, isOpen, classId]);

  const loadClassData = async () => {
    setLoading(true);
    try {
      const [turmaData, alunosData] = await Promise.all([
        turmasAPI.obter(classId),
        alunosAPI.obterPorTurma(classId)
      ]);

      setTurma(turmaData);
      setAlunos(alunosData || []);

      setFormData({
        tipo: turmaData.tipo || '',
        instrutor: turmaData.instrutor || '',
        data_evento_inicio: parseDateFromAPI(turmaData.data_evento_inicio),
        data_evento_fim: parseDateFromAPI(turmaData.data_evento_fim),
        horario: turmaData.horario || '',
        local_evento: turmaData.local_evento || '',
        capacidade: turmaData.capacidade || 0,
        descricao: turmaData.descricao || '',
        status: turmaData.status || 'EM ABERTO'
      });
    } catch (error) {
      console.error('Erro ao carregar dados da turma:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFinanceiroData = async () => {
    setFinLoading(true);
    try {
      const [gastosData, receitasResp] = await Promise.all([
        financeiroAPI.obterPorTurma(classId),
        financeiroAlunoAPI.listar({ turma_id: classId }),
      ]);
      setGastos(Array.isArray(gastosData) ? gastosData : []);
      const recData = receitasResp?.data || receitasResp || [];
      setReceitasTurma(Array.isArray(recData) ? recData : []);
    } catch (error) {
      console.error('Erro ao carregar financeiro da turma:', error);
    } finally {
      setFinLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const dataToSubmit = {
        ...formData,
        data_evento_inicio: formatDateForAPI(formData.data_evento_inicio),
        data_evento_fim: formatDateForAPI(formData.data_evento_fim)
      };

      await turmasAPI.atualizar(classId, dataToSubmit);
      setEditing(false);
      onSuccess?.();
      await loadClassData();
    } catch (error) {
      console.error('Erro ao atualizar turma:', error);
    }
  };

  const handleDelete = async () => {
    const msg = alunos.length > 0
      ? `Esta turma tem ${alunos.length} aluno(s) matriculado(s). Ao excluir, os alunos serao desvinculados mas nao deletados. Deseja continuar?`
      : 'Tem certeza que deseja excluir esta turma?';
    if (!window.confirm(msg)) return;

    try {
      await turmasAPI.deletar(classId);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao excluir turma:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={turma?.tipo || 'Detalhes da Turma'}>
      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex space-x-4">
          {([
            !isVendedor && { key: 'alunos' as TabType, label: `Alunos (${alunos.length}/${turma?.capacidade || 0})` },
            { key: 'dados' as TabType, label: 'Dados da Turma' },
            !isVendedor && { key: 'financeiro' as TabType, label: 'Financeiro' },
          ].filter(Boolean) as { key: TabType; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-2 px-1 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-teal text-brand-teal'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando...</div>
      ) : activeTab === 'alunos' ? (
        <AlunosTab alunos={alunos} />
      ) : activeTab === 'dados' ? (
        <DadosTab
          editing={editing}
          formData={formData}
          setFormData={setFormData}
          onEdit={() => setEditing(true)}
          onCancel={() => {
            setEditing(false);
            loadClassData();
          }}
          onSave={handleSave}
          onDelete={handleDelete}
          isVendedor={isVendedor}
        />
      ) : (
        <FinanceiroTab
          gastos={gastos}
          receitas={receitasTurma}
          loading={finLoading}
        />
      )}
    </Modal>
  );
};

// ============================================================================
// SUB-COMPONENTE: ABA DE ALUNOS
// ============================================================================
const AlunosTab: React.FC<{ alunos: any[] }> = ({ alunos }) => (
  <div>
    {alunos.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        Nenhum aluno matriculado nesta turma
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b">
            <tr className="text-gray-500">
              <th className="p-3">Nome</th>
              <th className="p-3">Email</th>
              <th className="p-3">Telefone</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno) => (
              <tr key={aluno.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{aluno.nome}</td>
                <td className="p-3">{aluno.email || '-'}</td>
                <td className="p-3">{aluno.telefone || '-'}</td>
                <td className="p-3">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {aluno.status || 'Ativo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// ============================================================================
// SUB-COMPONENTE: ABA FINANCEIRO
// ============================================================================
const FinanceiroTab: React.FC<{
  gastos: any[];
  receitas: any[];
  loading: boolean;
}> = ({ gastos, receitas, loading }) => {
  if (loading) {
    return <div className="text-center py-8 text-gray-500">Carregando dados financeiros...</div>;
  }

  const totalReceitas = receitas.reduce((s, r) => s + (Number(r.valor_venda) || 0), 0);
  const totalDespesas = gastos.reduce((s, g) => s + (Number(g.valor_total) || 0), 0);
  const saldo = totalReceitas - totalDespesas;

  // Montar extrato unificado
  const extrato: { id: string; data: string; tipo: 'entrada' | 'saida'; descricao: string; valor: number }[] = [];

  receitas.forEach(r => {
    extrato.push({
      id: r.id,
      data: r.data_matricula || r.data_criacao || '',
      tipo: 'entrada',
      descricao: r.aluno?.nome || 'Matricula',
      valor: Number(r.valor_venda) || 0,
    });
  });

  gastos.forEach(g => {
    extrato.push({
      id: g.id,
      data: g.data_movimentacao || g.data_criacao || '',
      tipo: 'saida',
      descricao: g.descricao || g.categoria || 'Gasto',
      valor: Number(g.valor_total) || 0,
    });
  });

  extrato.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <div>
      {/* Mini-cards de resumo */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-xs text-green-600 font-medium">Receitas</p>
          <p className="text-lg font-bold text-green-700">{formatCurrency(totalReceitas)}</p>
          <p className="text-xs text-green-500">{receitas.length} {receitas.length === 1 ? 'entrada' : 'entradas'}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-xs text-red-600 font-medium">Despesas</p>
          <p className="text-lg font-bold text-red-700">{formatCurrency(totalDespesas)}</p>
          <p className="text-xs text-red-500">{gastos.length} {gastos.length === 1 ? 'saida' : 'saidas'}</p>
        </div>
        <div className={`${saldo >= 0 ? 'bg-teal-50 border-teal-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-3 text-center`}>
          <p className={`text-xs font-medium ${saldo >= 0 ? 'text-teal-600' : 'text-orange-600'}`}>Saldo</p>
          <p className={`text-lg font-bold ${saldo >= 0 ? 'text-teal-700' : 'text-orange-700'}`}>{formatCurrency(saldo)}</p>
          <p className={`text-xs ${saldo >= 0 ? 'text-teal-500' : 'text-orange-500'}`}>{saldo >= 0 ? 'positivo' : 'negativo'}</p>
        </div>
      </div>

      {/* Extrato */}
      {extrato.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">Nenhuma movimentacao registrada para esta turma.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b">
                <th className="p-2 text-left">DATA</th>
                <th className="p-2 text-left">DESCRICAO</th>
                <th className="p-2 text-right">VALOR</th>
              </tr>
            </thead>
            <tbody>
              {extrato.map(item => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-2 text-gray-500">{item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="p-2">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${item.tipo === 'entrada' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {item.descricao}
                  </td>
                  <td className={`p-2 text-right font-semibold ${item.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.tipo === 'entrada' ? '+ ' : '- '}{formatCurrency(item.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTE: ABA DE DADOS
// ============================================================================
const DadosTab: React.FC<any> = ({
  editing,
  formData,
  setFormData,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  isVendedor
}) => {
  const tipoOptions = [
    { value: 'BLS', label: 'BLS' },
    { value: 'ATLS', label: 'ATLS' },
    { value: 'ACLS', label: 'ACLS' },
    { value: 'OUTRO', label: 'OUTRO' },
  ];

  const statusOptions = [
    { value: 'EM ABERTO', label: 'EM ABERTO' },
    { value: 'CANCELADA', label: 'CANCELADA' },
    { value: 'LOTADA', label: 'LOTADA' },
    { value: 'ACONTECEU', label: 'ACONTECEU' },
  ];

  if (!editing) {
    return (
      <div className="space-y-4">
        <DataField label="Tipo" value={formData.tipo} />
        <DataField label="Instrutor" value={formData.instrutor} />
        <DataField
          label="Data Inicio"
          value={formData.data_evento_inicio?.toLocaleDateString('pt-BR')}
        />
        <DataField
          label="Data Fim"
          value={formData.data_evento_fim?.toLocaleDateString('pt-BR')}
        />
        <DataField label="Horario" value={formData.horario} />
        <DataField label="Local" value={formData.local_evento} />
        <DataField label="Capacidade" value={formData.capacidade} />
        <DataField label="Status" value={formData.status} />
        <DataField label="Descricao" value={formData.descricao} />

        {!isVendedor && (
          <div className="flex justify-between mt-6">
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Excluir Turma
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-brand-teal text-white rounded-md hover:bg-teal-600"
            >
              Editar
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Select
        label="Tipo"
        value={formData.tipo}
        onChange={(v) => setFormData({ ...formData, tipo: v })}
        options={tipoOptions}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instrutor</label>
        <input
          type="text"
          value={formData.instrutor}
          onChange={(e) => setFormData({ ...formData, instrutor: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-colors"
        />
      </div>

      <DateInput
        label="Data Inicio"
        value={formData.data_evento_inicio}
        onChange={(date) => setFormData({ ...formData, data_evento_inicio: date })}
      />

      <DateInput
        label="Data Fim"
        value={formData.data_evento_fim}
        onChange={(date) => setFormData({ ...formData, data_evento_fim: date })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
        <input
          type="text"
          value={formData.horario}
          onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
        <input
          type="text"
          value={formData.local_evento}
          onChange={(e) => setFormData({ ...formData, local_evento: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade</label>
        <input
          type="number"
          value={formData.capacidade}
          onChange={(e) => setFormData({ ...formData, capacidade: parseInt(e.target.value) || 0 })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-colors"
        />
      </div>

      <Select
        label="Status"
        value={formData.status}
        onChange={(v) => setFormData({ ...formData, status: v })}
        options={statusOptions}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
        <textarea
          rows={3}
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-colors"
        />
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-brand-teal text-white rounded-md hover:bg-teal-600"
        >
          Salvar
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE AUXILIAR: CAMPO DE DADOS
// ============================================================================
const DataField: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b">
    <span className="text-sm font-medium text-gray-700">{label}:</span>
    <span className="text-sm text-gray-900">{value || '-'}</span>
  </div>
);

export default ClassDetailsModal;
