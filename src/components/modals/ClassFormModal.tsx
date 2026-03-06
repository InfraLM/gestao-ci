
import React, { useState } from 'react';
import Modal from '../Modal';
import DateInput from '../DateInput';
import Select from '../Select';
import { turmasAPI } from '../../services/api';

interface ClassFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const ClassFormModal: React.FC<ClassFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        tipo: '',
        instrutor: '',
        data_evento: null as Date | null,
        horario: '08:00 - 18:00',
        local_evento: '',
        capacidade: '',
        descricao: '',
        status: 'EM ABERTO'
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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
        setError('');
        setLoading(true);

        try {
            if (!formData.tipo) {
                setError('Tipo e obrigatorio');
                setLoading(false);
                return;
            }

            if (!formData.data_evento) {
                setError('Data do evento e obrigatoria');
                setLoading(false);
                return;
            }

            if (!formData.capacidade || parseInt(formData.capacidade) <= 0) {
                setError('Capacidade deve ser maior que 0');
                setLoading(false);
                return;
            }

            const dataToSubmit = {
                tipo: formData.tipo,
                instrutor: formData.instrutor,
                data_evento: formatDateForAPI(formData.data_evento),
                horario: formData.horario,
                local_evento: formData.local_evento,
                capacidade: parseInt(formData.capacidade),
                descricao: formData.descricao,
                status: formData.status
            };

            const response = await turmasAPI.criar(dataToSubmit);

            if (response.error) {
                setError(response.error);
                return;
            }

            // Reset form
            setFormData({
                tipo: '',
                instrutor: '',
                data_evento: null,
                horario: '08:00 - 18:00',
                local_evento: '',
                capacidade: '',
                descricao: '',
                status: 'EM ABERTO'
            });

            onSuccess?.();
            onClose();
        } catch (err) {
            setError('Erro ao criar turma: ' + (err instanceof Error ? err.message : 'Tente novamente'));
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Criar Nova Turma">
            <p className="text-sm text-gray-500 mb-6">Configure os detalhes da nova turma ou tratamento.</p>
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                        label="Tipo *"
                        value={formData.tipo}
                        onChange={(v) => setFormData(prev => ({ ...prev, tipo: v }))}
                        options={tipoOptions}
                        placeholder="Selecione o tipo"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instrutor</label>
                        <input
                            type="text"
                            name="instrutor"
                            value={formData.instrutor}
                            onChange={handleInputChange}
                            placeholder="Nome do Instrutor"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-colors"
                        />
                    </div>
                    <DateInput
                        label="Data do Evento"
                        value={formData.data_evento}
                        onChange={(date) => setFormData(prev => ({ ...prev, data_evento: date }))}
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
                        <input
                            type="text"
                            name="horario"
                            value={formData.horario}
                            onChange={handleInputChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                        <input
                            type="text"
                            name="local_evento"
                            value={formData.local_evento}
                            onChange={handleInputChange}
                            placeholder="Sala 101"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade</label>
                        <input
                            type="number"
                            name="capacidade"
                            value={formData.capacidade}
                            onChange={handleInputChange}
                            placeholder="10"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-colors"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
                        <textarea
                            rows={3}
                            name="descricao"
                            value={formData.descricao}
                            onChange={handleInputChange}
                            placeholder="Descricao da turma"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-colors"
                        ></textarea>
                    </div>
                    <div className="md:col-span-2">
                        <Select
                            label="Status"
                            value={formData.status}
                            onChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
                            options={statusOptions}
                        />
                    </div>
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
                        {loading ? 'Criando...' : 'Criar Turma'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ClassFormModal;
