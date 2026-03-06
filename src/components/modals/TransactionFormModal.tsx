import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import CurrencyInput from '../CurrencyInput';
import DateInput from '../DateInput';
import Select from '../Select';
import { financeiroAPI, turmasAPI } from '../../services/api';
import { formatDateUTC } from '../../utils/dateUtils';

interface Turma {
    id: string;
    tipo: string;
    data_evento_inicio?: string | null;
    data_evento_fim?: string | null;
    status?: string;
}

interface TransactionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CATEGORIAS = [
    'Aluguel de Espaco',
    'Material Didatico',
    'Alimentacao',
    'Equipamento',
    'Transporte',
    'Honorarios',
    'Marketing',
    'Tecnologia',
    'Outros',
];

const inputClass = 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal';

const TransactionFormModal: React.FC<TransactionFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [turmas, setTurmas] = useState<Turma[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        categoria: '',
        descricao: '',
        data_movimentacao: null as Date | null,
        turma_id: '',
        observacoes: '',
    });
    const [valorTotal, setValorTotal] = useState<number>(0);

    useEffect(() => {
        if (!isOpen) return;
        const load = async () => {
            try {
                const result = await turmasAPI.listar({ limit: '200' });
                setTurmas(result.data || []);
            } catch (err) {
                console.error('Erro ao carregar turmas:', err);
            }
        };
        load();
        setFormData({ categoria: '', descricao: '', data_movimentacao: new Date(), turma_id: '', observacoes: '' });
        setValorTotal(0);
        setError('');
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const formatDateForAPI = (date: Date | null): string | null => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.turma_id) { setError('Turma e obrigatoria.'); return; }
        if (!formData.categoria) { setError('Categoria e obrigatoria.'); return; }
        if (!formData.data_movimentacao) { setError('Data e obrigatoria.'); return; }

        setSaving(true);
        setError('');
        try {
            const result = await financeiroAPI.criar({
                turma_id: formData.turma_id,
                categoria: formData.categoria,
                descricao: formData.descricao || null,
                valor_total: valorTotal || null,
                data_movimentacao: formatDateForAPI(formData.data_movimentacao),
                observacoes: formData.observacoes || null,
            });

            if (result.error) { setError(result.error); return; }
            onSuccess?.();
            onClose();
        } catch {
            setError('Erro ao salvar o gasto. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Gasto">
            <p className="text-sm text-gray-500 mb-6">Registre um gasto associado a uma turma.</p>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

                    <div className="md:col-span-2">
                        <Select
                            label="Turma *"
                            value={formData.turma_id}
                            onChange={(v) => setFormData(prev => ({ ...prev, turma_id: v }))}
                            options={turmas.map(t => ({
                                value: t.id,
                                label: `${t.tipo} | ${formatDateUTC(t.data_evento_inicio)}${t.data_evento_fim ? ` - ${formatDateUTC(t.data_evento_fim)}` : ''}`
                            }))}
                            placeholder="Selecione a turma..."
                        />
                    </div>

                    <div>
                        <Select
                            label="Categoria *"
                            value={formData.categoria}
                            onChange={(v) => setFormData(prev => ({ ...prev, categoria: v }))}
                            options={CATEGORIAS.map(c => ({ value: c, label: c }))}
                            placeholder="Selecione..."
                        />
                    </div>

                    <div>
                        <DateInput
                            label="Data *"
                            value={formData.data_movimentacao}
                            onChange={(date) => setFormData(prev => ({ ...prev, data_movimentacao: date }))}
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Descricao</label>
                        <input
                            type="text"
                            name="descricao"
                            value={formData.descricao}
                            onChange={handleChange}
                            placeholder="Ex: Aluguel do salao para ACLS de Abril"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <CurrencyInput label="Valor Total" value={valorTotal} onChange={setValorTotal} placeholder="0,00" />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Observacoes</label>
                        <textarea
                            name="observacoes"
                            value={formData.observacoes}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Observacoes adicionais"
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm">
                        Cancelar
                    </button>
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-brand-teal text-white rounded-md hover:bg-teal-600 text-sm disabled:opacity-50">
                        {saving ? 'Salvando...' : 'Registrar Gasto'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TransactionFormModal;
