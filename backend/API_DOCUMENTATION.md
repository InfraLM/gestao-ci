# 📚 Documentação da API - Dashboard de Gestão

**Base URL:** `http://localhost:3001/admin-certificacoes/api`

---

## 📋 Índice de Endpoints

### Health & Status
- [Health Check](#health-check)

### Alunos
- [CRUD de Alunos](#alunos)
- [Operações por Turma](#alunos-por-turma)
- [Estatísticas](#estatísticas-de-alunos)

### Turmas
- [CRUD de Turmas](#turmas)
- [Operações Avançadas](#turmas-avançado)
- [Estatísticas](#estatísticas-de-turmas)

### Matrículas
- [CRUD de Matrículas](#matrículas)
- [Verificações](#verificação-de-matrícula)

### Financeiro
- [CRUD Financeiro](#financeiro)
- [Views e Resumos](#financeiro-avançado)

### Financeiro-Aluno
- [CRUD Financeiro-Aluno](#financeiro-aluno)
- [Históricos e Resumos](#financeiro-aluno-avançado)

---

## 🏥 Health Check

### GET `/health`
Verifica a saúde da API e a conexão com o banco de dados.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-05T10:30:00Z",
  "environment": "development",
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "lovable",
    "connected": true,
    "serverTime": "2026-02-05T10:30:00Z",
    "version": "PostgreSQL 14.0"
  }
}
```

---

## 👥 Alunos

### POST `/alunos`
Cria um novo aluno.

**Request Body:**
```json
{
  "nome": "João Silva",
  "cpf": "123.456.789-00",
  "email": "joao@example.com",
  "telefone": "(11) 98765-4321",
  "data_nascimento": "1990-05-15",
  "endereco": "Rua A, 123",
  "status": "Em Onboarding",
  "observacoes": "Aluno novo",
  "vendedor": "Carlos",
  "pos_graduacao": false
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-aqui",
  "nome": "João Silva",
  "cpf": "123.456.789-00",
  "email": "joao@example.com",
  "status": "Em Onboarding",
  "data_cadastro": "2026-02-05T10:30:00Z",
  "data_atualizacao": "2026-02-05T10:30:00Z"
}
```

### GET `/alunos`
Lista alunos com filtros opcionais.

**Query Parameters:**
- `nome` - Filtro por nome (partial match)
- `email` - Filtro por email (partial match)
- `cpf` - Filtro por CPF (exact match)
- `status` - Filtro por status
- `vendedor` - Filtro por vendedor
- `page` - Número da página (default: 1)
- `limit` - Registros por página (default: 10)

**Example:**
```
GET /alunos?nome=João&status=Ativo&page=1&limit=10
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "nome": "João Silva",
      "cpf": "123.456.789-00",
      "email": "joao@example.com",
      "status": "Ativo",
      "data_cadastro": "2026-02-05T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

### GET `/alunos/:id`
Obtém um aluno específico.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "nome": "João Silva",
  "cpf": "123.456.789-00",
  "email": "joao@example.com",
  "telefone": "(11) 98765-4321",
  "data_nascimento": "1990-05-15",
  "endereco": "Rua A, 123",
  "status": "Ativo",
  "observacoes": "Aluno novo",
  "vendedor": "Carlos",
  "pos_graduacao": false,
  "data_cadastro": "2026-02-05T10:30:00Z",
  "data_atualizacao": "2026-02-05T10:30:00Z"
}
```

### PUT `/alunos/:id`
Atualiza um aluno (campos enviados serão atualizados).

**Request Body:** (todos os campos opcionais)
```json
{
  "nome": "João Silva Atualizado",
  "status": "Formado"
}
```

**Response:** `200 OK` - Retorna aluno atualizado

### DELETE `/alunos/:id`
Deleta um aluno.

**Response:** `200 OK`
```json
{
  "message": "Aluno deletado com sucesso",
  "deletedAluno": { /* aluno deletado */ }
}
```

### GET `/alunos/stats/resumo`
Obtém estatísticas gerais de alunos.

**Response:**
```json
{
  "total_alunos": 350,
  "em_onboarding": 12,
  "ativos": 280,
  "inativos": 40,
  "formados": 18,
  "com_pos_graduacao": 85
}
```

### GET `/alunos/:alunoId/turmas`
Lista turmas de um aluno.

**Response:**
```json
[
  {
    "id": "turma-id",
    "tipo": "ACLS",
    "descricao": "Suporte de Vida Avançado",
    "data_evento": "2026-03-15",
    "data_matricula": "2026-02-01",
    "status_matricula": "Inscrito",
    "valor_venda": 1500.00,
    "parcelas": 3
  }
]
```

### GET `/alunos/turma/:turmaId/alunos`
Lista alunos de uma turma.

**Response:**
```json
[
  {
    "id": "aluno-id",
    "nome": "João Silva",
    "email": "joao@example.com",
    "data_matricula": "2026-02-01",
    "status_matricula": "Inscrito",
    "valor_venda": 1500.00,
    "parcelas": 3
  }
]
```

---

## 🎓 Turmas

### POST `/turmas`
Cria uma nova turma.

**Request Body:**
```json
{
  "tipo": "ACLS",
  "data_evento": "2026-03-15",
  "descricao": "Suporte de Vida Avançado",
  "horario": "14:00-16:00",
  "local": "Sala 101",
  "capacidade": 20,
  "instrutor": "Dr. Silva",
  "status": "Aberta"
}
```

**Response:** `201 Created`

### GET `/turmas`
Lista turmas com filtros.

**Query Parameters:**
- `tipo` - Filtro por tipo
- `status` - Filtro por status (Aberta, Fechada, Concluída, Cancelada)
- `instrutor` - Filtro por instrutor
- `page` - Página (default: 1)
- `limit` - Limite (default: 10)

### GET `/turmas/:id`
Obtém turma com contagem de alunos inscritos.

**Response:**
```json
{
  "id": "turma-id",
  "tipo": "ACLS",
  "data_evento": "2026-03-15",
  "capacidade": 20,
  "alunos_inscritos": 15,
  "status": "Aberta"
}
```

### PUT `/turmas/:id`
Atualiza uma turma.

### DELETE `/turmas/:id`
Deleta uma turma (cascata remove matrículas).

### GET `/turmas/stats/resumo`
Estatísticas de turmas.

**Response:**
```json
{
  "total_turmas": 8,
  "abertas": 4,
  "fechadas": 2,
  "concluidas": 2,
  "capacidade_total": 160,
  "total_alunos_matriculados": 95
}
```

### GET `/turmas/resumo/todas`
Lista todas as turmas com percentual de ocupação.

**Response:**
```json
[
  {
    "id": "turma-id",
    "tipo": "ACLS",
    "alunos_inscritos": 15,
    "capacidade": 20,
    "percentual_ocupacao": 75.00
  }
]
```

---

## 📝 Matrículas

### POST `/matriculas`
Matricula um aluno em uma turma.

**Request Body:**
```json
{
  "aluno_id": "aluno-uuid",
  "turma_id": "turma-uuid",
  "status": "Inscrito",
  "valor_venda": 1500.00,
  "parcelas": 3
}
```

**Response:** `201 Created`

**Erros Possíveis:**
- `409` - Aluno já matriculado nesta turma
- `400` - Aluno ou turma não existe

### GET `/matriculas`
Lista matrículas com filtros.

**Query Parameters:**
- `aluno_id` - Filtro por aluno
- `turma_id` - Filtro por turma
- `status` - Filtro por status
- `page` - Página
- `limit` - Limite

### GET `/matriculas/:id`
Obtém matrícula específica.

### PUT `/matriculas/:id`
Atualiza matrícula (status, valor, parcelas).

### DELETE `/matriculas/:id`
Deleta matrícula.

### GET `/matriculas/verificar/:aluno_id/:turma_id`
Verifica se aluno está matriculado em turma.

**Response:**
```json
{
  "existe": true,
  "dados": { /* matrícula se existir */ }
}
```

### GET `/matriculas/stats/resumo`
Estatísticas de matrículas.

**Response:**
```json
{
  "total_matriculas": 250,
  "total_alunos_unicos": 180,
  "inscritos": 150,
  "participando": 80,
  "concluidos": 20,
  "valor_total_vendas": 375000.00
}
```

---

## 💰 Financeiro

### POST `/financeiro`
Cria registro financeiro.

**Request Body:**
```json
{
  "turma_id": "turma-uuid",
  "categoria": "Receita",
  "tipo": "Matrícula",
  "descricao": "Matrícula ACLS",
  "quantidade": 1,
  "valor_total": 1500.00,
  "data": "2026-02-05",
  "observacoes": "Pagamento à vista"
}
```

**Response:** `201 Created`

### GET `/financeiro`
Lista registros com filtros.

**Query Parameters:**
- `turma_id` - Filtro por turma
- `categoria` - Filtro por categoria (Receita, Despesa, Ajuste)
- `tipo` - Filtro por tipo
- `data_inicio` - Data mínima
- `data_fim` - Data máxima
- `page` - Página
- `limit` - Limite

### GET `/financeiro/:id`
Obtém registro específico.

### PUT `/financeiro/:id`
Atualiza registro.

### DELETE `/financeiro/:id`
Deleta registro.

### GET `/financeiro/turma/:turmaId`
Lista financeiro de uma turma.

### GET `/financeiro/stats/resumo`
Estatísticas financeiras.

**Response:**
```json
{
  "total_registros": 150,
  "total_receitas": 500000.00,
  "total_despesas": 120000.00,
  "saldo_liquido": 380000.00,
  "tipos_unicos": 5,
  "turmas_com_registros": 8
}
```

### GET `/financeiro/periodo/resumo`
Resumo por período.

**Query Parameters:**
- `data_inicio` - Data início
- `data_fim` - Data fim
- `turma_id` - Turma específica (opcional)

**Response:**
```json
[
  {
    "categoria": "Receita",
    "tipo": "Matrícula",
    "quantidade_registros": 25,
    "quantidade_total": 30,
    "valor_total": 45000.00
  }
]
```

---

## 👤💰 Financeiro Aluno

### POST `/financeiro-aluno`
Associa registro financeiro com aluno.

**Request Body:**
```json
{
  "aluno_id": "aluno-uuid",
  "turma_id": "turma-uuid",
  "financeiro_id": "financeiro-uuid",
  "valor_matricula": 1500.00,
  "tipo": "Matrícula",
  "data": "2026-02-05",
  "status": "Pendente"
}
```

**Response:** `201 Created`

### GET `/financeiro-aluno`
Lista associações com filtros.

### GET `/financeiro-aluno/aluno/:alunoId/historico`
Histórico financeiro completo do aluno.

**Response:**
```json
[
  {
    "id": "uuid",
    "aluno_id": "aluno-uuid",
    "turma_id": "turma-uuid",
    "categoria": "Receita",
    "tipo": "Matrícula",
    "descricao": "Matrícula ACLS",
    "valor_matricula": 1500.00,
    "data": "2026-02-05",
    "status": "Pago"
  }
]
```

### GET `/financeiro-aluno/aluno/:alunoId/resumo`
Resumo financeiro do aluno.

**Response:**
```json
{
  "total_registros": 5,
  "valor_pendente": 0.00,
  "valor_pago": 3000.00,
  "valor_atrasado": 0.00,
  "valor_total": 3000.00
}
```

### GET `/financeiro-aluno/aluno/:alunoId/turma/:turmaId`
Financeiro do aluno em uma turma específica.

### PUT `/financeiro-aluno/:id`
Atualiza status de pagamento, valor, etc.

### DELETE `/financeiro-aluno/:id`
Deleta associação.

### GET `/financeiro-aluno/stats/resumo`
Estatísticas gerais.

---

## 🔐 Status de Resposta HTTP

| Código | Significado |
|--------|------------|
| `200` | OK - Requisição bem-sucedida |
| `201` | Created - Recurso criado |
| `400` | Bad Request - Dados inválidos |
| `404` | Not Found - Recurso não encontrado |
| `409` | Conflict - Conflito (ex: CPF duplicado) |
| `500` | Internal Server Error - Erro do servidor |

---

## 📝 Validações Importantes

### Alunos
- `nome` e `cpf` são obrigatórios
- `cpf` deve ser único no sistema
- `status` pode ser: "Em Onboarding", "Ativo", "Inativo", "Formado"

### Turmas
- `tipo` é obrigatório
- `status` pode ser: "Aberta", "Fechada", "Concluída", "Cancelada"

### Matrículas
- Um aluno não pode ser matriculado 2x na mesma turma
- Deletar turma remove todas matrículas associadas (cascata)

### Financeiro
- `turma_id`, `categoria`, `tipo`, `quantidade` e `data` são obrigatórios

---

## 🚀 Exemplo de Uso com JavaScript

```javascript
import { alunosAPI, turmasAPI, matriculasAPI } from './services/api';

// Criar aluno
const novoAluno = await alunosAPI.criar({
  nome: 'João Silva',
  cpf: '123.456.789-00',
  email: 'joao@example.com'
});

// Listar turmas
const turmas = await turmasAPI.listar({ status: 'Aberta' });

// Matricular aluno
const matricula = await matriculasAPI.criar({
  aluno_id: novoAluno.id,
  turma_id: turmas[0].id,
  valor_venda: 1500
});

// Obter estatísticas
const stats = await alunosAPI.estatisticas();
```

---

**Última atualização:** Fevereiro 2026
