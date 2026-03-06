# ⚡ Quick Reference - API Dashboard

## 🎯 URLs Principais

**Base URL:** `http://localhost:3001/admin-certificacoes/api`

| Recurso | URL | Descrição |
|---------|-----|-----------|
| 🏥 Health | `/health` | Verifica saúde da API |
| 👥 Alunos | `/alunos` | CRUD de alunos |
| 🎓 Turmas | `/turmas` | CRUD de turmas |
| 📝 Matrículas | `/matriculas` | Gerenciar matrículas |
| 💰 Financeiro | `/financeiro` | Receitas/Despesas |
| 👤💰 Fin-Aluno | `/financeiro-aluno` | Pagamentos por aluno |

---

## 🔥 Comandos Rápidos

### Testar API
```bash
# Health check
curl http://localhost:3001/admin-certificacoes/api/health

# Listar alunos
curl http://localhost:3001/admin-certificacoes/api/alunos

# Listar turmas
curl http://localhost:3001/admin-certificacoes/api/turmas

# Estatísticas
curl http://localhost:3001/admin-certificacoes/api/alunos/stats/resumo
```

### Iniciar Backend
```bash
cd backend
npm run dev
# Ou
npm start
```

---

## 📋 CRUD Pattern

### Criar (POST)
```javascript
POST /alunos
{ "nome": "João", "cpf": "123.456.789-00" }
→ 201 Created + dados do recurso

POST /turmas
{ "tipo": "ACLS", "capacidade": 20 }
→ 201 Created + dados da turma
```

### Ler (GET)
```javascript
GET /alunos              // Lista tudo
GET /alunos?nome=João   // Com filtro
GET /alunos/:id         // Um específico
→ 200 OK + dados

GET /turmas?status=Aberta
→ Turmas abertas apenas
```

### Atualizar (PUT)
```javascript
PUT /alunos/:id
{ "status": "Formado" }
→ 200 OK + dados atualizados
```

### Deletar (DELETE)
```javascript
DELETE /alunos/:id
→ 200 OK + confirmação
```

---

## 📊 Status HTTP Rápido

| Código | Tipo | Significado |
|--------|------|------------|
| 200 | ✅ | OK |
| 201 | ✅ | Criado |
| 400 | ❌ | Dados inválidos |
| 404 | ❌ | Não encontrado |
| 409 | ⚠️ | Conflito (duplicado) |
| 500 | 💥 | Erro servidor |

---

## 🎪 Endpoints por Recurso

### Alunos
```
POST   /alunos                              Criar
GET    /alunos                              Listar
GET    /alunos/:id                          Obter um
PUT    /alunos/:id                          Atualizar
DELETE /alunos/:id                          Deletar
GET    /alunos/:alunoId/turmas             Turmas do aluno
GET    /alunos/turma/:turmaId/alunos       Alunos de turma
GET    /alunos/stats/resumo                 Stats
```

### Turmas
```
POST   /turmas                              Criar
GET    /turmas                              Listar
GET    /turmas/:id                          Obter um
PUT    /turmas/:id                          Atualizar
DELETE /turmas/:id                          Deletar
GET    /turmas/resumo/todas                 Com occupação %
GET    /turmas/stats/resumo                 Stats
```

### Matrículas
```
POST   /matriculas                          Matricular
GET    /matriculas                          Listar
GET    /matriculas/:id                      Obter
PUT    /matriculas/:id                      Atualizar
DELETE /matriculas/:id                      Deletar
GET    /matriculas/verificar/:a/:t          Checkar matrícula
GET    /matriculas/stats/resumo             Stats
```

### Financeiro
```
POST   /financeiro                          Criar
GET    /financeiro                          Listar
GET    /financeiro/:id                      Obter
PUT    /financeiro/:id                      Atualizar
DELETE /financeiro/:id                      Deletar
GET    /financeiro/turma/:turmaId          Por turma
GET    /financeiro/stats/resumo             Stats
GET    /financeiro/periodo/resumo           Resumo período
```

### Financeiro-Aluno
```
POST   /financeiro-aluno                    Criar
GET    /financeiro-aluno                    Listar
GET    /financeiro-aluno/:id                Obter
PUT    /financeiro-aluno/:id                Atualizar
DELETE /financeiro-aluno/:id                Deletar
GET    /financeiro-aluno/aluno/:id/historico  Histórico
GET    /financeiro-aluno/aluno/:id/resumo     Resumo pago
GET    /financeiro-aluno/stats/resumo         Stats
```

