
import React, { useState, useEffect } from 'react';
import StatCard from '../StatCard';
import ErrorMessage from '../ErrorMessage';
import { alunosAPI, turmasAPI, financeiroAPI } from '../../services/api';
import { formatCurrency } from '../../hooks/useCurrencyInput';

interface AlunoStats {
    total_alunos: number;
    em_onboarding: number;
    ativos: number;
}

interface TurmaStats {
    total_turmas: number;
    em_aberto: number;
}

interface FinanceiroStats {
    total_receitas: number;
    total_despesas: number;
    saldo: number;
}

interface TurmaResumo {
    id: string;
    tipo: string;
    data_evento: string | null;
    status: string;
    capacidade: number;
    alunos_inscritos: number;
    percentual_ocupacao: number;
}

const statusColor: Record<string, string> = {
    'EM ABERTO': 'bg-green-100 text-green-800',
    'LOTADA': 'bg-red-100 text-red-800',
    'ACONTECEU': 'bg-blue-100 text-blue-800',
    'CANCELADA': 'bg-gray-100 text-gray-800',
};

const Dashboard: React.FC = () => {
    const [alunoStats, setAlunoStats] = useState<AlunoStats | null>(null);
    const [turmaStats, setTurmaStats] = useState<TurmaStats | null>(null);
    const [finStats, setFinStats] = useState<FinanceiroStats | null>(null);
    const [turmas, setTurmas] = useState<TurmaResumo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [alunos, turmasStats, financeiro, turmasResumo] = await Promise.all([
                alunosAPI.estatisticas(),
                turmasAPI.estatisticas(),
                financeiroAPI.resumoCompleto(),
                turmasAPI.listarComResumo(),
            ]);
            setAlunoStats(alunos);
            setTurmaStats(turmasStats);
            setFinStats(financeiro);
            setTurmas(Array.isArray(turmasResumo) ? turmasResumo : turmasResumo.data || []);
        } catch (err) {
            console.error('Erro ao carregar dashboard:', err);
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const turmasAtivas = turmas.filter(t => t.status === 'EM ABERTO' || t.status === 'LOTADA');

    return (
        <div className="p-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Bem-vindo, Admin</h1>
                <p className="text-gray-500 mt-1">{new Date().toLocaleDateString('pt-BR')}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <StatCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    title="Total de Alunos"
                    value={loading ? '...' : String(alunoStats?.total_alunos ?? 0)}
                    change={loading ? undefined : `${alunoStats?.ativos ?? 0} ativos`}
                    changeColor="text-green-500"
                    iconColor="bg-blue-100 text-blue-500"
                />
                <StatCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    title="Turmas Ativas"
                    value={loading ? '...' : String(turmaStats?.em_aberto ?? 0)}
                    change={loading ? undefined : `${turmaStats?.total_turmas ?? 0} total`}
                    changeColor="text-gray-500"
                    iconColor="bg-green-100 text-green-500"
                />
                <StatCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                    title="Em Onboarding"
                    value={loading ? '...' : String(alunoStats?.em_onboarding ?? 0)}
                    change={loading ? undefined : 'alunos em processo'}
                    changeColor="text-yellow-500"
                    iconColor="bg-yellow-100 text-yellow-500"
                />
                <StatCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    title="Saldo Financeiro"
                    value={loading ? '...' : formatCurrency(finStats?.saldo ?? 0)}
                    change={loading ? undefined : `Receitas: ${formatCurrency(finStats?.total_receitas ?? 0)}`}
                    changeColor={(finStats?.saldo ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}
                    iconColor={(finStats?.saldo ?? 0) >= 0 ? 'bg-teal-100 text-teal-500' : 'bg-red-100 text-red-500'}
                />
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-800">Turmas Ativas</h2>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Carregando...</div>
                    ) : error ? (
                        <ErrorMessage error={error} onRetry={fetchData} />
                    ) : turmasAtivas.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">Nenhuma turma ativa encontrada.</div>
                    ) : (
                        <table className="w-full mt-4 text-left">
                            <thead>
                                <tr className="text-sm text-gray-500 border-b">
                                    <th className="py-2">Turma</th>
                                    <th className="py-2">Data</th>
                                    <th className="py-2">Alunos</th>
                                    <th className="py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {turmasAtivas.slice(0, 8).map(turma => (
                                    <tr key={turma.id} className="border-b text-gray-700">
                                        <td className="py-4 font-medium">{turma.tipo}</td>
                                        <td className="py-4">{turma.data_evento ? new Date(turma.data_evento).toLocaleDateString('pt-BR') : '-'}</td>
                                        <td className="py-4">{turma.alunos_inscritos}/{turma.capacidade}</td>
                                        <td className="py-4">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColor[turma.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {turma.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-800">Resumo Geral</h2>
                    {loading ? (
                        <div className="mt-4 text-center py-8 text-gray-500">Carregando...</div>
                    ) : (
                        <div className="mt-4 space-y-4">
                            <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-gray-600">Total de Turmas</span>
                                <span className="font-bold text-gray-800">{turmaStats?.total_turmas ?? 0}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-gray-600">Turmas em Aberto</span>
                                <span className="font-bold text-green-600">{turmaStats?.em_aberto ?? 0}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-gray-600">Total de Alunos</span>
                                <span className="font-bold text-gray-800">{alunoStats?.total_alunos ?? 0}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-gray-600">Alunos Ativos</span>
                                <span className="font-bold text-green-600">{alunoStats?.ativos ?? 0}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-gray-600">Receitas</span>
                                <span className="font-bold text-green-600">{formatCurrency(finStats?.total_receitas ?? 0)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-gray-600">Despesas</span>
                                <span className="font-bold text-red-600">{formatCurrency(finStats?.total_despesas ?? 0)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-gray-600">Saldo</span>
                                <span className={`font-bold ${(finStats?.saldo ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(finStats?.saldo ?? 0)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

