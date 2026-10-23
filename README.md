# Mercado de Jogadores da Liga

Aplicação fullstack de um mercado de jogadores de uma liga de futebol fictícia — Estudo de caso SENAI/PE (CÓD. 237 — Desenvolvedor Fullstack I).

---

## 1. Pré-requisitos

Para executar o projeto localmente sem Docker, certifique-se de possuir instalado:

- **Node.js**: versão `22.x` (LTS recomendada, ex.: `v22.23.3` ou compatível).
- **npm**: versão `>= 10.x`.
- **PostgreSQL**: versão `16` (caso não utilize o container do Docker Compose).
- **Docker e Docker Compose** (recomendado para execução automatizada com comando único).

---

## 2. Passo a passo para criar o banco de dados e para recriá-lo do zero

O banco de dados utiliza PostgreSQL 16 com o schema versionado via migrations do Prisma ORM (`prisma/migrations`).

### 2.1 Criar o banco de dados do zero

1. A partir da raiz do repositório, inicie o container PostgreSQL:

```bash
docker compose up -d db
```

2. Na pasta `backend/`, aplique as migrações:

```bash
cd backend
npx prisma migrate deploy
```

_O banco será inicializado com as 7 tabelas obrigatórias da liga (`jogadores`, `clubes`, `contratos`, `transacoes`, `escalacoes`, `partidas`, `duelos_partida`)._

### 2.2 Recriar o banco do zero (apagar e recriar)

A qualquer momento, para limpar completamente todos os dados e recriar as tabelas:

```bash
cd backend
npx prisma migrate reset --force
```

---

## 3. Passo a passo para instalar e executar

### 3.1 Execução com Docker Compose (Comando único)

Um único comando a partir da raiz constrói e sobe o banco de dados PostgreSQL, a API NestJS e o frontend web Nginx com dados carregados automaticamente:

```bash
docker compose up --build
```

- **Aplicação Web Frontend (SPA)**: `http://localhost:5173`
- **Origem da API Backend**: `http://localhost:3000` (rotas sob o prefixo `/api/v1`)
- **Verificação de Saúde (Healthcheck)**: `http://localhost:3000/api/v1/health`
- **Documentação Interativa Swagger (OpenAPI)**: `http://localhost:3000/api/docs`

O container da API aguarda a prontidão do PostgreSQL (`pg_isready`), executa as migrações (`prisma migrate deploy`) e a carga inicial de dados idempotente (`prisma/seed.ts`), garantindo que a aplicação abra imediatamente populada com os 8 clubes e jogadores da liga.

### 3.2 Execução Local (Passo a passo no Ubuntu 24.04 / Linux / macOS / Windows)

#### Terminal 1 — Banco de Dados:

```bash
docker compose up -d db
```

#### Terminal 2 — Backend API:

```bash
cd backend
cp .env.example .env
npm ci
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run build
npm run start
```

_A API estará pronta em `http://localhost:3000` e responderá a requisições com prefixo `/api/v1`._

#### Verificação de integridade da API:

```bash
curl http://localhost:3000/api/v1/health
# Resposta esperada: {"status":"ok"}
```

#### Terminal 3 — Frontend Web (React + Vite):

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

_A aplicação web estará acessível no navegador em `http://localhost:5173`._

---

## 4. Variáveis de ambiente

As portas e URLs são padronizadas entre Compose, `.env.example` e aplicação local: `5432` (PostgreSQL), `3000` (Backend API) e `5173` (Frontend).

### 4.1 Backend (`backend/.env.example`)

As configurações do backend são lidas exclusivamente de variáveis de ambiente gerenciadas pelo NestJS `ConfigService` e validadas na inicialização:

| Variável       | Descrição                                                                           | Exemplo padrão                                                               |
| -------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `PORT`         | Porta HTTP em que a API escuta requisições                                          | `3000`                                                                       |
| `DATABASE_URL` | URL de conexão PostgreSQL para o Prisma ORM                                         | `postgresql://league:league@localhost:5432/league_marketplace?schema=public` |
| `CORS_ORIGIN`  | Origens autorizadas para CORS (separadas por vírgula, sem `*`)                      | `http://localhost:5173`                                                      |
| `LOG_LEVEL`    | Nível mínimo de logs da biblioteca Pino (`trace`, `debug`, `info`, `warn`, `error`) | `info`                                                                       |
| `NODE_ENV`     | Ambiente de execução (`development`, `production`, `test`)                          | `development`                                                                |

### 4.2 Frontend (`frontend/.env.example`)

Configurações injetadas no build da SPA React / Vite:

| Variável       | Descrição                                                              | Exemplo padrão                 |
| -------------- | ---------------------------------------------------------------------- | ------------------------------ |
| `VITE_API_URL` | URL base da API da liga consumida pelo cliente browser (com `/api/v1`) | `http://localhost:3000/api/v1` |

