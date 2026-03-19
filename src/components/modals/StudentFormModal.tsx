import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import PhoneInput from '../PhoneInput';
import CurrencyInput from '../CurrencyInput';
import DateInput from '../DateInput';
import Select from '../Select';
import { useAuth } from '../../context/AuthContext';
import { alunosAPI, matriculasAPI, turmasAPI, financeiroAlunoAPI } from '../../services/api';
import { Student } from '../../types';
import { formatDateUTC } from '../../utils/dateUtils';

interface StudentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    onSuccess?: () => void;
}

interface Turma {
    id: string;
    tipo: string;
    nome?: string;
    data_evento_inicio?: string;
    data_evento_fim?: string;
    capacidade: number;
    students?: number;
    alunos_inscritos?: number;
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({ isOpen, onClose, student, onSuccess }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [turmas, setTurmas] = useState<Turma[]>([]);
    const [selectedTurma, setSelectedTurma] = useState('');
    const [currentTurmaId, setCurrentTurmaId] = useState<string | null>(null);
    const [turmaError, setTurmaError] = useState('');
    const [formData, setFormData] = useState({
        nome: '',
        cpf: '',
        email: '',
        telefone: '',
        data_nascimento: null as Date | null,
        status: 'Ativo',
        endereco: '',
        observacoes: '',
        pos_graduacao: false,
        valor_venda: 0,
        vendedor: '',
        forma_pagamento: 'A VISTA',
        parcelas: 1,
    });

    useEffect(() => {
        if (isOpen) {
            loadTurmas();
        }
    }, [isOpen, student]);

    useEffect(() => {
        if (student) {
            setFormData({
                nome: student.nome || '',
                cpf: student.cpf || '',
                email: student.email || '',
                telefone: student.telefone || '',
                data_nascimento: student.data_nascimento ? new Date(student.data_nascimento) : null,
                status: student.status || 'Ativo',
                endereco: student.endereco || '',
                observacoes: student.observacoes || '',
                pos_graduacao: student.pos_graduacao || false,
                valor_venda: parseFloat(String(student.valor_venda)) || 0,
                vendedor: student.vendedor || user?.nome || '',
                forma_pagamento: (student as any).financeiro_aluno?.[0]?.forma_pagamento || 'A VISTA',
                parcelas: (student as any).financeiro_aluno?.[0]?.parcelas || 1,
            });

            // Buscar turma atual do aluno
            if (student.id) {
                matriculasAPI.listar({ aluno_id: student.id }).then((result: any) => {
                    const matriculas = result?.data || result || [];
                    const ativa = Array.isArray(matriculas)
                        ? matriculas.find((m: any) => m.status === 'inscrito')
                        : null;
                    if (ativa) {
                        setCurrentTurmaId(ativa.turma_id);
                        setSelectedTurma(ativa.turma_id);
                    } else {
                        setCurrentTurmaId(null);
                        setSelectedTurma('');
                    }
                }).catch(() => {
                    setCurrentTurmaId(null);
                    setSelectedTurma('');
                });
            }
        } else {
            setFormData({
                nome: '',
                cpf: '',
                email: '',
                telefone: '',
                data_nascimento: null,
                status: 'Ativo',
                endereco: '',
                observacoes: '',
                pos_graduacao: false,
                valor_venda: 0,
                vendedor: user?.nome || '',
                forma_pagamento: 'A VISTA',
                parcelas: 1,
            });
            setCurrentTurmaId(null);
            setSelectedTurma('');
        }
        setTurmaError('');
        setError('');
    }, [student, isOpen]);

    const loadTurmas = async () => {
        try {
            if (student?.id) {
                // Para edicao: carregar todas as turmas (inclusive lotadas) para mostrar a turma atual
                const response = await turmasAPI.listarComResumo();
                const data = response?.data || response || [];
                if (Array.isArray(data)) {
                    setTurmas(data.filter((t: any) => t.status !== 'CANCELADA' && t.status !== 'ACONTECEU'));
                }
            } else {
                // Para novo aluno: so turmas abertas
                const response = await turmasAPI.listarAbertas();
                if (response && Array.isArray(response)) {
                    setTurmas(response);
                }
            }
        } catch (err) {
            console.error('Erro ao carregar turmas:', err);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (date: Date | null) => {
        setFormData(prev => ({
            ...prev,
            data_nascimento: date
        }));
    };

    const formatDateForAPI = (date: Date | null): string | null => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatTurmaDisplay = (turma: Turma): string => {
        const dataInicio = formatDateUTC(turma.data_evento_inicio);
        const dataFim = turma.data_evento_fim ? formatDateUTC(turma.data_evento_fim) : null;
        return dataFim ? `${turma.tipo} | ${dataInicio} - ${dataFim}` : `${turma.tipo} | ${dataInicio}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!formData.nome) {
                setError('Nome e obrigatorio');
                setLoading(false);
                return;
            }

            if (!formData.cpf) {
                setError('CPF e obrigatorio');
                setLoading(false);
                return;
            }

            const dataToSubmit = {
                nome: formData.nome,
                cpf: formData.cpf || null,
                email: formData.email || null,
                telefone: formData.telefone?.replace(/\D/g, '') || null,
                data_nascimento: formatDateForAPI(formData.data_nascimento),
                status: formData.status,
                endereco: formData.endereco || null,
                observacoes: formData.observacoes || null,
                pos_graduacao: formData.pos_graduacao,
                valor_venda: formData.valor_venda,
                vendedor: formData.vendedor || null,
                turma_id: selectedTurma || null,
                forma_pagamento: formData.forma_pagamento,
                parcelas: formData.forma_pagamento === 'PARCELADO' ? formData.parcelas : 1,
            };

            let response;
            if (student?.id) {
                response = await alunosAPI.atualizar(student.id, dataToSubmit);
            } else {
                // Para novo aluno, o backend cria aluno_turma e financeiro_aluno automaticamente
                response = await alunosAPI.criar(dataToSubmit);
            }

            if (response.error) {
                setError(response.error);
                return;
            }

            // Para aluno existente, gerenciar turma
            if (student?.id && selectedTurma) {
                const alunoId = student.id;
                try {
                    if (currentTurmaId && currentTurmaId !== selectedTurma) {
                        // TRANSFERIR: mover de turma atual para nova turma
                        const transferResult = await matriculasAPI.transferir({
                            aluno_id: alunoId,
                            turma_origem_id: currentTurmaId,
                            turma_destino_id: selectedTurma,
                        });
                        if (transferResult.error) {
                            setTurmaError(transferResult.error);
                        }
                    } else if (!currentTurmaId) {
                        // NOVA MATRICULA: aluno nao tem turma, vincular
                        const verificar = await matriculasAPI.verificar(alunoId, selectedTurma);
                        if (!verificar || !verificar.existe) {
                            await matriculasAPI.criar({
                                aluno_id: alunoId,
                                turma_id: selectedTurma,
                                valor_venda: formData.valor_venda || null
                            });
                        }
                    }
                    // Se currentTurmaId === selectedTurma, nao faz nada
                } catch (err) {
                    console.error('Erro ao gerenciar turma:', err);
                    setTurmaError('Erro ao gerenciar turma: ' + (err instanceof Error ? err.message : 'Tente novamente'));
                }
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            setError('Erro ao salvar aluno: ' + (err instanceof Error ? err.message : 'Tente novamente'));
        } finally {
            setLoading(false);
        }
    };

    const title = student ? 'Editar Aluno' : 'Novo Aluno';
    const subTitle = student ? 'Edite os dados do aluno.' : 'Preencha os dados do novo aluno.';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <p className="text-sm text-gray-500 mb-6">{subTitle}</p>
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                        <input
                            type="text"
                            name="nome"
                            value={formData.nome}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">CPF</label>
                        <input
                            type="text"
                            name="cpf"
                            value={formData.cpf}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                    <PhoneInput
                        label="Telefone"
                        value={formData.telefone}
                        onChange={(value) => setFormData(prev => ({...prev, telefone: value}))}
                    />
                    <DateInput
                        label="Data de Nascimento"
                        value={formData.data_nascimento}
                        onChange={(date) => setFormData(prev => ({...prev, data_nascimento: date}))}
                    />
                    <Select
                        label="Status"
                        value={formData.status}
                        onChange={(v) => setFormData(prev => ({...prev, status: v}))}
                        options={[
                            { value: 'Ativo', label: 'Ativo' },
                            { value: 'Inativo', label: 'Inativo' },
                            { value: 'Cancelado', label: 'Cancelado' },
                        ]}
                    />
                    <CurrencyInput
                        label="Valor da Venda"
                        value={formData.valor_venda}
                        onChange={(value) => setFormData(prev => ({...prev, valor_venda: value}))}
                        required
                    />
                    <Select
                        label="Forma de Pagamento"
                        value={formData.forma_pagamento}
                        onChange={(v) => setFormData(prev => ({...prev, forma_pagamento: v, parcelas: v === 'PARCELADO' ? prev.parcelas : 1}))}
                        options={[
                            { value: 'A VISTA', label: 'A Vista' },
                            { value: 'PARCELADO', label: 'Parcelado' },
                        ]}
                    />
                    {formData.forma_pagamento === 'PARCELADO' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
                            <input
                                type="number"
                                min="2"
                                max="24"
                                value={formData.parcelas}
                                onChange={(e) => setFormData(prev => ({...prev, parcelas: parseInt(e.target.value) || 2}))}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"
                            />
                        </div>
                    )}
                    <div className="flex items-center pt-6">
                        <input
                            type="checkbox"
                            id="pos_graduacao"
                            checked={formData.pos_graduacao}
                            onChange={(e) => setFormData(prev => ({...prev, pos_graduacao: e.target.checked}))}
                            className="h-4 w-4 text-brand-teal focus:ring-brand-teal border-gray-300 rounded"
                        />
                        <label htmlFor="pos_graduacao" className="ml-2 block text-sm font-medium text-gray-700">
                            Aluno da Pos
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Vendedor</label>
                        <input
                            type="text"
                            name="vendedor"
                            value={formData.vendedor}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Endereco</label>
                        <input
                            type="text"
                            name="endereco"
                            value={formData.endereco}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                </div>

                {/* Turma Selection */}
                <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {student?.id ? (currentTurmaId ? 'Turma do Aluno' : 'Vincular a uma Turma') : 'Turma Inicial (Opcional)'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 mb-3">
                        {student?.id
                            ? (currentTurmaId ? 'Altere a turma para transferir o aluno' : 'Selecione uma turma para vincular o aluno')
                            : 'Selecione uma turma para vincular o aluno automaticamente ao salvar'
                        }
                    </p>
                    <select
                        value={selectedTurma}
                        onChange={(e) => {
                            setSelectedTurma(e.target.value);
                            setTurmaError('');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:ring-brand-teal focus:border-brand-teal"
                    >
                        <option value="">
                            {student?.id ? 'Nenhuma turma (nao vincular)' : 'Nenhuma turma (pode vincular depois)'}
                        </option>
                        {turmas.map(turma => (
                            <option key={turma.id} value={turma.id}>
                                {formatTurmaDisplay(turma)} ({(turma as any).alunos_inscritos || 0}/{turma.capacidade} vagas)
                            </option>
                        ))}
                    </select>
                    {turmaError && (
                        <div className={`mt-2 p-2 rounded-md text-sm ${turmaError.includes('sucesso') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                            {turmaError}
                        </div>
                    )}
                </div>

                <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800">Observacoes</h3>
                    <textarea
                        rows={4}
                        name="observacoes"
                        value={formData.observacoes}
                        onChange={handleInputChange}
                        className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    ></textarea>
                </div>

                <div className="flex justify-end space-x-3 mt-8">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-brand-teal text-white rounded-md hover:bg-teal-600 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default StudentFormModal;
