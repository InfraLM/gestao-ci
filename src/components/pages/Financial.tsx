import React, { useState, useEffect } from 'react';
import StatCard from '../StatCard';
import ErrorMessage from '../ErrorMessage';
import Select from '../Select';
import TransactionFormModal from '../modals/TransactionFormModal';
import { formatCurrency } from '../../hooks/useCurrencyInput';
import { financeiroAPI, financeiroAlunoAPI, turmasAPI } from '../../services/api';
import { formatDateUTC } from '../../utils/dateUtils';

type TabType = 'visao-geral' | 'gastos' | 'receitas' | 'por-turma';

interface Gasto {
    id: string;
    turma_id: string;
    categoria: string;
    descricao?: string;
    valor_total?: number;
    data_movimentacao: string;
}

interface Receita {
    id: string;
    aluno_id: string;
    turma_id: string;
    valor_venda?: number;
    data_matricula?: string;
    aluno_nome?: string;
    turma_tipo?: string;
}

interface TurmaResumo {
    turma_id: string;
    turma_tipo: string;
    data_evento_inicio: string | null;
    data_evento_fim: string | null;
    turma_status: string | null;
    receitas: number;
    despesas: number;
    saldo: number;
    qtd_alunos: number;
    qtd_gastos: number;
}

interface ResumoCompleto {
    total_receitas: number;
    total_despesas: number;
    saldo: number;
    por_turma: TurmaResumo[];
}

interface TurmaGastos {
    turma_id: string;
    turma_tipo: string;
    turma_data_evento_inicio: string | null;
    turma_data_evento_fim: string | null;
    total_gastos: number;
    total_receitas: number;
    saldo: number;
    gastos: Gasto[];
    receitas_turma: Receita[];
}

