# Frontend — Mercado de Jogadores da Liga (Passe)

Interface web moderna para gestão do mercado de jogadores, clubes, escalações táticas, transferências e partidas da liga de futebol fictícia (Desafio Técnico SENAI/PE — CÓD. 237).

---

## 1. Stack Tecnológica e Justificativa das Bibliotecas

| Biblioteca                   | Versão             | Justificativa                                                                                                                  |
| ---------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **React**                    | `18.3.1`           | Biblioteca base declarativa para construção de interfaces reativas baseadas em componentes.                                    |
| **TypeScript**               | `5.7`              | Tipagem estática com checagem estrita (`strict: true`), garantindo integridade e prevenindo erros em tempo de desenvolvimento. |
| **Vite**                     | `6.4.4`            | Ferramenta de build ultrarrápida com Hot Module Replacement (HMR) e code-splitting otimizado para produção.                    |
| **Tailwind CSS**             | `3.4.16`           | Framework utilitário de estilos com sistema de design tokens extraídos do Figma (Geist, Zinc, Primary #155DFC).                |
| **shadcn/ui + Radix UI**     | Primitives         | Componentes acessíveis (WAI-ARIA compliant), não opinativos, com suporte total a navegação por teclado e leitores de tela.     |
| **React Router**             | `6.28.0`           | Roteamento client-side em modo biblioteca (SPA).                                                                               |
| **TanStack Query (v5)**      | `5.62.8`           | Gerenciamento de estado de servidor, cache, sincronização em segundo plano, refetching e invalidação automática pós-mutações.  |
| **React Hook Form**          | `7.54.1`           | Gerenciamento performático de formulários desacoplado de re-renderizações desnecessárias.                                      |
| **Zod**                      | `3.24.1`           | Validação declarativa de esquemas de formulário (regras de nome, idade, atributos, agilidade, sigla do clube).                 |
| **Lucide React**             | `0.468.0`          | Ícones consistentes com a identidade visual do Figma.                                                                          |
| **Vitest + Testing Library** | `2.1.9` / `16.1.0` | Testes unitários de regras de negócio de interface, formatadores, esquemas e componentes.                                      |
| **Playwright**               | `1.49.1`           | Testes ponta a ponta (E2E) cobrindo fluxos reais desktop e mobile (375 px).                                                    |
| **ESLint 9 + Prettier**      | `9.17.0` / `3.4.2` | Padronização de código e formatação automatizada.                                                                              |

---

## 2. Pré-requisitos e Instalação

- **Node.js**: versão `20 LTS` ou `22 LTS`.
- **npm**: versão `>= 10.x`.
- **Backend API**: Em execução na porta 3000 (`http://localhost:3000/api/v1`).

### Instalação de dependências:

```bash
npm install
```

### Configuração de ambiente:

Copie o arquivo de exemplo para `.env`:

```bash
cp .env.example .env
```

Conteúdo de `.env`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## 3. Comandos de Execução

| Comando                | Descrição                                                                      |
| ---------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`          | Inicia o servidor Vite de desenvolvimento em `http://localhost:5173`.          |
| `npm run build`        | Compila TypeScript (`tsc -b`) e gera o bundle de produção via Vite em `dist/`. |
| `npm run preview`      | Executa localmente o bundle gerado em `dist/`.                                 |
| `npm run test`         | Executa todos os testes unitários via Vitest.                                  |
| `npm run test:watch`   | Executa testes unitários em modo observador.                                   |
| `npm run test:e2e`     | Executa os testes ponta a ponta via Playwright (desktop e mobile 375 px).      |
| `npm run lint`         | Executa a verificação estática do código com ESLint.                           |
| `npm run format:check` | Verifica a formatação do código com Prettier.                                  |
| `npm run format`       | Corrige a formatação automaticamente com Prettier.                             |

---

## 4. Arquitetura da Aplicação

Adotada **arquitetura orientada a funcionalidades (feature-based)**:

```text
frontend/
├── src/
│   ├── app/                    # Configurações centrais, roteador e providers (QueryClient)
│   ├── components/
│   │   ├── feedback/           # Toasts, estados vazios, skeleton de carregamento, estados de erro
│   │   ├── layout/             # Sidebar responsiva, Header com status da liga, AppLayout
│   │   └── ui/                 # Componentes reutilizáveis baseados em shadcn/ui e Radix
│   ├── features/
│   │   ├── clubs/              # Módulo de Clubes (listagem, cadastro, detalhe, elenco, tática)
│   │   ├── league/             # Módulo de Liga (simulação de partidas, 6 duelos, classificação)
│   │   ├── market/             # Módulo de Mercado (compra e venda de atletas com validações)
│   │   ├── players/            # Módulo de Jogadores (tabela paginada, filtros mutuamente exclusivos, CRUD)
│   │   └── transactions/       # Módulo de Transações (resumo financeiro, filtros e exportação CSV)
│   ├── lib/
│   │   ├── api.ts              # Cliente HTTP centralizado com classe ApiError
│   │   ├── formatters.ts       # Formatador de moeda (2 casas decimais), datas no fuso Brasília e percentuais
│   │   └── utils.ts            # Utilitário cn (clsx + tailwind-merge)
│   ├── styles/                 # globals.css com tokens de design do Figma
│   └── main.tsx                # Ponto de entrada da aplicação
├── tests/
│   ├── e2e/                    # Suíte de testes ponta a ponta Playwright
│   └── setup.ts                # Configuração do ambiente de testes unitários (Vitest + JSDOM)
├── playwright.config.ts
├── vite.config.ts
└── tailwind.config.ts
```

---

## 5. Diretrizes de Interface e Regras de Negócio

1. **Separação de Responsabilidades**: A API REST é a única fonte da verdade para regras de negócio (cálculos de valor de mercado, multas, bônus de jovem promessa, placares e classificação). O frontend não recalcula regras de negócio; apenas valida formulários declarativamente e exibe as respostas do backend.
2. **Formatação Monetária e Datas**: Moedas são formatadas com vírgula decimal e 2 casas (`R$ 1.500.000,00`). Datas enviadas usam o padrão Brasília (`AAAA-MM-DDTHH:MM-03:00`).
3. **Responsividade Garantida**: Telas testadas e fluidas desde resoluções móveis de 375 px (sem overflow horizontal em página, tabelas com rolagem horizontal contida, gaveta móvel para navegação).
4. **Filtros Mutuamente Exclusivos**: Na listagem de jogadores, o filtro "Só livres" e o filtro por clube são mutuamente exclusivos na interface.
5. **Tratamento de Conflito 409**: Qualquer conflito de regra de negócio retornado pela API é capturado pelo cliente HTTP e exibido ao usuário via notificação visual acessível (Toast).
