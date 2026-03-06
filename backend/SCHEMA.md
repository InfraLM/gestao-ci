# 📋 Documentação do Schema de Dados - Dashboard de Gestão

**Última atualização:** Fevereiro 2026  
**Namespace:** `lovable`

---

## 📑 Índice Rápido

- [Tabelas](#tabelas)
  - [ci_turmas](#ci_turmas)
  - [ci_alunos](#ci_alunos)
  - [ci_aluno_turma](#ci_aluno_turma)
  - [ci_financeiro](#ci_financeiro)
  - [ci_financeiro_aluno](#ci_financeiro_aluno)
- [Views](#views)
- [Relacionamentos](#relacionamentos)
- [Índices Criados](#índices-criados)

---

## 📊 Tabelas

### ci_turmas
**Descrição:** Tabela de turmas, eventos e cursos

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | VARCHAR(255) | PRIMARY KEY, NOT NULL | Identificador único |
| `tipo` | VARCHAR(255) | NOT NULL | Tipo de turma (ex: "Curso", "Workshop", "Palestra") |
| `data_evento` | DATE | - | Data do evento/turma |
| `descricao` | VARCHAR(1000) | - | Descrição detalhada |
| `horario` | VARCHAR(100) | - | Horário (ex: "14:00 - 16:00") |
| `local` | VARCHAR(255) | - | Local/sala de aula |
| `capacidade` | INTEGER | - | Número máximo de alunos |
| `instrutor` | VARCHAR(255) | - | Nome do instrutor/professor |
| `status` | VARCHAR(50) | DEFAULT 'Aberta' | Status: 'Aberta', 'Fechada', 'Concluída', 'Cancelada' |
| `data_criacao` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação do registro |
| `data_atualizacao` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data da última atualização |

**Índices:**
- `idx_turmas_status` - Campo status
- `idx_turmas_tipo` - Campo tipo
- `idx_turmas_data_evento` - Campo data_evento

---

### ci_alunos
**Descrição:** Tabela base de alunos

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | VARCHAR(255) | PRIMARY KEY, NOT NULL | Identificador único |
| `nome` | VARCHAR(255) | NOT NULL | Nome completo do aluno |
| `cpf` | VARCHAR(20) | UNIQUE | CPF (único no sistema) |
| `email` | VARCHAR(255) | - | Email do aluno |
| `telefone` | VARCHAR(20) | - | Telefone de contato |
| `data_nascimento` | DATE | - | Data de nascimento |
| `endereco` | VARCHAR(500) | - | Endereço completo |
| `status` | VARCHAR(50) | DEFAULT 'Em Onboarding' | Status: 'Em Onboarding', 'Ativo', 'Inativo', 'Formado' |
| `observacoes` | VARCHAR(1000) | - | Observações sobre o aluno |
| `vendedor` | VARCHAR(100) | - | Nome do vendedor/responsável |
| `pos_graduacao` | BOOLEAN | DEFAULT FALSE | Indicador de pós-graduação |
| `data_cadastro` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `data_atualizacao` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data da última atualização |

**Índices:**
- `idx_alunos_nome` - Campo nome
- `idx_alunos_email` - Campo email
- `idx_alunos_cpf` - Campo cpf
- `idx_alunos_status` - Campo status

---

### ci_aluno_turma
**Descrição:** Tabela de associação entre alunos e turmas (matrícula)

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | VARCHAR(255) | PRIMARY KEY, NOT NULL | Identificador único |
| `aluno_id` | VARCHAR(255) | FK → ci_alunos, NOT NULL | Referência ao aluno |
| `turma_id` | VARCHAR(255) | FK → ci_turmas, NOT NULL | Referência à turma |
| `data_matricula` | DATE | DEFAULT CURRENT_DATE | Data da matrícula |
| `status` | VARCHAR(50) | DEFAULT 'Inscrito' | Status: 'Inscrito', 'Participando', 'Concluído', 'Cancelado' |
| `valor_venda` | NUMERIC(10,2) | - | Valor da venda/matrícula |
| `parcelas` | INTEGER | - | Número de parcelas |
| `data_criacao` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `data_atualizacao` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data da última atualização |

**Constraints:**
- `fk_aluno_turma_aluno` - Aluno (ON DELETE CASCADE, ON UPDATE CASCADE)
- `fk_aluno_turma_turma` - Turma (ON DELETE CASCADE, ON UPDATE CASCADE)
- `uq_aluno_turma` - Unique constraint: (aluno_id, turma_id)

**Índices:**
- `idx_aluno_turma_aluno_id` - Campo aluno_id
- `idx_aluno_turma_turma_id` - Campo turma_id
- `idx_aluno_turma_status` - Campo status
- `idx_aluno_turma_data_matricula` - Campo data_matricula

---

### ci_financeiro
**Descrição:** Tabela de registros financeiros por turma

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | VARCHAR(255) | PRIMARY KEY, NOT NULL | Identificador único |
| `turma_id` | VARCHAR(255) | FK → ci_turmas, NOT NULL | Referência à turma |
| `categoria` | VARCHAR(100) | NOT NULL | Categoria: 'Receita', 'Despesa', 'Ajuste' |
| `tipo` | VARCHAR(50) | NOT NULL | Tipo específico: 'Matrícula', 'Reembolso', 'Aluguel', 'Instrutor', etc. |
| `descricao` | VARCHAR(500) | - | Descrição da transação |
| `quantidade` | INTEGER | NOT NULL | Quantidade de itens/pessoas |
| `valor_total` | NUMERIC(10,2) | - | Valor total da transação |
| `data` | DATE | NOT NULL | Data da transação |
| `observacoes` | VARCHAR(1000) | - | Observações adicionais |
| `data_criacao` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `data_atualizacao` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data da última atualização |

**Constraints:**
- `fk_financeiro_turma` - Turma (ON DELETE CASCADE, ON UPDATE CASCADE)

**Índices:**
- `idx_financeiro_turma_id` - Campo turma_id
- `idx_financeiro_data` - Campo data
- `idx_financeiro_categoria` - Campo categoria
- `idx_financeiro_tipo` - Campo tipo

---

### ci_financeiro_aluno
**Descrição:** Tabela de associação entre financeiro e alunos (rastreamento por aluno)

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | VARCHAR(255) | PRIMARY KEY, NOT NULL | Identificador único |
| `aluno_id` | VARCHAR(255) | FK → ci_alunos, NOT NULL | Referência ao aluno |
| `turma_id` | VARCHAR(255) | FK → ci_turmas, NOT NULL | Referência à turma |
| `financeiro_id` | VARCHAR(255) | FK → ci_financeiro, NOT NULL | Referência ao registro financeiro |
| `valor_matricula` | NUMERIC(10,2) | - | Valor de matrícula do aluno |
| `tipo` | VARCHAR(100) | - | Tipo de transação |
| `data` | DATE | - | Data da transação |
| `status` | VARCHAR(50) | DEFAULT 'Pendente' | Status: 'Pendente', 'Pago', 'Cancelado', 'Atrasado' |
| `data_criacao` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `data_atualizacao` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data da última atualização |

**Constraints:**
- `fk_fin_aluno_aluno` - Aluno (ON DELETE CASCADE, ON UPDATE CASCADE)
- `fk_fin_aluno_turma` - Turma (ON DELETE CASCADE, ON UPDATE CASCADE)
- `fk_fin_aluno_financeiro` - Financeiro (ON DELETE CASCADE, ON UPDATE CASCADE)
- `uq_fin_aluno` - Unique constraint: (aluno_id, financeiro_id, turma_id)

**Índices:**
- `idx_fin_aluno_aluno_id` - Campo aluno_id
- `idx_fin_aluno_turma_id` - Campo turma_id
- `idx_fin_aluno_financeiro_id` - Campo financeiro_id
- `idx_fin_aluno_status` - Campo status

---

## 🔍 Views

### vw_alunos_turmas
**Descrição:** Alunos com suas turmas e informações de matrícula

```sql
SELECT 
    a.id AS aluno_id,
    a.nome,
    a.email,
    a.cpf,
    t.id AS turma_id,
    t.tipo AS turma_tipo,
    t.descricao AS turma_descricao,
    at.data_matricula,
    at.status AS status_matricula,
    at.valor_venda,
    at.parcelas
FROM lovable.ci_alunos a
LEFT JOIN lovable.ci_aluno_turma at ON a.id = at.aluno_id
LEFT JOIN lovable.ci_turmas t ON at.turma_id = t.id;
```

**Campos disponíveis:**
- `aluno_id` - ID do aluno
- `nome` - Nome do aluno
- `email` - Email do aluno
- `cpf` - CPF do aluno
- `turma_id` - ID da turma
- `turma_tipo` - Tipo da turma
- `turma_descricao` - Descrição da turma
- `data_matricula` - Data da matrícula
- `status_matricula` - Status da matrícula
- `valor_venda` - Valor da venda
- `parcelas` - Número de parcelas

---

### vw_financeiro_turmas
**Descrição:** Resumo financeiro por turma

```sql
SELECT 
    t.id AS turma_id,
    t.tipo,
    t.descricao,
    COUNT(DISTINCT f.id) AS total_registros_financeiros,
    SUM(f.valor_total) AS valor_total_financeiro,
    COUNT(DISTINCT fa.aluno_id) AS total_alunos_associados,
    SUM(fa.valor_matricula) AS valor_total_matriculas
FROM lovable.ci_turmas t
LEFT JOIN lovable.ci_financeiro f ON t.id = f.turma_id
LEFT JOIN lovable.ci_financeiro_aluno fa ON t.id = fa.turma_id
GROUP BY t.id, t.tipo, t.descricao;
```

**Campos disponíveis:**
- `turma_id` - ID da turma
- `tipo` - Tipo da turma
- `descricao` - Descrição da turma
- `total_registros_financeiros` - Total de registros financeiros
- `valor_total_financeiro` - Soma de valores financeiros
- `total_alunos_associados` - Quantidade de alunos únicos
- `valor_total_matriculas` - Soma de valores de matrícula

---

## 🔗 Relacionamentos

```
┌─────────────────┐
│   ci_turmas     │
│   (Turmas)      │
└────────┬────────┘
         │ (1:N)
         │
         ├──────────────────────────┬──────────────────┬─────────────┐
         │                          │                  │             │
    ┌────▼──────────────┐    ┌─────▼──────────┐  ┌───▼─────────┐  ┌▼─────────────────┐
    │ ci_aluno_turma    │    │ ci_financeiro  │  │  ci_alunos  │  │ci_financeiro_alun│
    │ (Matrícula)       │    │ (Financeiro)   │  │  (Alunos)   │  │     o             │
    └────┬──────────────┘    └─────┬──────────┘  └─────────────┘  └──────────────────┘
         │ (N:1)                   │ (N:1)
         │                         │
    ┌────▼──────────────┐     ┌────▼──────────────────┐
    │   ci_alunos       │     │ ci_financeiro_aluno   │
    │   (Alunos)        │     │ (Aluno-Financeiro)    │
    └───────────────────┘     └───────────────────────┘
```

### Resumo dos Relacionamentos:

- **ci_turmas** ← → **ci_aluno_turma** ← → **ci_alunos**  
  (Muitos para muitos com dados de matrícula)

- **ci_turmas** ← → **ci_financeiro**  
  (Uma turma pode ter múltiplos registros financeiros)

- **ci_alunos** ← → **ci_financeiro_aluno** ← → **ci_financeiro**  
  (Rastreamento financeiro por aluno)

---

## 📇 Índices Criados

### Tabela ci_turmas
- `idx_turmas_status` - Otimiza filtros por status
- `idx_turmas_tipo` - Otimiza filtros por tipo
- `idx_turmas_data_evento` - Otimiza filtros por data

### Tabela ci_alunos
- `idx_alunos_nome` - Otimiza buscas por nome
- `idx_alunos_email` - Otimiza buscas por email
- `idx_alunos_cpf` - Otimiza validações de CPF único
- `idx_alunos_status` - Otimiza filtros por status

### Tabela ci_aluno_turma
- `idx_aluno_turma_aluno_id` - Otimiza joins com alunos
- `idx_aluno_turma_turma_id` - Otimiza joins com turmas
- `idx_aluno_turma_status` - Otimiza filtros por status
- `idx_aluno_turma_data_matricula` - Otimiza filtros por data

### Tabela ci_financeiro
- `idx_financeiro_turma_id` - Otimiza joins com turmas
- `idx_financeiro_data` - Otimiza filtros por período
- `idx_financeiro_categoria` - Otimiza filtros por categoria
- `idx_financeiro_tipo` - Otimiza filtros por tipo

### Tabela ci_financeiro_aluno
- `idx_fin_aluno_aluno_id` - Otimiza joins com alunos
- `idx_fin_aluno_turma_id` - Otimiza joins com turmas
- `idx_fin_aluno_financeiro_id` - Otimiza joins com financeiro
- `idx_fin_aluno_status` - Otimiza filtros por status

---

## 💡 Dicas para Desenvolvimento

### Ao criar Controllers/Rotas:

1. **Para listar alunos de uma turma:**
   - Use a view `vw_alunos_turmas` com filtro `turma_id`
   - Ou faça JOIN entre `ci_aluno_turma` e `ci_alunos`

2. **Para obter resumo financeiro de turma:**
   - Use a view `vw_financeiro_turmas`
   - Filtre por `turma_id`

3. **Para buscar aluno por CPF:**
   - Usa índice existente em `idx_alunos_cpf`
   - Será rápido mesmo em grandes volumes

4. **Para filtros de data/período:**
   - Use os índices em `data_evento`, `data_matricula`, `data`
   - Filtros numéricos serão otimizados

5. **Sempre use `ON DELETE CASCADE`:**
   - Deletar uma turma remove automaticamente alunos associados
   - Deletar um aluno remove suas matrículas

### Status Esperados:

**Turmas:** Aberta, Fechada, Concluída, Cancelada  
**Alunos:** Em Onboarding, Ativo, Inativo, Formado  
**Matrícula:** Inscrito, Participando, Concluído, Cancelado  
**Financeiro:** Pendente, Pago, Cancelado, Atrasado

---

## 🔐 Restrições de Integridade

- Um aluno não pode estar matriculado **duas vezes** na mesma turma (constraint `uq_aluno_turma`)
- Um registro financeiro não pode estar associado **duas vezes** ao mesmo aluno na mesma turma (constraint `uq_fin_aluno`)
- CPF é único no sistema - não há duplicatas de alunos (constraint `UNIQUE` em `cpf`)
- Deletar uma turma remove todas as matrículas, registros financeiros e associações em cascata

---

**Última revisão:** Fevereiro 2026