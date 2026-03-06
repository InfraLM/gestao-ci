import React, { useState, useEffect } from 'react';
import PhoneInput from '../PhoneInput';
import CurrencyInput from '../CurrencyInput';
import DateInput from '../DateInput';
import Select from '../Select';
import { useAuth } from '../../context/AuthContext';
import { alunosAPI, turmasAPI } from '../../services/api';

interface Turma {
  id: string;
  tipo: string;
  data_evento?: string;
  capacidade: number;
  alunos_inscritos?: number;
  status?: string;
}

const RegisterStudent: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [turmas, setTurmas] = useState<Turma[]>([]);

  const emptyForm = {
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    data_nascimento: null as Date | null,
    valor_venda: 0,
    turma_id: '',
    vendedor: '',
  };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadTurmas();
  }, []);

  const loadTurmas = async () => {
    try {
      const response = await turmasAPI.listarAbertas();
      if (response && Array.isArray(response)) {
        setTurmas(response);
      }
    } catch (err) {
      console.error('Erro ao carregar turmas:', err);
    }
  };

  const formatDateForAPI = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTurmaLabel = (turma: Turma): string => {
    const dataFormatada = turma.data_evento
      ? new Date(turma.data_evento).toLocaleDateString('pt-BR')
      : 'Sem data';
    const vagas = turma.capacidade - (turma.alunos_inscritos || 0);
    return `${turma.tipo} | ${dataFormatada} (${vagas} vagas)`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validacoes
    if (!formData.nome.trim()) { setError('Nome e obrigatorio'); return; }
    if (!formData.cpf.trim()) { setError('CPF e obrigatorio'); return; }
    if (!formData.email.trim()) { setError('Email e obrigatorio'); return; }
    if (!formData.telefone.trim()) { setError('Telefone e obrigatorio'); return; }
    if (!formData.data_nascimento) { setError('Data de nascimento e obrigatoria'); return; }
    if (!formData.turma_id) { setError('Selecione uma turma'); return; }
    if (!formData.valor_venda || formData.valor_venda <= 0) { setError('Valor da venda e obrigatorio'); return; }
    if (!formData.vendedor) { setError('Selecione o vendedor'); return; }

    setLoading(true);
    try {
      const dataToSubmit = {
        nome: formData.nome.trim(),
        cpf: formData.cpf.trim(),
        email: formData.email.trim(),
        telefone: formData.telefone.trim(),
        data_nascimento: formatDateForAPI(formData.data_nascimento),
        status: 'Ativo',
        valor_venda: formData.valor_venda,
        turma_id: formData.turma_id,
        vendedor: formData.vendedor,
        pos_graduacao: false,
      };

      const response = await alunosAPI.criar(dataToSubmit);

      if (response.error) {
        setError(response.error);
        return;
      }

      setSuccess(`Aluno "${formData.nome}" cadastrado com sucesso!`);
      setFormData(emptyForm);
      loadTurmas(); // recarregar vagas
    } catch (err) {
      setError('Erro ao cadastrar aluno: ' + (err instanceof Error ? err.message : 'Tente novamente'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Registrar Novo Aluno</h1>
        <p className="text-gray-500 mt-1">Preencha todos os campos para cadastrar o aluno.</p>
      </header>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Nome do aluno"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
              placeholder="000.000.000-00"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-colors"
            />
          </div>

          <PhoneInput
            label="Telefone *"
            value={formData.telefone}
            onChange={(value) => setFormData(prev => ({ ...prev, telefone: value }))}
          />

          <DateInput
            label="Data de Nascimento *"
            value={formData.data_nascimento}
            onChange={(date) => setFormData(prev => ({ ...prev, data_nascimento: date }))}
            required
          />

          <CurrencyInput
            label="Valor da Venda *"
            value={formData.valor_venda}
            onChange={(value) => setFormData(prev => ({ ...prev, valor_venda: value }))}
            required
          />

          <div className="md:col-span-2">
            <Select
              label="Turma *"
              value={formData.turma_id}
              onChange={(v) => setFormData(prev => ({ ...prev, turma_id: v }))}
              options={turmas.map(t => ({
                value: t.id,
                label: formatTurmaLabel(t),
              }))}
              placeholder="Selecione a turma..."
            />
          </div>

          {/* Vendedor */}
          <div className="md:col-span-2">
            <Select
              label="Vendedor *"
              value={formData.vendedor}
              onChange={(v) => setFormData(prev => ({ ...prev, vendedor: v }))}
              options={[
                { value: 'ROBSON', label: 'ROBSON' },
                { value: 'WEBER PENA', label: 'WEBER PENA' },
                { value: 'TEOFILO', label: 'TEÓFILO' },
                { value: 'VICTORIA', label: 'VICTÓRIA' },
                { value: 'TALES', label: 'TALES' },
              ]}
              placeholder="Selecione o vendedor..."
            />
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-brand-teal text-white font-bold rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar Aluno'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterStudent;