---

## 5. Estrutura de pastas e lista de bibliotecas utilizadas

### 5.1 Estrutura de pastas

```text
.
├── backend/
│   ├── prisma/
│   │   ├── migrations/            # Migrações versionadas do banco de dados
│   │   ├── schema.prisma          # Schema com as 7 tabelas obrigatórias em snake_case
│   │   └── seed.ts                # Carga inicial idempotente com dados oficiais
│   ├── src/
│   │   ├── clubs/                 # Módulo de Clubes (criação, listagem e detalhe de elenco)
│   │   ├── core/
│   │   │   ├── filters/           # GlobalExceptionFilter (formato unificado { message })
│   │   │   └── pipes/             # ParsePositiveIntPipe (V8) e ZodValidationPipe (V1, V7)
│   │   ├── domain/                # Núcleo de regras e fórmulas puras sem I/O
│   │   │   ├── base-value.ts      # Cálculo de valor base e bônus de jovem promessa
│   │   │   ├── contract.ts        # Cálculo de dias restantes e taxas de fidelidade
│   │   │   ├── domain-calculator.service.ts # Centralizador dos cálculos de domínio
│   │   │   ├── duel.ts            # Simulação determinística de partidas e 6 duelos (RN20)
│   │   │   ├── iso-datetime.ts    # Validador puro de formato ISO Brasília (-03:00) e calendário gregoriano
│   │   │   ├── lineup.ts          # Validação de formações táticas (3-1, 2-2, 2-1-1, 1-2-1)
│   │   │   ├── market-value.ts    # Cálculo de valor de mercado (condição, agilidade, idade)
│   │   │   ├── money.ts           # Arredondamento half-away-from-zero e centavos
│   │   │   ├── overall.ts         # Cálculo de overall por posição e pesos (RN06)
│   │   │   └── sale.ts            # Cálculo de multa, lucro e comissão progressiva (RN16)
│   │   ├── health/                # Endpoint GET /api/v1/health
│   │   ├── league/                # Módulo da Liga (escalações, partidas e classificação)
│   │   ├── market/                # Módulo de Mercado (compra, venda e histórico CSV)
│   │   ├── players/               # Módulo de Jogadores (CRUD, busca, filtros e condição)
│   │   ├── prisma/                # PrismaService com conexão gerenciada
│   │   ├── shared/                # Clock e comparador Unicode NFD
│   │   ├── app.module.ts          # Módulo raiz do NestJS
│   │   └── main.ts                # Bootstrap, Swagger, CORS restrito, pipes e logger Pino
│   ├── Dockerfile                 # Multi-stage build com migrações e seed no entrypoint
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/            # Componentes visuais UI, layout e feedback
│   │   ├── features/              # Módulos de domínio (players, clubs, market, league, transactions)
│   │   ├── lib/                   # Clientes de API, formatação de moeda/data e React Query
│   │   └── styles/                # Tailwind CSS e tokens do Figma
│   ├── Dockerfile                 # Multi-stage build (Node 22 builder + Nginx runner com SPA fallback)
│   ├── nginx.conf                 # Configuração do Nginx com fallback para index.html
│   └── package.json
├── docker-compose.yml             # Orquestração com subida em comando único (db, api, frontend)
└── README.md
```

### 5.2 Lista de bibliotecas utilizadas e justificativas

