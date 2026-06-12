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
      mockGameMasterService.ts  # Implementação atual baseada em regras/templates
      index.ts             # Ponto único de acesso ao serviço (singleton)
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
- **Mestre de IA (mock)**: chat de sessão de RPG implementado atrás da
  interface `GameMasterService`. A implementação atual
  (`MockGameMasterService`) gera narrações com base em palavras-chave da
  mensagem do jogador (descansar, atacar, comprar, explorar, falar, etc.),
  considera rolagens de dado recentes para resolver ações de combate e pode
  ajustar PV/ouro do personagem.
- **Persistência da campanha**: mensagens do chat, rolagens de dados, estado
  do personagem (PV/ouro) e entradas do diário são salvos no banco. Ao voltar
  para uma campanha, o jogador retoma exatamente de onde parou.
- **Diário da campanha**: página dedicada com últimos acontecimentos, decisões
  tomadas e missões (ativas/concluídas, com opção de marcar como concluída).

## A camada `GameMasterService` (para futura integração com IA)

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
- `takeTurn` recebe o histórico recente de mensagens, a ficha do personagem e
  o contexto de rolagens de dados, e retorna a resposta do Mestre, possíveis
  mudanças no personagem (PV/ouro) e novas entradas de diário.

Hoje essa interface é implementada por `MockGameMasterService`, que usa regras
e templates simples (sem custo de API). Para integrar um LLM real no futuro,
basta criar uma nova implementação de `GameMasterService` (ex.:
`LlmGameMasterService`) e trocar o singleton exportado em
`src/lib/gameMaster/index.ts` — nenhuma outra parte do app precisa mudar.

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

## Próximos passos recomendados

- **Mestre de IA real**: implementar uma nova `GameMasterService` que use um
  modelo de linguagem (ex.: API da Anthropic) para gerar narrações mais ricas
  e variadas, mantendo a mesma interface.
- **Resumo de campanha mais inteligente**: hoje `campaign.summary` é
  atualizado de forma simples a cada turno; uma implementação com IA poderia
  gerar resumos mais informativos para dar contexto ao modelo em sessões
  longas.
- **Múltiplos personagens por campanha / multiplayer**: o modelo atual é 1
  personagem por campanha (solo). Uma evolução natural seria permitir grupos.
- **Testes automatizados**: adicionar testes de integração (ex.: Playwright ou
  Vitest + supertest) para os fluxos principais, hoje validados manualmente.
- **UI/UX**: melhorias visuais (ex.: animações de rolagem de dados, indicação
  de "Mestre digitando..."), paginação no diário e no histórico de dados.
- **Edição/exclusão de campanha**: permitir encerrar (`status = ENDED`) ou
  excluir uma campanha pelo painel.
