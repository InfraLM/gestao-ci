
import React, { useState, useEffect } from 'react';
import StatCard from '../StatCard';
import ErrorMessage from '../ErrorMessage';
import { Student } from '../../types';
import StudentFormModal from '../modals/StudentFormModal';
import { alunosAPI } from '../../services/api';
import { formatDateUTC } from '../../utils/dateUtils';

interface AlunoStats {
    total_alunos: number;
    em_onboarding: number;
    ativos: number;
    inativos: number;
    formados: number;
    com_pos_graduacao: number;
}

const PaymentStatusBadge: React.FC<{ status: 'Paid' | 'Pending' }> = ({ status }) => {
    const baseClasses = "px-3 py-1 text-xs font-medium rounded-full";
    const statusClasses = {
        Paid: "bg-green-100 text-green-800",
        Pending: "bg-yellow-100 text-yellow-800",
    };
    const statusText = status === 'Paid' ? 'Pago' : 'Pendente';
    return <span className={`${baseClasses} ${statusClasses[status]}`}>{statusText}</span>;
};


const Students: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [stats, setStats] = useState<AlunoStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError(null);
            const filters: any = { limit: '200' };
            if (searchTerm) filters.nome = searchTerm;
            const [result, statsResult] = await Promise.all([
                alunosAPI.listar(filters),
                alunosAPI.estatisticas(),
            ]);
            setStudents(result.data || []);
            setStats(statsResult);
        } catch (err) {
            console.error('Erro ao carregar alunos:', err);
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchStudents();
        }, 400);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    const handleOpenModal = (student: any = null) => {
        if (student) {
            setEditingStudent({
                ...student,
                valor_venda: parseFloat(student.valor_venda) || 0,
            });
        } else {
            setEditingStudent(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
    };

    const handleDelete = async (student: any) => {
        if (!window.confirm(`Tem certeza que deseja excluir "${student.nome}"? Todos os dados associados (matriculas, financeiro, onboarding) serao removidos.`)) return;
        setDeleting(student.id);
        try {
            await alunosAPI.deletar(student.id);
            fetchStudents();
        } catch (err) {
            console.error('Erro ao excluir aluno:', err);
            alert('Erro ao excluir aluno: ' + (err instanceof Error ? err.message : 'Tente novamente'));
        } finally {
            setDeleting(null);
        }
    };

    return (
        <>
            <StudentFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                student={editingStudent}
                onSuccess={fetchStudents}
            />
            <div className="p-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Alunos / Pacientes</h1>
                        <p className="text-gray-500 mt-1">Gerencie os alunos e pacientes da clinica</p>
                    </div>
                    <div className="flex items-center mt-4 md:mt-0 space-x-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar por nome..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <button onClick={() => handleOpenModal()} className="bg-brand-teal text-white font-bold py-2 px-4 rounded-lg flex items-center">
                            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            Novo Aluno
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <StatCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                        title="Total de Alunos"
                        value={loading ? '...' : String(stats?.total_alunos ?? 0)}
                        change={loading ? undefined : `${stats?.com_pos_graduacao ?? 0} com pos-graduacao`}
                        changeColor="text-blue-500"
                        iconColor="bg-blue-100 text-blue-500"
                    />
                    <StatCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        title="Alunos Ativos"
                        value={loading ? '...' : String(stats?.ativos ?? 0)}
                        change={loading ? undefined : `${stats?.formados ?? 0} formados`}
                        changeColor="text-green-500"
                        iconColor="bg-green-100 text-green-500"
                    />
                    <StatCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        title="Em Onboarding"
                        value={loading ? '...' : String(stats?.em_onboarding ?? 0)}
                        change={loading ? undefined : 'alunos em processo'}
                        changeColor="text-yellow-500"
                        iconColor="bg-yellow-100 text-yellow-500"
                    />
                </div>

                <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">
                            Carregando alunos do banco de dados...
                        </div>
                    ) : error ? (
                        <ErrorMessage error={error} onRetry={fetchStudents} />
                    ) : students.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Nenhum aluno encontrado{searchTerm ? ' com o filtro aplicado' : ' no banco de dados'}.
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-sm text-gray-500 border-b">
                                            <th className="p-3">NOME</th>
                                            <th className="p-3">EMAIL</th>
                                            <th className="p-3">TELEFONE</th>
                                            <th className="p-3">TURMA</th>
                                            <th className="p-3">PAGAMENTO</th>
                                            <th className="p-3">ACOES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student: any) => {
                                            const turmaInfo = student.aluno_turma?.[0]?.turma;
                                            const turmaLabel = turmaInfo
                                                ? `${turmaInfo.tipo} | ${formatDateUTC(turmaInfo.data_evento_inicio)}${turmaInfo.data_evento_fim ? ` - ${formatDateUTC(turmaInfo.data_evento_fim)}` : ''}`
                                                : '-';
                                            const temPagamento = student.financeiro_aluno?.length > 0 && parseFloat(student.financeiro_aluno[0]?.valor_venda || '0') > 0;
                                            return (
                                            <tr key={student.id} className="border-b text-gray-700 hover:bg-gray-50">
                                                <td className="p-3 font-medium">{student.nome}</td>
                                                <td className="p-3">{student.email || '-'}</td>
                                                <td className="p-3">{student.telefone || '-'}</td>
                                                <td className="p-3">{turmaLabel}</td>
                                                <td className="p-3"><PaymentStatusBadge status={temPagamento ? 'Paid' : 'Pending'} /></td>
                                                <td className="p-3">
                                                    <div className="flex items-center space-x-3">
                                                        <button onClick={() => handleOpenModal(student)} className="text-gray-400 hover:text-blue-500">
                                                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(student)}
                                                            disabled={deleting === student.id}
                                                            className={`text-gray-400 hover:text-red-500 ${deleting === student.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 text-sm text-gray-500 text-right">
                                {students.length} aluno{students.length !== 1 ? 's' : ''} encontrado{students.length !== 1 ? 's' : ''}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default Students;
