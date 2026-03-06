
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import ErrorMessage from '../ErrorMessage';
import { turmasAPI, onboardingAPI, financeiroAPI, alunosAPI } from '../../services/api';
import { formatCurrency } from '../../hooks/useCurrencyInput';

interface TurmaResumo {
    id: string;
    tipo: string;
    data_evento: string | null;
    status: string;
    capacidade: number;
    alunos_inscritos: number;
    percentual_ocupacao: number;
}

interface FinResumoTurma {
    turma_id: string;
    turma_tipo: string;
    receitas: number;
    despesas: number;
    saldo: number;
}

interface FinResumo {
    total_receitas: number;
    total_despesas: number;
    saldo: number;
    por_turma: FinResumoTurma[];
}

interface AlunoRelatorio {
    total: number;
    por_vendedor: { vendedor: string; alunos: number; receita: number }[];
    por_status: { status: string; count: number }[];
    pos_graduacao: { com: number; sem: number };
    evolucao_cadastros: { mes: string; count: number }[];
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];
const ONBOARDING_COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899'];
const STATUS_COLORS: Record<string, string> = {
    'Ativo': '#10B981',
    'Em Onboarding': '#F59E0B',
    'Formado': '#3B82F6',
    'Inativo': '#EF4444',
    'Indefinido': '#9CA3AF',
};

