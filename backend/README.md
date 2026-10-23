# Backend API — Mercado de Jogadores da Liga

API RESTful para gerenciamento de clubes, jogadores, mercado de transferências, escalações táticas, partidas e classificação da liga de futebol fictícia (Estudo de Caso SENAI/PE — CÓD. 237).

---

## 1. Stack Tecnológica e Versões das Ferramentas

| Ferramenta / Biblioteca       | Versão                  | Justificativa Técnica                                                                                              |
| ----------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Node.js**                   | `22 LTS` (`>= 22.15.0`) | Ambiente de execução JavaScript/TypeScript com suporte a type stripping nativo.                                    |
| **TypeScript**                | `~5.9.3`                | Tipagem estática com checagem estrita (`strict: true`), prevenindo erros em runtime.                               |
| **NestJS**                    | `^12.1.3`               | Arquitetura corporativa modular em camadas desacopladas (Controller -> Service -> Repository/Prisma).              |
| **PostgreSQL**                | `16` (`16-alpine`)      | Banco relacional robusto com integridade referencial, foreign keys e constraints únicas.                           |
| **Prisma ORM**                | `^6.19.3`               | Mapeamento relacional tipado, migrações declarativas versionadas e suporte a transações atômicas (`$transaction`). |
| **Zod**                       | `^4.6.7`                | Validação declarativa de entrada via pipe global (`ZodValidationPipe`), sem `if` solto em controllers.             |
| **Pino (nestjs-pino)**        | `^10.4.0` / `^5.3.1`    | Logger HTTP estruturado de alta performance: 1 linha por requisição (timestamp, método, rota, status).             |
| **Swagger (@nestjs/swagger)** | `^12.0.2`               | Documentação OpenAPI interativa disponível em `/api/docs`.                                                         |
| **Jest + ts-jest**            | `^30.5.2` / `^29.4.14`  | 18 test suites e 180 testes unitários e de integração com cobertura total de fórmulas.                             |
| **ESLint 9 + Prettier**       | `^9.0.0` / `^3.9.10`    | Verificação estática de código e formatação automatizada sem erros.                                                |

---

## 2. Comandos para Criação e Recriação do Banco de Dados

### 2.1 Criar o banco do zero

```bash
# Iniciar o container PostgreSQL
docker compose up -d db

# Aplicar migrações
cd backend
npx prisma migrate deploy

# Executar carga inicial de dados (seed oficial com 8 clubes e 80 jogadores)
npm run seed
```

### 2.2 Recriar o banco do zero (reset completo)

```bash
cd backend
npx prisma migrate reset --force
```

---

## 3. Variáveis de Ambiente

As configurações são gerenciadas pelo NestJS `ConfigService` e mapeadas no arquivo `backend/.env.example`:

| Variável       | Descrição                                                 | Exemplo Padrão                                                               |
| -------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `PORT`         | Porta HTTP da API                                         | `3000`                                                                       |
| `DATABASE_URL` | URL de conexão PostgreSQL                                 | `postgresql://league:league@localhost:5432/league_marketplace?schema=public` |
| `CORS_ORIGIN`  | Origens autorizadas para CORS (separadas por vírgula)     | `http://localhost:5173`                                                      |
| `LOG_LEVEL`    | Nível de logs (`trace`, `debug`, `info`, `warn`, `error`) | `info`                                                                       |
| `NODE_ENV`     | Ambiente (`development`, `production`, `test`)            | `development`                                                                |

---

## 4. Estrutura de Diretórios

```text
backend/
├── prisma/
│   ├── migrations/                # Histórico versionado de migrações SQL
│   ├── schema.prisma              # Definição das 7 tabelas normativas em snake_case
│   └── seed.ts                    # Carga inicial com tipagem estrita (sem any explícito)
├── src/
│   ├── clubs/                     # Módulo de Clubes (criação 201, listagem e detalhe de elenco)
│   ├── core/
│   │   ├── filters/               # GlobalExceptionFilter (formato unificado { message })
│   │   └── pipes/                 # ParsePositiveIntPipe (V8) e ZodValidationPipe (V1, V7)
│   ├── domain/                    # Núcleo puro de regras de negócio sem I/O
│   │   ├── base-value.ts          # Cálculo de valor base e bônus de jovem promessa
│   │   ├── contract.ts            # Cálculo de dias restantes e faixas de multa (RN15)
│   │   ├── domain-calculator.service.ts # Centralizador dos cálculos de domínio
│   │   ├── duel.ts                # Oráculo e simulação dos 6 duelos táticos (RN20)
│   │   ├── iso-datetime.ts        # Helper puro de validação de data ISO Brasília e calendário
│   │   ├── lineup.ts              # Validação de formações táticas (3-1, 2-2, 2-1-1, 1-2-1)
│   │   ├── market-value.ts        # Cálculo de valor de mercado por condição e atributos
│   │   ├── money.ts               # Arredondamento half-away-from-zero e centavos
│   │   ├── overall.ts             # Overall por pesos posicionais oficiais (RN06)
│   │   └── sale.ts                # Multa rescisória, comissão sobre lucro e crédito líquido
│   ├── health/                    # Endpoint GET /api/v1/health
│   ├── league/                    # Módulo da Liga (escalações, partidas e classificação)
│   ├── market/                    # Módulo de Mercado (compra, venda e extrato CSV)
│   │   └── dto/buy-player.dto.ts  # Validação estrita de loyalty_until (V6 / RN01)
│   ├── players/                   # Módulo de Jogadores (CRUD, busca NFD e condição)
│   ├── prisma/                    # PrismaService singleton com pool gerenciado
│   ├── shared/                    # Clock e utilitários de texto/data
│   ├── app.module.ts              # Módulo raiz do NestJS
│   └── main.ts                    # Bootstrap com CORS restrito, pipes globais e Swagger
├── Dockerfile                     # Multi-stage build com migrações e seed no entrypoint
└── package.json
```

---

## 5. Premissas de Domínio e Decisões de Arquitetura

1. **Validação Estrita de Datas (RN01 / V6)**: Implementado o helper puro `isValidBrasiliaIsoDateTime` em `src/domain/iso-datetime.ts`. Rejeita qualquer overflow nativo da classe `Date` do JavaScript (ex.: `2027-02-30`, `2027-04-31`), valida anos bissextos e exige fuso horário obrigatório `-03:00`.
2. **Arredondamento Financeiro**: Metodologia _half-away-from-zero_ aplicada uma única vez no resultado final de cada cálculo monetário. A verificação do limite de 50% de caixa na compra opera sobre a metade exata do saldo (RN13).
3. **Transações Atômicas**: Operações críticas de escrita rodam em transação única (`prisma.$transaction`): compra, venda, substituição de escalação, simulação de partida com 6 duelos, e troca de condição física com desfalque.
4. **Tratamento Centralizado de Exceções**: O `GlobalExceptionFilter` intercepta erros e padroniza as respostas de erro no formato normativo `{ "message": "..." }`, eliminando stack traces e convertendo falhas de validação em HTTP 400, recursos inexistentes em 404 e conflitos de negócio em 409.

---

## 6. Verificação de Qualidade e Comandos

```bash
# Execução da suíte de testes (18 suítes / 180 testes unitários e de integração)
npm test

# Verificação estática de código (ESLint com zero erros)
npm run lint

# Checagem de formatação (Prettier)
npm run format:check

# Compilação da aplicação
npm run build
```
