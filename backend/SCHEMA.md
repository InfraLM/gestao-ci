# Schema do Banco de Dados

Gerado a partir de `backend/prisma/schema.prisma`. Todas as tabelas usam o schema PostgreSQL `lovable`.

---

## ci_alunos

| Coluna           | Tipo          | Restrições            |
|------------------|---------------|-----------------------|
| id               | VARCHAR(255)  | PK                    |
| nome             | VARCHAR(255)  | NOT NULL              |
| cpf              | VARCHAR(20)   | Nullable              |
| email            | VARCHAR(255)  | Nullable              |
| telefone         | VARCHAR(20)   | Nullable              |
| data_nascimento  | DATE          | Nullable              |
| endereco         | VARCHAR(500)  | Nullable              |
| status           | VARCHAR(50)   | Nullable              |
| observacoes      | VARCHAR(1000) | Nullable              |
| vendedor         | VARCHAR(100)  | Nullable              |
| valor_venda      | DECIMAL(10,2) | Nullable              |
| pos_graduacao    | BOOLEAN       | DEFAULT false         |
| data_cadastro    | DATE          | Nullable              |
| data_atualizacao | DATE          | Nullable              |

**Relacionamentos:** `aluno_turma` (1:N), `financeiro_aluno` (1:N), `onboarding` (1:N)

---

## ci_turmas

| Coluna             | Tipo          | Restrições  |
|--------------------|---------------|-------------|
| id                 | VARCHAR(255)  | PK          |
| tipo               | VARCHAR(255)  | Nullable    |
| data_evento_inicio | DATE          | Nullable    |
| data_evento_fim    | DATE          | Nullable    |
| descricao          | VARCHAR(1000) | Nullable    |
| horario            | VARCHAR(100)  | Nullable    |
| local_evento       | VARCHAR(255)  | Nullable    |
| capacidade         | INT           | Nullable    |
| instrutor          | VARCHAR(255)  | Nullable    |
| status             | VARCHAR(50)   | Nullable    |
| data_criacao       | DATE          | Nullable    |
| data_atualizacao   | DATE          | Nullable    |

**Relacionamentos:** `aluno_turma` (1:N), `financeiro` (1:N), `financeiro_aluno` (1:N)

---

## ci_aluno_turma

| Coluna           | Tipo         | Restrições                           |
|------------------|--------------|--------------------------------------|
| id_indice        | VARCHAR(255) | PK                                   |
| aluno_id         | VARCHAR(255) | FK → ci_alunos(id) ON DELETE CASCADE |
| turma_id         | VARCHAR(255) | FK → ci_turmas(id) ON DELETE CASCADE |
| status           | VARCHAR(50)  | Nullable                             |
| data_associacao  | DATE         | Nullable                             |
| data_atualizacao | DATE         | Nullable                             |

**Unique:** `(aluno_id, turma_id)`

---

## ci_financeiro

| Coluna            | Tipo          | Restrições                           |
|-------------------|---------------|--------------------------------------|
| id                | VARCHAR(255)  | PK                                   |
| turma_id          | VARCHAR(255)  | FK → ci_turmas(id) ON DELETE CASCADE |
| categoria         | VARCHAR(100)  | NOT NULL                             |
| descricao         | VARCHAR(500)  | Nullable                             |
| valor_total       | DECIMAL(10,2) | Nullable                             |
| data_movimentacao | DATE          | NOT NULL                             |
| observacoes       | VARCHAR(1000) | Nullable                             |
| data_criacao      | DATE          | Nullable                             |
| data_atualizacao  | DATE          | Nullable                             |

---

## ci_financeiro_aluno

| Coluna           | Tipo          | Restrições                           |
|------------------|---------------|--------------------------------------|
| id               | VARCHAR(255)  | PK                                   |
| aluno_id         | VARCHAR(255)  | FK → ci_alunos(id) ON DELETE CASCADE |
| turma_id         | VARCHAR(255)  | FK → ci_turmas(id) ON DELETE CASCADE |
| valor_venda      | DECIMAL(10,2) | Nullable                             |
| data_matricula   | DATE          | Nullable                             |
| data_criacao     | DATE          | Nullable                             |
| data_atualizacao | DATE          | Nullable                             |
| parcelas         | INT           | Nullable                             |
| forma_pagamento  | VARCHAR       | Nullable                             |

**Unique:** `(aluno_id, turma_id)`

---

## ci_onboarding

| Coluna       | Tipo         | Restrições                           |
|--------------|--------------|--------------------------------------|
| id           | VARCHAR(255) | PK                                   |
| aluno_id     | VARCHAR(255) | FK → ci_alunos(id) ON DELETE CASCADE |
| etapa        | VARCHAR(100) | NOT NULL                             |
| data_mudanca | DATE         | NOT NULL                             |

---

## ci_formulario

| Coluna                | Tipo          | Restrições |
|-----------------------|---------------|------------|
| id                    | VARCHAR(255)  | PK         |
| data_resposta         | DATE          | NOT NULL   |
| horario_resposta      | VARCHAR(10)   | NOT NULL   |
| nps                   | INT           | NOT NULL   |
| avaliacao_organizacao | VARCHAR(20)   | NOT NULL   |
| avaliacao_instrutor   | VARCHAR(20)   | NOT NULL   |
| avaliacao_apoio       | VARCHAR(20)   | NOT NULL   |
| avaliacao_geral       | VARCHAR(20)   | NOT NULL   |
| o_que_melhorar        | VARCHAR(2000) | Nullable   |
| o_que_mais_gostou     | VARCHAR(2000) | NOT NULL   |
| comentarios           | VARCHAR(2000) | Nullable   |

---

## apps_usuarios

| Coluna       | Tipo    | Restrições |
|--------------|---------|------------|
| id           | VARCHAR | PK         |
| nome         | VARCHAR | Nullable   |
| email        | VARCHAR | Nullable   |
| login        | VARCHAR | Nullable   |
| senha        | VARCHAR | Nullable   |
| cargo        | VARCHAR | Nullable   |
| ci           | BOOLEAN | Nullable   |
| pfo          | BOOLEAN | Nullable   |
| comercial    | BOOLEAN | Nullable   |
| data_criacao | DATE    | Nullable   |
| area         | VARCHAR | Nullable   |
| ronda        | BOOLEAN | Nullable   |
| reuniao      | BOOLEAN | Nullable   |
