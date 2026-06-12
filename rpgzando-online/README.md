# RPGzando Online

MVP de uma plataforma de RPG de mesa digital com **Mestre de IA** persistente
para campanhas solo de D&D 5e. Permite criar uma conta, montar uma ficha de
personagem, iniciar uma campanha e jogar através de um chat com o Mestre,
rolando dados e acompanhando o diário da campanha (acontecimentos, decisões e
missões).

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Turbopack)
- React 19 + TypeScript (modo `strict`)
- Tailwind CSS v4
- [Prisma ORM](https://www.prisma.io/) 6 + PostgreSQL
- Autenticação própria com cookies de sessão assinados (JWT via `jose`) e
  senhas com `bcryptjs`

## Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ rodando localmente (ou acessível via `DATABASE_URL`)

## Configuração local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env` a partir do exemplo e ajuste os valores conforme o
   seu ambiente:

   ```bash
   cp .env.example .env
   ```

   Variáveis:

   | Variável | Descrição |
   | --- | --- |
   | `DATABASE_URL` | String de conexão do PostgreSQL usada pelo Prisma. |
   | `AUTH_SECRET` | Segredo usado para assinar os tokens de sessão (JWT). Gere um valor forte em produção, ex: `openssl rand -base64 32`. |
   | `AI_PROVIDER` | Provedor de IA do Mestre: `gemini`, `openai` ou `anthropic`. Vazio/ausente usa o Mestre mock (sem custo de API). |
   | `OPENAI_API_KEY` | Chave da API da OpenAI (necessária quando `AI_PROVIDER=openai`). |
   | `GEMINI_API_KEY` | Chave da API do Google Gemini (necessária quando `AI_PROVIDER=gemini`). |
   | `ANTHROPIC_API_KEY` | Chave da API da Anthropic (necessária quando `AI_PROVIDER=anthropic`). |
   | `OPENAI_MODEL` / `GEMINI_MODEL` / `ANTHROPIC_MODEL` | Opcional: sobrescreve o modelo padrão de cada provedor. |

3. Crie o banco de dados (se ainda não existir):

   ```bash
   createdb rpgzando
   ```

4. Aplique as migrações do Prisma (cria as tabelas):

   ```bash
   npx prisma migrate dev
   ```

5. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

## Scripts úteis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento (Turbopack). |
| `npm run build` | Build de produção. |
| `npm run start` | Inicia o servidor a partir do build de produção. |
| `npm run lint` | Executa o ESLint. |
| `npm test` | Executa os testes automatizados (Vitest). |
| `npx tsc --noEmit` | Verifica os tipos TypeScript sem gerar arquivos. |
| `npx prisma studio` | Abre uma UI para inspecionar/editar os dados do banco. |
| `npx prisma migrate dev` | Cria/aplica migrações a partir de `prisma/schema.prisma`. |

## Estrutura do projeto

```
prisma/
  schema.prisma          # Modelo de dados (User, Character, Campaign, Message, JournalEntry, DiceRoll, ...)
  migrations/             # Histórico de migrações do banco

src/
  app/
    page.tsx              # Landing page
    register/, login/     # Páginas de cadastro e login
    dashboard/            # Painel com os personagens do usuário
    characters/new/        # Criação de personagem
    characters/[id]/       # Ficha de personagem (editar, inventário, iniciar campanha)
    campaign/[id]/          # Tela de jogo (chat com o Mestre + dados)
    campaign/[id]/journal/  # Diário da campanha (acontecimentos, decisões, missões)

  components/             # Componentes de UI (formulários, chat, rolador de dados, navbar, ...)

  lib/
    auth.ts               # Sessão (JWT em cookie httpOnly), hashing de senha
    dice.ts                # Lógica de rolagem de dados (D4–D100)
    prisma.ts              # Cliente Prisma (singleton)
    actions/               # Server Actions (auth, characters, campaigns)
    gameMaster/            # Abstração do "Mestre de IA"
      types.ts             # Contratos (GameMasterService, mensagens, snapshots, etc.)
      systemPrompt.ts      # Prompt de sistema centralizado (identidade, regras, formato JSON)
      contextBuilder.ts    # Monta o prompt do usuário (ficha, histórico, diário, dados, resumo)
      responseParser.ts    # Faz o parse da resposta JSON do LLM
      summarizer.ts        # Constantes de memória de longo prazo (limites de contexto)
      mockGameMasterService.ts  # Implementação determinística baseada em regras/templates
      llmGameMasterService.ts   # Implementação baseada em LLM (com fallback para o mock)
      providers/            # Adaptadores por provedor de IA
        types.ts             # Interface AIProvider + AIProviderError
        geminiProvider.ts, openaiProvider.ts, anthropicProvider.ts
        index.ts             # Fábrica que lê AI_PROVIDER e seleciona o provedor
      index.ts             # Ponto único de acesso ao serviço (seleciona mock vs. LLM)
      __tests__/            # Testes automatizados (Vitest)
```

## Funcionalidades implementadas

- **Autenticação**: cadastro, login e logout com sessão em cookie httpOnly
  assinado (JWT), senhas com hash `bcrypt`.
- **Personagens**: criação e edição de ficha (nome, raça, classe, nível,
  pontos de vida, atributos, ouro) e inventário simples (adicionar/remover
  itens).
- **Sistema de dados**: rolagem de D4, D6, D8, D10, D12, D20 e D100 com
  quantidade e modificador configuráveis, exibição do resultado e histórico
  persistido por campanha.
- **Mestre de IA**: chat de sessão de RPG implementado atrás da interface
  `GameMasterService`. Quando `AI_PROVIDER` está configurado (Gemini, OpenAI ou
  Claude), as respostas são geradas por um LLM real, narrando em pt-BR,
  respeitando a ficha do personagem, o diário da campanha e o histórico
  recente. Sem `AI_PROVIDER` configurado (ou em caso de falha do provedor), o
  app usa um Mestre mock determinístico baseado em palavras-chave (descansar,
  atacar, comprar, explorar, falar, etc.), que também considera rolagens de
  dado recentes para resolver ações de combate e pode ajustar PV/ouro do
  personagem.
- **Persistência da campanha**: mensagens do chat, rolagens de dados, estado
  do personagem (PV/ouro) e entradas do diário são salvos no banco. Ao voltar
  para uma campanha, o jogador retoma exatamente de onde parou.
- **Diário da campanha**: página dedicada com últimos acontecimentos, decisões
  tomadas e missões (ativas/concluídas, com opção de marcar como concluída).

## A camada `GameMasterService` e o Mestre de IA

Toda a lógica do "Mestre" passa por uma interface única definida em
`src/lib/gameMaster/types.ts`:

```ts
interface GameMasterService {
  introduceCampaign(character, campaignTitle): Promise<GameMasterIntroductionResult>;
  takeTurn(input: GameMasterTurnInput): Promise<GameMasterTurnResult>;
}
```

- `introduceCampaign` gera a narração inicial da campanha e as primeiras
  entradas de diário (ex.: missão inicial).
- `takeTurn` recebe o histórico recente de mensagens, a ficha completa do
  personagem (incluindo atributos e inventário), o diário da campanha (missões
  ativas/concluídas, acontecimentos e decisões recentes), as últimas rolagens
  de dados e o resumo da campanha, e retorna a resposta do Mestre, possíveis
  mudanças no personagem (PV/ouro) e novas entradas de diário.

### Implementações

- **`MockGameMasterService`**: regras e templates simples, sem custo de API.
  Usada quando `AI_PROVIDER` não está configurado, e também como fallback.
- **`LLMGameMasterService`**: usa um provedor de IA (Gemini, OpenAI ou Claude,
  via `src/lib/gameMaster/providers/`) selecionado por `AI_PROVIDER`. Para cada
  chamada:
  1. Monta o contexto completo com `contextBuilder.ts` (ficha, histórico,
     diário, dados, resumo da campanha).
  2. Envia o prompt de sistema centralizado (`systemPrompt.ts`, que define
     identidade do Mestre, tom narrativo em pt-BR, regras de D&D 5e, regras de
     segurança e o formato de resposta JSON) + o contexto ao provedor.
  3. Faz o parse da resposta JSON com `responseParser.ts`.
  4. Se o provedor falhar ou responder algo que não pode ser interpretado,
     usa `MockGameMasterService` como fallback — o jogador sempre recebe uma
     resposta.

`src/lib/gameMaster/index.ts` é o único ponto de seleção: escolhe
`LLMGameMasterService` (com o provedor configurado) ou `MockGameMasterService`
com base em `AI_PROVIDER`. Nenhuma outra parte do app precisa saber qual
implementação está ativa.

### Memória de longo prazo

O Mestre recebe sempre as últimas 20 mensagens, as últimas 10 rolagens de
dados e o `summary` (resumo) atual da campanha. A cada turno, o LLM é
instruído a devolver um `summary` atualizado, que incorpora o resumo anterior
e os novos acontecimentos; esse resumo é persistido em `campaign.summary`. Com
isso o tamanho do contexto enviado ao modelo permanece limitado mesmo em
campanhas longas, sem perder a continuidade narrativa.

### Trocando de provedor

Basta alterar `AI_PROVIDER` (e a respectiva `*_API_KEY`) no `.env` — nenhuma
mudança de código é necessária:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=...
```

## Testes realizados

O fluxo completo foi validado manualmente de ponta a ponta (via requisições
HTTP autenticadas, simulando um navegador):

1. Cadastro de usuário → painel mostra estado vazio.
2. Criação de personagem → ficha exibida corretamente.
3. Início de campanha → narração inicial menciona a cidade e a missão
   inicial; entradas de diário (missão + acontecimento) são criadas.
4. Rolagem de dado (D20+2) → resultado persistido no histórico.
5. Mensagem de combate → o Mestre considera a rolagem recente, narra o
   resultado e ajusta os PV do personagem.
6. Mensagem genérica → registrada como "decisão" no diário.
7. Recarregar a página da campanha → mensagens anteriores continuam
   visíveis (persistência confirmada).
8. Página do diário → mostra missão ativa, decisão registrada e
   acontecimento do início da campanha.
9. Marcar missão como concluída → ela é movida para "Missões concluídas" e a
   lista de missões ativas fica vazia.

Verificações estáticas: `npx tsc --noEmit`, `npm run lint` e `npm run build`
passam sem erros.

### Sprint 2 — Mestre de IA real (`LLMGameMasterService`)

- `npm test` (Vitest) cobre: seleção de provedor por `AI_PROVIDER`, montagem do
  contexto (ficha, diário, histórico, dados, resumo), parse das respostas do
  LLM (incluindo respostas com blocos de código ou texto extra), propagação do
  resumo (memória de longo prazo) e fallback para o Mestre mock quando o
  provedor falha ou responde algo inválido.
- Validado manualmente de ponta a ponta com `AI_PROVIDER` não configurado
  (fallback para o mock, fluxo completo continua funcionando) e com
  `AI_PROVIDER=gemini` configurado com uma chave inválida: a chamada real ao
  Gemini falha, o erro é logado e o `LLMGameMasterService` cai para o Mestre
  mock automaticamente, sem quebrar a campanha.

## Próximos passos recomendados

- **Múltiplos personagens por campanha / multiplayer**: o modelo atual é 1
  personagem por campanha (solo). Uma evolução natural seria permitir grupos.
- **UI/UX**: melhorias visuais (ex.: animações de rolagem de dados, indicação
  de "Mestre digitando..."), paginação no diário e no histórico de dados.
- **Edição/exclusão de campanha**: permitir encerrar (`status = ENDED`) ou
  excluir uma campanha pelo painel.
