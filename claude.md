# CLAUDE.md — Instruções do Projeto

## Visão Geral

Plataforma de gestão de alunos e turmas com relatórios financeiros.

- **Backend:** `./backend/` — Node.js + Express + Prisma + PostgreSQL
- **Frontend:** `./` (raiz) — React + Vite
- **Deploy:** Vercel via `git push` (sem CLI da Vercel)
- **Schema DB:** `lovable` no PostgreSQL

---

## Estrutura de Pastas

```
/
├── CLAUDE.md
├── .mcp.json                  # Configuração do MCP PostgreSQL
├── package.json               # Frontend (React + Vite)
├── src/                       # Código-fonte do frontend
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── lib/
├── backend/
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma      # Source of truth do banco
│   └── src/
│       ├── routes/
│       ├── controllers/
│       ├── middleware/
│       └── index.ts
└── vercel.json                # Configuração de deploy
```

---

## Comandos Essenciais

### Frontend (raiz)
```bash
npm run dev          # Dev server Vite (porta 5173)
npm run build        # Build de produção
npm run preview      # Preview do build
```

### Backend (`cd backend`)
```bash
npm run dev          # Dev com nodemon
npm run build        # Compila TypeScript
npm start            # Inicia produção

# Prisma
npx prisma studio            # GUI do banco
npx prisma db pull           # Puxa schema do banco para o Prisma
npx prisma migrate dev       # Cria e aplica migration
npx prisma migrate deploy    # Aplica migrations em produção
npx prisma generate          # Regenera o Prisma Client
```

### Deploy
```bash
git add .
git commit -m "feat: descrição"
git push origin main         # Dispara deploy automático na Vercel
```

---

## Banco de Dados

### Schema e Tabelas
- **Schema:** `lovable`
- **Tabelas:** `ci_alunos`, `ci_turmas`, `ci_aluno_turma`, `ci_financeiro`, `ci_financeiro_aluno`
- **Usuários com acesso:** `lovable`, `n8n`, `vinilea`, `melo`, `anabe`, `renato`, `issac`

### Regras do Banco
- PKs são `VARCHAR(255)` geradas pela aplicação (nunca `SERIAL` ou `DEFAULT gen_random_uuid()`)
- Datas são tipo `DATE` (não `TIMESTAMP`) — sempre inseridas pelo código, nunca pelo banco
- Valores monetários são `NUMERIC(10,2)` — nunca `FLOAT`
- **Nunca adicionar** `DEFAULT now()`, `GENERATED ALWAYS AS`, `SERIAL` ou qualquer valor gerado pelo banco

### Mapeamento Prisma
| PostgreSQL | Prisma |
|---|---|
| `VARCHAR(n)` | `String @db.VarChar(n)` |
| `DATE` | `DateTime @db.Date` |
| `NUMERIC(10,2)` | `Decimal @db.Decimal(10, 2)` |
| `INTEGER` | `Int` |
| `BOOLEAN` | `Boolean` |

### Cuidados com Tipos no TypeScript
- Campos `Decimal` do Prisma **não são** `number` — use `.toNumber()` para converter ou importe `Decimal` de `@prisma/client/runtime/library`
- Campos `DateTime @db.Date` chegam como objetos `Date` no JS — ao inserir, use `new Date("YYYY-MM-DD")` sem horas

---

## Padrões de Código

### Backend — Express + Prisma
- Rotas em `backend/src/routes/`, controllers em `backend/src/controllers/`
- Sempre use `try/catch` nos controllers e retorne erros padronizados:
  ```ts
  res.status(500).json({ error: "Mensagem descritiva", details: err.message })
  ```
- Queries Prisma sempre especificam `schema` via `@@schema("lovable")` no model
- Para relatórios financeiros, use queries Prisma com `groupBy` ou raw SQL quando necessário

### Frontend — React + Vite
- Componentes em PascalCase, hooks com prefixo `use`
- Chamadas à API via `fetch` ou axios para `VITE_API_URL` (variável de ambiente)
- Datas exibidas sempre no formato `dd/MM/yyyy` (Brasil)
- Valores monetários exibidos como `R$ 1.053,88` (locale `pt-BR`)

### Variáveis de Ambiente
```
# Backend (.env em backend/)
DATABASE_URL="postgresql://USER:PASS@HOST:5432/DB"

# Frontend (.env na raiz)
VITE_API_URL="http://localhost:3000"  # dev
# Na Vercel, configurar VITE_API_URL apontando para o backend em produção
```

---

## Relacionamentos entre Tabelas

```
ci_alunos ──────────────────► ci_aluno_turma ◄──── ci_turmas
    │                                                    │
    └──► ci_financeiro_aluno ◄──────────────────────────┘
                                                         │
                                              ci_financeiro ◄─── ci_turmas
```

- **Receita por turma:** soma de `ci_financeiro_aluno.valor_venda` WHERE `turma_id = X`
- **Despesa por turma:** soma de `ci_financeiro.valor_total` WHERE `turma_id = X`
- **Resultado financeiro:** receita - despesa
- Ao deletar um aluno ou turma, os registros dependentes são removidos em CASCADE

---

## Deploy na Vercel

- O deploy acontece automaticamente ao fazer `git push origin main`
- O `vercel.json` na raiz define o build do frontend (Vite) e as rotas do backend
- **Nunca commitar** arquivos `.env` — usar variáveis de ambiente no painel da Vercel
- O backend precisa estar configurado como uma função serverless ou como serviço separado
- Migrations do Prisma **não rodam automaticamente** no deploy — rodar manualmente antes se houver mudanças de schema

---

## Fluxos Financeiros

### Ao matricular um aluno em uma turma:
1. Criar/verificar registro em `ci_alunos`
2. Criar registro em `ci_aluno_turma` com `status = 'inscrito'`
3. Criar registro em `ci_financeiro_aluno` com `valor_venda` e `data_matricula`

### Ao registrar um gasto de turma:
1. Criar registro em `ci_financeiro` vinculado ao `turma_id`

### Para relatório financeiro:
- **Por turma:** JOIN entre `ci_financeiro_aluno` e `ci_financeiro` filtrando por `turma_id`
- **Por período:** filtrar por `data_movimentacao` ou `data_matricula`
- **Geral:** sem filtros, agrupando por turma

---

## O que NÃO Fazer

- ❌ Não usar `TIMESTAMP` — usar `DATE`
- ❌ Não gerar IDs no banco — gerar na aplicação (ex: `crypto.randomUUID()`)
- ❌ Não usar `FLOAT` para valores monetários — usar `NUMERIC(10,2)`
- ❌ Não commitar `.env` ou segredos
- ❌ Não rodar migrations em produção sem testar em dev antes
- ❌ Não modificar o schema do banco sem atualizar o `schema.prisma`
- ❌ Não usar `any` no TypeScript sem justificativa