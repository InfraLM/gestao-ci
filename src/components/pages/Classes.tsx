
import React, { useState, useEffect } from 'react';
import { Class } from '../../types';
import ErrorMessage from '../ErrorMessage';
import DateInput from '../DateInput';
import Select from '../Select';
import ClassFormModal from '../modals/ClassFormModal';
import ClassDetailsModal from '../modals/ClassDetailsModal';
import { useAuth } from '../../context/AuthContext';
import { turmasAPI } from '../../services/api';

const ClassCard: React.FC<{ classInfo: Class; onCardClick: () => void }> = ({ classInfo, onCardClick }) => {
    const percentage = classInfo.capacity > 0
        ? Math.round((classInfo.students / classInfo.capacity) * 100)
        : 0;

    // Determinar cor da barra baseada no percentual
    const getProgressColor = () => {
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 70) return 'bg-yellow-500';
        return 'bg-brand-teal';
    };

    // Determinar cor do card baseada no status
    const getCardColor = () => {
        switch (classInfo.classStatus) {
            case 'CANCELADA':
                return 'bg-red-50 border-2 border-red-300';
            case 'LOTADA':
                return 'bg-green-50 border-2 border-green-300';
            case 'ACONTECEU':
                return 'bg-gray-100 border-2 border-gray-300';
            default:
                return 'bg-white';
        }
    };

    return (
        <div
            className={`${getCardColor()} p-4 rounded-lg shadow-md flex flex-col justify-between cursor-pointer hover:shadow-lg transition-all`}
            onClick={onCardClick}
        >
            <div>
                <h3 className="font-bold text-lg text-brand-dark">{classInfo.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{classInfo.date || 'Data não definida'}</p>
            </div>
            <div className="mt-4">
                <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>{classInfo.students} alunos/{classInfo.capacity} capacidade</span>
                    <span className="font-semibold">{percentage}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div
                        className={`h-2 ${getProgressColor()} rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    classInfo.classStatus === 'CANCELADA' ? 'bg-red-100 text-red-800' :
                    classInfo.classStatus === 'LOTADA' ? 'bg-green-100 text-green-800' :
                    classInfo.classStatus === 'ACONTECEU' ? 'bg-gray-200 text-gray-700' :
                    'bg-blue-100 text-blue-800'
                }`}>
                    {classInfo.classStatus || 'EM ABERTO'}
                </span>
                <button className="text-gray-400 hover:text-brand-teal p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

const getBadgeColor = (name?: string) => {
    switch (name) {
        case 'BLS': return 'bg-blue-100 text-blue-800';
        case 'ACLS': return 'bg-red-100 text-red-800';
        case 'ATLS': return 'bg-amber-100 text-amber-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const CalendarView: React.FC<{ classes: Class[]; onClassClick: (id: string) => void }> = ({ classes, onClassClick }) => {
    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(now.getMonth());
    const [currentYear, setCurrentYear] = useState(now.getFullYear());

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOffset = new Date(currentYear, currentMonth, 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOffset });

    const prevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
    };

    const getClassesForDay = (day: number): Class[] => {
        return classes.filter(c => {
            if (!c.date) return false;
            const parts = c.date.split('/');
            if (parts.length !== 3) return false;
            const [d, m, y] = parts;
            return parseInt(d) === day && parseInt(m) === currentMonth + 1 && parseInt(y) === currentYear;
        });
    };

    const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="bg-white p-6 rounded-xl shadow-md mt-6">
            <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
                <h2 className="text-xl font-bold capitalize">{monthLabel}</h2>
                <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-600">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {blanks.map((_, i) => <div key={`blank-${i}`} className="border rounded-lg h-28"></div>)}
                {days.map(day => {
                    const dayClasses = getClassesForDay(day);
                    const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
                    return (
                        <div key={day} className={`border rounded-lg h-28 p-1 text-left overflow-hidden ${isToday ? 'border-brand-teal border-2' : ''}`}>
                            <span className={`font-semibold text-sm ${isToday ? 'text-brand-teal' : ''}`}>{day}</span>
                            <div className="mt-1 space-y-0.5 overflow-y-auto max-h-[72px]">
                                {dayClasses.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => onClassClick(c.id)}
                                        className={`block w-full text-left px-1 py-0.5 rounded text-[10px] font-semibold truncate cursor-pointer hover:opacity-80 ${getBadgeColor(c.name)}`}
                                    >
                                        {c.name} ({c.students}/{c.capacity})
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Classes: React.FC = () => {
    const { isVendedor } = useAuth();
    const [view, setView] = useState<'Cards' | 'Calendar'>('Cards');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [classes, setClasses] = useState<Class[]>([]);
    const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Estados dos filtros
    const [filters, setFilters] = useState({
        tipo: '',
        status: '',
        dataInicio: null as Date | null,
        dataFim: null as Date | null,
        ordenacao: 'proximos' as 'proximos' | 'distantes',
        busca: ''
    });

    const fetchClasses = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await turmasAPI.listarComResumo();
            setClasses(result.data || []);
            setFilteredClasses(result.data || []);
        } catch (err) {
            console.error('Erro ao carregar turmas:', err);
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, classes]);

    const applyFilters = () => {
        let result = [...classes];

        // Filtro por tipo
        if (filters.tipo) {
            result = result.filter(c => c.name?.includes(filters.tipo));
        }

        // Filtro por status
        if (filters.status) {
            result = result.filter(c => c.classStatus === filters.status);
        }

        // Filtro por busca
        if (filters.busca) {
            const searchLower = filters.busca.toLowerCase();
            result = result.filter(c =>
                c.name?.toLowerCase().includes(searchLower) ||
                c.instructor?.toLowerCase().includes(searchLower)
            );
        }

        // Filtro por data
        if (filters.dataInicio || filters.dataFim) {
            result = result.filter(c => {
                if (!c.date) return false;
                const [day, month, year] = c.date.split('/');
                const classDate = new Date(`${year}-${month}-${day}`);

                if (filters.dataInicio && classDate < filters.dataInicio) return false;
                if (filters.dataFim && classDate > filters.dataFim) return false;

                return true;
            });
        }

        // Ordenação por data
        result.sort((a, b) => {
            if (!a.date || !b.date) return 0;

            const [dayA, monthA, yearA] = a.date.split('/');
            const [dayB, monthB, yearB] = b.date.split('/');
            const dateA = new Date(`${yearA}-${monthA}-${dayA}`);
            const dateB = new Date(`${yearB}-${monthB}-${dayB}`);

            return filters.ordenacao === 'proximos'
                ? dateA.getTime() - dateB.getTime()
                : dateB.getTime() - dateA.getTime();
        });

        setFilteredClasses(result);
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            tipo: '',
            status: '',
            dataInicio: null,
            dataFim: null,
            ordenacao: 'proximos',
            busca: ''
        });
    };

    return (
        <>
            <ClassFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchClasses}
            />
            <ClassDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedClassId(null);
                }}
                classId={selectedClassId || ''}
                onSuccess={fetchClasses}
            />
            <div className="p-8">
                <header>
                    <h1 className="text-3xl font-bold text-gray-900">Gestão de Turmas e Cronograma</h1>
                    <p className="text-gray-500 mt-1">Gerencie as turmas e cronogramas de tratamento</p>
                </header>

                {/* Barra de busca e ações */}
                <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                    <div className="relative w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Buscar por nome ou instrutor..."
                            value={filters.busca}
                            onChange={(e) => handleFilterChange('busca', e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="bg-gray-200 p-1 rounded-lg flex">
                            <button
                                onClick={() => setView('Cards')}
                                className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'Cards' ? 'bg-white shadow' : ''}`}
                            >
                                Cards
                            </button>
                            <button
                                onClick={() => setView('Calendar')}
                                className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'Calendar' ? 'bg-white shadow' : ''}`}
                            >
                                Calendário
                            </button>
                        </div>
                        {!isVendedor && (
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`border rounded-lg px-4 py-2 text-sm ${showFilters ? 'bg-brand-teal text-white' : ''}`}
                            >
                                Filtrar
                            </button>
                        )}
                        {!isVendedor && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-brand-teal text-white font-bold py-2 px-4 rounded-lg flex items-center"
                            >
                                <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Nova Turma
                            </button>
                        )}
                    </div>
                </div>

                {/* Painel de filtros */}
                {showFilters && (
                    <div className="mt-4 bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Filtros Avançados</h3>
                            <button
                                onClick={clearFilters}
                                className="text-sm text-brand-teal hover:text-teal-600"
                            >
                                Limpar Filtros
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <Select
                                label="Tipo"
                                value={filters.tipo}
                                onChange={(v) => handleFilterChange('tipo', v)}
                                options={[
                                    { value: 'BLS', label: 'BLS' },
                                    { value: 'ATLS', label: 'ATLS' },
                                    { value: 'ACLS', label: 'ACLS' },
                                    { value: 'OUTRO', label: 'OUTRO' },
                                ]}
                                placeholder="Todos"
                            />

                            <Select
                                label="Status"
                                value={filters.status}
                                onChange={(v) => handleFilterChange('status', v)}
                                options={[
                                    { value: 'EM ABERTO', label: 'EM ABERTO' },
                                    { value: 'CANCELADA', label: 'CANCELADA' },
                                    { value: 'LOTADA', label: 'LOTADA' },
                                    { value: 'ACONTECEU', label: 'ACONTECEU' },
                                ]}
                                placeholder="Todos"
                            />

                            <DateInput
                                label="De"
                                value={filters.dataInicio}
                                onChange={(date) => handleFilterChange('dataInicio', date)}
                                placeholder="dd/mm/aaaa"
                            />

                            <DateInput
                                label="Ate"
                                value={filters.dataFim}
                                onChange={(date) => handleFilterChange('dataFim', date)}
                                placeholder="dd/mm/aaaa"
                            />

                            <Select
                                label="Ordenacao"
                                value={filters.ordenacao}
                                onChange={(v) => handleFilterChange('ordenacao', v)}
                                options={[
                                    { value: 'proximos', label: 'Proximos' },
                                    { value: 'distantes', label: 'Distantes' },
                                ]}
                            />
                        </div>
                        {/* Badge do range selecionado */}
                        {filters.dataInicio && filters.dataFim && (
                            <div className="mt-3 flex items-center gap-2">
                                <span className="inline-flex items-center px-3 py-1 bg-brand-teal/10 text-brand-teal text-sm font-medium rounded-full">
                                    {filters.dataInicio.toLocaleDateString('pt-BR')} - {filters.dataFim.toLocaleDateString('pt-BR')}
                                    <button
                                        onClick={() => { handleFilterChange('dataInicio', null); handleFilterChange('dataFim', null); }}
                                        className="ml-2 hover:text-teal-800"
                                    >
                                        &times;
                                    </button>
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Resultados */}
                {loading ? (
                    <div className="mt-6 text-center py-8 text-gray-500">
                        Carregando turmas do banco de dados...
                    </div>
                ) : error ? (
                    <div className="mt-6">
                        <ErrorMessage error={error} onRetry={fetchClasses} />
                    </div>
                ) : filteredClasses.length === 0 ? (
                    <div className="mt-6 text-center py-8 text-gray-500">
                        Nenhuma turma encontrada com os filtros aplicados.
                    </div>
                ) : view === 'Cards' ? (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredClasses.map(c => (
                            <ClassCard
                                key={c.id}
                                classInfo={c}
                                onCardClick={() => {
                                    setSelectedClassId(c.id);
                                    setIsDetailsModalOpen(true);
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <CalendarView
                        classes={filteredClasses}
                        onClassClick={(id) => {
                            setSelectedClassId(id);
                            setIsDetailsModalOpen(true);
                        }}
                    />
                )}
            </div>
        </>
    );
};

export default Classes;