const getCurrentMonth = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const Financial: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('visao-geral');
    const [resumo, setResumo] = useState<ResumoCompleto>({ total_receitas: 0, total_despesas: 0, saldo: 0, por_turma: [] });
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [receitas, setReceitas] = useState<Receita[]>([]);
    const [turmasGastos, setTurmasGastos] = useState<TurmaGastos[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedTurma, setExpandedTurma] = useState<string | null>(null);
    const [mesFilter, setMesFilter] = useState('');
    const [tipoData, setTipoData] = useState<'movimentacao' | 'evento'>('movimentacao');

    const fetchResumo = async () => {
        try {
            const filtros: any = {};
            if (mesFilter) filtros.mes = mesFilter;
            filtros.tipo_data = tipoData;
            const data = await financeiroAPI.resumoCompleto(filtros);
            if (data && !data.error) {
                setResumo(data);
            }
        } catch (err) {
            console.error('Erro ao carregar resumo:', err);
            setError(err instanceof Error ? err : new Error(String(err)));
        }
    };

    const fetchGastosEReceitas = async () => {
        try {
            const [gastosResp, receitasResp] = await Promise.all([
                financeiroAPI.listar({ limit: '200' }),
                financeiroAlunoAPI.listar({ limit: '200' }),
            ]);

            const gastosData: Gasto[] = gastosResp.data || [];
            const receitasData: Receita[] = receitasResp?.data || receitasResp || [];

            setGastos(gastosData);
            setReceitas(Array.isArray(receitasData) ? receitasData : []);
            await buildTurmasGastos(gastosData, Array.isArray(receitasData) ? receitasData : []);
        } catch (err) {
            console.error('Erro ao carregar dados financeiros:', err);
            setError(err instanceof Error ? err : new Error(String(err)));
        }
    };

    const buildTurmasGastos = async (data: Gasto[], receitasData: Receita[]) => {
        // Agrupar gastos por turma
        const gastosMap = new Map<string, Gasto[]>();
        data.forEach(g => {
            if (!gastosMap.has(g.turma_id)) gastosMap.set(g.turma_id, []);
            gastosMap.get(g.turma_id)!.push(g);
        });

        // Agrupar receitas por turma
        const receitasMap = new Map<string, Receita[]>();
        receitasData.forEach(r => {
            if (!receitasMap.has(r.turma_id)) receitasMap.set(r.turma_id, []);
            receitasMap.get(r.turma_id)!.push(r);
        });

        // Unir todas turma_ids
        const allTurmaIds = new Set([...gastosMap.keys(), ...receitasMap.keys()]);

        const result: TurmaGastos[] = [];
        for (const turmaId of allTurmaIds) {
            let turmaInfo = { tipo: 'Turma', data_evento_inicio: null as string | null, data_evento_fim: null as string | null };
            try {
                const t = await turmasAPI.obter(turmaId);
                turmaInfo = { tipo: t.tipo, data_evento_inicio: t.data_evento_inicio, data_evento_fim: t.data_evento_fim };
            } catch { /* ignorar */ }

            const turmaGastos = gastosMap.get(turmaId) || [];
            const turmaReceitas = receitasMap.get(turmaId) || [];
            const totalGastos = turmaGastos.reduce((s, g) => s + (Number(g.valor_total) || 0), 0);
            const totalReceitas = turmaReceitas.reduce((s, r) => s + (Number(r.valor_venda) || 0), 0);

            result.push({
                turma_id: turmaId,
                turma_tipo: turmaInfo.tipo,
                turma_data_evento_inicio: turmaInfo.data_evento_inicio,
                turma_data_evento_fim: turmaInfo.data_evento_fim,
                total_gastos: totalGastos,
                total_receitas: totalReceitas,
                saldo: totalReceitas - totalGastos,
                gastos: turmaGastos,
                receitas_turma: turmaReceitas,
            });
        }
        setTurmasGastos(result.sort((a, b) => b.saldo - a.saldo));
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchResumo(), fetchGastosEReceitas()]).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchResumo();
    }, [mesFilter, tipoData]);

    const handleSuccess = () => {
        setLoading(true);
        setError(null);
        Promise.all([fetchResumo(), fetchGastosEReceitas()]).finally(() => setLoading(false));
    };

    const tabs: { key: TabType; label: string }[] = [
        { key: 'visao-geral', label: 'Visao Geral' },
        { key: 'gastos', label: `Gastos (${gastos.length})` },
        { key: 'receitas', label: `Receitas (${receitas.length})` },
        { key: 'por-turma', label: `Por Turma (${turmasGastos.length})` },
    ];

    return (
        <>
            <TransactionFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleSuccess} />
            <div className="p-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestao Financeira</h1>
                        <p className="text-gray-500 mt-1">Receitas, despesas e saldo por turma.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-brand-teal text-white font-bold py-2 px-4 rounded-lg flex items-center mt-4 md:mt-0 hover:bg-teal-600"
                    >
                        <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Registrar Gasto
                    </button>
                </header>

                {/* Filtros */}
                <div className="flex flex-wrap gap-4 mt-6 items-end">
                    <Select
                        label="Mes"
                        value={mesFilter}
                        onChange={setMesFilter}
                        options={(() => {
                            const opts = [];
                            const now = new Date();
                            for (let i = -6; i <= 6; i++) {
                                const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
                                const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                                opts.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
                            }
                            return opts;
                        })()}
                        placeholder="Todos os meses"
                    />
                    <Select
                        label="Filtrar por"
                        value={tipoData}
                        onChange={(v) => setTipoData(v as 'movimentacao' | 'evento')}
                        options={[
                            { value: 'movimentacao', label: 'Data da movimentacao' },
                            { value: 'evento', label: 'Data do evento da turma' },
                        ]}
                    />
                    {mesFilter && (
                        <button
                            onClick={() => setMesFilter('')}
                            className="px-3 py-2 text-sm text-brand-teal hover:text-teal-700 border border-brand-teal rounded-lg font-medium"
                        >
                            Limpar filtro
                        </button>
                    )}
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <StatCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>}
                        title="Total Receitas"
                        value={formatCurrency(resumo.total_receitas)}
                        change={`${resumo.por_turma.length} turmas`}
                        changeColor="text-green-500"
                        iconColor="bg-green-100 text-green-500"
                    />
                    <StatCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                        title="Total Despesas"
                        value={formatCurrency(resumo.total_despesas)}
                        change={`${gastos.length} registros`}
                        changeColor="text-red-500"
                        iconColor="bg-red-100 text-red-500"
                    />
                    <StatCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                        title="Saldo"
                        value={formatCurrency(resumo.saldo)}
                        change={resumo.saldo >= 0 ? 'positivo' : 'negativo'}
                        changeColor={resumo.saldo >= 0 ? 'text-green-500' : 'text-red-500'}
                        iconColor={resumo.saldo >= 0 ? 'bg-teal-100 text-teal-500' : 'bg-red-100 text-red-500'}
                    />
                </div>

                {/* Tabs */}
                <div className="mt-8 bg-white rounded-xl shadow-md">
                    <div className="border-b">
                        <div className="flex space-x-4 px-6 overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-brand-teal text-brand-teal' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Carregando dados financeiros...</div>
                        ) : error ? (
                            <ErrorMessage error={error} onRetry={handleSuccess} />
                        ) : activeTab === 'visao-geral' ? (
                            <VisaoGeral turmas={resumo.por_turma} />
                        ) : activeTab === 'gastos' ? (
                            <ExtratoGeral gastos={gastos} />
                        ) : activeTab === 'receitas' ? (
                            <ReceitasTab receitas={receitas} />
                        ) : (
                            <PorTurma turmasGastos={turmasGastos} expandedTurma={expandedTurma} setExpandedTurma={setExpandedTurma} />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

// ============================================================================
// VISAO GERAL (receitas vs despesas por turma)
// ============================================================================
const VisaoGeral: React.FC<{ turmas: TurmaResumo[] }> = ({ turmas }) => {
    if (turmas.length === 0) {
        return <div className="text-center py-8 text-gray-500">Nenhum dado financeiro encontrado para o periodo.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-sm text-gray-500 border-b">
                        <th className="p-3">TURMA</th>
                        <th className="p-3">DATA</th>
                        <th className="p-3 text-center">ALUNOS</th>
                        <th className="p-3 text-right">RECEITAS</th>
                        <th className="p-3 text-right">DESPESAS</th>
                        <th className="p-3 text-right">SALDO</th>
                    </tr>
                </thead>
                <tbody>
                    {turmas.map(t => (
                        <tr key={t.turma_id} className="border-b text-gray-700 hover:bg-gray-50">
                            <td className="p-3 font-medium">{t.turma_tipo}</td>
                            <td className="p-3 text-sm">{t.data_evento_inicio ? `${formatDateUTC(t.data_evento_inicio)}${t.data_evento_fim ? ` - ${formatDateUTC(t.data_evento_fim)}` : ''}` : '-'}</td>
                            <td className="p-3 text-center">{t.qtd_alunos}</td>
                            <td className="p-3 text-right font-semibold text-green-600">{formatCurrency(t.receitas)}</td>
                            <td className="p-3 text-right font-semibold text-red-600">{formatCurrency(t.despesas)}</td>
                            <td className={`p-3 text-right font-bold ${t.saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {formatCurrency(t.saldo)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="border-t bg-gray-50">
                        <td colSpan={3} className="p-3 font-semibold text-gray-700 text-sm">Total</td>
                        <td className="p-3 text-right font-bold text-green-600">
                            {formatCurrency(turmas.reduce((s, t) => s + t.receitas, 0))}
                        </td>
                        <td className="p-3 text-right font-bold text-red-600">
                            {formatCurrency(turmas.reduce((s, t) => s + t.despesas, 0))}
                        </td>
                        <td className={`p-3 text-right font-bold ${turmas.reduce((s, t) => s + t.saldo, 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(turmas.reduce((s, t) => s + t.saldo, 0))}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

// ============================================================================
// EXTRATO GERAL (gastos)
// ============================================================================
const ExtratoGeral: React.FC<{ gastos: Gasto[] }> = ({ gastos }) => {
    if (gastos.length === 0) {
        return <div className="text-center py-8 text-gray-500">Nenhum gasto registrado. Clique em "Registrar Gasto" para adicionar.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-sm text-gray-500 border-b">
                        <th className="p-3">DATA</th>
                        <th className="p-3">CATEGORIA</th>
                        <th className="p-3">DESCRICAO</th>
                        <th className="p-3 text-right">VALOR</th>
                    </tr>
                </thead>
                <tbody>
                    {gastos.map(g => (
                        <tr key={g.id} className="border-b text-gray-700 hover:bg-gray-50">
                            <td className="p-3 text-sm">{new Date(g.data_movimentacao).toLocaleDateString('pt-BR')}</td>
                            <td className="p-3">
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">{g.categoria}</span>
                            </td>
                            <td className="p-3 text-sm">{g.descricao || '-'}</td>
                            <td className="p-3 text-right font-semibold text-red-600">
                                - {formatCurrency(Number(g.valor_total) || 0)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="border-t bg-gray-50">
                        <td colSpan={3} className="p-3 font-semibold text-gray-700 text-sm">Total</td>
                        <td className="p-3 text-right font-bold text-red-600">
                            - {formatCurrency(gastos.reduce((s, g) => s + (Number(g.valor_total) || 0), 0))}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

// ============================================================================
// RECEITAS (financeiro_aluno)
// ============================================================================
const ReceitasTab: React.FC<{ receitas: Receita[] }> = ({ receitas }) => {
    if (receitas.length === 0) {
        return <div className="text-center py-8 text-gray-500">Nenhuma receita registrada. Receitas sao criadas ao matricular alunos.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-sm text-gray-500 border-b">
                        <th className="p-3">DATA</th>
                        <th className="p-3">ALUNO</th>
                        <th className="p-3">TURMA</th>
                        <th className="p-3 text-right">VALOR</th>
                    </tr>
                </thead>
                <tbody>
                    {receitas.map(r => (
                        <tr key={r.id} className="border-b text-gray-700 hover:bg-gray-50">
                            <td className="p-3 text-sm">{r.data_matricula ? new Date(r.data_matricula).toLocaleDateString('pt-BR') : '-'}</td>
                            <td className="p-3 font-medium">{(r as any).aluno?.nome || r.aluno_nome || r.aluno_id}</td>
                            <td className="p-3 text-sm">{(r as any).turma?.tipo || r.turma_tipo || r.turma_id}</td>
                            <td className="p-3 text-right font-semibold text-green-600">
                                + {formatCurrency(Number(r.valor_venda) || 0)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="border-t bg-gray-50">
                        <td colSpan={3} className="p-3 font-semibold text-gray-700 text-sm">Total</td>
                        <td className="p-3 text-right font-bold text-green-600">
                            + {formatCurrency(receitas.reduce((s, r) => s + (Number(r.valor_venda) || 0), 0))}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

// ============================================================================
// POR TURMA (entradas + saidas + saldo)
// ============================================================================
const PorTurma: React.FC<{
    turmasGastos: TurmaGastos[];
    expandedTurma: string | null;
    setExpandedTurma: (id: string | null) => void;
}> = ({ turmasGastos, expandedTurma, setExpandedTurma }) => {
    if (turmasGastos.length === 0) {
        return <div className="text-center py-8 text-gray-500">Nenhum dado financeiro registrado ainda.</div>;
    }

    return (
        <div className="space-y-4">
            {turmasGastos.map(turma => {
                // Montar extrato unificado (entradas + saidas) ordenado por data
                const extrato: { id: string; data: string; tipo: 'entrada' | 'saida'; descricao: string; categoria: string; valor: number }[] = [];

                turma.receitas_turma.forEach(r => {
                    extrato.push({
                        id: r.id,
                        data: r.data_matricula || '',
                        tipo: 'entrada',
                        descricao: (r as any).aluno?.nome || r.aluno_nome || 'Matricula',
                        categoria: 'Matricula',
                        valor: Number(r.valor_venda) || 0,
                    });
                });

                turma.gastos.forEach(g => {
                    extrato.push({
                        id: g.id,
                        data: g.data_movimentacao,
                        tipo: 'saida',
                        descricao: g.descricao || '-',
                        categoria: g.categoria,
                        valor: Number(g.valor_total) || 0,
                    });
                });

                extrato.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

                return (
                    <div key={turma.turma_id} className="border rounded-lg overflow-hidden">
                        <div
                            className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                            onClick={() => setExpandedTurma(expandedTurma === turma.turma_id ? null : turma.turma_id)}
                        >
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{turma.turma_tipo}</h3>
                                <p className="text-sm text-gray-500">
                                    {turma.turma_data_evento_inicio
                                        ? `${formatDateUTC(turma.turma_data_evento_inicio)}${turma.turma_data_evento_fim ? ` - ${formatDateUTC(turma.turma_data_evento_fim)}` : ''}`
                                        : 'Sem data'
                                    } - {turma.receitas_turma.length} {turma.receitas_turma.length === 1 ? 'entrada' : 'entradas'}, {turma.gastos.length} {turma.gastos.length === 1 ? 'saida' : 'saidas'}
                                </p>
                            </div>
                            <div className="flex items-center space-x-6">
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Receitas</p>
                                    <p className="text-sm font-bold text-green-600">+ {formatCurrency(turma.total_receitas)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Despesas</p>
                                    <p className="text-sm font-bold text-red-600">- {formatCurrency(turma.total_gastos)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Saldo</p>
                                    <p className={`text-sm font-bold ${turma.saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {turma.saldo >= 0 ? '+ ' : '- '}{formatCurrency(Math.abs(turma.saldo))}
                                    </p>
                                </div>
                                <svg
                                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedTurma === turma.turma_id ? 'rotate-180' : ''}`}
                                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {expandedTurma === turma.turma_id && (
                            <div className="p-4 bg-white border-t">
                                {extrato.length === 0 ? (
                                    <div className="text-center py-4 text-gray-400 text-sm">Nenhuma movimentacao</div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-xs text-gray-500 border-b">
                                                <th className="p-2 text-left">DATA</th>
                                                <th className="p-2 text-left">TIPO</th>
                                                <th className="p-2 text-left">DESCRICAO</th>
                                                <th className="p-2 text-right">VALOR</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {extrato.map(item => (
                                                <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                                                    <td className="p-2">{item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '-'}</td>
                                                    <td className="p-2">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.tipo === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {item.tipo === 'entrada' ? item.categoria : item.categoria}
                                                        </span>
                                                    </td>
                                                    <td className="p-2">{item.descricao}</td>
                                                    <td className={`p-2 text-right font-semibold ${item.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {item.tipo === 'entrada' ? '+ ' : '- '}{formatCurrency(item.valor)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t bg-gray-50">
                                                <td colSpan={3} className="p-2 font-semibold text-gray-700 text-xs">Saldo da Turma</td>
                                                <td className={`p-2 text-right font-bold text-xs ${turma.saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                    {turma.saldo >= 0 ? '+ ' : '- '}{formatCurrency(Math.abs(turma.saldo))}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default Financial;
