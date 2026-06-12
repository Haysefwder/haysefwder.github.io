import { describe, expect, it } from "vitest";
import { buildIntroductionPrompt, buildTurnPrompt } from "../contextBuilder";
import { RECENT_MESSAGE_LIMIT } from "../summarizer";
import { makeCharacter, makeJournal, makeTurnInput } from "./fixtures";

describe("buildIntroductionPrompt", () => {
  it("includes the campaign title and the full character sheet", () => {
    const prompt = buildIntroductionPrompt(makeCharacter(), "A Sombra de Pedraverde");

    expect(prompt).toContain("A Sombra de Pedraverde");
    expect(prompt).toContain("Lyra Stormwind");
    expect(prompt).toContain("Elfo");
    expect(prompt).toContain("Mago");
    expect(prompt).toContain("Inteligência 17");
    expect(prompt).toContain("Poção de cura");
  });
});

describe("buildTurnPrompt", () => {
  it("includes character data, summary, journal, history, dice rolls and the player message", () => {
    const prompt = buildTurnPrompt(makeTurnInput());

    // Character data (mandatory context: name, race, class, level, HP, attributes, gold, inventory)
    expect(prompt).toContain("Lyra Stormwind");
    expect(prompt).toContain("Pontos de vida: 14/20");
    expect(prompt).toContain("Ouro: 30");
    expect(prompt).toContain("Poção de cura");

    // Long-term memory: rolling summary must be present so the model can extend it
    expect(prompt).toContain("Lyra está em Pedraverde investigando luzes na Torre Caída.");

    // Journal context: active quests, events and decisions
    expect(prompt).toContain("Luzes na Torre Caída");
    expect(prompt).toContain("Chegada a Pedraverde");
    expect(prompt).toContain('Lyra decidiu: "Investigar a torre ao amanhecer."');

    // Recent message history
    expect(prompt).toContain("Você chega a Pedraverde. O que você faz?");
    expect(prompt).toContain("Eu vou até a taverna.");

    // Recent dice rolls + the roll that applies to this action
    expect(prompt).toContain("1d20 + 3 -> [15] = 18");

    // The player's current message
    expect(prompt).toContain("Eu ataco o monstro com minha espada!");
  });

  it("notes that older messages are folded into the summary once the recent-message window is full", () => {
    const fullHistory = Array.from({ length: RECENT_MESSAGE_LIMIT }, (_, i) => ({
      sender: i % 2 === 0 ? ("GM" as const) : ("PLAYER" as const),
      content: `Mensagem ${i}`,
    }));

    const shortPrompt = buildTurnPrompt(makeTurnInput({ recentMessages: fullHistory.slice(0, 3) }));
    const fullPrompt = buildTurnPrompt(makeTurnInput({ recentMessages: fullHistory }));

    expect(shortPrompt).not.toContain("já estão incorporadas ao resumo");
    expect(fullPrompt).toContain("já estão incorporadas ao resumo");
  });

  it("renders empty journal sections explicitly instead of omitting them", () => {
    const prompt = buildTurnPrompt(
      makeTurnInput({
        journal: makeJournal({ completedQuests: [], recentEvents: [], recentDecisions: [], activeQuests: [] }),
      })
    );

    expect(prompt).toContain("Missões ativas:");
    expect(prompt).toContain("- (nenhuma)");
  });
});
