import type {
  GameMasterCharacterSnapshot,
  GameMasterJournalContext,
  GameMasterTurnInput,
} from "../types";

export function makeCharacter(
  overrides: Partial<GameMasterCharacterSnapshot> = {}
): GameMasterCharacterSnapshot {
  return {
    name: "Lyra Stormwind",
    race: "Elfo",
    class: "Mago",
    level: 1,
    hpCurrent: 14,
    hpMax: 20,
    gold: 30,
    attributes: {
      strength: 8,
      dexterity: 14,
      constitution: 12,
      intelligence: 17,
      wisdom: 12,
      charisma: 10,
    },
    inventory: [
      { name: "Poção de cura", quantity: 3, description: "Restaura 2d4+2 PV" },
      { name: "Grimório", quantity: 1, description: null },
    ],
    ...overrides,
  };
}

export function makeJournal(overrides: Partial<GameMasterJournalContext> = {}): GameMasterJournalContext {
  return {
    activeQuests: [
      { title: "Luzes na Torre Caída", description: "Investigar as luzes estranhas na Torre Caída." },
    ],
    completedQuests: [],
    recentEvents: [
      { title: "Chegada a Pedraverde", description: "Lyra chega à vila de Pedraverde." },
    ],
    recentDecisions: [
      { title: "Decisão do jogador", description: 'Lyra decidiu: "Investigar a torre ao amanhecer."' },
    ],
    ...overrides,
  };
}

export function makeTurnInput(overrides: Partial<GameMasterTurnInput> = {}): GameMasterTurnInput {
  return {
    character: makeCharacter(),
    campaignTitle: "A Sombra de Pedraverde",
    campaignSummary: "Lyra está em Pedraverde investigando luzes na Torre Caída.",
    recentMessages: [
      { sender: "GM", content: "Você chega a Pedraverde. O que você faz?" },
      { sender: "PLAYER", content: "Eu vou até a taverna." },
    ],
    journal: makeJournal(),
    recentDiceRolls: [{ description: "1d20 + 3 -> [15] = 18", total: 18 }],
    playerMessage: "Eu ataco o monstro com minha espada!",
    lastDiceRoll: { description: "1d20 + 3 -> [15] = 18", total: 18 },
    ...overrides,
  };
}

export function validGameMasterResponse(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    narration: "Você avança pela névoa e encontra um caminho iluminado. O que você faz agora?",
    journalEntries: [
      { type: "EVENT", title: "Caminho iluminado", description: "Lyra encontrou um caminho iluminado na névoa." },
    ],
    summary: "Lyra está explorando um caminho iluminado perto de Pedraverde.",
    characterStateChange: { hpDelta: -2, goldDelta: 5 },
    ...overrides,
  });
}