const Reports: React.FC = () => {
    const [turmas, setTurmas] = useState<TurmaResumo[]>([]);
    const [onboardingCounts, setOnboardingCounts] = useState<Record<string, number>>({});
    const [finResumo, setFinResumo] = useState<FinResumo>({ total_receitas: 0, total_despesas: 0, saldo: 0, por_turma: [] });
    const [alunoRelatorio, setAlunoRelatorio] = useState<AlunoRelatorio | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadData = () => {
        setLoading(true);
        setError(null);
        Promise.all([
            turmasAPI.listarComResumo(),
            onboardingAPI.contagem(),
            financeiroAPI.resumoCompleto(),
            alunosAPI.relatorio(),
        ]).then(([turmasRes, onboarding, financeiro, relatorio]) => {
            const turmasData = turmasRes?.data || turmasRes || [];
            setTurmas(Array.isArray(turmasData) ? turmasData : []);
            setOnboardingCounts(onboarding || {});
            if (financeiro && !financeiro.error) setFinResumo(financeiro);
            if (relatorio && !relatorio.error) setAlunoRelatorio(relatorio);
        }).catch(err => {
            console.error('Erro ao carregar relatorios:', err);
            setError(err instanceof Error ? err : new Error(String(err)));
        }).finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center h-full">
                <div className="text-gray-500">Carregando dados dos relatorios...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <ErrorMessage error={error} onRetry={loadData} />
            </div>
        );
    }

    // ========== DADOS PROCESSADOS ==========

    // Financeiro por turma
    const financialData = finResumo.por_turma.map(t => ({
        name: t.turma_tipo,
        Receitas: t.receitas,
        Despesas: t.despesas,
    }));

    // Saldo por turma
    const saldoData = finResumo.por_turma.map(t => ({
        name: t.turma_tipo,
        saldo: t.saldo,
    }));

    // Alunos por turma
    const studentsByClassData = turmas
        .filter(t => t.status !== 'CANCELADA')
        .map(t => ({
            name: t.tipo,
            alunos: t.alunos_inscritos || 0,
        }));

    // Onboarding pipeline
    const etapas = ['Boas-vindas', 'Envio do Livro', 'Grupo da Turma', 'Concluido', 'Feedback'];
    const onboardingData = etapas.map(etapa => ({
        name: etapa,
        value: onboardingCounts[etapa] || 0,
    }));
    const totalOnboarding = onboardingData.reduce((s, d) => s + d.value, 0);

    // Ocupacao
    const occupancyData = turmas
        .filter(t => t.status !== 'CANCELADA')
        .map(t => ({
            name: t.tipo,
            ocupacao: t.percentual_ocupacao || 0,
        }));

    // Vendedores
    const vendedorData = (alunoRelatorio?.por_vendedor || []).slice(0, 8);

    // Status dos alunos
    const statusData = (alunoRelatorio?.por_status || []).map(s => ({
        name: s.status,
        value: s.count,
    }));

    // Pos-graduacao
    const posGradData = alunoRelatorio ? [
        { name: 'Com Pos', value: alunoRelatorio.pos_graduacao.com },
        { name: 'Sem Pos', value: alunoRelatorio.pos_graduacao.sem },
    ] : [];

    // Evolucao cadastros
    const evolucaoData = (alunoRelatorio?.evolucao_cadastros || []).map(e => ({
        name: e.mes.replace(/^\d{4}-/, ''),
        cadastros: e.count,
    }));

    // Status das turmas
    const turmaStatusMap: Record<string, number> = {};
    turmas.forEach(t => {
        turmaStatusMap[t.status] = (turmaStatusMap[t.status] || 0) + 1;
    });
    const turmaStatusData = Object.entries(turmaStatusMap).map(([status, count]) => ({ name: status, value: count }));

    // KPIs
    const totalAlunos = alunoRelatorio?.total || 0;
    const totalCapacidade = turmas.reduce((s, t) => s + (t.capacidade || 0), 0);
    const totalInscritos = turmas.reduce((s, t) => s + (t.alunos_inscritos || 0), 0);
    const ocupacaoMedia = totalCapacidade > 0 ? Math.round((totalInscritos / totalCapacidade) * 100) : 0;
    const ticketMedio = totalAlunos > 0 ? finResumo.total_receitas / totalAlunos : 0;
    const margemLucro = finResumo.total_receitas > 0 ? ((finResumo.saldo / finResumo.total_receitas) * 100) : 0;

    const customTooltipFinanceiro = ({ active, payload, label }: any) => {
        if (!active || !payload) return null;
        return (
            <div className="bg-white p-3 rounded shadow border text-sm">
                <p className="font-semibold">{label}</p>
                {payload.map((p: any, i: number) => (
                    <p key={i} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
                ))}
            </div>
        );
    };

    return (
        <div className="p-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Relatorios e Analises</h1>
                <p className="text-gray-500 mt-1">Visao geral do desempenho do negocio</p>
            </header>

            {/* KPIs Cards */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-md text-center">
                    <p className="text-2xl font-bold text-gray-800">{totalAlunos}</p>
                    <p className="text-xs text-gray-500 mt-1">Total Alunos</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md text-center">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(finResumo.total_receitas)}</p>
                    <p className="text-xs text-gray-500 mt-1">Receita Total</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md text-center">
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(finResumo.total_despesas)}</p>
                    <p className="text-xs text-gray-500 mt-1">Despesas Total</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md text-center">
                    <p className={`text-2xl font-bold ${finResumo.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(finResumo.saldo)}</p>
                    <p className="text-xs text-gray-500 mt-1">Saldo</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md text-center">
                    <p className="text-2xl font-bold text-blue-600">{ocupacaoMedia}%</p>
                    <p className="text-xs text-gray-500 mt-1">Ocupacao Media</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md text-center">
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(ticketMedio)}</p>
                    <p className="text-xs text-gray-500 mt-1">Ticket Medio</p>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Receitas vs Despesas por Turma */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-bold text-lg">Receitas vs Despesas por Turma</h3>
                    <div className="w-full h-72 mt-4">
                        {financialData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados financeiros</div>
                        ) : (
                            <ResponsiveContainer>
                                <BarChart data={financialData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip content={customTooltipFinanceiro} />
                                    <Legend />
                                    <Bar dataKey="Receitas" fill="#10B981" />
                                    <Bar dataKey="Despesas" fill="#EF4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* 2. Saldo (Lucro/Prejuizo) por Turma */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-bold text-lg">Resultado por Turma (Saldo)</h3>
                    <div className="w-full h-72 mt-4">
                        {saldoData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados</div>
                        ) : (
                            <ResponsiveContainer>
                                <BarChart data={saldoData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Saldo']} />
                                    <Bar dataKey="saldo" barSize={30}>
                                        {saldoData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.saldo >= 0 ? '#10B981' : '#EF4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* 3. Performance por Vendedor */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-bold text-lg">Performance por Vendedor</h3>
                    <div className="w-full h-72 mt-4">
                        {vendedorData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados de vendedores</div>
                        ) : (
                            <ResponsiveContainer>
                                <BarChart data={vendedorData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="vendedor" width={100} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(value: number, name: string) => [name === 'receita' ? formatCurrency(value) : value, name === 'receita' ? 'Receita' : 'Alunos']} />
                                    <Legend />
                                    <Bar dataKey="alunos" fill="#3B82F6" barSize={12} name="Alunos" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* 4. Receita por Vendedor */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-bold text-lg">Receita por Vendedor</h3>
                    <div className="w-full h-72 mt-4">
                        {vendedorData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados</div>
                        ) : (
                            <ResponsiveContainer>
                                <BarChart data={vendedorData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="vendedor" width={100} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Receita']} />
                                    <Bar dataKey="receita" fill="#10B981" barSize={14}>
                                        {vendedorData.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* 5. Status dos Alunos */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-bold text-lg">Distribuicao por Status</h3>
                    <div className="w-full h-72 mt-4 flex items-center">
                        {statusData.length === 0 ? (
                            <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">Sem dados</div>
                        ) : (
                            <>
                                <ResponsiveContainer width="50%" height="100%">
                                    <PieChart>
                                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                            {statusData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="w-1/2 pl-4">
                                    <ul>
                                        {statusData.map((entry: any, index: number) => (
                                            <li key={index} className="flex items-center mb-2">
                                                <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[entry.name] || COLORS[index % COLORS.length] }}></span>
                                                <span className="text-sm">{entry.name}: <strong>{entry.value}</strong></span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 6. Pos-graduacao */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-bold text-lg">Pos-Graduacao</h3>
                    <div className="w-full h-72 mt-4 flex items-center">
                        {posGradData.length === 0 || (posGradData[0].value === 0 && posGradData[1].value === 0) ? (
                            <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">Sem dados</div>
                        ) : (
                            <>
                                <ResponsiveContainer width="50%" height="100%">
                                    <PieChart>
                                        <Pie data={posGradData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                            <Cell fill="#8B5CF6" />
                                            <Cell fill="#D1D5DB" />
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="w-1/2 pl-4 space-y-3">
                                    <div className="flex items-center">
                                        <span className="w-3 h-3 rounded-full mr-2 bg-purple-500"></span>
                                        <span className="text-sm">Com pos: <strong>{posGradData[0].value}</strong> ({totalAlunos > 0 ? Math.round((posGradData[0].value / totalAlunos) * 100) : 0}%)</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-3 h-3 rounded-full mr-2 bg-gray-300"></span>
                                        <span className="text-sm">Sem pos: <strong>{posGradData[1].value}</strong> ({totalAlunos > 0 ? Math.round((posGradData[1].value / totalAlunos) * 100) : 0}%)</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 7. Alunos por Turma */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-bold text-lg">Alunos por Turma</h3>
                    <div className="w-full h-72 mt-4">
                        {studentsByClassData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados de turmas</div>
                        ) : (
                            <ResponsiveContainer>
                                <BarChart data={studentsByClassData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="alunos" fill="#14B8A6" barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* 8. Ocupacao de Turmas */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-bold text-lg">Ocupacao das Turmas (%)</h3>
                    <div className="w-full h-72 mt-4">
                        {occupancyData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados de turmas</div>
                        ) : (
                            <ResponsiveContainer>
                                <BarChart data={occupancyData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Ocupacao']} />
                                    <Bar dataKey="ocupacao" barSize={20}>
                                        {occupancyData.map((_entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={_entry.ocupacao >= 100 ? '#EF4444' : _entry.ocupacao >= 75 ? '#F59E0B' : '#10B981'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* 9. Pipeline de Onboarding */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-bold text-lg">Pipeline de Onboarding</h3>
                    <div className="w-full h-72 mt-4 flex items-center">
                        {totalOnboarding === 0 ? (
                            <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">Sem dados de onboarding</div>
                        ) : (
                            <>
                                <ResponsiveContainer width="50%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={onboardingData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {onboardingData.map((_entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={ONBOARDING_COLORS[index % ONBOARDING_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="w-1/2 pl-4">
                                    <ul>
                                        {onboardingData.map((entry: any, index: number) => (
                                            <li key={`legend-${index}`} className="flex items-center mb-2">
                                                <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: ONBOARDING_COLORS[index % ONBOARDING_COLORS.length] }}></span>
                                                <span className="text-sm">{entry.name}: <strong>{entry.value}</strong> ({totalOnboarding > 0 ? Math.round((entry.value / totalOnboarding) * 100) : 0}%)</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="mt-3 text-sm text-gray-500">Total: {totalOnboarding} alunos</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 10. Status das Turmas */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-bold text-lg">Status das Turmas</h3>
                    <div className="w-full h-72 mt-4 flex items-center">
                        {turmaStatusData.length === 0 ? (
                            <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">Sem dados</div>
                        ) : (
                            <>
                                <ResponsiveContainer width="50%" height="100%">
                                    <PieChart>
                                        <Pie data={turmaStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                            {turmaStatusData.map((_: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="w-1/2 pl-4">
                                    <ul>
                                        {turmaStatusData.map((entry: any, index: number) => (
                                            <li key={index} className="flex items-center mb-2">
                                                <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                                <span className="text-sm">{entry.name}: <strong>{entry.value}</strong></span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 11. Evolucao de Cadastros */}
                <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2">
                    <h3 className="font-bold text-lg">Evolucao de Cadastros por Mes</h3>
                    <div className="w-full h-72 mt-4">
                        {evolucaoData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados de cadastros</div>
                        ) : (
                            <ResponsiveContainer>
                                <AreaChart data={evolucaoData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="cadastros" stroke="#14B8A6" fill="#14B8A640" strokeWidth={2} name="Novos Alunos" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* 12. Margem de Lucro Geral */}
                <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2">
                    <h3 className="font-bold text-lg">Resumo Financeiro Geral</h3>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-600">Receita Total</p>
                            <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(finResumo.total_receitas)}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-600">Despesas Total</p>
                            <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(finResumo.total_despesas)}</p>
                        </div>
                        <div className={`${finResumo.saldo >= 0 ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-lg text-center`}>
                            <p className="text-sm text-gray-600">Lucro/Prejuizo</p>
                            <p className={`text-xl font-bold mt-1 ${finResumo.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(finResumo.saldo)}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-600">Margem</p>
                            <p className={`text-xl font-bold mt-1 ${margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>{margemLucro.toFixed(1)}%</p>
                        </div>
                    </div>
                    {/* Barra visual de margem */}
                    {finResumo.total_receitas > 0 && (
                        <div className="mt-6">
                            <div className="flex justify-between text-sm text-gray-500 mb-1">
                                <span>Despesas ({finResumo.total_receitas > 0 ? Math.round((finResumo.total_despesas / finResumo.total_receitas) * 100) : 0}%)</span>
                                <span>Lucro ({Math.max(0, Math.round(margemLucro))}%)</span>
                            </div>
                            <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
                                <div className="h-full bg-red-400" style={{ width: `${Math.min(100, (finResumo.total_despesas / finResumo.total_receitas) * 100)}%` }}></div>
                                <div className="h-full bg-green-400" style={{ width: `${Math.max(0, margemLucro)}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
