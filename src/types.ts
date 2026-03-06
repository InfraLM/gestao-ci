
export interface Student {
    id: string;
    name: string;
    cpf?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    address?: string;
    observations?: string;
    dateJoined: string;
    course: string;
    status: 'Onboarding' | 'Active' | 'Completed' | 'Pending';
    paymentStatus?: 'Paid' | 'Pending';
}

export interface Class {
    id: string;
    name: string;
    instructor?: string;
    students: number;
    capacity: number;
    progress?: number;
    date?: string;
    time?: string;
    location?: string;
    description?: string;
    classStatus?: 'EM ABERTO' | 'CANCELADA' | 'LOTADA' | 'ACONTECEU';
}

export interface FinancialTransaction {
    id: number;
    date: string;
    category: string;
    description: string;
    amount: number;
    class: string;
    type: 'Income' | 'Expense';
    quantity?: number;
    unitValue?: number;
    observations?: string;
}

export interface OnboardingStudent {
    id: number;
    name: string;
    email: string;
    step: 'Boas-vindas' | 'Envio do Livro' | 'Grupo da Turma' | 'Concluído';
    progress: number;
}
