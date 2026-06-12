import type {
  GameMasterCharacterSnapshot,
  GameMasterDiceContext,
  GameMasterJournalContext,
  GameMasterJournalEntrySnapshot,
  GameMasterMessage,
  GameMasterTurnInput,
} from "./types";
import { shouldCompactHistory } from "./summarizer";

const SENDER_LABELS: Record<GameMasterMessage["sender"], string> = {
  PLAYER: "Jogador",
  GM: "Mestre",
  SYSTEM: "Sistema",
};

function renderCharacterSection(character: GameMasterCharacterSnapshot): string {
  const { attributes } = character;
  const inventory =
    character.inventory.length > 0
      ? character.inventory
          .map((item) =>
            item.description
              ? `- ${item.name} (x${item.quantity}): ${item.description}`
              : `- ${item.name} (x${item.quantity})`
          )
          .join("\n")
      : "- (vazio)";

  return [
    "## Ficha do personagem",
    `Nome: ${character.name}`,
    `Raça: ${character.race}`,
    `Classe: ${character.class}`,
    `Nível: ${character.level}`,
    `Pontos de vida: ${character.hpCurrent}/${character.hpMax}`,
    `Atributos: Força ${attributes.strength}, Destreza ${attributes.dexterity}, Constituição ${attributes.constitution}, Inteligência ${attributes.intelligence}, Sabedoria ${attributes.wisdom}, Carisma ${attributes.charisma}`,
    `Ouro: ${character.gold}`,
    "Inventário:",
    inventory,
  ].join("\n");
}

function renderSummarySection(summary: string): string {
  const text = summary.trim() || "(nenhum resumo registrado ainda; esta é a primeira sessão)";
  return ["## Resumo da campanha até agora", text].join("\n");
}

function renderEntries(entries: GameMasterJournalEntrySnapshot[]): string {
  if (entries.length === 0) return "- (nenhuma)";
  return entries.map((entry) => `- ${entry.title}: ${entry.description}`).join("\n");
}

function renderJournalSection(journal: GameMasterJournalContext): string {
  return [
    "## Diário da campanha",
    "Missões ativas:",
    renderEntries(journal.activeQuests),
    "Missões concluídas:",
    renderEntries(journal.completedQuests),
    "Acontecimentos recentes:",
    renderEntries(journal.recentEvents),
    "Decisões recentes do jogador:",
    renderEntries(journal.recentDecisions),
  ].join("\n");
}

function renderHistorySection(messages: GameMasterMessage[]): string {
  const lines =
    messages.length > 0
      ? messages.map((message) => `${SENDER_LABELS[message.sender]}: ${message.content}`)
      : ["(sem mensagens anteriores; esta é a primeira interação da campanha)"];

  // When the recent-message window is full, older messages were dropped and are
  // only represented through the campaign summary above.
  const header = shouldCompactHistory(messages.length)
    ? "## Histórico recente (mensagens mais antigas já estão incorporadas ao resumo da campanha acima)"
    : "## Histórico recente";

  return [header, ...lines].join("\n");
}

function renderDiceSection(rolls: GameMasterDiceContext[]): string {
  if (rolls.length === 0) {
    return ["## Rolagens de dados recentes", "- (nenhuma)"].join("\n");
  }
  return [
    "## Rolagens de dados recentes",
    ...rolls.map((roll) => `- ${roll.description}`),
  ].join("\n");
}

/** Builds the user prompt sent to the LLM when a brand-new campaign starts. */
export function buildIntroductionPrompt(
  character: GameMasterCharacterSnapshot,
  campaignTitle: string
): string {
  return [
    `Uma nova campanha solo de D&D 5e está começando, com o título "${campaignTitle}".`,
    renderCharacterSection(character),
    "Gere a narração de abertura: apresente o cenário inicial, conduza o personagem até um gancho de aventura (uma missão inicial) e termine com uma pergunta clara sobre o que o personagem faz a seguir.",
    "Responda no formato JSON especificado nas instruções do sistema. Inclua a missão inicial e o evento de chegada como entradas em \"journalEntries\" (tipos \"QUEST\" e \"EVENT\"), e escreva um \"summary\" inicial descrevendo a situação.",
  ].join("\n\n");
}

/** Builds the user prompt sent to the LLM for a regular turn of the campaign. */
export function buildTurnPrompt(input: GameMasterTurnInput): string {
  const sections = [
    `Campanha: "${input.campaignTitle}"`,
    renderCharacterSection(input.character),
    renderSummarySection(input.campaignSummary),
    renderJournalSection(input.journal),
    renderHistorySection(input.recentMessages),
    renderDiceSection(input.recentDiceRolls),
    input.lastDiceRoll
      ? `## Rolagem que se aplica diretamente a esta ação\n- ${input.lastDiceRoll.description}`
      : null,
    `## Mensagem do jogador\n${input.playerMessage}`,
    "Gere a próxima cena considerando todo o contexto acima e responda no formato JSON especificado nas instruções do sistema.",
  ];

  return sections.filter((section): section is string => section !== null).join("\n\n");
}
