/**
 * API Service
 * Centralized HTTP client for all API calls with retry, timeout, and error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================================================
// ERROR CLASSES
// ============================================================================
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// ============================================================================
// SAFE FETCH — retry + timeout wrapper
// ============================================================================
async function safeFetch(url: string, options?: RequestInit): Promise<any> {
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, attempt * 1000));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new ApiError(
          body.message || body.error || `Erro ${response.status}`,
          response.status,
          body.code
        );
      }

      return await response.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      // 401 = token invalido/expirado — forcar logout
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem('ci_token');
        localStorage.removeItem('ci_user');
        window.location.reload();
        throw err;
      }
      if (err instanceof ApiError) throw err;
      if (err.name === 'AbortError') {
        throw new NetworkError('A requisicao excedeu o tempo limite (10s)');
      }

      // Network error (Failed to fetch) — retry
      if (attempt === maxRetries) {
        throw new NetworkError(
          'Nao foi possivel conectar ao servidor. Verifique sua conexao.'
        );
      }
    }
  }

  throw lastError || new NetworkError('Erro desconhecido');
}

// ============================================================================
// HELPERS
// ============================================================================
const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
  const token = localStorage.getItem('ci_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const addCacheBuster = (url: string) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${Date.now()}`;
};

// ============================================================================
// ALUNOS API
// ============================================================================
export const alunosAPI = {
  criar: (data: any) => safeFetch(`${API_BASE_URL}/alunos`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  }),

  listar: (filters: any = {}) => {
    const params = new URLSearchParams(filters);
    const url = addCacheBuster(`${API_BASE_URL}/alunos?${params}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  obter: (id: string) => {
    const url = addCacheBuster(`${API_BASE_URL}/alunos/${id}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  atualizar: (id: string, data: any) => safeFetch(`${API_BASE_URL}/alunos/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  }),

  deletar: (id: string) => safeFetch(`${API_BASE_URL}/alunos/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  }),

  obterPorTurma: (turmaId: string) => {
    const url = addCacheBuster(`${API_BASE_URL}/alunos/turma/${turmaId}/alunos`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  obterTurmas: (alunoId: string) => {
    const url = addCacheBuster(`${API_BASE_URL}/alunos/${alunoId}/turmas`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  estatisticas: () => {
    const url = addCacheBuster(`${API_BASE_URL}/alunos/stats/resumo`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  relatorio: () => {
    const url = addCacheBuster(`${API_BASE_URL}/alunos/relatorio`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },
};

// ============================================================================
// TURMAS API
// ============================================================================
export const turmasAPI = {
  criar: (data: any) => safeFetch(`${API_BASE_URL}/turmas`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  }),

  listar: (filters: any = {}) => {
    const params = new URLSearchParams(filters);
    const url = addCacheBuster(`${API_BASE_URL}/turmas?${params}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  obter: (id: string) => {
    const url = addCacheBuster(`${API_BASE_URL}/turmas/${id}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  atualizar: (id: string, data: any) => safeFetch(`${API_BASE_URL}/turmas/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  }),

  deletar: (id: string) => safeFetch(`${API_BASE_URL}/turmas/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  }),

  listarComResumo: () => {
    const url = addCacheBuster(`${API_BASE_URL}/turmas/resumo/todas`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  listarAbertas: () => {
    const url = addCacheBuster(`${API_BASE_URL}/turmas/abertas/disponiveis`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  estatisticas: () => {
    const url = addCacheBuster(`${API_BASE_URL}/turmas/stats/resumo`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },
};

// ============================================================================
// MATRÍCULAS API
// ============================================================================
export const matriculasAPI = {
  criar: (data: any) => safeFetch(`${API_BASE_URL}/matriculas`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  }),

  listar: (filters: any = {}) => {
    const params = new URLSearchParams(filters);
    const url = addCacheBuster(`${API_BASE_URL}/matriculas?${params}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  obter: (id: string) => {
    const url = addCacheBuster(`${API_BASE_URL}/matriculas/${id}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  atualizar: (id: string, data: any) => safeFetch(`${API_BASE_URL}/matriculas/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  }),

  deletar: (id: string) => safeFetch(`${API_BASE_URL}/matriculas/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  }),

  verificar: (alunoId: string, turmaId: string) => {
    const url = addCacheBuster(`${API_BASE_URL}/matriculas/verificar/${alunoId}/${turmaId}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  obterView: (filters: any = {}) => {
    const params = new URLSearchParams(filters);
    const url = addCacheBuster(`${API_BASE_URL}/matriculas/view/alunos-turmas?${params}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  estatisticas: () => {
    const url = addCacheBuster(`${API_BASE_URL}/matriculas/stats/resumo`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  transferir: (data: { aluno_id: string; turma_origem_id: string; turma_destino_id: string }) =>
    safeFetch(`${API_BASE_URL}/matriculas/transferir`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }),
};

// ============================================================================
// FINANCEIRO API
// ============================================================================
export const financeiroAPI = {
  criar: (data: any) => safeFetch(`${API_BASE_URL}/financeiro`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  }),

  listar: (filters: any = {}) => {
    const params = new URLSearchParams(filters);
    const url = addCacheBuster(`${API_BASE_URL}/financeiro?${params}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  obter: (id: string) => {
    const url = addCacheBuster(`${API_BASE_URL}/financeiro/${id}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  atualizar: (id: string, data: any) => safeFetch(`${API_BASE_URL}/financeiro/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  }),

  deletar: (id: string) => safeFetch(`${API_BASE_URL}/financeiro/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  }),

  obterPorTurma: (turmaId: string) => {
    const url = addCacheBuster(`${API_BASE_URL}/financeiro/turma/${turmaId}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  obterView: () => {
    const url = addCacheBuster(`${API_BASE_URL}/financeiro/view/turmas`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  estatisticas: () => {
    const url = addCacheBuster(`${API_BASE_URL}/financeiro/stats/resumo`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  resumoPeriodo: (filtros: any = {}) => {
    const params = new URLSearchParams(filtros);
    const url = addCacheBuster(`${API_BASE_URL}/financeiro/periodo/resumo?${params}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  resumoCompleto: (filtros: any = {}) => {
    const params = new URLSearchParams(filtros);
    const url = addCacheBuster(`${API_BASE_URL}/financeiro/resumo/completo?${params}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },
};

// ============================================================================
// FINANCEIRO ALUNO API
// ============================================================================
export const financeiroAlunoAPI = {
  criar: (data: any) => safeFetch(`${API_BASE_URL}/financeiro-aluno`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  }),

  listar: (filters: any = {}) => {
    const params = new URLSearchParams(filters);
    const url = addCacheBuster(`${API_BASE_URL}/financeiro-aluno?${params}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  obter: (id: string) => {
    const url = addCacheBuster(`${API_BASE_URL}/financeiro-aluno/${id}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  atualizar: (id: string, data: any) => safeFetch(`${API_BASE_URL}/financeiro-aluno/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  }),

  deletar: (id: string) => safeFetch(`${API_BASE_URL}/financeiro-aluno/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  }),

  obterHistoricoAluno: (alunoId: string) => {
    const url = addCacheBuster(`${API_BASE_URL}/financeiro-aluno/aluno/${alunoId}/historico`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  obterResumoAluno: (alunoId: string) => {
    const url = addCacheBuster(`${API_BASE_URL}/financeiro-aluno/aluno/${alunoId}/resumo`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  obterPorTurma: (alunoId: string, turmaId: string) => {
    const url = addCacheBuster(`${API_BASE_URL}/financeiro-aluno/aluno/${alunoId}/turma/${turmaId}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  estatisticas: () => {
    const url = addCacheBuster(`${API_BASE_URL}/financeiro-aluno/stats/resumo`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },
};

// ============================================================================
// ONBOARDING API
// ============================================================================
export const onboardingAPI = {
  listar: (filters: any = {}) => {
    const params = new URLSearchParams(filters);
    const url = addCacheBuster(`${API_BASE_URL}/onboarding?${params}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  obterPorAluno: (alunoId: string) => {
    const url = addCacheBuster(`${API_BASE_URL}/onboarding/aluno/${alunoId}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  historico: (alunoId: string) => {
    const url = addCacheBuster(`${API_BASE_URL}/onboarding/aluno/${alunoId}/historico`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  atualizar: (id: string, data: any) => safeFetch(`${API_BASE_URL}/onboarding/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  }),

  avancar: (alunoId: string) => safeFetch(`${API_BASE_URL}/onboarding/avancar/${alunoId}`, {
    method: 'PUT',
    headers: getHeaders(),
  }),

  contagem: () => {
    const url = addCacheBuster(`${API_BASE_URL}/onboarding/stats/contagem`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },
};

// ============================================================================
// DASHBOARD API
// ============================================================================
export const dashboardAPI = {
  obterResumo: async () => {
    const [alunosStats, turmasStats, matriculasStats, financeiroStats] = await Promise.all([
      alunosAPI.estatisticas(),
      turmasAPI.estatisticas(),
      matriculasAPI.estatisticas(),
      financeiroAPI.estatisticas(),
    ]);
    return {
      alunos: alunosStats,
      turmas: turmasStats,
      matriculas: matriculasStats,
      financeiro: financeiroStats,
    };
  }
};

// ============================================================================
// HEALTH CHECK (usa fetch direto, sem retry)
// ============================================================================
export const healthAPI = {
  check: () => {
    const url = addCacheBuster(`${API_BASE_URL}/health`);
    return fetch(url, { headers: getHeaders(), cache: 'no-store' }).then(r => r.json());
  },
};

// ============================================================================
// FORMULARIO API
// ============================================================================
export const formularioAPI = {
  listar: (filters: any = {}) => {
    const params = new URLSearchParams(filters);
    const url = addCacheBuster(`${API_BASE_URL}/formulario?${params}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  obter: (id: string) => {
    const url = addCacheBuster(`${API_BASE_URL}/formulario/${id}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },

  resultados: (filters: any = {}) => {
    const params = new URLSearchParams(filters);
    const url = addCacheBuster(`${API_BASE_URL}/formulario/resultados?${params}`);
    return safeFetch(url, { headers: getHeaders(), cache: 'no-store' });
  },
};

// ============================================================================
// AUTH API (sem token — login publico)
// ============================================================================
export const authAPI = {
  login: async (login: string, senha: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, senha }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(data.error || 'Erro no login', response.status);
    }
    return data;
  },
};

export default {
  alunos: alunosAPI,
  turmas: turmasAPI,
  matriculas: matriculasAPI,
  financeiro: financeiroAPI,
  financeiroAluno: financeiroAlunoAPI,
  dashboard: dashboardAPI,
  health: healthAPI,
  auth: authAPI,
};