---

## 🔍 Query Parameters Comuns

```javascript
// Paginação
?page=1&limit=10

// Filtros
?nome=João           // Busca parcial
?status=Ativo        // Busca exata
?cpf=123.456.789-00  // Busca exata

// Período
?data_inicio=2026-02-01&data_fim=2026-02-05

// Combinados
?status=Ativo&page=2&limit=20
```

---

## 🛠️ Estrutura Backend

```
backend/
├── src/
│   ├── controllers/
│   │   ├── alunos.controller.js
│   │   ├── turmas.controller.js
│   │   ├── aluno-turma.controller.js
│   │   ├── financeiro.controller.js
│   │   └── financeiro-aluno.controller.js
│   ├── routes/
│   │   ├── alunos.routes.js
│   │   ├── turma.routes.js
│   │   ├── matriculas.routes.js
│   │   ├── financeiro.routes.js
│   │   └── financeiro-aluno.routes.js
│   ├── config/
│   │   └── database.js
│   └── index.js (servidor principal)
├── package.json
└── .env (configurações)
```

---

## 📦 Frontend - Como Usar API

```typescript
import { alunosAPI, turmasAPI } from './services/api';

// Listar
const alunos = await alunosAPI.listar({ status: 'Ativo' });

// Criar
const novo = await alunosAPI.criar({ nome: 'João', cpf: '123...' });

// Atualizar
const atualizado = await alunosAPI.atualizar(id, { status: 'Formado' });

// Deletar
await alunosAPI.deletar(id);

// Estatísticas
const stats = await alunosAPI.estatisticas();
```

---

## 🗄️ Banco de Dados

**5 Tabelas principais:**
- `ci_alunos` - Alunos
- `ci_turmas` - Turmas
- `ci_aluno_turma` - Matrículas
- `ci_financeiro` - Transações
- `ci_financeiro_aluno` - Pagamentos/aluno

**2 Views:**
- `vw_alunos_turmas` - Alunos com turmas
- `vw_financeiro_turmas` - Financeiro por turma

---

## ⚙️ Configuração Mínima

### .env
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lovable
DB_USER=postgres
DB_PASSWORD=sua_senha
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
```

### Terminal
```bash
cd backend
npm install
npm run dev
```

---

## 🐛 Debugging

**Logs automáticos:**
- Cada request printa no console
- Queries mostram duração em ms
- Erros detalhados em desenvolvimento

**Testar DB:**
```bash
curl http://localhost:3001/admin-certificacoes/api/db-test
```

---

## 🎓 Status Válidos

| Tabela | Status Possíveis |
|--------|-----------------|
| Alunos | Em Onboarding, Ativo, Inativo, Formado |
| Turmas | Aberta, Fechada, Concluída, Cancelada |
| Matrículas | Inscrito, Participando, Concluído, Cancelado |
| Financeiro | - (apenas categoria: Receita/Despesa/Ajuste) |
| Fin-Aluno | Pendente, Pago, Cancelado, Atrasado |

---

## ✅ Validações

- **CPF:** Deve ser único (não pode duplicar)
- **Aluno+Turma:** Aluno não pode estar 2x na mesma turma
- **Campos obrigatórios:**
  - Alunos: nome, cpf
  - Turmas: tipo
  - Matrículas: aluno_id, turma_id
  - Financeiro: turma_id, categoria, tipo, quantidade, data

---

## 📈 Performance

**Índices criados:**
- idx_alunos_nome, email, cpf, status
- idx_turmas_status, tipo, data_evento
- idx_aluno_turma_aluno_id, turma_id, status
- idx_financeiro_turma_id, data, categoria, tipo
- idx_fin_aluno_aluno_id, turma_id, financeiro_id, status

**Paginação:** Suportada em todos GET com `page` e `limit`

---

## 🆘 Troubleshooting

| Erro | Causa | Solução |
|------|-------|--------|
| 409 Conflict | CPF duplicado | Verificar CP no banco |
| 404 Not Found | Recurso não existe | Conferir ID |
| 500 Error | Erro no banco | Verificar .env e conexão |
| CORS Error | Origin não permitida | Adicionar em CORS_ORIGINS |

---

**Criado:** Fevereiro 2026  
**API Version:** 1.0.0  
**Status:** ✅ Pronta para Produção
