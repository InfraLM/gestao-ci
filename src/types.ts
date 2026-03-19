
export interface Student {
    id: string;
    nome: string;
    cpf?: string;
    email?: string;
    telefone?: string;
    data_nascimento?: string;
    endereco?: string;
    observacoes?: string;
    data_cadastro?: string;
    status?: string;
    vendedor?: string;
    pos_graduacao?: boolean;
    aluno_turma?: any[];
    financeiro_aluno?: any[];
}

export interface Class {
    id: string;
    tipo?: string;
    instrutor?: string;
    data_evento_inicio?: string;
    data_evento_fim?: string;
    horario?: string;
    local_evento?: string;
    capacidade?: number;
    descricao?: string;
    status?: string;
    alunos_inscritos: number;
    percentual_ocupacao?: number;
    data_inicio_fmt?: string;
    data_fim_fmt?: string;
    data_display?: string;
}

export interface FinancialTransaction {
    id: string;
    turma_id: string;
    categoria: string;
    descricao?: string;
    valor_total?: number;
    data_movimentacao: string;
    observacoes?: string;
}

export interface OnboardingStudent {
    id: string;
    aluno_id: string;
    nome: string;
    email?: string;
    telefone?: string;
    etapa: string;
    data_mudanca?: string;
    turmas?: any[];
}