| Biblioteca                                                   | Versão                         | Justificativa de Uso                                                                                                                                                                            |
| ------------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` | `^12.1.3`                      | Framework modular para TypeScript corporativo, com injeção de dependências, controle de ciclo de vida e desacoplamento de camadas exigido pelo barema (B2).                                     |
| `@nestjs/config`                                             | `^12.0.1`                      | Gerenciamento centralizado de variáveis de ambiente validadas.                                                                                                                                  |
| `@prisma/client`, `prisma`                                   | `^6.19.3`                      | ORM estável e tipado para modelagem relacional com PostgreSQL 16, suporte a transações interativas atômicas (`$transaction`) e migrações versionadas.                                           |
| `zod`                                                        | `^4.6.7`                       | Mecanismo declarativo de validação de esquemas de dados em tempo de execução, garantindo regras V1, V3, V4, V6 e V7 sem `if` solto em controllers.                                              |
| `pino`, `nestjs-pino`, `pino-http`                           | `^10.4.0`, `^5.3.1`, `^11.0.0` | Sistema de logs estruturados de alta performance com timestamp legível (`isoTime`), gerando exatamente uma linha por requisição contendo método, caminho e status HTTP (atende diferencial B5). |
| `@nestjs/swagger`                                            | `^12.0.0`                      | Geração interativa de documentação OpenAPI/Swagger em `/api/docs` (atende diferencial B5).                                                                                                      |
| `jest`, `ts-jest`                                            | `^30.5.2`, `^29.4.14`          | Framework de testes unitários e de integração configurado para execução não-interativa e sem mocks frágeis.                                                                                     |
| `eslint`, `prettier`                                         | `^9.0.0`, `^3.9.10`            | Padronização estrita de código e verificação estática de formatação.                                                                                                                            |

---

## 6. Decisões e premissas

1. **Centralização Matemática em Módulo de Domínio Puro (`src/domain/`)**: Todos os cálculos de valor de mercado, overall, taxa de compra, dias restantes, multas, comissão progressiva e duelos de partida foram implementados como funções puras sem dependência externa, consumidas por um `DomainCalculatorService` centralizado. Nenhum controller ou service duplica qualquer fórmula.
2. **Arredondamento Monetário e Precisão**: Valores em moeda são calculados usando _half-away-from-zero_ arredondados uma única vez no resultado final, evitando erros cumulativos de ponto flutuante. O limite de 50% do caixa para compra é verificado sobre a metade exata do caixa sem pré-arredondamento (RN13).
3. **Tratamento Centralizado de Exceções**: O `GlobalExceptionFilter` intercepta todas as exceções e padroniza as respostas de erro no formato normativo `{ "message": "..." }`, eliminando stack traces e expondo status `400` para dados inválidos, `404` para recursos inexistentes e `409` para conflitos de regra de negócio.
4. **IDs de Rotas e Regra V8**: Conforme a regra V8, identificadores de rota que não correspondam estritamente a inteiros positivos decimais sem zeros à esquerda ou que excedam `2147483647` são rejeitados com `404 Not Found` (implementado no `ParsePositiveIntPipe`).
5. **Transações Atômicas**: Operações críticas de escrita (compra, venda, escalação tática, partida com gravação dos 6 duelos, e alteração de condição para DOENTE com desfalque) são executadas inteiramente dentro de `prisma.$transaction`.
6. **Formatação de Datas com Fuso de Brasília (RN01)**: Datas recebidas pela API exigem o offset `-03:00` (`AAAA-MM-DDTHH:MM-03:00`), enquanto todas as respostas da API retornam com os segundos incluídos (`AAAA-MM-DDTHH:MM:SS-03:00`), validadas pelo helper puro `isValidBrasiliaIsoDateTime` e formatadas por `formatIsoBrasilia`.
7. **Exportação CSV (RN18)**: O endpoint `GET /clubs/:id/transactions/export` devolve `Content-Type: text/csv; charset=utf-8` em UTF-8 sem BOM com quebra de linha LF (`\n`), vírgula decimal para valores monetários e escape com aspas duplas duplicadas caso o nome contenha `;` ou `"`. Caso nenhuma transação coincida com os filtros, retorna apenas o cabeçalho finalizado em `\n`.

---

## 7. Funcionalidades não implementadas

- **Nenhuma** (todos os 22 requisitos funcionais do backend B01–B22 e os 14 requisitos do frontend F01–F14 foram implementados e validados).

---

## 8. Uso de inteligência artificial

Durante o desenvolvimento foi utilizada assistência de inteligência artificial (agente de código) para navegação e auditoria na especificação do projeto, elaboração da suíte de testes unitários automatizados, validação de edge cases de arredondamento e refatoração de código com foco nas regras do barema. Toda regra de negócio, decisão técnica e linha de código foram validadas e testadas contra os documentos oficiais da seleção.

---

## 9. Diferenciais técnicos e comandos de verificação (B5 / F5)

### 9.1 Testes automatizados do Backend (Jest)

Executa toda a suíte de testes (18 suítes e 180 testes unitários e de integração, cobrindo integralmente as fórmulas normativas e validações):

```bash
cd backend
npm test
```

### 9.2 Verificação de formatação e lint do Backend

Executa a validação de linting e checagem de formatação do código fonte sem alterações:

```bash
cd backend
npm run lint
npm run format:check
```

### 9.3 Documentação Swagger interativa

Após iniciar a API backend, acesse o navegador em:
`http://localhost:3000/api/docs`

### 9.4 Logs estruturados em uma única linha

As requisições HTTP geram logs padronizados via Pino com data/hora ISO, método, rota e código de resposta:

```text
{"level":30,"time":"2026-10-17T14:35:00.000Z","req":{"method":"GET","url":"/api/v1/players?limit=10"},"res":{"statusCode":200},"responseTime":12}
```

### 9.5 Testes e verificação do Frontend (Vitest e Playwright)

Executa toda a suíte de testes unitários e de regras de componentes do frontend (22 arquivos e 104 testes):

```bash
cd frontend
npm test
```

Executa a validação estática de linting e checagem de formatação do frontend:

```bash
cd frontend
npm run lint
npm run format:check
```

Executa a suíte de testes ponta a ponta (E2E) com Playwright (desktop e mobile 375 px):

```bash
cd frontend
npm run test:e2e
```
