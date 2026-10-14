# Mercado de Jogadores da Liga

> **Este documento é vivo.** Ele reúne a arquitetura definida para o projeto e, a cada
> etapa de desenvolvimento, registra as decisões técnicas tomadas, com o motivo e a
> alternativa descartada. A seção [Decisões registradas](#4-decisões-registradas) é
> atualizada em cada entrega; a seção [Estado atual](#5-estado-atual) mostra o que já
> está funcionando. As instruções de execução são mantidas verdadeiras a cada entrega.

Estudo de caso SENAI/PE — **CÓD. 237** (Desenvolvedor Fullstack I). Aplicação fullstack
de um mercado de jogadores de uma liga de futebol fictícia.

---

## 1. Visão geral

- **API REST** sob o prefixo `/api/v1`, sem autenticação, com CORS restrito à origem do
  frontend (lida de variável de ambiente).
- **SPA React** consome a API e entrega as telas do mockup (listagem de jogadores com
  paginação, clubes, transações do clube, partidas, classificação e operações de
  compra/venda/escalação/condição).
- **Banco PostgreSQL 16**, criado do zero pelos comandos documentados aqui.

---

## 2. Arquitetura do backend

### 2.1 Stack

| Camada | Tecnologia | Motivo |
| --- | --- | --- |
| Runtime | Node 22 LTS | permitido pelo enunciado; o 20 LTS saiu de suporte em abril/2026, e o 22 atende ao Nest CLI 12 (require(ESM)) |
| Framework | NestJS 12 (Express) | estrutura modular, injeção de dependência e exception filter nativos |
| Banco | PostgreSQL 16 + Prisma 6.19.3 | migrations versionadas; linha clássica do Prisma (6.x estável), sem driver adapter |
| Validação | Zod 4 (pipe global) | mecanismo declarativo de validação (criterio B2) |
| Logs | pino (nestjs-pino) | log real de HTTP: uma linha por requisição (diferencial B5) |
| Testes | Jest + supertest | padrão do NestJS, zero configuração com decorators |
| Qualidade | ESLint 9 + Prettier | `lint` e `format:check` rodam sem erros (diferencial B5) |

### 2.2 Organização do código (feature modules + domínio puro)

backend/src/
├── main.ts                     # bootstrap: prefixo /api/v1, CORS, logger
├── app.module.ts
├── common/
│   ├── filters/                # exception filter global → { message }
│   └── pipes/                  # ZodValidationPipe parametrizado por rota
├── config/                     # schema Zod do .env (falha cedo)
├── prisma/                     # PrismaService + TransactionRunner
├── domain/                     # funções puras, sem I/O (única fonte de cada cálculo)
│   ├── money.ts                # centavos e arredondamento half-away-from-zero
│   ├── market-value.ts         # RN02–RN05
│   ├── overall.ts              # RN06 (overall e valor base)
│   ├── contract.ts             # RN15 (dias restantes e multa)
│   ├── sale.ts                 # RN13 e RN16 (taxa, comissão, crédito)
│   ├── lineup.ts               # RN19 (formações e setores)
│   └── duel.ts                 # RN20 (condição, duelos e placar)
├── shared/                     # text (normalização e ordem), dates (RN01), ids, query
└── modules/
    ├── health/                 # GET /health
    ├── players/                # GET/POST /players, GET/PUT/DELETE /players/{id}, PATCH /players/{id}/condition
    ├── clubs/                  # GET/POST /clubs, GET /clubs/{id}, PUT/GET /clubs/{id}/lineup
    ├── transfers/              # POST /players/{id}/buy e /sell
    ├── transactions/           # GET /clubs/{id}/transactions e /transactions/export
    ├── matches/                # GET/POST /matches, GET /matches/{id}
    └── standings/              # GET /standings


Módulos e rotas em **inglês** (as rotas do enunciado são em inglês); tabelas e colunas em
**português snake_case** (exigência do enunciado, ver seção 4, decisão 10).

### 2.3 Camadas e fluxo de uma requisição

HTTP → pipe Zod (valida) → controller → service → repository → Prisma → PostgreSQL
                     ↑                     ↓
        exception filter global      domain/ (funções puras)

- controller: só HTTP (recebe o dado já validado, devolve a resposta, seta `Location` nos 201). Não calcula regra nem fala com o Prisma.
- service: orquestra o caso de uso e abre a transação. Não contém fórmulas; chama as funções de `domain/`.
- domain: toda fórmula de negócio, pura e testável, em um único lugar (valor de mercado, overall, taxa, multa, comissão, placar).
- repository: única camada que consulta o Prisma; aceita o cliente de transação.
- Listagens: o repository filtra no SQL o que for coluna (posição, condição, clube, idade); o service calcula o valor de mercado, filtra a faixa de valor, ordena e pagina (o valor de mercado não é coluna).

### 2.4 Regras transversais

- **Erros**: exception filter global devolve `{ message }` — `400` (dado/parâmetro
  inválido), `404` (recurso inexistente), `409` (regra de negócio). Sem stack trace.
- **Transações**: compra, venda, partida (com duelos), escalação e alteração de condição
  que tira um titular rodam cada uma numa única transação do Prisma.
- **Datas**: entrada `AAAA-MM-DDTHH:MM-03:00`, resposta `AAAA-MM-DDTHH:MM:SS-03:00`,
  sempre horário de Brasília.
- **Dinheiro**: centavos na lógica, `DECIMAL` no banco, 2 casas só na resposta da API.
- **CORS**: origem restrita vinda de variável de ambiente (nunca `*`).

- Validação: o pipe recebe o schema de cada rota; ids de URL inválidos viram 404 (V8); campos extras são descartados (V7); JSON inválido e corpo que não é objeto viram 400.
- Concorrência: compra e venda travam a linha do clube (`SELECT ... FOR UPDATE`) dentro da transação, para o caixa nunca ficar inconsistente.
- Logs: pino-http com `isoTime` e uma única linha por requisição (método, caminho e status).

---

## 3. Arquitetura do frontend

### 3.1 Stack

| Camada | Tecnologia | Motivo |
| --- | --- | --- |
| Build | Vite + React + TypeScript | permitido pelo enunciado |
| Rotas | React Router (modo biblioteca) | exigido pelo enunciado; sem Route Handlers de servidor |
| Requisições | `fetch` + wrapper próprio | sem bibliotecas extras; erros tipados a partir do `{ message }` da API |
| Validação de formulários | Zod | validação de campos obrigatórios e faixas antes do envio (critério F2); schemas por feature |
| Estilo | Tailwind CSS + shadcn/ui | permitido pelo enunciado |
| Testes | Vitest + Testing Library | mesmo runner do build Vite |
| Qualidade | ESLint 9 + Prettier | espelho do backend |

### 3.2 Organização do código (features em camadas)

```
frontend/src/
├── main.tsx                      # root React + Router
├── app/                          # rotas e layout
├── lib/
│   ├── api.ts                    # cliente fetch: base URL, ApiError com o message da API
│   ├── format.ts                 # moeda (1.234,56) e data em Brasília (só formata, não recalcula)
│   ├── dates.ts                  # datetime-local → AAAA-MM-DDTHH:MM-03:00
│   └── use-action.ts             # hook de ação: trava de envio, sucesso ou message da API
├── components/
│   ├── ui/                       # shadcn/ui
│   └── shared/                   # DataTable, FormField, PageState, Feedback, ConfirmDialog
└── features/
    ├── players/  clubs/  transfers/  transactions/  lineup/  matches/  standings/
    └── <feature>/
        ├── api.ts                # funções de chamada à API (única camada que usa lib/api)
        ├── hooks.ts              # estado de carga/erro e refetch
        ├── schemas.ts            # schemas Zod dos formulários
        ├── components/
        └── pages/
```

### 3.3 Fluxo de dados e telas

Página → hook da feature → api.ts da feature → lib/api

- Nenhum componente chama `fetch`: só `features/*/api.ts` usa `lib/api.ts` (critério F2).
- Estado com `useState`/`useEffect` por hook de recurso; depois de cada ação, o hook refaz a consulta e a tela mostra o dado devolvido pela API, sem recarregar a página. Sem biblioteca de estado global.
- Nada é recalculado na tela: valor base, valor de mercado, overall, taxa, multa, comissão, lucro, crédito, patrimônio, totais, placar e classificação vêm da API. Somar valor e taxa para o custo total é permitido.
- Todo botão de ação usa `useAction`: fica desabilitado durante o envio, e o clique duplo gera um único pedido (critério F3).
- Toda tela de lista usa `PageState` para carregando, vazio e erro (6 telas: jogadores, clubes, elenco, histórico de transações, histórico de partidas e classificação).
- Formulários validam, antes de enviar, os campos obrigatórios e as faixas de um campo só (nome 3–100, clube 3–60, sigla com 3 letras, agilidade 1–100, idade 16–45, atributos e potencial 1–99), com a mensagem junto ao campo. Regras de banco e de estado (409 e 404) ficam na API, e a tela mostra o `message`.
- Telas: jogadores (lista, cadastro, edição, condição, exclusão, compra), clubes (lista, criação, página com elenco, venda, histórico, escalação), partidas (jogar e histórico) e classificação.

---

## 4. Decisões registradas

Cada linha é uma decisão tomada durante o desenvolvimento, com data, motivo e alternativa
descartada. Esta seção cresce a cada entrega.

| # | Data | Decisão | Motivo / alternativa descartada |
| --- | --- | --- | --- |
| 1 | 2026-10-14 | Backend em **NestJS 12** (não Fastify puro) | o plano original citava Fastify; NestJS dá camadas, DI e exception filter nativos, que o barema exige |
| 2 | 2026-10-14 | **Prisma 6.19** (não Prisma 7) | a linha 7 exige driver adapter (`@prisma/adapter-pg`) e `prisma.config.ts`; complexidade sem benefício para o caso |
| 3 | 2026-10-14 | **TypeScript 5.9** (não 7.x) | `ts-jest` exige `<7` e `typescript-eslint` exige `<6.1.0`; 5.9 é também o mais seguro para decorators |
| 4 | 2026-10-14 | **ESLint 9** (não 10) | ESLint 9 é maduro e totalmente compatível com `typescript-eslint` 8 e com o Node 22 LTS; o 10 só traria breaking changes sem benefício para o barema |
| 5 | 2026-10-14 | **Jest** no backend, **Vitest** no frontend | Jest é o padrão do NestJS (decorators sem config extra); Vitest combina com o build Vite |
| 6 | 2026-10-14 | **Zod** como mecanismo de validação | atende o critério B2 ("mecanismo declarativo declarado nas dependências"); aplicado por pipe global |
| 7 | 2026-10-14 | Dinheiro em **centavos inteiros** na lógica, `DECIMAL` no banco | o barema aceita os dois formatos; evita erro de ponto flutuante |
| 8 | 2026-10-14 | Arredondamento "meio para longe do zero", **uma única vez** por cálculo | arredondamento parcial causa divergência (ex.: 14,775 → 14,78) |
| 9 | 2026-10-14 | **pino** (nestjs-pino) para logs | diferencial B5: log real de HTTP, uma linha por requisição, sem `console.log` |
| 10 | 2026-10-14 | Módulos em **inglês**, tabelas/colunas em **português snake_case** | rotas do enunciado são em inglês; nomes de tabela são exigência do enunciado em português |
| 11 | 2026-10-14 | CORS restrito à origem de variável de ambiente | o enunciado não aceita `*` e o barema (B2, segurança e configuração) só pontua a prática completa |
| 12 | 2026-10-14 | Docker Compose começa só com o **db**; api e web entram com os Dockerfiles | o README também deve funcionar sem Docker; serviços extras no compose só depois dos Dockerfiles |
| 13 | 2026-10-14 | **Node 22 LTS** como única versão pedida ao avaliador | o 20 LTS saiu de suporte em abril/2026; o 22 é permitido pelo enunciado, atende ao Nest CLI 12 e está fixado em `.nvmrc` e no `engines` do `package.json` |
| 14 | 2026-10-14 | Máquina de dev saneada antes de codar | pacote npm `node` (23.5.0) na home sequestrava `npm run`; PG17 local disputava a porta 5432 com o container — ambos corrigidos |
| 15 | 2026-10-14 | Monólito modular em camadas, com `domain/` de funções puras | cada cálculo do B2 fica em um único lugar e as tabelas do enunciado viram testes unitários; DDD, hexagonal e CQRS descartados por excesso para 7 tabelas |
| 16 | 2026-10-14 | Frontend por feature, com camadas `api → hooks → componentes` e `useAction` | atende F2 (nenhuma chamada direta em componente) e F3 (clique duplo com um só pedido); descartado Redux/Zustand, desnecessário para este escopo |
| 17 | 2026-10-14 | `TransactionRunner` e lock de linha (`SELECT ... FOR UPDATE`) no caixa | garante atomicidade das 5 operações do B2 e evita caixa inconsistente em requisições simultâneas |

---

## 5. Estado atual

- [x] PostgreSQL 16 sobe via `docker compose up -d db` (saudável)
- [x] API NestJS sobe, prefixo `/api/v1`, CORS e logger pino configurados
- [x] `GET /api/v1/health` responde `200 {"status":"ok"}`
- [x] Log de requisição: uma linha com hora, método, caminho e status
- [x] `npm run build`, `eslint .` e `prettier --check .` verdes
- [ ] Schema Prisma com as 7 tabelas + primeira migration
- [ ] Módulos de domínio (players, clubs, matches, standings, transfers, conditions)
- [ ] Frontend (Vite + React + Tailwind/shadcn)

---

## 6. Como executar (estado atual)

Pré-requisitos: **Node.js 22 LTS**, **npm >= 10** e **Docker** com Compose. Confira a
versão com `node -v` (esperado `22.x`); há um `.nvmrc` na raiz para quem usa `nvm`.

```bash
# 1. subir o banco
docker compose up -d db

# 2. configurar e subir a API
cd backend
cp .env.example .env
npm install
npx prisma generate
npm run build
npm run start

# 3. conferir
curl http://localhost:3000/api/v1/health
```

- **Origem da API**: `http://localhost:3000` (rotas sob `/api/v1`)
- **Origem do frontend**: `http://localhost:5173` (liberada no CORS)

### Variáveis de ambiente (`backend/.env`)

| Variável | Descrição |
| --- | --- |
| `PORT` | porta do servidor da API |
| `DATABASE_URL` | conexão com o PostgreSQL |
| `CORS_ORIGIN` | origem do frontend liberada no CORS |
| `LOG_LEVEL` | nível dos logs (`trace`…`error`) |

O exemplo completo está em `backend/.env.example`.

---

## 7. Uso de IA

Durante o desenvolvimento foi usada assistência de IA (agente de código) para explorar o
repositório, levantar hipóteses de falha de ambiente e redigir código e documentação.
Toda regra de negócio e toda decisão registrada na seção 4 passou por revisão e
confirmação humana antes de ser incorporada.
